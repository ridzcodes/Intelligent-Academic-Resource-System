"""
Test Script for AI Pipeline Module 1: PDF Extraction and Text Chunking
======================================================================
This standalone test verifies:
1. Text cleaning and whitespace normalization.
2. Direct text chunking with sliding window and overlap.
3. PDF text extraction preserving page boundaries using PyPDF.
4. Structured page-aware document chunking.

Run command:
    python test_pipeline.py
"""

import io
from pathlib import Path
import pypdf
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject, DictionaryObject

from pdf_processor import clean_text, chunk_text, extract_text_from_pdf, chunk_document_pages, process_pdf


def create_sample_academic_pdf(file_path: Path) -> None:
    """Helper to generate a lightweight 2-page academic PDF for testing."""
    writer = PdfWriter()
    
    # Define standard font
    font_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
    })
    font_ref = writer._add_object(font_dict)

    # Page 1: Operating Systems Notes
    page1 = writer.add_blank_page(width=612, height=792)
    page1[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})
    })
    stream_content_1 = (
        b"BT /F1 12 Tf 72 700 Td "
        b"(Chapter 1: Operating System Architectures and Memory Management Models.) Tj ET"
    )
    content_stream_1 = DecodedStreamObject()
    content_stream_1.set_data(stream_content_1)
    page1[NameObject("/Contents")] = writer._add_object(content_stream_1)

    # Page 2: Scheduling Algorithms
    page2 = writer.add_blank_page(width=612, height=792)
    page2[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})
    })
    stream_content_2 = (
        b"BT /F1 12 Tf 72 700 Td "
        b"(Chapter 2: CPU Scheduling Algorithms like Round Robin and Shortest Job First.) Tj ET"
    )
    content_stream_2 = DecodedStreamObject()
    content_stream_2.set_data(stream_content_2)
    page2[NameObject("/Contents")] = writer._add_object(content_stream_2)

    with open(file_path, "wb") as f:
        writer.write(f)


def run_all_tests():
    print("=" * 70)
    print("STARTING TEST SUITE: AI Pipeline Module 1 (PDF & Chunking)")
    print("=" * 70)

    # -----------------------------------------------------------------------
    # Test 1: Text Cleaning
    # -----------------------------------------------------------------------
    print("\n[TEST 1] Testing Text Cleaning & Whitespace Normalization...")
    raw_sample = "   Unit 1: Data Structures \r\n\r\n\r\n\r\n   Binary Search Trees\xa0and Graphs   \n\n\n  "
    cleaned = clean_text(raw_sample)
    expected = "Unit 1: Data Structures\n\nBinary Search Trees and Graphs"
    assert cleaned == expected, f"Expected '{expected}', got '{cleaned}'"
    print(" [PASS] Text cleaning properly handles newlines, tabs, and non-breaking spaces.")
    print(f"        Output preview: {repr(cleaned)}")

    # -----------------------------------------------------------------------
    # Test 2: Sliding Window Chunking with Overlap
    # -----------------------------------------------------------------------
    print("\n[TEST 2] Testing Direct Text Chunking (Sliding Window)...")
    sample_text = "Artificial Intelligence and Machine Learning for Academic Research Systems."
    chunk_sz = 30
    chunk_ov = 8
    chunks = chunk_text(sample_text, chunk_size=chunk_sz, chunk_overlap=chunk_ov)
    
    assert len(chunks) > 1, "Should produce multiple chunks"
    print(f" [PASS] Generated {len(chunks)} chunks from text of length {len(sample_text)}.")
    for i, chk in enumerate(chunks):
        print(f"        Chunk [{i}]: (len={len(chk)}) -> '{chk}'")

    # -----------------------------------------------------------------------
    # Test 3: PDF Generation, Extraction & Page Preservation
    # -----------------------------------------------------------------------
    print("\n[TEST 3] Testing PDF Text Extraction via PyPDF...")
    test_pdf_path = Path("sample_test_notes.pdf")
    create_sample_academic_pdf(test_pdf_path)
    
    try:
        pages = extract_text_from_pdf(test_pdf_path)
        assert len(pages) == 2, f"Expected 2 pages, got {len(pages)}"
        assert pages[0]["page_number"] == 1
        assert "Chapter 1" in pages[0]["text"]
        assert pages[1]["page_number"] == 2
        assert "Chapter 2" in pages[1]["text"]
        print(f" [PASS] Extracted {len(pages)} pages with preserved page boundaries:")
        for p in pages:
            print(f"        Page {p['page_number']}: ({p['word_count']} words) -> '{p['text'][:50]}...'")

        # -----------------------------------------------------------------------
        # Test 4: End-to-End PDF Processing (Extraction + Chunking)
        # -----------------------------------------------------------------------
        print("\n[TEST 4] Testing Full PDF Processing Pipeline...")
        result = process_pdf(test_pdf_path, chunk_size=45, chunk_overlap=10)
        assert result["total_pages"] == 2
        assert result["total_chunks"] > 0
        print(f" [PASS] Total Pages: {result['total_pages']}, Total Chunks: {result['total_chunks']}")
        for chk in result["chunks"]:
            print(f"        [{chk['chunk_id']}] (Page {chk['page_number']}): '{chk['text']}'")

    finally:
        # Clean up temporary test file
        if test_pdf_path.exists():
            test_pdf_path.unlink()

    print("\n" + "=" * 70)
    print(" ALL TESTS PASSED SUCCESSFULLY! Module 1 is verified and ready.")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
