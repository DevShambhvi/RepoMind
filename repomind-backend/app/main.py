"""
FastAPI App Entrypoint
Exposes /api/ingest, /api/query, and /health endpoints for the Git-RAG pipeline.

CORS is configured via the CORS_ORIGINS env var (comma-separated list).
Global exception handlers ensure every error returns a consistent JSON envelope.
"""

from __future__ import annotations

import logging
import uuid
from typing import Dict

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from github import GithubException

from app.config import settings
from app.schemas.api_models import (
    CollectionInfoResponse,
    DeleteCollectionResponse,
    ErrorResponse,
    FileListResponse,
    FileInfo,
    HealthResponse,
    IngestAccepted,
    IngestRequest,
    IngestResponse,
    IngestStatusResponse,
    QueryRequest,
    QueryResponse,
    RepoInfo,
    RepoListResponse,
    SourceChunk,
)
from app.services.github import chunk_file, fetch_repo_files
from app.services.gemini import answer_query, generate_embedding, generate_embeddings
from app.database.vector_db import (
    delete_collection,
    get_collection_info,
    get_file_content,
    list_files,
    list_repos,
    search_similarity,
    upsert_documents,
)

# ── Logging ───────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────

app = FastAPI(
    title="Git-RAG Backend",
    description="RAG pipeline over GitHub repositories powered by Gemini & Qdrant.",
    version="0.1.0",
)

# ── CORS middleware ───────────────────────────────────────
# Parse the comma-separated CORS_ORIGINS setting into a list.
# Set to "*" in .env only if you truly need to allow every origin.

_allowed_origins: list[str] = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handlers ────────────────────────────


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    """Return HTTPExceptions in the standard ErrorResponse shape."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            detail=exc.detail,
            status_code=exc.status_code,
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return 422 validation errors with a human-friendly summary."""
    messages = []
    for err in exc.errors():
        loc = " → ".join(str(l) for l in err.get("loc", []))
        messages.append(f"{loc}: {err.get('msg', 'invalid')}")
    detail = "; ".join(messages)
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(detail=detail, status_code=422).model_dump(),
    )


@app.exception_handler(GithubException)
async def github_exception_handler(
    _request: Request, exc: GithubException
) -> JSONResponse:
    """Translate PyGithub errors into user-friendly API responses."""
    status = exc.status if hasattr(exc, "status") else 502
    detail = f"GitHub API error: {exc.data}" if hasattr(exc, "data") else str(exc)
    logger.error("GitHub API error (%s): %s", status, detail)
    return JSONResponse(
        status_code=status,
        content=ErrorResponse(detail=detail, status_code=status).model_dump(),
    )


@app.exception_handler(Exception)
async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """Catch-all: log the traceback and return a safe 500 response."""
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            detail="An internal server error occurred. Check the server logs for details.",
            status_code=500,
        ).model_dump(),
    )


# ── In-memory task tracker ────────────────────────────────
# Maps task_id → current status dict.  Fine for a single-process
# dev server; swap for Redis / DB in production.

_tasks: Dict[str, IngestStatusResponse] = {}


# ── Background ingestion worker ──────────────────────────

async def _ingest_worker(task_id: str, req: IngestRequest) -> None:
    """Run the full ingest pipeline in the background."""
    try:
        _tasks[task_id].status = "processing"

        # 1. Fetch files from GitHub via PyGithub API
        files = await fetch_repo_files(
            repo_url=req.repo_url,
            branch=req.branch,
            file_extensions=req.file_extensions,
        )
        if not files:
            _tasks[task_id].status = "failed"
            _tasks[task_id].detail = "No matching files found in the repository."
            return

        # 2. Smart-chunk every file (code-aware boundaries / ~500 tokens)
        all_chunks: list[str] = []
        all_payloads: list[dict] = []
        for repo_file in files:
            file_chunks = chunk_file(repo_file)
            for fc in file_chunks:
                all_chunks.append(fc.content)
                all_payloads.append({
                    "repo_url": req.repo_url,
                    "file_path": fc.file_path,
                    "content": fc.content,
                    "chunk_index": fc.chunk_index,
                    "total_chunks": fc.total_chunks,
                    "start_line": fc.metadata.get("start_line", 1),
                    "end_line": fc.metadata.get("end_line", 1),
                })

        # 3. Generate embeddings in batches
        batch_size = 100
        all_vectors: list[list[float]] = []
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i : i + batch_size]
            vecs = await generate_embeddings(batch)
            all_vectors.extend(vecs)

        # 4. Upsert into Qdrant
        stored = upsert_documents(chunks=all_payloads, embeddings=all_vectors)

        _tasks[task_id].status = "completed"
        _tasks[task_id].result = IngestResponse(
            message="Repository ingested successfully.",
            repo=req.repo_url,
            files_processed=len(files),
            chunks_stored=stored,
        )
        logger.info("Task %s completed – %d chunks stored.", task_id, stored)

    except Exception as exc:
        logger.exception("Ingestion task %s failed", task_id)
        _tasks[task_id].status = "failed"
        _tasks[task_id].detail = str(exc)


# ── Routes ────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Return service health status."""
    return HealthResponse()


@app.post(
    "/api/ingest",
    response_model=IngestAccepted,
    status_code=202,
    tags=["Ingestion"],
)
async def ingest_repo(req: IngestRequest, background_tasks: BackgroundTasks):
    """
    Accept an ingestion request and process it in the background.

    Returns a ``task_id`` immediately (HTTP 202).  Poll
    ``/api/ingest/status/{task_id}`` to track progress.
    """
    task_id = uuid.uuid4().hex

    # Register the task as pending
    _tasks[task_id] = IngestStatusResponse(
        task_id=task_id,
        status="pending",
    )

    # Dispatch work to the background
    background_tasks.add_task(_ingest_worker, task_id, req)

    return IngestAccepted(task_id=task_id, repo=req.repo_url)


@app.get(
    "/api/ingest/status/{task_id}",
    response_model=IngestStatusResponse,
    tags=["Ingestion"],
)
async def ingest_status(task_id: str):
    """Poll the status of a background ingestion task."""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Unknown task_id")
    return _tasks[task_id]


@app.post("/api/query", response_model=QueryResponse, tags=["Query"])
async def query_rag(req: QueryRequest):
    """
    Embed the user's query, retrieve the top-k similar chunks from Qdrant,
    format them as structured context, pass them to Gemini for answer
    generation, and return the raw markdown answer + source references.
    """
    try:
        # 1. Embed the user query
        query_vec = await generate_embedding(req.query)

        # 2. Retrieve similar chunks from the vector DB
        results = search_similarity(
            query_vector=query_vec,
            limit=req.top_k,
            repo_url=req.repo_url,
        )

        if not results:
            return QueryResponse(
                answer="No relevant context found for this repository. Please ingest the repo first.",
                sources=[],
            )

        # 3. Format chunks as structured context (file path + content)
        context_chunks = [
            {"file_path": r.file_path, "content": r.content}
            for r in results
        ]

        # 4. Generate a markdown answer via Gemini
        answer = await answer_query(req.query, context_chunks)

        # 5. Build source references for the UI
        sources = [
            SourceChunk(
                file_path=r.file_path,
                content=r.content[:500],  # trim for response size
                score=r.score,
                chunk_index=r.chunk_index,
                repo_url=r.repo_url,
                start_line=r.start_line,
                end_line=r.end_line,
            )
            for r in results
        ]

        return QueryResponse(answer=answer, sources=sources)

    except Exception as exc:
        logger.exception("Query failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Repository & Collection browsing ─────────────────────

@app.get("/api/repos", response_model=RepoListResponse, tags=["Browse"])
async def get_repos():
    """List all ingested repositories with file and chunk counts."""
    repos_raw = list_repos()
    repos = [RepoInfo(**r) for r in repos_raw]
    return RepoListResponse(repos=repos)


@app.get("/api/repos/files", response_model=FileListResponse, tags=["Browse"])
async def get_repo_files(repo_url: str):
    """
    List all indexed files for a specific repository.

    Pass the full repo URL as a query parameter.
    """
    files_raw = list_files(repo_url=repo_url)
    files = [FileInfo(**f) for f in files_raw]
    total_chunks = sum(f.chunks_count for f in files)
    return FileListResponse(repo_url=repo_url, files=files, total_chunks=total_chunks)


@app.get(
    "/api/collections/info",
    response_model=CollectionInfoResponse,
    tags=["Browse"],
)
async def collection_info():
    """Return statistics about the Qdrant vector collection."""
    info = get_collection_info()
    return CollectionInfoResponse(**info)


@app.delete(
    "/api/collections",
    response_model=DeleteCollectionResponse,
    tags=["Browse"],
)
async def delete_collection_route():
    """Delete the entire vector collection (for re-ingestion)."""
    name = settings.qdrant_collection
    try:
        delete_collection(name)
        return DeleteCollectionResponse(
            message="Collection deleted successfully.",
            collection=name,
        )
    except Exception as exc:
        logger.exception("Failed to delete collection")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
