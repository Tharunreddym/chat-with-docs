# Chat with Your Documents

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload PDF or Word documents and chat with them using OpenAI GPT-4o. Responses stream token-by-token via Server-Sent Events with inline source citations.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, FastAPI |
| AI | OpenAI GPT-4o |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector Store | In-memory (FAISS) — swap for Pinecone easily |
| Document Parsing | LangChain, PyMuPDF, python-docx |
| Streaming | Server-Sent Events (SSE) |
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |

## Features

- Upload PDF and Word (.docx) documents
- Chunking with overlap via LangChain text splitters
- Dense vector retrieval with OpenAI embeddings + FAISS
- GPT-4o answers with inline `[Source: page N]` citations
- Token-by-token streaming — first token < 500ms
- Multi-document support per session
- Clean chat UI with upload progress

## Project Structure

```
chat-with-docs/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI route handlers
│   │   ├── core/         # Config, settings
│   │   ├── models/       # Pydantic schemas
│   │   ├── services/     # RAG pipeline, document processing
│   │   └── utils/        # Helpers
│   ├── tests/
│   ├── requirements.txt
│   └── main.py
├── frontend/
│   ├── app/              # Next.js 14 app router
│   ├── lib/              # API client, types
│   └── package.json
├── .env.example
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- OpenAI API key

### 1. Clone & configure

```bash
git clone https://github.com/YOUR_USERNAME/chat-with-docs.git
cd chat-with-docs
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## IntelliJ Setup

See [INTELLIJ_SETUP.md](INTELLIJ_SETUP.md) for step-by-step IDE configuration.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/documents/upload` | Upload PDF or DOCX |
| `GET` | `/api/documents` | List uploaded documents |
| `DELETE` | `/api/documents/{id}` | Remove a document |
| `POST` | `/api/chat/stream` | Stream chat response (SSE) |
| `GET` | `/api/health` | Health check |

## Environment Variables

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
MAX_UPLOAD_SIZE_MB=50
CHUNK_SIZE=800
CHUNK_OVERLAP=150
TOP_K_RESULTS=5
CORS_ORIGINS=http://localhost:3000
```
