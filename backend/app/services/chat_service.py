import json
from typing import AsyncIterator, List, Optional

from groq import AsyncGroq

from app.core.config import settings
from app.models.schemas import ChatMessage, SourceChunk
from app.services.document_service import retrieve_chunks

client = AsyncGroq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are a helpful assistant that answers questions based on the provided document excerpts.

Rules:
- Answer ONLY from the provided context. Do not use outside knowledge.
- After each factual claim, add an inline citation like [Source: filename, p.N].
- If the context does not contain enough information, say so clearly.
- Be concise and precise.
"""


def _build_context_block(chunks: List[dict]) -> str:
    lines = ["<context>"]
    for i, chunk in enumerate(chunks, 1):
        lines.append(
            f'[{i}] File: {chunk["filename"]} | Page: {chunk["page"]}\n{chunk["text"]}'
        )
    lines.append("</context>")
    return "\n\n".join(lines)


def _chunks_to_sources(chunks: List[dict]) -> List[SourceChunk]:
    seen = set()
    sources = []
    for chunk in chunks:
        key = (chunk["doc_id"], chunk["page"])
        if key not in seen:
            seen.add(key)
            sources.append(
                SourceChunk(
                    document_id=chunk["doc_id"],
                    filename=chunk["filename"],
                    page=chunk["page"],
                    text_preview=chunk["text"][:200],
                )
            )
    return sources


async def stream_chat(
    messages: List[ChatMessage],
    document_ids: Optional[List[str]],
) -> AsyncIterator[str]:
    user_query = next(
        (m.content for m in reversed(messages) if m.role == "user"), ""
    )
    chunks = await retrieve_chunks(user_query, document_ids)

    sources = _chunks_to_sources(chunks)
    yield _sse({"type": "sources", "sources": [s.model_dump() for s in sources]})

    context_block = (
        _build_context_block(chunks)
        if chunks
        else "<context>No documents uploaded yet.</context>"
    )
    groq_messages = [{"role": "system", "content": SYSTEM_PROMPT + "\n\n" + context_block}]
    for msg in messages:
        groq_messages.append({"role": msg.role, "content": msg.content})

    stream = await client.chat.completions.create(
        model=settings.groq_model,
        messages=groq_messages,
        stream=True,
        temperature=0.2,
        max_tokens=1500,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield _sse({"type": "token", "content": delta.content})

    yield _sse({"type": "done"})


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"