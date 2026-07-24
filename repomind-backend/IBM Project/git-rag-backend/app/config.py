"""
Environment Variables & Settings
Loads configuration from .env and exposes typed settings via Pydantic.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- API Keys ---
    gemini_api_key: str
    github_token: str = ""

    # --- Vector DB ---
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "git_rag"

    # --- Model Config ---
    embedding_model: str = "models/gemini-embedding-001"
    llm_model: str = "models/gemini-2.5-flash"

    # --- Chunking ---
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # --- CORS ---
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174"


# Singleton instance – import this everywhere
settings = Settings()
