# AI Microservice - Academic Resource Retrieval & Recommendation System

## Overview
This microservice is built using **Python** and **FastAPI**. It powers the intelligence layer for the Intelligent Academic Resource System, including document ingestion, text preprocessing, vector embeddings, persistent vector storage via ChromaDB, semantic search, and personalized recommendations.

---

## AI Pipeline Roadmap & Architecture

```
+---------------------------------------------------------------------------------------+
| [COMPLETED] Phase 1: Document Ingestion & Text Chunking                               |
|  - PDF text extraction via PyPDF                                                      |
|  - Text normalization & whitespace cleaning                                           |
|  - Page boundary preservation                                                         |
|  - Sliding-window text chunking with configurable overlap                             |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| [COMPLETED] Phase 2: Vector Embeddings & ChromaDB Vector Storage                      |
|  - SentenceTransformer model: sentence-transformers/all-MiniLM-L6-v2 (384-D)           |
|  - Dense vector generation for individual chunks and batch processing                 |
|  - Persistent ChromaDB collection with HNSW cosine distance indexing                  |
|  - Academic metadata storage (resource_id, filename, page_number, chunk_id)           |
|  - Vector similarity search & query matching endpoint                                 |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| [COMPLETED] Unified Indexing Pipeline (PDF -> Chunks -> Embeddings -> ChromaDB)       |
|  - Master orchestrator in indexing_pipeline.py                                        |
|  - Endpoint POST /api/ai/index-pdf for end-to-end ingestion and vector persistence     |
+---------------------------------------------------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
| [UPCOMING] Phase 3: Semantic Search Query Pipeline & Recommendation Engine            |
|  - Full-text and vector hybrid search integration                                     |
|  - Content-based + collaborative personalized resource recommendation engine          |
+---------------------------------------------------------------------------------------+
```

---

## Core Concepts (College Viva & Presentation Reference)

### 1. Unified Document Indexing Pipeline
The indexing pipeline connects all individual AI components into an automated, 4-step workflow:
1. **Extraction**: `pypdf` parses the raw PDF stream page-by-page.
2. **Chunking**: Text is cleaned and split into overlapping chunks with preserved `page_number` references.
3. **Embedding**: `sentence-transformers/all-MiniLM-L6-v2` generates 384-dimensional dense vectors for all chunks in batch.
4. **Vector Storage**: ChromaDB stores vectors, chunk texts, and metadata (`resource_id`, `filename`, `page_number`, `chunk_id`, `chunk_index`) using HNSW cosine index.

### 2. What are Vector Embeddings?
- An **embedding** is a dense numerical vector representation of text in a high-dimensional mathematical space (384 dimensions in our system).
- Instead of treating text as isolated strings of characters, embedding models map words, sentences, and paragraphs into a continuous vector space where **semantic meaning** is preserved as geometric coordinates.

### 3. Why are Embeddings Used instead of Keyword Search?
- **Vocabulary Mismatch Problem**: Traditional keyword searches (like SQL `LIKE` queries or exact string searches) fail when users query using synonyms or descriptive terms (e.g., searching for *"hierarchical data structures"* will fail to find documents mentioning *"Binary Search Trees"* or *"AVL Trees"*).
- **Contextual Understanding**: Embeddings understand that *"CPU Scheduling"* and *"Process Dispatching"* refer to closely related concepts in Operating Systems.
- **Model Used**: `sentence-transformers/all-MiniLM-L6-v2` (~80 MB, 384-D dense vectors, high-performance semantic search).

### 4. What is ChromaDB and Why is it Used?
- **ChromaDB** is an open-source, AI-native vector database.
- Traditional databases (PostgreSQL, MongoDB) are optimized for scalar values and B-tree/hash indexes. They are inefficient for calculating geometric distances (such as Cosine Similarity) across millions of 384-dimensional vectors.
- ChromaDB uses **Hierarchical Navigable Small World (HNSW)** indexing to perform Approximate Nearest Neighbor (ANN) search in sub-millisecond time.
- **Persistence**: All vectors, document texts, and metadata are saved locally in `ai-service/chroma_db/` and reloaded on startup.

---

## API Endpoints

| Endpoint | Method | Payload Type | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/ai/health` | `GET` | None | Health check & microservice status |
| `/api/ai/process-pdf` | `POST` | `multipart/form-data` | Upload a PDF file to extract text & generate chunks |
| `/api/ai/chunk-text` | `POST` | `application/json` | Test chunking algorithm directly on plain text |
| `/api/ai/index-text` | `POST` | `application/json` | Embed a single text passage and store in ChromaDB with metadata |
| `/api/ai/index-pdf` | `POST` | `multipart/form-data` | **Complete Pipeline**: Extract, chunk, embed, and index an entire PDF into ChromaDB |
| `/api/ai/search-vectors` | `POST` | `application/json` | Natural language semantic search returning closest chunks |
| `/api/ai/vector-stats` | `GET` | None | Returns ChromaDB vector count and storage directory |

---

## Setup & Running Instructions

### 1. Activate the Virtual Environment
Navigate to the `ai-service` directory:
```bash
cd ai-service
```

Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD)**:
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **Linux / macOS**:
  ```bash
  source .venv/bin/activate
  ```

### 2. Run the FastAPI Development Server
```bash
uvicorn main:app --reload --port 8000
```
The server will start at `http://127.0.0.1:8000`.

---

## How to Run the Automated Test Suites

### Test Suite 1: Phase 1 PDF Extraction & Chunking
```bash
cd ai-service
.\.venv\Scripts\python.exe test_pipeline.py
```

### Test Suite 2: Phase 2 Embeddings & ChromaDB Vector Store
```bash
cd ai-service
.\.venv\Scripts\python.exe test_embeddings_chromadb.py
```

### Test Suite 3: Complete End-to-End PDF Indexing Pipeline
```bash
cd ai-service
.\.venv\Scripts\python.exe test_indexing_pipeline.py
```

---

## How to Test via Swagger UI & cURL

### Option A: Interactive Swagger UI (Recommended for Viva Demo)
1. Open your browser and navigate to:
   **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**
2. **Test Complete PDF Indexing**:
   - Open **`POST /api/ai/index-pdf`** -> **Try it out**.
   - Choose any PDF file from your machine.
   - Enter `resource_id`: `"res_os_101"`.
   - Click **Execute**.
   - Inspect the response containing `total_pages`, `total_chunks`, and `vectors_stored`.
3. **Test Semantic Search Query**:
   - Open **`POST /api/ai/search-vectors`** -> **Try it out**.
   - Enter query: `"What are CPU scheduling algorithms?"`
   - Click **Execute** to see the retrieved chunk, similarity score, source filename, and exact page number.

### Option B: Using cURL

#### 1. Index a Full PDF Document
```bash
curl -X POST "http://127.0.0.1:8000/api/ai/index-pdf" \
  -F "file=@/path/to/lecture_notes.pdf" \
  -F "resource_id=res_lecture_101" \
  -F "chunk_size=500" \
  -F "chunk_overlap=50"
```

#### 2. Perform Semantic Search Query
```bash
curl -X POST "http://127.0.0.1:8000/api/ai/search-vectors" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Explain round robin and CPU process dispatching",
    "top_k": 3
  }'
```

#### 3. Check Vector Store Statistics
```bash
curl -X GET "http://127.0.0.1:8000/api/ai/vector-stats"
```
