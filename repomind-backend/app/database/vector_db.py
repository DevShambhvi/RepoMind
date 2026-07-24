"""
Vector DB Interface – Qdrant-backed vector storage.

Provides two core operations:
    - upsert_documents  – store code chunk embeddings with rich metadata
    - search_similarity – retrieve the closest vectors for a query

Supports both local (Docker) and Qdrant Cloud instances via the
QDRANT_URL setting.
"""

from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)

from app.config import settings

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────

VECTOR_DIM = 3072  # gemini-embedding-001 output dimensionality


# ── Client (singleton) ───────────────────────────────────

_client: Optional[QdrantClient] = None


def _get_client() -> QdrantClient:
    """Lazily initialise and return the Qdrant client."""
    global _client
    if _client is None:
        url = settings.qdrant_url
        if url.startswith("http://") or url.startswith("https://"):
            try:
                client_candidate = QdrantClient(url=url, timeout=2.0)
                client_candidate.get_collections()
                _client = client_candidate
                logger.info("Connected to Qdrant at %s", url)
            except Exception as e:
                logger.warning(
                    "Failed connecting to Qdrant at %s (%s). Falling back to local disk Qdrant storage (./qdrant_db).",
                    url,
                    e,
                )
                _client = QdrantClient(path="./qdrant_db")
        elif url == ":memory:":
            _client = QdrantClient(location=":memory:")
        else:
            _client = QdrantClient(path=url)
    return _client


# ── Collection management ────────────────────────────────

def ensure_collection(
    collection_name: Optional[str] = None,
    vector_size: int = VECTOR_DIM,
) -> None:
    """
    Create the Qdrant collection if it does not already exist.
    """
    client = _get_client()
    name = collection_name or settings.qdrant_collection

    existing = [c.name for c in client.get_collections().collections]
    if name in existing:
        logger.info("Collection '%s' already exists — skipping creation.", name)
        return

    client.create_collection(
        collection_name=name,
        vectors_config=VectorParams(
            size=vector_size,
            distance=Distance.COSINE,
        ),
    )

    # Create payload indices for filtered search
    for field in ("repo_url", "file_path"):
        client.create_payload_index(
            collection_name=name,
            field_name=field,
            field_schema=PayloadSchemaType.KEYWORD,
        )

    logger.info(
        "Created Qdrant collection '%s' (%d-dim, cosine) with payload indices.",
        name,
        VECTOR_DIM,
    )


def delete_collection(collection_name: Optional[str] = None) -> None:
    """Delete the collection (useful for re-ingestion)."""
    client = _get_client()
    name = collection_name or settings.qdrant_collection
    client.delete_collection(collection_name=name)
    logger.info("Deleted Qdrant collection '%s'.", name)


# ── Data classes ──────────────────────────────────────────

@dataclass
class SearchResult:
    """A single result from a similarity search."""
    file_path: str
    content: str
    repo_url: str
    score: float
    chunk_index: int = 0
    total_chunks: int = 1
    start_line: int = 1
    end_line: int = 1


# ── Core API ──────────────────────────────────────────────

def upsert_documents(
    chunks: List[Dict[str, Any]],
    embeddings: List[List[float]],
    collection_name: Optional[str] = None,
) -> int:
    """
    Insert (or update) code-chunk vectors with metadata into Qdrant.

    Parameters
    ----------
    chunks : list[dict]
        Each dict must contain:
            - repo_url    : str – the source repository URL
            - file_path   : str – relative path inside the repo
            - content     : str – the chunk text
        And may contain:
            - chunk_index : int – position of this chunk in the file
            - total_chunks: int – total chunks for the file
    embeddings : list[list[float]]
        One embedding vector per chunk (must be same length as chunks).
    collection_name : str or None
        Target collection. Defaults to settings.qdrant_collection.

    Returns
    -------
    int
        Number of points upserted.

    Raises
    ------
    ValueError
        If chunks and embeddings have different lengths.
    """
    if len(chunks) != len(embeddings):
        raise ValueError(
            f"Length mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings."
        )

    name = collection_name or settings.qdrant_collection
    vec_size = len(embeddings[0]) if embeddings else VECTOR_DIM
    ensure_collection(name, vector_size=vec_size)
    client = _get_client()

    # Build Qdrant point structs
    points: List[PointStruct] = []
    for chunk, vector in zip(chunks, embeddings):
        payload = {
            "repo_url": chunk["repo_url"],
            "file_path": chunk["file_path"],
            "content": chunk["content"],
            "chunk_index": chunk.get("chunk_index", 0),
            "total_chunks": chunk.get("total_chunks", 1),
            "start_line": chunk.get("start_line", 1),
            "end_line": chunk.get("end_line", 1),
        }
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload=payload,
            )
        )

    # Upsert in batches of 100 to avoid oversized requests
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i : i + batch_size]
        client.upsert(collection_name=name, points=batch)

    logger.info("Upserted %d vectors into collection '%s'.", len(points), name)
    return len(points)


def search_similarity(
    query_vector: List[float],
    limit: int = 5,
    repo_url: Optional[str] = None,
    file_path: Optional[str] = None,
    collection_name: Optional[str] = None,
) -> List[SearchResult]:
    """
    Query Qdrant for the vectors most similar to query_vector.

    Parameters
    ----------
    query_vector : list[float]
        The embedding of the user's question.
    limit : int
        Maximum number of results to return (default 5).
    repo_url : str or None
        If provided, restricts results to this repository.
    file_path : str or None
        If provided, restricts results to this specific file.
    collection_name : str or None
        Target collection. Defaults to settings.qdrant_collection.

    Returns
    -------
    list[SearchResult]
        Ranked results with metadata, ordered by descending similarity.
    """
    name = collection_name or settings.qdrant_collection
    client = _get_client()

    # Build optional filter conditions
    must_conditions: List[FieldCondition] = []
    if repo_url:
        must_conditions.append(
            FieldCondition(key="repo_url", match=MatchValue(value=repo_url))
        )
    if file_path:
        must_conditions.append(
            FieldCondition(key="file_path", match=MatchValue(value=file_path))
        )

    query_filter = Filter(must=must_conditions) if must_conditions else None

    ensure_collection(name, vector_size=len(query_vector))
    hits = client.query_points(
        collection_name=name,
        query=query_vector,
        query_filter=query_filter,
        limit=limit,
    )

    results: List[SearchResult] = []
    for hit in hits.points:
        payload = hit.payload or {}
        results.append(
            SearchResult(
                file_path=payload.get("file_path", ""),
                content=payload.get("content", ""),
                repo_url=payload.get("repo_url", ""),
                score=hit.score,
                chunk_index=payload.get("chunk_index", 0),
                total_chunks=payload.get("total_chunks", 1),
                start_line=payload.get("start_line", 1),
                end_line=payload.get("end_line", 1),
            )
        )

    logger.info(
        "Search returned %d results (limit=%d, repo=%s).",
        len(results),
        limit,
        repo_url or "any",
    )
    return results


# ── Utilities ─────────────────────────────────────────────

def get_collection_info(collection_name: Optional[str] = None) -> Dict[str, Any]:
    """Return point count and other stats for the collection."""
    client = _get_client()
    name = collection_name or settings.qdrant_collection
    try:
        info = client.get_collection(collection_name=name)
        status_val = getattr(info.status, "value", str(info.status))
        pts = getattr(info, "points_count", 0) or 0
        vecs = getattr(info, "vectors_count", None)
        if vecs is None:
            vecs = pts
        return {
            "name": name,
            "points_count": pts,
            "vectors_count": vecs,
            "status": status_val,
        }
    except Exception:
        return {
            "name": name,
            "points_count": 0,
            "vectors_count": 0,
            "status": "not_found",
        }


def list_repos(collection_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all distinct ingested repositories with file/chunk counts.

    Scrolls through all points in the collection and aggregates
    by repo_url.
    """
    client = _get_client()
    name = collection_name or settings.qdrant_collection

    # Check collection exists
    existing = [c.name for c in client.get_collections().collections]
    if name not in existing:
        return []

    repo_data: Dict[str, Dict[str, Any]] = {}
    offset = None

    while True:
        results, next_offset = client.scroll(
            collection_name=name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
        )

        for point in results:
            payload = point.payload or {}
            repo_url = payload.get("repo_url", "")
            file_path = payload.get("file_path", "")

            if repo_url not in repo_data:
                repo_data[repo_url] = {"files": set(), "chunks": 0}

            repo_data[repo_url]["files"].add(file_path)
            repo_data[repo_url]["chunks"] += 1

        if next_offset is None:
            break
        offset = next_offset

    return [
        {
            "repo_url": url,
            "files_count": len(data["files"]),
            "chunks_count": data["chunks"],
        }
        for url, data in repo_data.items()
        if url  # skip empty repo_url
    ]


def list_files(
    repo_url: str,
    collection_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    List all indexed files for a given repository.

    Returns file paths with chunk counts and estimated line numbers.
    """
    client = _get_client()
    name = collection_name or settings.qdrant_collection

    existing = [c.name for c in client.get_collections().collections]
    if name not in existing:
        return []

    file_data: Dict[str, Dict[str, Any]] = {}
    offset = None

    while True:
        results, next_offset = client.scroll(
            collection_name=name,
            limit=100,
            offset=offset,
            with_payload=True,
            with_vectors=False,
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="repo_url", match=MatchValue(value=repo_url)
                    )
                ]
            ),
        )

        for point in results:
            payload = point.payload or {}
            file_path = payload.get("file_path", "")
            end_line = payload.get("end_line", 0)

            if file_path not in file_data:
                file_data[file_path] = {"chunks": 0, "max_line": 0}

            file_data[file_path]["chunks"] += 1
            file_data[file_path]["max_line"] = max(
                file_data[file_path]["max_line"], end_line
            )

        if next_offset is None:
            break
        offset = next_offset

    return [
        {
            "file_path": fp,
            "chunks_count": data["chunks"],
            "total_lines": data["max_line"],
        }
        for fp, data in sorted(file_data.items())
    ]


def get_file_content(
    repo_url: str,
    file_path: str,
    collection_name: Optional[str] = None,
) -> str:
    """
    Reconstruct the content of a specific file by joining its chunks
    in order of chunk_index.
    """
    client = _get_client()
    name = collection_name or settings.qdrant_collection

    results, _ = client.scroll(
        collection_name=name,
        limit=500,
        with_payload=True,
        with_vectors=False,
        scroll_filter=Filter(
            must=[
                FieldCondition(
                    key="repo_url", match=MatchValue(value=repo_url)
                ),
                FieldCondition(
                    key="file_path", match=MatchValue(value=file_path)
                ),
            ]
        ),
    )

    # Sort by chunk_index and join
    chunks = sorted(
        results, key=lambda p: (p.payload or {}).get("chunk_index", 0)
    )
    return "\n\n".join(
        (p.payload or {}).get("content", "") for p in chunks
    )
