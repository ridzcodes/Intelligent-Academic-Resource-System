"""
Intelligent Academic Resource Retrieval & Recommendation System
Python AI Microservice (FastAPI)

Pipeline Architecture:
----------------------
[Phase 1 / Completed] -> PDF Ingestion, Text Cleaning & Overlapping Chunking
[Phase 2 / Completed] -> Sentence-Transformer Embeddings (all-MiniLM-L6-v2) & ChromaDB Vector Storage
[Pipeline Module]     -> Unified End-to-End PDF Indexing Pipeline (PDF -> Chunks -> Vectors -> ChromaDB)
[Phase 3 / Upcoming]  -> Semantic Search Query Pipeline & Personalized Recommendation Engine
"""

from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel, Field

# Module 1: PDF Extraction & Chunking
from pdf_processor import process_pdf, chunk_text

# Module 2: SentenceTransformer Embeddings & ChromaDB Vector Store
from embedding_service import embedding_service
from vector_store import vector_store

# Unified Pipeline: End-to-End Ingestion & Indexing
from indexing_pipeline import index_pdf_document

app = FastAPI(
    title="Academic Resource AI Microservice",
    description="Microservice for PDF text extraction, chunking, embeddings, ChromaDB vector search, and recommendations",
    version="2.1.0"
)

# ---------------------------------------------------------------------------
# Pydantic Schemas (Data Validation & OpenAPI Documentation)
# ---------------------------------------------------------------------------

class PageData(BaseModel):
    page_number: int = Field(..., description="1-indexed page number from the PDF")
    text: str = Field(..., description="Cleaned text content of the page")
    character_count: int = Field(..., description="Total characters in this page")
    word_count: int = Field(..., description="Total words in this page")


class ChunkData(BaseModel):
    chunk_id: str = Field(..., description="Unique identifier for the chunk")
    chunk_index: int = Field(..., description="Zero-based sequence index of the chunk")
    page_number: int = Field(..., description="Original PDF page number where this chunk originates")
    text: str = Field(..., description="Chunk text content")
    character_count: int = Field(..., description="Total characters in this chunk")
    word_count: int = Field(..., description="Total words in this chunk")


class PDFProcessResponse(BaseModel):
    filename: str = Field(..., description="Name of the uploaded PDF file")
    total_pages: int = Field(..., description="Total number of pages extracted")
    total_chunks: int = Field(..., description="Total number of text chunks generated")
    chunk_size: int = Field(..., description="Chunk size configured (in characters)")
    chunk_overlap: int = Field(..., description="Chunk overlap configured (in characters)")
    pages: List[PageData] = Field(..., description="List of per-page extracted text objects")
    chunks: List[ChunkData] = Field(..., description="List of generated text chunks with metadata")


class ChunkTextRequest(BaseModel):
    text: str = Field(..., description="Plain text to be split into chunks")
    chunk_size: int = Field(500, description="Max characters per chunk (default: 500)")
    chunk_overlap: int = Field(50, description="Overlap characters between adjacent chunks (default: 50)")


class ChunkTextResponse(BaseModel):
    total_chunks: int = Field(..., description="Total number of chunks produced")
    chunk_size: int = Field(..., description="Configured chunk size")
    chunk_overlap: int = Field(..., description="Configured chunk overlap")
    chunks: List[str] = Field(..., description="List of extracted text chunks")


# --- Phase 2 & Indexing Pipeline Schemas ---

class IndexTextRequest(BaseModel):
    text: str = Field(..., description="Text content to be converted to vector embedding and stored in ChromaDB")
    resource_id: str = Field("demo_resource", description="Unique identifier for the resource / document")
    filename: str = Field("demo.txt", description="Source document filename")
    page_number: int = Field(1, description="Source page number (default: 1)")
    chunk_id: str = Field("chunk_0", description="Chunk identifier (default: chunk_0)")
    chunk_index: int = Field(0, description="Chunk sequential index (default: 0)")


class IndexTextResponse(BaseModel):
    message: str = Field(..., description="Status message")
    vector_id: str = Field(..., description="Unique ID assigned in ChromaDB")
    resource_id: str = Field(..., description="Resource ID")
    filename: str = Field(..., description="Source filename")
    page_number: int = Field(..., description="Page number")
    embedding_dimension: int = Field(..., description="Dimension of generated embedding (384)")
    total_vectors_in_db: int = Field(..., description="Total vector count currently in ChromaDB")
    document_preview: str = Field(..., description="Preview of indexed text")


class IndexPDFResponse(BaseModel):
    success: bool = Field(True, description="Indicates whether indexing succeeded")
    status: str = Field("indexed", description="Indexing status: 'indexed' or 'failed'")
    message: str = Field("Document successfully indexed into vector database", description="Status message")
    filename: str = Field(..., description="Source PDF filename")
    resource_id: str = Field(..., description="Resource ID")
    total_pages: int = Field(..., description="Extracted page count")
    total_chunks: int = Field(..., description="Number of chunks generated")
    vectors_stored: int = Field(..., description="Number of vectors embedded and stored in ChromaDB")
    embedding_dimension: int = Field(384, description="Dimension of generated embeddings (384)")
    total_vectors_in_db: int = Field(..., description="Total vector count currently in ChromaDB")


class SearchVectorRequest(BaseModel):
    query: str = Field(..., description="Natural language search query (e.g. 'Binary Search Trees', 'Deadlock detection')")
    top_k: int = Field(8, description="Number of most relevant unique resources to retrieve (default: 8)")
    resource_id: Optional[str] = Field(None, description="Optional filter to restrict search to a specific resource")


class SearchVectorItem(BaseModel):
    id: str = Field(..., description="Vector ID in ChromaDB")
    text: str = Field(..., description="Chunk text content retrieved")
    similarity_score: float = Field(..., description="Cosine / hybrid relevance score (0.0 to 1.0, higher is more similar)")
    distance: float = Field(..., description="Cosine distance (0.0 is exact match, 2.0 is opposite)")
    metadata: Dict[str, Any] = Field(..., description="Chunk metadata including resource_id, page_number, filename")


class SearchVectorResponse(BaseModel):
    query: str = Field(..., description="The search query")
    top_k: int = Field(..., description="Requested top_k results count")
    total_results: int = Field(..., description="Number of matching unique resource results found")
    results: List[SearchVectorItem] = Field(..., description="List of matching unique resource chunks sorted by relevance")


# --- Recommendation Engine Schemas ---

class RecommendRequest(BaseModel):
    resource_id: Optional[str] = Field(None, description="Source academic resource ID to find similar items for")
    text: Optional[str] = Field(None, description="Optional text content (title, subject, description) for fallback embedding")
    top_k: int = Field(5, description="Number of unique similar resources to recommend (default: 5)")


class RecommendedResourceItem(BaseModel):
    resource_id: str = Field(..., description="Unique academic resource ID")
    similarity_score: float = Field(..., description="Aggregated cosine similarity score (0.0 to 1.0)")
    final_score: Optional[float] = Field(None, description="Final pooled recommendation score (0.6*max + 0.4*top3_mean)")
    max_similarity_score: float = Field(..., description="Peak cross-chunk similarity score")
    max_similarity: Optional[float] = Field(None, description="Peak cross-chunk similarity score alias")
    avg_similarity_score: float = Field(..., description="Average similarity score across top-3 matched chunks")
    top3_mean_similarity: Optional[float] = Field(None, description="Mean of top 3 cross-chunk similarities")
    matched_chunks_count: int = Field(..., description="Number of matching passages in this document")
    filename: Optional[str] = Field(None, description="Original filename")
    best_match_page: Optional[int] = Field(None, description="Page number of highest matching chunk")
    best_match_chunk_id: Optional[str] = Field(None, description="Chunk ID of highest match")
    best_match_text: Optional[str] = Field(None, description="Excerpt preview of highest matching text")
    best_source_chunk_id: Optional[str] = Field(None, description="Chunk ID of highest matching source chunk")
    best_source_page: Optional[int] = Field(None, description="Page number of highest matching source chunk")


class RecommendResponse(BaseModel):
    success: bool = Field(True, description="Indicates whether recommendation succeeded")
    source_resource_id: Optional[str] = Field(None, description="Source resource ID requested")
    total_recommendations: int = Field(..., description="Total unique recommended resources returned")
    recommendations: List[RecommendedResourceItem] = Field(..., description="Ranked list of similar resources")
    message: str = Field("Recommendations retrieved successfully", description="Status message")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/ai/health")
def health_check():
    """
    Health check endpoint to verify that the AI microservice is online.
    Preserved as required for system monitoring and viva demonstration.
    """
    return {
        "status": "online",
        "service": "AI Semantic Retrieval and Recommendation Engine",
        "phase": "Phase 2 (Embeddings & ChromaDB Vector Storage Active)",
        "message": "AI service placeholder is ready for vector pipeline integration"
    }


# --- Module 1 Endpoints: PDF Extraction & Text Chunking ---

@app.post("/api/ai/process-pdf", response_model=PDFProcessResponse)
async def process_pdf_upload(
    file: UploadFile = File(..., description="PDF file to be extracted and chunked"),
    chunk_size: int = Form(500, description="Maximum characters per chunk (default: 500)"),
    chunk_overlap: int = Form(50, description="Overlap characters between chunks (default: 50)")
):
    """
    Module 1 Endpoint: PDF File Upload Extraction & Chunking
    
    Viva Explanation:
    1. Validates the uploaded file is a PDF.
    2. Uses PyPDF to parse pages and clean raw text.
    3. Breaks the document into overlapping chunks (sliding window).
    4. Attaches page metadata so future vector embeddings can trace back to the exact page.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF (.pdf) files are supported."
        )

    if chunk_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_size must be greater than 0."
        )
    if chunk_overlap < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap cannot be negative."
        )
    if chunk_overlap >= chunk_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap must be strictly less than chunk_size."
        )

    try:
        result = process_pdf(file.file, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        
        return {
            "filename": file.filename,
            "total_pages": result["total_pages"],
            "total_chunks": result["total_chunks"],
            "chunk_size": chunk_size,
            "chunk_overlap": chunk_overlap,
            "pages": result["pages"],
            "chunks": result["chunks"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing PDF: {str(e)}"
        )


@app.post("/api/ai/chunk-text", response_model=ChunkTextResponse)
def chunk_raw_text(request: ChunkTextRequest):
    """
    Demonstration Endpoint: Direct Text Chunking
    
    Demonstrates how raw text is split into chunks with overlap without needing a PDF.
    Ideal for viva testing and understanding chunk boundary behavior.
    """
    if request.chunk_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_size must be greater than 0."
        )
    if request.chunk_overlap < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap cannot be negative."
        )
    if request.chunk_overlap >= request.chunk_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap must be strictly less than chunk_size."
        )

    chunks = chunk_text(request.text, chunk_size=request.chunk_size, chunk_overlap=request.chunk_overlap)

    return {
        "total_chunks": len(chunks),
        "chunk_size": request.chunk_size,
        "chunk_overlap": request.chunk_overlap,
        "chunks": chunks
    }


# --- Module 2 Endpoints: Embeddings & ChromaDB Vector Store ---

@app.post("/api/ai/index-text", response_model=IndexTextResponse)
def index_single_text(request: IndexTextRequest):
    """
    Phase 2 Endpoint: Text -> SentenceTransformer Embedding -> ChromaDB Storage
    
    Viva Demonstration:
    1. Receives a sample text piece and metadata (resource_id, filename, page_number).
    2. Passes the text to SentenceTransformer ('all-MiniLM-L6-v2') to produce a 384-D vector.
    3. Persists the vector, original text, and metadata inside ChromaDB.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text field cannot be empty."
        )

    try:
        # Step 1: Generate 384-dimensional dense vector embedding
        embedding = embedding_service.generate_embedding(request.text)
        
        # Step 2: Store vector and metadata in ChromaDB
        store_result = vector_store.add_single_text(
            text=request.text.strip(),
            embedding=embedding,
            resource_id=request.resource_id,
            filename=request.filename,
            page_number=request.page_number,
            chunk_id=request.chunk_id,
            chunk_index=request.chunk_index
        )

        stats = vector_store.get_stats()

        return {
            "message": "Text successfully embedded and indexed in ChromaDB",
            "vector_id": store_result["vector_id"],
            "resource_id": request.resource_id,
            "filename": request.filename,
            "page_number": request.page_number,
            "embedding_dimension": len(embedding),
            "total_vectors_in_db": stats["total_vectors"],
            "document_preview": store_result["document_preview"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error indexing text in ChromaDB: {str(e)}"
        )


@app.post("/api/ai/index", response_model=IndexPDFResponse)
@app.post("/api/ai/index-pdf", response_model=IndexPDFResponse)
async def index_pdf_file(
    file: UploadFile = File(..., description="PDF file to extract, chunk, embed, and store in ChromaDB"),
    resource_id: str = Form(..., description="Unique resource ID (e.g. from MongoDB/backend)"),
    chunk_size: int = Form(500, description="Max characters per chunk (default: 500)"),
    chunk_overlap: int = Form(50, description="Overlap characters between chunks (default: 50)")
):
    """
    Complete Indexing Pipeline Endpoint:
    PDF Upload -> PyPDF Text Extraction -> Text Cleaning & Page Chunking -> SentenceTransformer Embeddings -> ChromaDB Storage
    
    Viva Flow:
    1. Validates the PDF format.
    2. Calls indexing_pipeline.index_pdf_document() to execute the 4-step ingestion pipeline.
    3. Purges previous vectors for this resource to avoid duplicates.
    4. Stores 384-D dense vectors with metadata (resource_id, filename, page_number, chunk_id, chunk_index).
    5. Returns indexing metrics (total pages, total chunks, vectors stored).
    """
    # 1. Validate file extension
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF (.pdf) files are supported."
        )

    # 2. Validate resource_id
    if not resource_id or not resource_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resource_id is required."
        )

    # 3. Validate chunking parameters
    if chunk_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_size must be greater than 0."
        )
    if chunk_overlap < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap cannot be negative."
        )
    if chunk_overlap >= chunk_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="chunk_overlap must be strictly less than chunk_size."
        )

    try:
        # Execute unified indexing pipeline
        result = index_pdf_document(
            file_source=file.file,
            resource_id=resource_id.strip(),
            filename=file.filename,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )

        return {
            "success": True,
            "status": "indexed",
            "message": f"Successfully extracted, embedded and indexed {result['vectors_stored']} chunks into ChromaDB",
            "filename": result["filename"],
            "resource_id": result["resource_id"],
            "total_pages": result["total_pages"],
            "total_chunks": result["total_chunks"],
            "vectors_stored": result["vectors_stored"],
            "embedding_dimension": result["embedding_dimension"],
            "total_vectors_in_db": result["total_vectors_in_db"]
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error executing PDF indexing pipeline: {str(e)}"
        )


@app.delete("/api/ai/vectors/{resource_id}")
def delete_resource_vectors(resource_id: str):
    """
    Deletes all vector chunks associated with a specific resource_id from ChromaDB.
    Called when a document is deleted or unapproved.
    """
    if not resource_id or not resource_id.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="resource_id is required"
        )
    
    deleted_count = vector_store.delete_by_resource_id(resource_id.strip())
    stats = vector_store.get_stats()
    return {
        "success": True,
        "message": f"Vectors for resource '{resource_id}' deleted successfully",
        "resource_id": resource_id,
        "vectors_deleted": deleted_count,
        "total_vectors_in_db": stats["total_vectors"]
    }


@app.post("/api/ai/search-vectors", response_model=SearchVectorResponse)
def search_similar_chunks(request: SearchVectorRequest):
    """
    Phase 2 Retrieval Endpoint: Query Text -> Query Embedding -> ChromaDB Cosine Search -> Closest Chunks
    
    Viva Demonstration:
    1. Takes a natural language query (e.g. "What is a Binary Search Tree?").
    2. Converts the query into a 384-D vector embedding using the same SentenceTransformer.
    3. Queries ChromaDB for the closest vectors using Cosine Similarity.
    4. Returns top matching chunks with metadata (exact page number, resource ID, filename).
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty."
        )

    if request.top_k <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="top_k must be greater than 0."
        )

    try:
        # Step 1: Embed query text into 384-D space
        query_vector = embedding_service.generate_embedding(request.query)

        # Step 2: Perform hybrid similarity search in ChromaDB with grouping, candidate pool expansion, and phrase boost
        matches = vector_store.query_similar_chunks(
            query_embedding=query_vector,
            top_k=request.top_k,
            resource_id=request.resource_id,
            query_text=request.query
        )

        return {
            "query": request.query,
            "top_k": request.top_k,
            "total_results": len(matches),
            "results": matches
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing vector similarity search: {str(e)}"
        )


@app.post("/api/ai/recommend", response_model=RecommendResponse)
def get_content_recommendations(request: RecommendRequest):
    """
    Content-Based Recommendation Endpoint:
    Resource ID / Text Representation -> ChromaDB Vector Cosine Matching -> Group by Document -> Top Similar Resources
    
    Viva Flow & Logic:
    1. Input: Accepts a resource_id and/or fallback text representation (title, syllabus, description).
    2. Vector Representation: Retrieves stored 384-D chunk embeddings for the resource from ChromaDB
       and computes a normalized centroid vector. If the resource is not yet indexed, embeds the fallback text on-the-fly.
    3. Similarity Retrieval: Queries ChromaDB for nearest candidate chunks.
    4. Exclusion: Explicitly filters out chunks belonging to the current resource (avoids recommending itself).
    5. Deduplication & Grouping: Groups multiple matching chunks by resource_id so that each PDF appears only once.
    6. Score Aggregation: Computes weighted similarity (70% peak chunk alignment + 30% document average).
    7. Ranking: Returns top-K distinct academic resources ranked by semantic relevance.
    """
    if not request.resource_id and (not request.text or not request.text.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either resource_id or text must be provided for recommendations."
        )

    if request.top_k <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="top_k must be greater than 0."
        )

    try:
        source_embedding = None
        
        # If resource_id is provided, attempt to compute centroid from ChromaDB vectors
        if request.resource_id:
            source_embedding = vector_store.compute_resource_centroid(request.resource_id.strip())

        # If resource has no stored vectors in ChromaDB, fallback to embedding provided text on-the-fly
        if source_embedding is None and request.text and request.text.strip():
            source_embedding = embedding_service.generate_embedding(request.text.strip())

        if source_embedding is None:
            return {
                "success": True,
                "source_resource_id": request.resource_id,
                "total_recommendations": 0,
                "recommendations": [],
                "message": "Resource has no indexed vectors in ChromaDB and no fallback text was provided."
            }

        recommendations = vector_store.recommend_similar_resources(
            resource_id=request.resource_id.strip() if request.resource_id else None,
            source_embedding=source_embedding,
            top_k=request.top_k
        )

        return {
            "success": True,
            "source_resource_id": request.resource_id,
            "total_recommendations": len(recommendations),
            "recommendations": recommendations,
            "message": f"Successfully retrieved {len(recommendations)} similar resource recommendations."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing content-based recommendations: {str(e)}"
        )


@app.get("/api/ai/recommend", response_model=RecommendResponse)
def get_content_recommendations_get(
    resource_id: Optional[str] = None,
    text: Optional[str] = None,
    top_k: int = 5
):
    """GET variant of the recommendation endpoint for quick URL testing & browser queries."""
    req = RecommendRequest(resource_id=resource_id, text=text, top_k=top_k)
    return get_content_recommendations(req)


@app.get("/api/ai/vector-stats")
def get_vector_store_stats():
    """Returns database statistics for ChromaDB (total vectors, directory path)."""
    return vector_store.get_stats()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
