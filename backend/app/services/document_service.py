import uuid
import hashlib
import math
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import fitz
import numpy as np
from docx import Document as DocxDocument
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.core.config import settings

document_store: Dict[str, dict] = {}
chunk_store: Dict[str, List[dict]] = {}

splitter = RecursiveCharacterTextSplitter(
    chunk_size=settings.chunk_size,
    chunk_overlap=settings.chunk_overlap,
    separators=["\n\n", "\n", ". ", " ", ""],
)


def parse_pdf(path: Path) -> Tuple[List[Tuple[str, int]], int]:
    doc = fitz.open(str(path))
    pages = [(page.get_text(), i + 1) for i, page in enumerate(doc)]
    return pages, len(doc)


def parse_docx(path: Path) -> Tuple[List[Tuple[str, int]], int]:
    doc = DocxDocument(str(path))
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    chunks = [full_text[i: i + 3000] for i in range(0, len(full_text), 3000)]
    pages = [(chunk, idx + 1) for idx, chunk in enumerate(chunks)]
    return pages, len(pages)


def parse_document(path: Path) -> Tuple[List[Tuple[str, int]], int]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return parse_pdf(path)
    elif suffix in (".docx", ".doc"):
        return parse_docx(path)
    else:
        raise ValueError(f"Unsupported file type: {suffix}")


def chunk_pages(pages: List[Tuple[str, int]]) -> List[dict]:
    chunks = []
    for text, page_num in pages:
        if not text.strip():
            continue
        splits = splitter.split_text(text)
        for split in splits:
            chunks.append({"text": split, "page": page_num})
    return chunks


def tokenize(text: str) -> List[str]:
    return text.lower().split()


def embed_text(text: str, vocab: Dict[str, int], idf: Dict[str, float]) -> List[float]:
    tokens = tokenize(text)
    tf = Counter(tokens)
    total = len(tokens) or 1
    vec = [0.0] * len(vocab)
    for token, count in tf.items():
        if token in vocab:
            vec[vocab[token]] = (count / total) * idf.get(token, 1.0)
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def build_vocab_idf(texts: List[str]) -> Tuple[Dict[str, int], Dict[str, float]]:
    N = len(texts)
    df: Counter = Counter()
    for text in texts:
        tokens = set(tokenize(text))
        df.update(tokens)
    vocab = {word: i for i, word in enumerate(sorted(df.keys()))}
    idf = {word: math.log((N + 1) / (count + 1)) + 1 for word, count in df.items()}
    return vocab, idf


def cosine_similarity(a: List[float], b: List[float]) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom else 0.0


async def ingest_document(path: Path, original_filename: str) -> dict:
    doc_id = str(uuid.uuid4())
    pages, page_count = parse_document(path)
    raw_chunks = chunk_pages(pages)

    if not raw_chunks:
        raise ValueError("Document appears to be empty or unreadable.")

    print(f"[INGEST] Building TF-IDF for {len(raw_chunks)} chunks...")
    texts = [c["text"] for c in raw_chunks]
    vocab, idf = build_vocab_idf(texts)
    embeddings = [embed_text(t, vocab, idf) for t in texts]

    enriched_chunks = []
    for chunk, embedding in zip(raw_chunks, embeddings):
        enriched_chunks.append({
            **chunk,
            "doc_id": doc_id,
            "filename": original_filename,
            "embedding": embedding,
            "vocab": vocab,
            "idf": idf,
        })

    chunk_store[doc_id] = enriched_chunks

    stat = path.stat()
    metadata = {
        "id": doc_id,
        "filename": original_filename,
        "page_count": page_count,
        "chunk_count": len(enriched_chunks),
        "uploaded_at": datetime.utcnow(),
        "size_bytes": stat.st_size,
        "path": str(path),
        "vocab": vocab,
        "idf": idf,
    }
    document_store[doc_id] = metadata
    return metadata


async def retrieve_chunks(query: str, doc_ids: List[str] | None = None) -> List[dict]:
    if not chunk_store:
        return []

    target_ids = doc_ids if doc_ids else list(chunk_store.keys())
    all_chunks = []
    for did in target_ids:
        if did in chunk_store:
            all_chunks.extend(chunk_store[did])

    if not all_chunks:
        return []

    vocab = all_chunks[0]["vocab"]
    idf = all_chunks[0]["idf"]
    query_embedding = embed_text(query, vocab, idf)

    candidates = []
    for chunk in all_chunks:
        score = cosine_similarity(query_embedding, chunk["embedding"])
        candidates.append((score, chunk))

    candidates.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in candidates[:settings.top_k_results]]