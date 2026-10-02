# AI Service (Future Microservice Placeholder)

## Overview
This service will be built using **Python** and **FastAPI** to provide AI-powered semantic search and personalized resource recommendations for the Intelligent Academic Resource System.

> **Note:** As per the project roadmap, the AI service will be implemented in Phase 2 after finalizing the core full-stack foundation.

---

## Planned Architecture & Technologies

1. **Framework**: FastAPI (High-performance asynchronous Python REST API)
2. **PDF Text Extraction**:
   - `PyPDF2` / `pypdf`
   - `pdfplumber` or `fitz` (PyMuPDF) for structural document parsing
3. **Text Chunking & Preprocessing**:
   - Recursive character text splitting (using LangChain or custom token chunker)
   - Academic metadata preservation (Subject, Department, Semester, Chapter keywords)
4. **Vector Embeddings**:
   - `sentence-transformers` (e.g., `all-MiniLM-L6-v2` or `BGE-small-en-v1.5`)
   - Hugging Face / OpenAI embedding models
5. **Vector Store / Semantic Search**:
   - ChromaDB / FAISS / Qdrant for storing vector embeddings
   - Cosine similarity matching between student search queries and resource chunks
6. **Recommendation Engine**:
   - Content-based filtering based on user's department, semester, downloaded subjects, and recent searches
   - Collaborative filtering signals (popular resources among peers in the same semester)

---

## Planned Endpoints

| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/ai/health` | GET | Health check for AI service |
| `/api/ai/process-pdf` | POST | Extract text, chunk, and index an uploaded PDF |
| `/api/ai/semantic-search` | POST | Query vector database with natural language query |
| `/api/ai/recommendations` | POST | Generate personalized study material recommendations for a student |

---

## Future Setup Instructions
```bash
# Navigate to ai-service directory
cd ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run FastAPI dev server
uvicorn main:app --reload --port 8000
```
