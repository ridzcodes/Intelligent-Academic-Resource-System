"""
Document Indexing Pipeline Module for Intelligent Academic Resource System
==========================================================================

Module Overview (For Viva & Presentation):
------------------------------------------
This module is the master orchestrator that connects the entire AI ingestion
and vector search pipeline:

    [PDF Upload]
         |
         v
    [Step 1: PyPDF Extraction] (extracts page-by-page text)
         |
         v
    [Step 2: Text Cleaning & Page-Aware Chunking] (sliding-window with overlap)
         |
         v
    [Step 3: SentenceTransformer Embeddings] (generates 384-D dense vectors)
         |
         v
    [Step 4: ChromaDB Persistent Vector Storage] (indexes vectors + academic metadata)

Why Orchestrate in a Dedicated Pipeline?
- Separation of Concerns: Modules 1 (PDF) and 2 (Embeddings/DB) stay focused and reusable.
- Atomic Execution: A document is completely processed and indexed in a single end-to-end flow.
- Traceable Metadata: Every stored vector in ChromaDB retains its resource_id, original filename,
  page_number, chunk_id, and chunk_index for precise academic citation.
"""

from pathlib import Path
from typing import Dict, Any, List, Union, BinaryIO

# Reusable core modules
from pdf_processor import extract_text_from_pdf, chunk_document_pages
from embedding_service import embedding_service
from vector_store import vector_store


def index_pdf_document(
    file_source: Union[str, Path, BinaryIO],
    resource_id: str,
    filename: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> Dict[str, Any]:
    """
    Executes the complete document indexing pipeline from raw PDF to ChromaDB.

    Pipeline Steps:
    1. Extract page-by-page text from the PDF using PyPDF.
    2. Clean text and segment into overlapping chunks while preserving page numbers.
    3. Generate 384-dimensional vector embeddings using SentenceTransformer (all-MiniLM-L6-v2).
    4. Store chunks, vectors, and academic metadata in persistent ChromaDB.

    Args:
        file_source (Union[str, Path, BinaryIO]): File path or binary stream of the PDF.
        resource_id (str): Unique academic resource ID (e.g. from MongoDB/backend).
        filename (str): Original filename of the PDF (e.g. 'Operating_Systems_Unit1.pdf').
        chunk_size (int): Target character count per chunk (default: 500).
        chunk_overlap (int): Overlap character count between chunks (default: 50).

    Returns:
        Dict[str, Any]: Indexing summary dictionary containing:
            - filename: Source file name
            - resource_id: Resource identifier
            - total_pages: Number of pages extracted
            - total_chunks: Number of text chunks generated
            - vectors_stored: Number of vectors saved in ChromaDB
            - embedding_dimension: Dimension of embeddings (384)
            - total_vectors_in_db: Current total count in the vector database
    """
    # -----------------------------------------------------------------------
    # Step 1: Extract Text from PDF (preserves page boundaries)
    # -----------------------------------------------------------------------
    pages = extract_text_from_pdf(file_source)
    if not pages:
        raise ValueError("PDF document contains no pages.")

    # -----------------------------------------------------------------------
    # Step 2: Clean & Split into Overlapping Chunks (with page numbers)
    # -----------------------------------------------------------------------
    chunks = chunk_document_pages(pages, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    if not chunks:
        raise ValueError("PDF document contains no extractable text content to chunk.")

    # -----------------------------------------------------------------------
    # Step 3: Generate Dense Vector Embeddings (SentenceTransformer 384-D)
    # -----------------------------------------------------------------------
    chunk_texts = [chunk["text"] for chunk in chunks]
    embeddings = embedding_service.generate_embeddings(chunk_texts)

    # -----------------------------------------------------------------------
    # Step 4: Persist Vectors & Structured Metadata in ChromaDB
    # (Purge any prior vectors for this resource to avoid duplicates)
    # -----------------------------------------------------------------------
    vector_store.delete_by_resource_id(resource_id)

    vectors_added = vector_store.add_chunks(
        chunks=chunks,
        embeddings=embeddings,
        resource_id=resource_id,
        filename=filename
    )

    # Retrieve updated database stats
    stats = vector_store.get_stats()

    return {
        "filename": filename,
        "resource_id": resource_id,
        "total_pages": len(pages),
        "total_chunks": len(chunks),
        "vectors_stored": vectors_added,
        "embedding_dimension": embedding_service.get_dimension(),
        "total_vectors_in_db": stats["total_vectors"]
    }
