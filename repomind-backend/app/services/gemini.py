"""
Gemini Service – Unified SDK client for Embeddings & LLM.

Uses the ``google-genai`` SDK to generate text embeddings and
to produce RAG-augmented answers via the Gemini chat model.
"""

from __future__ import annotations

import logging

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# ── SDK Client (initialised once) ────────────────────────

_client = genai.Client(api_key=settings.gemini_api_key)


# ── Embeddings ────────────────────────────────────────────

async def generate_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate vector embeddings for a batch of text strings.

    Parameters
    ----------
    texts : list[str]
        The texts to embed.

    Returns
    -------
    list[list[float]]
        A list of embedding vectors (one per input text).
    """
    result = _client.models.embed_content(
        model=settings.embedding_model,
        contents=texts,
    )
    return [emb.values for emb in result.embeddings]


async def generate_embedding(text: str) -> list[float]:
    """Convenience wrapper for a single text string."""
    embeddings = await generate_embeddings([text])
    return embeddings[0]


# ── LLM (RAG answer generation) ──────────────────────────

async def answer_query(
    query: str,
    context_chunks: list[dict[str, str]],
) -> str:
    """
    Generate a markdown answer using Gemini, grounded in retrieved code context.

    Parameters
    ----------
    query : str
        The user's natural-language question.
    context_chunks : list[dict]
        Retrieved code/doc chunks.  Each dict has at minimum:
            - ``file_path`` : str
            - ``content``   : str

    Returns
    -------
    str
        The model's answer in raw Markdown, with file-path references.
    """
    # Format each chunk as a labelled block so Gemini can cite sources
    formatted_parts: list[str] = []
    for i, chunk in enumerate(context_chunks, 1):
        formatted_parts.append(
            f"--- Chunk {i} ---\n"
            f"File: {chunk['file_path']}\n\n"
            f"{chunk['content']}"
        )
    context = "\n\n".join(formatted_parts)

    prompt = (
        "You are an expert code assistant. Use ONLY the following context "
        "extracted from a GitHub repository to answer the question.\n"
        "• Write your answer in **Markdown**.\n"
        "• When referencing code, cite the source file path "
        "(e.g. `src/auth.py`).\n"
        "• If the context does not contain enough information, say so.\n\n"
        f"### Context\n{context}\n\n"
        f"### Question\n{query}\n\n"
        "### Answer"
    )

    models_to_try = [settings.llm_model, "models/gemini-2.5-flash", "models/gemini-flash-latest"]
    # Deduplicate preserving order
    models_to_try = list(dict.fromkeys(models_to_try))

    last_error: Exception | None = None
    for m in models_to_try:
        try:
            response = _client.models.generate_content(
                model=m,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=2048,
                ),
            )
            return response.text
        except Exception as e:
            logger.warning("Generation with model %s failed: %s. Trying next candidate...", m, e)
            last_error = e

    raise last_error or RuntimeError("All LLM model candidates failed.")
