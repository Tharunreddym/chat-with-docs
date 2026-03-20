from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Groq
    groq_api_key: str = ""
    groq_model: str = "llama3-8b-8192"

    # OpenAI embeddings only
    openai_api_key: str = ""
    openai_embedding_model: str = "text-embedding-3-small"

    # RAG
    chunk_size: int = 800
    chunk_overlap: int = 150
    top_k_results: int = 5

    # Upload
    max_upload_size_mb: int = 50
    upload_dir: Path = Path("./uploads")

    # Server
    cors_origins: str = "http://localhost:3000"
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
settings.upload_dir.mkdir(parents=True, exist_ok=True)