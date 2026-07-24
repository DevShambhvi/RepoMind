/**
 * RepoMind API Client
 *
 * Typed functions for every backend endpoint.
 * All functions throw on network errors; callers should catch.
 */

const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl !== "http://localhost:8000" && !envUrl.includes("localhost")) {
    return envUrl;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:8000`;
  }
  return envUrl ?? "http://localhost:8000";
};

const API_BASE = getApiBase();

// ── Types ────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
}

export interface IngestAccepted {
  message: string;
  task_id: string;
  repo: string;
}

export interface IngestResult {
  message: string;
  repo: string;
  files_processed: number;
  chunks_stored: number;
}

export interface IngestStatus {
  task_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  detail: string | null;
  result: IngestResult | null;
}

export interface SourceChunk {
  file_path: string;
  content: string;
  score: number;
  chunk_index: number;
  repo_url: string;
  start_line: number;
  end_line: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface RepoInfo {
  repo_url: string;
  files_count: number;
  chunks_count: number;
}

export interface RepoListResponse {
  repos: RepoInfo[];
}

export interface FileInfo {
  file_path: string;
  chunks_count: number;
  total_lines: number;
}

export interface FileListResponse {
  repo_url: string;
  files: FileInfo[];
  total_chunks: number;
}

export interface CollectionInfo {
  name: string;
  points_count: number;
  vectors_count: number;
  status: string;
}

// ── Helper ───────────────────────────────────────────────

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── API Functions ────────────────────────────────────────

/** Health check – verifies the backend is reachable. */
export async function healthCheck(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

/** Kick off a background repo ingestion job. */
export async function ingestRepo(
  repoUrl: string,
  branch = "main",
  fileExtensions = [".py", ".md", ".txt", ".js", ".ts", ".tsx", ".jsx", ".go"],
): Promise<IngestAccepted> {
  return request<IngestAccepted>("/api/ingest", {
    method: "POST",
    body: JSON.stringify({
      repo_url: repoUrl,
      branch,
      file_extensions: fileExtensions,
    }),
  });
}

/** Poll the status of a running ingestion task. */
export async function getIngestStatus(
  taskId: string,
): Promise<IngestStatus> {
  return request<IngestStatus>(`/api/ingest/status/${taskId}`);
}

/** Send a natural-language query to the RAG pipeline. */
export async function queryRAG(
  query: string,
  repoUrl: string,
  topK = 5,
): Promise<QueryResponse> {
  return request<QueryResponse>("/api/query", {
    method: "POST",
    body: JSON.stringify({ query, repo_url: repoUrl, top_k: topK }),
  });
}

/** List all ingested repositories. */
export async function listRepos(): Promise<RepoListResponse> {
  return request<RepoListResponse>("/api/repos");
}

/** List all indexed files for a repository. */
export async function listFiles(repoUrl: string): Promise<FileListResponse> {
  return request<FileListResponse>(
    `/api/repos/files?repo_url=${encodeURIComponent(repoUrl)}`,
  );
}

/** Get vector collection statistics. */
export async function getCollectionInfo(): Promise<CollectionInfo> {
  return request<CollectionInfo>("/api/collections/info");
}

/** Delete the entire vector collection. */
export async function deleteCollection(): Promise<{ message: string; collection: string }> {
  return request("/api/collections", { method: "DELETE" });
}
