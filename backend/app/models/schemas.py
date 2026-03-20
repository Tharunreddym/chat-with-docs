"""Pydantic request/response schemas."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# ── Documents ──────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: str
    filename: str
    page_count: int
    chunk_count: int
    uploaded_at: datetime
    size_bytes: int


class DocumentListOut(BaseModel):
    documents: List[DocumentOut]
    total: int


# ── Chat ───────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    document_ids: Optional[List[str]] = None  # None = search all uploaded docs


class SourceChunk(BaseModel):
    document_id: str
    filename: str
    page: int
    text_preview: str  # first 200 chars of the chunk


class ChatStreamEvent(BaseModel):
    """Shape of each SSE data payload."""
    type: str  # "token" | "sources" | "done" | "error"
    content: Optional[str] = None
    sources: Optional[List[SourceChunk]] = None
    error: Optional[str] = None


# ── Health ─────────────────────────────────────────────────────────────────────

class HealthOut(BaseModel):
    status: str
    version: str
    openai_configured: bool
