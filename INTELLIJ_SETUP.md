# IntelliJ IDEA Setup Guide

## Prerequisites

Install these plugins in IntelliJ IDEA:
1. **Python** (bundled with PyCharm, install via `File > Settings > Plugins` in IDEA)
2. **Node.js** (for frontend)

---

## Backend Setup (FastAPI)

### 1. Open the project
- `File > Open` → select the `chat-with-docs/` root folder
- IntelliJ will detect it as a multi-module project

### 2. Configure Python SDK
- `File > Project Structure > SDKs > + > Python SDK`
- Choose **Virtualenv Environment** → New
- Base interpreter: Python 3.11
- Location: `backend/venv`
- Click OK

### 3. Mark source root
- Right-click `backend/` → `Mark Directory As > Sources Root`

### 4. Create a Run Configuration for the backend
- `Run > Edit Configurations > + > Python`
- Name: `FastAPI Dev`
- Script: `backend/main.py`  
  *Or use module mode:*
- Module: `uvicorn`
- Parameters: `main:app --reload --port 8000`
- Working directory: `$PROJECT_DIR$/backend`
- Environment variables: `PYTHONPATH=$PROJECT_DIR$/backend`
- Python interpreter: the venv you created

### 5. Install dependencies
Open IntelliJ terminal:
```bash
cd backend
pip install -r requirements.txt
```

---

## Frontend Setup (Next.js)

### 1. Configure Node.js
- `File > Settings > Languages & Frameworks > Node.js`
- Set Node interpreter to your Node 18+ install

### 2. Create a Run Configuration for the frontend
- `Run > Edit Configurations > + > npm`
- Name: `Next.js Dev`
- `package.json`: `frontend/package.json`
- Command: `run`
- Scripts: `dev`

### 3. Install dependencies
```bash
cd frontend
npm install
```

---

## Running Both Together

Use IntelliJ's **Compound Run Configuration**:
- `Run > Edit Configurations > + > Compound`
- Name: `Full Stack`
- Add: `FastAPI Dev` + `Next.js Dev`
- Hit Run — both start simultaneously

---

## Environment Variables in IntelliJ

- Copy `.env.example` to `.env`
- In the FastAPI run config → `Environment Variables` → load from `.env`
- Or install the **EnvFile** plugin to auto-load `.env`

---

## Useful Shortcuts

| Action | Shortcut |
|--------|----------|
| Run | `Shift+F10` |
| Debug | `Shift+F9` |
| Open Terminal | `Alt+F12` |
| Find in Files | `Ctrl+Shift+F` |
| Git operations | `Alt+9` |
