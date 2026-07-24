"""
Pydantic schemas for API requests and responses.
"""

from pydantic import BaseModel, Field


# ── Requests ──────────────────────────────────────────────

class IngestRequest(BaseModel):
    """Request body for ingesting a GitHub repository."""
    repo_url: str = Field(
        ...,
        description="Full GitHub repository URL (e.g. https://github.com/owner/repo)",
        examples=["https://github.com/fastapi/fastapi"],
    )
    branch: str = Field(
        default="main",
        description="Branch to ingest",
    )
    file_extensions: list[str] = Field(
        default=[".py", ".md", ".txt", ".js", ".ts"],
        description="File extensions to include during ingestion",
    )


class QueryRequest(BaseModel):
    """Request body for querying the RAG pipeline."""
    query: str = Field(
        ...,
        description="Natural-language question about the ingested codebase",
        examples=["How is auth handled?"],
    )
    repo_url: str = Field(
        ...,
        description="Repository URL to scope the query to",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of context chunks to retrieve",
    )


# ── Responses ─────────────────────────────────────────────

class IngestAccepted(BaseModel):
    """Returned immediately when ingestion is dispatched as a background task."""
    message: str = "Ingestion started"
    task_id: str
    repo: str

class IngestResponse(BaseModel):
    """Response after a successful ingestion."""
    message: str
    repo: str
    files_processed: int
    chunks_stored: int

class IngestStatusResponse(BaseModel):
    """Response for polling the status of a running ingestion task."""
    task_id: str
    status: str  # "pending" | "processing" | "completed" | "failed"
    detail: str | None = None
    result: IngestResponse | None = None


class SourceChunk(BaseModel):
    """A single retrieved context chunk returned as a reference."""
    file_path: str
    content: str
    score: float
    chunk_index: int = 0
    repo_url: str = ""
    start_line: int = 1
    end_line: int = 1


class QueryResponse(BaseModel):
    """Response from the RAG query endpoint."""
    answer: str
    sources: list[SourceChunk]


class HealthResponse(BaseModel):
    """Health-check response."""
    status: str = "ok"
    version: str = "0.1.0"


class ErrorResponse(BaseModel):
    """Standardised error envelope returned by all error handlers."""
    detail: str
    status_code: int


# ── New endpoints ─────────────────────────────────────────

class RepoInfo(BaseModel):
    """Summary info for an ingested repository."""
    repo_url: str
    files_count: int
    chunks_count: int


class RepoListResponse(BaseModel):
    """Response listing all ingested repositories."""
    repos: list[RepoInfo]


class FileInfo(BaseModel):
    """Summary info for an indexed file within a repo."""
    file_path: str
    chunks_count: int
    total_lines: int = 0


class FileListResponse(BaseModel):
    """Response listing all indexed files for a repository."""
    repo_url: str
    files: list[FileInfo]
    total_chunks: int


class FileContentResponse(BaseModel):
    """Response containing the reconstructed content of a file."""
    repo_url: str
    file_path: str
    content: str
    chunks_count: int


class CollectionInfoResponse(BaseModel):
    """Response with vector DB collection statistics."""
    name: str
    points_count: int
    vectors_count: int
    status: str


class DeleteCollectionResponse(BaseModel):
    """Response after deleting a collection."""
    message: str
    collection: str
