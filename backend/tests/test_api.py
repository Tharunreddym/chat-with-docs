"""Integration tests for API endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


def test_list_documents_empty():
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert data["documents"] == []
    assert data["total"] == 0


def test_upload_invalid_file_type():
    response = client.post(
        "/api/documents/upload",
        files={"file": ("test.txt", b"hello world", "text/plain")},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_delete_nonexistent_document():
    response = client.delete("/api/documents/nonexistent-id")
    assert response.status_code == 404


def test_chat_empty_messages():
    response = client.post("/api/chat/stream", json={"messages": []})
    assert response.status_code == 400


def test_chat_last_message_not_user():
    response = client.post(
        "/api/chat/stream",
        json={"messages": [{"role": "assistant", "content": "Hello"}]},
    )
    assert response.status_code == 400
