"""Streaming chat endpoint using Server-Sent Events."""
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest
from app.services.chat_service import stream_chat

router = APIRouter()


@router.post("/stream")
async def chat_stream(request: ChatRequest):
    if not request.messages:
        raise HTTPException(400, "messages array must not be empty.")

    last_role = request.messages[-1].role
    if last_role != "user":
        raise HTTPException(400, "Last message must be from the user.")

    async def event_generator():
        try:
            async for chunk in stream_chat(request.messages, request.document_ids):
                yield chunk
        except Exception as exc:
            error_payload = json.dumps({"type": "error", "error": str(exc)})
            yield f"data: {error_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
