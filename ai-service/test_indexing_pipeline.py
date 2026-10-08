"""
Test Suite for Complete AI Indexing Pipeline (PDF -> Chunks -> Embeddings -> ChromaDB)
======================================================================================

Tests verified:
1. Creation of a lightweight sample multi-page academic PDF.
2. End-to-end execution of `index_pdf_document()` in `indexing_pipeline.py`.
3. Verification of stored ChromaDB vectors and metadata integrity:
   - resource_id
   - filename
   - page_number
   - chunk_id
   - chunk_index
4. Semantic similarity search against the indexed PDF chunks.
5. Direct execution of the FastAPI `POST /api/ai/index-pdf` endpoint handler.

Run command:
    python test_indexing_pipeline.py
"""

import asyncio
import io
from pathlib import Path
import pypdf
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, NameObject, DictionaryObject
from fastapi import UploadFile

from vector_store import vector_store
from embedding_service import embedding_service
from indexing_pipeline import index_pdf_document
from main import index_pdf_file


def create_sample_academic_pdf(file_path: Path) -> None:
    """Helper to generate a lightweight 2-page academic PDF for testing."""
    writer = PdfWriter()
    
    font_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
    })
    font_ref = writer._add_object(font_dict)

    # Page 1: Database Management Systems Notes
    page1 = writer.add_blank_page(width=612, height=792)
    page1[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})
    })
    stream_content_1 = (
        b"BT /F1 12 Tf 72 700 Td "
        b"(Module 1: Relational Database Normalization forms including 1NF, 2NF, 3NF, and BCNF.) Tj ET"
    )
    content_stream_1 = DecodedStreamObject()
    content_stream_1.set_data(stream_content_1)
    page1[NameObject("/Contents")] = writer._add_object(content_stream_1)

    # Page 2: ACID Properties and Transactions
    page2 = writer.add_blank_page(width=612, height=792)
    page2[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): font_ref})
    })
    stream_content_2 = (
        b"BT /F1 12 Tf 72 700 Td "
        b"(Module 2: Transaction processing and ACID properties: Atomicity, Consistency, Isolation, and Durability.) Tj ET"
    )
    content_stream_2 = DecodedStreamObject()
    content_stream_2.set_data(stream_content_2)
    page2[NameObject("/Contents")] = writer._add_object(content_stream_2)

    with open(file_path, "wb") as f:
        writer.write(f)


def test_indexing_pipeline_direct():
    print("=" * 80)
    print("STARTING TEST SUITE: Complete Document Indexing Pipeline")
    print("=" * 80)

    # Use isolated test database (chroma_test_db) to avoid modifying live database
    vector_store.switch_to_test_db()
    vector_store.reset()

    test_pdf_path = Path("sample_dbms_lecture.pdf")
    create_sample_academic_pdf(test_pdf_path)

    try:
        # -------------------------------------------------------------------
        # Test 1: Direct Indexing Pipeline Function
        # -------------------------------------------------------------------
        print("\n[TEST 1] Testing index_pdf_document() pipeline...")
        result = index_pdf_document(
            file_source=test_pdf_path,
            resource_id="res_dbms_505",
            filename="sample_dbms_lecture.pdf",
            chunk_size=60,
            chunk_overlap=15
        )

        assert result["filename"] == "sample_dbms_lecture.pdf"
        assert result["resource_id"] == "res_dbms_505"
        assert result["total_pages"] == 2
        assert result["total_chunks"] > 0
        assert result["vectors_stored"] == result["total_chunks"]
        assert result["embedding_dimension"] == 384
        
        print(" [PASS] Pipeline completed successfully:")
        print(f"        Filename: {result['filename']}")
        print(f"        Resource ID: {result['resource_id']}")
        print(f"        Pages Extracted: {result['total_pages']}")
        print(f"        Chunks Created: {result['total_chunks']}")
        print(f"        Vectors Stored: {result['vectors_stored']}")

        # -------------------------------------------------------------------
        # Test 2: ChromaDB Metadata Verification
        # -------------------------------------------------------------------
        print("\n[TEST 2] Verifying Stored Vector Metadata in ChromaDB...")
        stats = vector_store.get_stats()
        assert stats["total_vectors"] == result["vectors_stored"]
        
        # Query specifically for ACID properties
        query_text = "What does ACID stand for in database transactions?"
        query_emb = embedding_service.generate_embedding(query_text)
        matches = vector_store.query_similar_chunks(query_emb, top_k=2)

        assert len(matches) > 0
        top_match = matches[0]
        
        # Verify metadata integrity
        meta = top_match["metadata"]
        assert meta["resource_id"] == "res_dbms_505"
        assert meta["filename"] == "sample_dbms_lecture.pdf"
        assert "page_number" in meta
        assert "chunk_id" in meta
        assert "chunk_index" in meta

        print(" [PASS] Semantic search retrieved relevant chunk with full metadata:")
        print(f"        Query: '{query_text}'")
        print(f"        Top Match ID: {top_match['id']}")
        print(f"        Page Number: {meta['page_number']}")
        print(f"        Similarity Score: {top_match['similarity_score']}")
        print(f"        Matched Text: '{top_match['text']}'")

        # -------------------------------------------------------------------
        # Test 3: FastAPI Endpoint POST /api/ai/index-pdf
        # -------------------------------------------------------------------
        print("\n[TEST 3] Testing FastAPI POST /api/ai/index-pdf Endpoint Handler...")
        
        with open(test_pdf_path, "rb") as f:
            pdf_bytes = f.read()

        upload_file = UploadFile(
            filename="sample_dbms_lecture.pdf",
            file=io.BytesIO(pdf_bytes)
        )

        async def run_endpoint_test():
            response = await index_pdf_file(
                file=upload_file,
                resource_id="res_dbms_endpoint_test",
                chunk_size=60,
                chunk_overlap=15
            )
            return response

        endpoint_res = asyncio.run(run_endpoint_test())
        assert endpoint_res["filename"] == "sample_dbms_lecture.pdf"
        assert endpoint_res["resource_id"] == "res_dbms_endpoint_test"
        assert endpoint_res["total_pages"] == 2
        assert endpoint_res["vectors_stored"] > 0
        
        print(" [PASS] POST /api/ai/index-pdf endpoint returned valid JSON response:")
        print(f"        Response: {endpoint_res}")

    finally:
        # Clean up temporary test file
        if test_pdf_path.exists():
            test_pdf_path.unlink()

    print("\n" + "=" * 80)
    print(" ALL INDEXING PIPELINE TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    test_indexing_pipeline_direct()
