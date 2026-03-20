"""Tests for document parsing and chunking logic."""
import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.document_service import chunk_pages, cosine_similarity


def test_chunk_pages_basic():
    pages = [("This is a test document with some content.", 1)]
    chunks = chunk_pages(pages)
    assert len(chunks) >= 1
    assert chunks[0]["page"] == 1
    assert "text" in chunks[0]


def test_chunk_pages_empty():
    pages = [("   ", 1), ("", 2)]
    chunks = chunk_pages(pages)
    assert chunks == []


def test_chunk_pages_multiple_pages():
    pages = [
        ("First page content about topic A.", 1),
        ("Second page content about topic B.", 2),
    ]
    chunks = chunk_pages(pages)
    pages_seen = {c["page"] for c in chunks}
    assert 1 in pages_seen
    assert 2 in pages_seen


def test_cosine_similarity_identical():
    vec = [1.0, 0.0, 0.0]
    assert cosine_similarity(vec, vec) == pytest.approx(1.0)


def test_cosine_similarity_orthogonal():
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert cosine_similarity(a, b) == pytest.approx(0.0)


def test_cosine_similarity_zero_vector():
    a = [0.0, 0.0]
    b = [1.0, 2.0]
    assert cosine_similarity(a, b) == 0.0
