"""
PDF Processing Module for Intelligent Academic Resource Retrieval System
========================================================================

Module Overview (For Viva & Presentation):
------------------------------------------
This module is the foundational Step 1 (Document Ingestion & Preprocessing)
of the AI vector search pipeline.

Key Concepts:
1. PDF Text Extraction:
   Reads binary PDF documents page-by-page using the `pypdf` library to extract
   raw textual content while tracking page numbers.

2. Text Cleaning:
   Academic documents often contain formatting artifacts such as non-breaking
   spaces, excessive line breaks, carriage returns, and irregular whitespace.
   Cleaning normalizes the text into a consistent format without removing
   essential punctuation or words.

3. Page Boundary Preservation:
   Academic resources (lecture notes, syllabus, textbooks, research papers) are
   structured by pages. Preserving page numbers enables the search and recommendation
   engine to direct students to the exact page where a topic is discussed.

4. Text Chunking with Overlap:
   Embedding models (e.g., sentence-transformers) have maximum token limits and
   perform best on concise, coherent text passages.
   - Chunk Size: Maximum number of characters/words in a single segment.
   - Chunk Overlap: Number of shared characters/words between adjacent chunks.
     Overlap ensures that important context located at chunk boundaries is not lost.
"""

import re
from pathlib import Path
from typing import List, Dict, Any, Union, BinaryIO
import pypdf


def clean_text(text: str) -> str:
    """
    Cleans and normalizes raw text extracted from a PDF document.

    What it cleans:
    - Standardizes Windows (\\r\\n) and Mac (\\r) line endings to Unix (\\n).
    - Replaces non-breaking spaces (\\xa0) and form feed characters (\\x0c) with standard spaces.
    - Replaces multiple consecutive horizontal spaces or tabs with a single space.
    - Strips leading and trailing whitespace from each line.
    - Limits excessive consecutive blank lines to at most two (preserving paragraph breaks).
    - Strips overall leading and trailing whitespace from the document.

    Args:
        text (str): Raw extracted text.

    Returns:
        str: Cleaned and normalized text.
    """
    if not text:
        return ""

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Replace special unicode/control spaces with standard space
    text = text.replace("\xa0", " ").replace("\x0c", " ")

    # Process line by line: collapse multiple horizontal spaces and strip line ends
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    text = "\n".join(lines)

    # Collapse 3 or more consecutive newlines into a standard double newline (paragraph break)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Final trim
    return text.strip()


def extract_text_from_pdf(file_source: Union[str, Path, BinaryIO]) -> List[Dict[str, Any]]:
    """
    Extracts text from every page of a PDF file while preserving page numbers.

    Args:
        file_source (Union[str, Path, BinaryIO]): Path to the PDF file or an open binary file stream.

    Returns:
        List[Dict[str, Any]]: A list of dictionaries, one per page:
            [
                {
                    "page_number": 1,
                    "text": "Cleaned text content of page 1...",
                    "character_count": 520,
                    "word_count": 85
                },
                ...
            ]

    Raises:
        FileNotFoundError: If the provided file path does not exist.
        ValueError: If the file is not a valid PDF or is empty.
    """
    # If a file path is provided, verify existence
    if isinstance(file_source, (str, Path)):
        path_obj = Path(file_source)
        if not path_obj.exists():
            raise FileNotFoundError(f"PDF file not found at: {file_source}")
        if not path_obj.is_file():
            raise ValueError(f"The path '{file_source}' is not a valid file.")

    try:
        reader = pypdf.PdfReader(file_source)
    except Exception as e:
        raise ValueError(f"Failed to read PDF file. Make sure it is a valid PDF. Error: {str(e)}")

    total_pages = len(reader.pages)
    extracted_pages: List[Dict[str, Any]] = []

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1  # 1-indexed for human-readable page numbering
        try:
            raw_text = page.extract_text() or ""
        except Exception:
            # Fallback if an individual page has extraction issues
            raw_text = ""

        cleaned = clean_text(raw_text)

        extracted_pages.append({
            "page_number": page_num,
            "text": cleaned,
            "character_count": len(cleaned),
            "word_count": len(cleaned.split()) if cleaned else 0
        })

    return extracted_pages


def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    """
    Splits a single block of text into overlapping chunks using a sliding window algorithm.

    Viva Explanation:
    - If a document is 2,000 characters and chunk_size=500, chunk_overlap=50:
      Chunk 1: 0 -> 500
      Chunk 2: 450 -> 950 (starts 50 chars before chunk 1 ended)
      Chunk 3: 900 -> 1400
      Chunk 4: 1350 -> 1850
      Chunk 5: 1800 -> 2000
    - The step size is `chunk_size - chunk_overlap`.
    - Overlap prevents sentences or keywords cut at the boundary from losing their meaning.

    Args:
        text (str): The cleaned text to be chunked.
        chunk_size (int): Maximum number of characters per chunk (default: 500).
        chunk_overlap (int): Number of overlapping characters between consecutive chunks (default: 50).

    Returns:
        List[str]: List of text chunk strings.
    """
    if not text or not text.strip():
        return []

    # Validation and sensible defaults
    if chunk_size <= 0:
        raise ValueError("chunk_size must be a positive integer.")
    if chunk_overlap < 0:
        raise ValueError("chunk_overlap cannot be negative.")
    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be strictly less than chunk_size.")

    # If text is shorter than chunk_size, return it as a single chunk
    if len(text) <= chunk_size:
        return [text]

    chunks: List[str] = []
    step = chunk_size - chunk_overlap
    start = 0
    text_len = len(text)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        # Stop if we have reached the end of the text
        if end >= text_len:
            break

        start += step

    return chunks


def chunk_document_pages(
    pages: List[Dict[str, Any]],
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> List[Dict[str, Any]]:
    """
    Chunks text page-by-page while preserving page number references for each chunk.

    Preserving the page number with each chunk is essential for academic resource retrieval,
    so that when a student receives a search result, the system can display:
    "Found on Page 3: '...chunk text...'"

    Args:
        pages (List[Dict[str, Any]]): List of page dictionaries from `extract_text_from_pdf`.
        chunk_size (int): Max characters per chunk (default: 500).
        chunk_overlap (int): Character overlap between adjacent chunks (default: 50).

    Returns:
        List[Dict[str, Any]]: List of chunk metadata dictionaries:
            [
                {
                    "chunk_id": "chunk_0",
                    "chunk_index": 0,
                    "page_number": 1,
                    "text": "Chunk text content...",
                    "character_count": 480,
                    "word_count": 75
                },
                ...
            ]
    """
    all_chunks: List[Dict[str, Any]] = []
    chunk_index = 0

    for page in pages:
        page_num = page.get("page_number", 1)
        page_text = page.get("text", "")

        if not page_text.strip():
            continue

        page_chunks = chunk_text(page_text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        for text_piece in page_chunks:
            all_chunks.append({
                "chunk_id": f"chunk_{chunk_index}",
                "chunk_index": chunk_index,
                "page_number": page_num,
                "text": text_piece,
                "character_count": len(text_piece),
                "word_count": len(text_piece.split())
            })
            chunk_index += 1

    return all_chunks


def process_pdf(
    file_source: Union[str, Path, BinaryIO],
    chunk_size: int = 500,
    chunk_overlap: int = 50
) -> Dict[str, Any]:
    """
    High-level pipeline function that extracts text and generates chunks from a PDF.

    Args:
        file_source (Union[str, Path, BinaryIO]): Path to PDF or binary file object.
        chunk_size (int): Target character size per chunk.
        chunk_overlap (int): Overlap characters between chunks.

    Returns:
        Dict[str, Any]: Combined results containing:
            - total_pages: Total number of pages in the PDF.
            - total_chunks: Total number of generated chunks.
            - pages: List of per-page extracted text data.
            - chunks: List of chunk dictionaries with metadata.
    """
    pages = extract_text_from_pdf(file_source)
    chunks = chunk_document_pages(pages, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

    return {
        "total_pages": len(pages),
        "total_chunks": len(chunks),
        "pages": pages,
        "chunks": chunks
    }
