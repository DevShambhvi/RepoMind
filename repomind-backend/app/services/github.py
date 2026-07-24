"""
GitHub Service – Fetching & parsing repository files via the GitHub API.

Uses PyGithub to authenticate with a Personal Access Token, traverse
the full repository tree, filter by code extensions, and chunk file
contents using code-aware boundary detection.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

from github import Github, GithubException

from app.config import settings

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────

DEFAULT_EXTENSIONS = {".py", ".js", ".md", ".ts", ".go"}

# Approximate characters per token (conservative estimate)
_CHARS_PER_TOKEN = 4
_TARGET_TOKENS = 500
_TARGET_CHARS = _TARGET_TOKENS * _CHARS_PER_TOKEN  # ~2000 chars
_MIN_CHUNK_CHARS = 200  # never produce chunks smaller than this
_OVERLAP_CHARS = 200    # sliding-window overlap

# Regex patterns for detecting logical code boundaries
_BOUNDARY_PATTERNS: dict[str, re.Pattern] = {
    ".py": re.compile(
        r"^(?:class\s+\w+|def\s+\w+|async\s+def\s+\w+)", re.MULTILINE
    ),
    ".js": re.compile(
        r"^(?:function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|export\s+(?:default\s+)?(?:function|class))",
        re.MULTILINE,
    ),
    ".ts": re.compile(
        r"^(?:function\s+\w+|class\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|export\s+(?:default\s+)?(?:function|class)|interface\s+\w+|type\s+\w+)",
        re.MULTILINE,
    ),
    ".go": re.compile(
        r"^(?:func\s+(?:\(\w+\s+\*?\w+\)\s+)?\w+|type\s+\w+\s+struct)",
        re.MULTILINE,
    ),
}


# ── Data classes ──────────────────────────────────────────

@dataclass
class RepoFile:
    """A single file fetched from the repository."""
    path: str
    content: str


@dataclass
class FileChunk:
    """A chunk of a file, ready for embedding."""
    file_path: str
    content: str
    chunk_index: int
    total_chunks: int
    metadata: dict = field(default_factory=dict)


# ── GitHub API client ────────────────────────────────────

def _get_client() -> Github:
    """Create an authenticated PyGithub client."""
    token = settings.github_token
    if not token:
        raise ValueError(
            "GITHUB_TOKEN is not set. Add it to your .env file."
        )
    return Github(token)


def _parse_repo_owner_name(repo_url: str) -> str:
    """
    Extract 'owner/repo' from a full GitHub URL.

    Supports:
        https://github.com/owner/repo
        https://github.com/owner/repo.git
        github.com/owner/repo
    """
    url = repo_url.rstrip("/")
    if url.endswith(".git"):
        url = url[:-4]

    # Strip scheme + domain
    for prefix in ("https://github.com/", "http://github.com/", "github.com/"):
        if url.startswith(prefix) or url.startswith(prefix.replace("http", "https")):
            url = url.split("github.com/", 1)[-1]
            break

    parts = url.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError(
            f"Cannot parse owner/repo from URL: {repo_url}"
        )
    return f"{parts[0]}/{parts[1]}"


# ── Fetch files ───────────────────────────────────────────

async def fetch_repo_files(
    repo_url: str,
    branch: str = "main",
    file_extensions: list[str] | None = None,
) -> list[RepoFile]:
    """
    Fetch all matching files from a GitHub repository via the API.

    Parameters
    ----------
    repo_url : str
        Full GitHub repository URL.
    branch : str
        Branch to read from (default ``main``).
    file_extensions : list[str] | None
        Whitelist of extensions. Defaults to ``DEFAULT_EXTENSIONS``.

    Returns
    -------
    list[RepoFile]
        Parsed file entries with path and content.
    """
    extensions = set(file_extensions) if file_extensions else DEFAULT_EXTENSIONS
    owner_repo = _parse_repo_owner_name(repo_url)

    client = _get_client()
    try:
        repo = client.get_repo(owner_repo)
    except GithubException as exc:
        logger.error("Failed to access repo %s: %s", owner_repo, exc)
        raise

    logger.info("Traversing repo tree: %s (branch=%s)", owner_repo, branch)

    try:
        tree = repo.get_git_tree(sha=branch, recursive=True)
    except GithubException:
        # Fallback: try 'master' if 'main' fails
        logger.warning("Branch '%s' not found, trying 'master'", branch)
        tree = repo.get_git_tree(sha="master", recursive=True)

    files: list[RepoFile] = []

    for element in tree.tree:
        if element.type != "blob":
            continue

        # Check extension
        ext = _get_extension(element.path)
        if ext not in extensions:
            continue

        try:
            blob = repo.get_git_blob(element.sha)
            if blob.encoding == "base64":
                import base64
                content = base64.b64decode(blob.content).decode(
                    "utf-8", errors="ignore"
                )
            else:
                content = blob.content

            files.append(RepoFile(path=element.path, content=content))
        except Exception:
            logger.warning("Skipping unreadable file: %s", element.path)

    logger.info("Fetched %d files from %s", len(files), owner_repo)
    return files


def _get_extension(path: str) -> str:
    """Return the lowercase file extension (e.g. '.py')."""
    dot = path.rfind(".")
    return path[dot:].lower() if dot != -1 else ""


# ── Smart Chunking ────────────────────────────────────────

def chunk_file(file: RepoFile) -> list[FileChunk]:
    """
    Split a file into chunks using code-aware boundary detection.

    Strategy
    --------
    1. If the file is small enough (≤ ``_TARGET_CHARS``), return it as one chunk.
    2. Try to split on **logical boundaries** (function/class definitions)
       for supported languages.
    3. For Markdown files, split on headings (``#``, ``##``, etc.).
    4. Fall back to a **sliding-window** approach with overlap.

    Returns
    -------
    list[FileChunk]
        Ordered list of chunks for this file.
    """
    text = file.content.strip()
    if not text:
        return []

    ext = _get_extension(file.path)

    # Small file → single chunk
    if len(text) <= _TARGET_CHARS:
        return [
            FileChunk(
                file_path=file.path,
                content=text,
                chunk_index=0,
                total_chunks=1,
            )
        ]

    # Try code-aware splitting
    if ext in _BOUNDARY_PATTERNS:
        chunks = _split_by_code_boundaries(text, ext)
    elif ext == ".md":
        chunks = _split_markdown(text)
    else:
        chunks = _split_sliding_window(text)

    # Build FileChunk objects
    total = len(chunks)
    file_chunks = []
    for i, chunk in enumerate(chunks):
        # Calculate line range
        start_line = 1
        end_line = 1
        idx = file.content.find(chunk)
        if idx != -1:
            start_line = file.content.count('\n', 0, idx) + 1
            end_line = start_line + chunk.count('\n')
        else:
            # Fallback by finding first line
            lines = chunk.splitlines()
            if lines:
                first_line = lines[0].strip()
                if len(first_line) > 5:
                    idx = file.content.find(first_line)
                    if idx != -1:
                        start_line = file.content.count('\n', 0, idx) + 1
                        end_line = start_line + len(lines) - 1
                    else:
                        end_line = start_line + len(lines) - 1
                else:
                    end_line = start_line + len(lines) - 1
        
        file_chunks.append(
            FileChunk(
                file_path=file.path,
                content=chunk,
                chunk_index=i,
                total_chunks=total,
                metadata={"start_line": start_line, "end_line": end_line}
            )
        )
    return file_chunks


def chunk_text(
    text: str,
    chunk_size: int | None = None,
    chunk_overlap: int | None = None,
) -> list[str]:
    """
    Simple text chunker (sliding-window). Kept for backward compatibility.

    Parameters
    ----------
    text : str
        The source text.
    chunk_size : int | None
        Max characters per chunk (default ~2000 ≈ 500 tokens).
    chunk_overlap : int | None
        Overlap between consecutive chunks (default 200).

    Returns
    -------
    list[str]
        The resulting text chunks.
    """
    size = chunk_size or _TARGET_CHARS
    overlap = chunk_overlap or _OVERLAP_CHARS
    return _split_sliding_window(text, max_chars=size, overlap=overlap)


# ── Internal chunking strategies ─────────────────────────

def _split_by_code_boundaries(text: str, ext: str) -> list[str]:
    """
    Split source code at function/class definition boundaries.

    Each chunk groups consecutive definitions so that the chunk stays
    within ``_TARGET_CHARS``. If a single definition exceeds the limit
    it is included as its own (oversized) chunk rather than being
    broken mid-function.
    """
    pattern = _BOUNDARY_PATTERNS[ext]
    matches = list(pattern.finditer(text))

    if len(matches) < 2:
        # Not enough boundaries – fall back to sliding window
        return _split_sliding_window(text)

    # Compute boundary positions (start of each match)
    boundaries = [m.start() for m in matches]

    # Build sections between boundaries
    sections: list[str] = []
    for i, start in enumerate(boundaries):
        end = boundaries[i + 1] if i + 1 < len(boundaries) else len(text)
        section = text[start:end].rstrip()
        if section:
            sections.append(section)

    # Prepend any header content before the first boundary (imports, etc.)
    header = text[: boundaries[0]].rstrip()
    if header:
        sections.insert(0, header)

    # Merge small sections into target-sized chunks
    return _merge_sections(sections)


def _split_markdown(text: str) -> list[str]:
    """Split Markdown by heading boundaries (lines starting with #)."""
    heading_re = re.compile(r"^#{1,6}\s", re.MULTILINE)
    matches = list(heading_re.finditer(text))

    if len(matches) < 2:
        return _split_sliding_window(text)

    boundaries = [m.start() for m in matches]
    sections: list[str] = []

    # Content before first heading
    header = text[: boundaries[0]].rstrip()
    if header:
        sections.append(header)

    for i, start in enumerate(boundaries):
        end = boundaries[i + 1] if i + 1 < len(boundaries) else len(text)
        section = text[start:end].rstrip()
        if section:
            sections.append(section)

    return _merge_sections(sections)


def _merge_sections(
    sections: list[str],
    max_chars: int = _TARGET_CHARS,
) -> list[str]:
    """
    Greedily merge adjacent sections so each chunk ≤ ``max_chars``.

    A section that exceeds ``max_chars`` on its own is kept intact
    to avoid breaking it mid-definition.
    """
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0

    for section in sections:
        section_len = len(section)

        if current and current_len + section_len + 2 > max_chars:
            # Flush current buffer
            chunks.append("\n\n".join(current))
            current = []
            current_len = 0

        current.append(section)
        current_len += section_len + 2  # +2 for the join separator

    if current:
        chunks.append("\n\n".join(current))

    # Drop any empty / too-small chunks
    return [c for c in chunks if len(c.strip()) >= _MIN_CHUNK_CHARS]


def _split_sliding_window(
    text: str,
    max_chars: int = _TARGET_CHARS,
    overlap: int = _OVERLAP_CHARS,
) -> list[str]:
    """
    Sliding-window chunker with line-boundary snapping.

    Instead of cutting mid-line, each window boundary is pushed to
    the nearest newline so that no line is split across chunks.
    """
    chunks: list[str] = []
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + max_chars, text_len)

        # Snap to nearest newline (don't cut mid-line)
        if end < text_len:
            newline_pos = text.rfind("\n", start, end)
            if newline_pos > start:
                end = newline_pos + 1  # include the newline

        chunk = text[start:end].strip()
        if chunk and len(chunk) >= _MIN_CHUNK_CHARS:
            chunks.append(chunk)

        # Advance with overlap
        step = end - start - overlap
        if step <= 0:
            step = max_chars  # prevent infinite loop on very long lines
        start += step

    return chunks if chunks else [text.strip()]
