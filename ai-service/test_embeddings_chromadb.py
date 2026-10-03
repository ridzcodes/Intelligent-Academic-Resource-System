"""
Test Suite for AI Pipeline Phase 2: Embeddings & ChromaDB Vector Storage
========================================================================

Tests verified:
1. SentenceTransformer model initialization and 384-D vector generation.
2. Batch embedding generation for multiple text chunks.
3. ChromaDB persistent storage, collection initialization, and metadata storage.
4. Semantic similarity search verifying that conceptually related documents score higher.
5. Filtered vector search by resource_id.
6. FastAPI endpoint function execution.

Run command:
    python test_embeddings_chromadb.py
"""

from pathlib import Path
from embedding_service import embedding_service
from vector_store import vector_store
from main import (
    health_check,
    index_single_text,
    search_similar_chunks,
    IndexTextRequest,
    SearchVectorRequest,
    get_vector_store_stats
)


def run_phase_2_tests():
    print("=" * 75)
    print("STARTING TEST SUITE: AI Pipeline Phase 2 (Embeddings & ChromaDB)")
    print("=" * 75)

    # Reset collection for a clean, deterministic test environment
    vector_store.reset()

    # -----------------------------------------------------------------------
    # Test 1: Health Check Endpoint Unchanged
    # -----------------------------------------------------------------------
    print("\n[TEST 1] Testing Health Check Endpoint...")
    h_res = health_check()
    assert h_res["status"] == "online"
    print(" [PASS] Health check endpoint is active and online.")

    # -----------------------------------------------------------------------
    # Test 2: SentenceTransformer Embeddings (384-D)
    # -----------------------------------------------------------------------
    print("\n[TEST 2] Testing SentenceTransformer Vector Generation...")
    sample_text = "Binary Search Trees provide logarithmic time complexity for insertions and lookups."
    emb = embedding_service.generate_embedding(sample_text)
    
    assert isinstance(emb, list), "Embedding should be a list of floats"
    assert len(emb) == 384, f"Expected 384 dimensions, got {len(emb)}"
    print(f" [PASS] Generated dense vector embedding of dimension: {len(emb)}")
    print(f"        Vector slice preview: [{', '.join(f'{x:.4f}' for x in emb[:5])}...]")

    # Batch embedding test
    batch_texts = [
        "Operating System Process Scheduling Algorithms.",
        "Relational Database Management Systems and SQL Normalization.",
        "Computer Networks TCP/IP Protocol Stack and Routing."
    ]
    batch_embs = embedding_service.generate_embeddings(batch_texts)
    assert len(batch_embs) == 3
    assert all(len(vec) == 384 for vec in batch_embs)
    print(f" [PASS] Batch generation produced {len(batch_embs)} embeddings of dimension 384.")

    # -----------------------------------------------------------------------
    # Test 3: ChromaDB Vector Storage with Metadata
    # -----------------------------------------------------------------------
    print("\n[TEST 3] Testing ChromaDB Vector Storage with Metadata...")
    
    # Store document 1 chunks (Data Structures)
    dsa_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Unit 1: Binary Search Tree (BST) properties and tree traversal algorithms.",
            "character_count": 75,
            "word_count": 11
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "Unit 2: AVL Trees and Red-Black Trees for self-balancing search trees.",
            "character_count": 70,
            "word_count": 11
        }
    ]
    dsa_embs = embedding_service.generate_embeddings([c["text"] for c in dsa_chunks])
    dsa_added = vector_store.add_chunks(
        chunks=dsa_chunks,
        embeddings=dsa_embs,
        resource_id="res_dsa_101",
        filename="dsa_lecture_notes.pdf"
    )
    assert dsa_added == 2

    # Store document 2 chunks (Operating Systems)
    os_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Chapter 1: CPU Scheduling algorithms including Shortest Job First and Round Robin.",
            "character_count": 82,
            "word_count": 12
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 4,
            "text": "Chapter 4: Deadlock prevention, avoidance using Banker's Algorithm, and recovery.",
            "character_count": 80,
            "word_count": 10
        }
    ]
    os_embs = embedding_service.generate_embeddings([c["text"] for c in os_chunks])
    os_added = vector_store.add_chunks(
        chunks=os_chunks,
        embeddings=os_embs,
        resource_id="res_os_202",
        filename="operating_systems_guide.pdf"
    )
    assert os_added == 2

    stats = vector_store.get_stats()
    assert stats["total_vectors"] == 4, f"Expected 4 vectors, got {stats['total_vectors']}"
    print(f" [PASS] Successfully stored 4 chunks across 2 resources in ChromaDB.")
    print(f"        Collection: '{stats['collection_name']}', Total vectors: {stats['total_vectors']}")

    # -----------------------------------------------------------------------
    # Test 4: Semantic Similarity Search (Cosine Matching)
    # -----------------------------------------------------------------------
    print("\n[TEST 4] Testing Semantic Vector Search (Concept Matching)...")
    
    query = "How do self balancing binary trees like AVL work?"
    query_vector = embedding_service.generate_embedding(query)
    results = vector_store.query_similar_chunks(query_vector, top_k=2)

    assert len(results) > 0
    top_match = results[0]
    print(f"        Search Query: '{query}'")
    print(f"        Top Match ID: {top_match['id']}")
    print(f"        Similarity Score: {top_match['similarity_score']} (Distance: {top_match['distance']})")
    print(f"        Source File: {top_match['metadata']['filename']}, Page: {top_match['metadata']['page_number']}")
    print(f"        Matched Text: '{top_match['text']}'")

    # Verify that DSA resource was matched over OS resource
    assert top_match["metadata"]["resource_id"] == "res_dsa_101", "Expected DSA chunk to be the top match!"
    print(" [PASS] Semantic search accurately identified the relevant DSA chunk over OS chunks.")

    # -----------------------------------------------------------------------
    # Test 5: Filtered Search by Resource ID
    # -----------------------------------------------------------------------
    print("\n[TEST 5] Testing Filtered Search by Resource ID...")
    filtered_results = vector_store.query_similar_chunks(
        query_vector,
        top_k=2,
        resource_id="res_os_202"
    )
    assert all(r["metadata"]["resource_id"] == "res_os_202" for r in filtered_results)
    print(f" [PASS] Filtered search restricted results strictly to resource 'res_os_202'.")

    # -----------------------------------------------------------------------
    # Test 6: FastAPI Indexing & Search Endpoints
    # -----------------------------------------------------------------------
    print("\n[TEST 6] Testing FastAPI Endpoints (Index-Text and Search-Vectors)...")
    
    # 6a. Index single text endpoint
    idx_req = IndexTextRequest(
        text="A Graph data structure consists of a finite set of vertices (or nodes) and a set of edges.",
        resource_id="res_graphs_303",
        filename="graphs_notes.pdf",
        page_number=5,
        chunk_id="chunk_0",
        chunk_index=0
    )
    idx_res = index_single_text(idx_req)
    assert idx_res["vector_id"] == "res_graphs_303_chunk_0"
    assert idx_res["embedding_dimension"] == 384
    print(" [PASS] POST /api/ai/index-text executed successfully.")

    # 6b. Search vectors endpoint
    search_req = SearchVectorRequest(
        query="What is a graph node and edge?",
        top_k=1
    )
    search_res = search_similar_chunks(search_req)
    assert search_res["total_results"] == 1
    assert search_res["results"][0]["metadata"]["resource_id"] == "res_graphs_303"
    print(" [PASS] POST /api/ai/search-vectors executed successfully.")

    print("\n" + "=" * 75)
    print(" ALL PHASE 2 TESTS PASSED SUCCESSFULLY! Embeddings & ChromaDB verified.")
    print("=" * 75)


if __name__ == "__main__":
    run_phase_2_tests()
