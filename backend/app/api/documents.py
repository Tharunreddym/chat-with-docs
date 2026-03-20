"""Document upload / list / delete endpoints."""
import shutil
import traceback
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.models.schemas import DocumentListOut, DocumentOut
from app.services.document_service import document_store, chunk_store, ingest_document

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc"}


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type '{ext}'. Upload PDF or DOCX.")

    if file.size and file.size > settings.max_upload_bytes:
        raise HTTPException(413, f"File exceeds {settings.max_upload_size_mb} MB limit.")

    safe_name = f"{uuid.uuid4()}{ext}"
    dest = settings.upload_dir / safe_name

    print(f"[UPLOAD] Saving to: {dest}")
    try:
        with dest.open("wb") as out:
            shutil.copyfileobj(file.file, out)
    finally:
        await file.close()

    print(f"[UPLOAD] File saved. Starting ingestion...")
    try:
        metadata = await ingest_document(dest, file.filename or safe_name)
        print(f"[UPLOAD] Ingestion complete: {metadata}")
    except Exception as exc:
        print(f"[UPLOAD ERROR] {exc}")
        traceback.print_exc()
        dest.unlink(missing_ok=True)
        raise HTTPException(500, f"Failed to process document: {exc}") from exc

    return DocumentOut(**metadata)


@router.get("", response_model=DocumentListOut)
async def list_documents():
    docs = [DocumentOut(**meta) for meta in document_store.values()]
    docs.sort(key=lambda d: d.uploaded_at, reverse=True)
    return DocumentListOut(documents=docs, total=len(docs))


@router.delete("/{document_id}", status_code=204)
async def delete_document(document_id: str):
    if document_id not in document_store:
        raise HTTPException(404, "Document not found.")

    meta = document_store.pop(document_id)
    chunk_store.pop(document_id, None)

    path = Path(meta.get("path", ""))
    path.unlink(missing_ok=True)