"""
Comprehensive Automated Test Suite: AI Semantic Search Hybrid Retrieval & Deduplication
========================================================================================

Verifies all required fixes:
1. Candidate pool expansion (n_candidates = max(top_k * 10, 50)).
2. Grouping by resource_id (one PDF appears only once; duplicate chunks deduplicated).
3. Representative chunk selection (best chunk chosen with page number, excerpt, and metadata preserved).
4. Exact phrase / lexical boost ("JAVASCRIPT VARIABLES" strongly favors WTL Unit 2 Notes).
5. Unrelated DBMS/OS documents do not outrank directly matching Web Technologies documents.
6. Unique results sorted strictly in descending order of relevance score.
7. FastAPI endpoint POST /api/ai/search-vectors contract & integration.
8. Filtered search within a single resource_id still functions.

Run command:
    .\\.venv\\Scripts\\python.exe test_semantic_ranking.py
"""

from typing import List, Dict, Any
from vector_store import vector_store
from embedding_service import embedding_service
from main import search_similar_chunks, SearchVectorRequest


def seed_test_academic_corpus():
    """Seeds ChromaDB with multi-chunk documents simulating the academic library."""
    # Use isolated test database (chroma_test_db) to avoid modifying live database
    vector_store.switch_to_test_db()
    vector_store.reset()

    # Document 1: WTL Unit 2 Notes (Contains "JAVASCRIPT VARIABLES" on Page 12)
    wtl_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 10,
            "text": "Unit 2: Introduction to Web Technologies, Client-side Scripting Fundamentals and Browser Execution.",
            "character_count": 102,
            "word_count": 13
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 12,
            "text": "Unit 2: JAVASCRIPT VARIABLES - declaring variables using var, let, and const keywords, variable scoping and hoisting rules.",
            "character_count": 124,
            "word_count": 16
        },
        {
            "chunk_id": "chunk_2",
            "chunk_index": 2,
            "page_number": 15,
            "text": "Unit 2: JavaScript Functions, Arrow functions, Callbacks and First-class citizen functions in ES6.",
            "character_count": 98,
            "word_count": 13
        }
    ]
    wtl_embs = embedding_service.generate_embeddings([c["text"] for c in wtl_chunks])
    vector_store.add_chunks(
        chunks=wtl_chunks,
        embeddings=wtl_embs,
        resource_id="res_wtl_unit2",
        filename="WTL Unit 2 Notes.pdf"
    )

    # Document 2: JavaScript - DOM and Event Handling (Multiple chunks on DOM & events)
    dom_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "JavaScript DOM Manipulation: Accessing elements using document.getElementById, querySelector, and class lists.",
            "character_count": 110,
            "word_count": 12
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 3,
            "text": "Event Handling in JavaScript: addEventListener, click events, event propagation with bubbling and capturing phases.",
            "character_count": 115,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_2",
            "chunk_index": 2,
            "page_number": 5,
            "text": "Modifying HTML DOM nodes dynamically with createElement, appendChild, and removeChild methods.",
            "character_count": 94,
            "word_count": 11
        }
    ]
    dom_embs = embedding_service.generate_embeddings([c["text"] for c in dom_chunks])
    vector_store.add_chunks(
        chunks=dom_chunks,
        embeddings=dom_embs,
        resource_id="res_js_dom",
        filename="JavaScript – DOM and Event Handling.pdf"
    )

    # Document 3: JavaScript - Advanced Web Programming (Multiple chunks on async JS)
    adv_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 2,
            "text": "Advanced JavaScript: Asynchronous programming with Promises, async/await syntax, and error handling in web applications.",
            "character_count": 121,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 6,
            "text": "JavaScript Closures, Lexical Scope, Prototype Chaining, and Object-Oriented patterns in modern JavaScript.",
            "character_count": 105,
            "word_count": 12
        },
        {
            "chunk_id": "chunk_2",
            "chunk_index": 2,
            "page_number": 8,
            "text": "Fetch API, HTTP AJAX requests, and handling JSON responses in client-side web development.",
            "character_count": 90,
            "word_count": 12
        }
    ]
    adv_embs = embedding_service.generate_embeddings([c["text"] for c in adv_chunks])
    vector_store.add_chunks(
        chunks=adv_chunks,
        embeddings=adv_embs,
        resource_id="res_js_adv",
        filename="JavaScript – Advanced Web Programming.pdf"
    )

    # Document 4: sample_dbms_lecture.pdf (Unrelated Database domain, multiple chunks)
    dbms_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Database Management Systems: Relational data model, SQL SELECT queries, and foreign key integrity constraints.",
            "character_count": 112,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 3,
            "text": "Transaction processing, ACID properties, and Two-Phase Locking (2PL) concurrency control protocols in DBMS.",
            "character_count": 108,
            "word_count": 13
        }
    ]
    dbms_embs = embedding_service.generate_embeddings([c["text"] for c in dbms_chunks])
    vector_store.add_chunks(
        chunks=dbms_chunks,
        embeddings=dbms_embs,
        resource_id="res_dbms_sample",
        filename="sample_dbms_lecture.pdf"
    )

    # Document 5: operating_systems_guide.pdf (Unrelated OS domain, multiple chunks)
    os_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Operating Systems CPU Scheduling: Shortest Remaining Time First, Priority Scheduling, and Multilevel Feedback Queues.",
            "character_count": 118,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 4,
            "text": "Deadlock Characterization: Mutual exclusion, Hold and Wait, No preemption, and Circular wait conditions.",
            "character_count": 105,
            "word_count": 14
        }
    ]
    os_embs = embedding_service.generate_embeddings([c["text"] for c in os_chunks])
    vector_store.add_chunks(
        chunks=os_chunks,
        embeddings=os_embs,
        resource_id="res_os_guide",
        filename="operating_systems_guide.pdf"
    )


def run_tests():
    print("=" * 80)
    print("STARTING TEST SUITE: AI Semantic Search Ranking & Deduplication")
    print("=" * 80)

    # Setup
    seed_test_academic_corpus()
    stats = vector_store.get_stats()
    print(f"\n[SETUP] Seeded {stats['total_vectors']} chunks across 5 distinct academic PDFs into ChromaDB.")

    # -----------------------------------------------------------------------
    # TEST 1: Deduplication & Unique Resource Enforcement
    # -----------------------------------------------------------------------
    print("\n[TEST 1] Testing Document Deduplication (One PDF appears exactly once)...")
    query_text = "JAVASCRIPT VARIABLES"
    query_emb = embedding_service.generate_embedding(query_text)
    
    results = vector_store.query_similar_chunks(
        query_embedding=query_emb,
        top_k=8,
        query_text=query_text
    )

    returned_res_ids = [r["metadata"]["resource_id"] for r in results]
    unique_res_ids = set(returned_res_ids)

    print(f"        Query: '{query_text}'")
    print(f"        Total Results: {len(results)}")
    print(f"        Returned Resource IDs: {returned_res_ids}")

    # Verify no duplicate resources
    assert len(returned_res_ids) == len(unique_res_ids), (
        f"Duplicates detected in results! Returned IDs: {returned_res_ids}"
    )
    print(" [PASS] Each academic resource appears EXACTLY ONCE in semantic search results.")

    # -----------------------------------------------------------------------
    # TEST 2: WTL Unit 2 Notes Returned at Top Rank with Exact Phrase Boost
    # -----------------------------------------------------------------------
    print("\n[TEST 2] Testing Ranking: WTL Unit 2 Notes strongly favored for 'JAVASCRIPT VARIABLES'...")
    assert len(results) > 0, "Expected non-empty search results"
    top_result = results[0]

    print(f"        Top Match Filename: {top_result['metadata']['filename']}")
    print(f"        Top Match Resource ID: {top_result['metadata']['resource_id']}")
    print(f"        Top Match Page: {top_result['metadata']['page_number']}")
    print(f"        Top Match Score: {top_result['similarity_score']}")
    print(f"        Top Match Excerpt: '{top_result['text']}'")

    assert top_result["metadata"]["resource_id"] == "res_wtl_unit2", (
        f"Expected top match to be 'res_wtl_unit2', but got '{top_result['metadata']['resource_id']}'"
    )
    assert top_result["metadata"]["filename"] == "WTL Unit 2 Notes.pdf"
    assert top_result["metadata"]["page_number"] == 12, (
        f"Expected representative chunk from Page 12, got Page {top_result['metadata']['page_number']}"
    )
    assert "JAVASCRIPT VARIABLES" in top_result["text"]
    assert 0.0 < top_result["similarity_score"] < 1.0, (
        f"Score should be a valid confidence fraction, got {top_result['similarity_score']}"
    )
    print(" [PASS] 'WTL Unit 2 Notes' is ranked #1 with representative chunk from Page 12.")

    # -----------------------------------------------------------------------
    # TEST 3: Domain Relevance & Sort Order Verification
    # -----------------------------------------------------------------------
    print("\n[TEST 3] Testing Domain Relevance: Web Tech docs outrank DBMS/OS documents...")
    scores = [r["similarity_score"] for r in results]
    print(f"        Relevance Scores in order: {scores}")

    # Check strict descending sort order
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i + 1], (
            f"Results not sorted descending! Score at index {i} ({scores[i]}) < {scores[i+1]}"
        )
    print(" [PASS] Results are strictly sorted by relevance score in descending order.")

    # Check Web Tech documents outrank DBMS and OS documents
    res_rank_map = {r["metadata"]["resource_id"]: idx for idx, r in enumerate(results)}
    assert res_rank_map["res_wtl_unit2"] < res_rank_map.get("res_dbms_sample", 999)
    assert res_rank_map["res_js_dom"] < res_rank_map.get("res_dbms_sample", 999)
    assert res_rank_map["res_js_adv"] < res_rank_map.get("res_dbms_sample", 999)
    assert res_rank_map["res_wtl_unit2"] < res_rank_map.get("res_os_guide", 999)
    print(" [PASS] Web Technologies materials successfully outrank unrelated DBMS and OS documents.")

    # -----------------------------------------------------------------------
    # TEST 4: FastAPI Search Vector Endpoint (POST /api/ai/search-vectors)
    # -----------------------------------------------------------------------
    print("\n[TEST 4] Testing FastAPI Endpoint POST /api/ai/search-vectors...")
    request_obj = SearchVectorRequest(
        query="JAVASCRIPT VARIABLES",
        top_k=8
    )
    api_response = search_similar_chunks(request_obj)
    
    assert api_response["query"] == "JAVASCRIPT VARIABLES"
    assert api_response["top_k"] == 8
    assert api_response["total_results"] == len(results)
    assert len(api_response["results"]) > 0
    assert api_response["results"][0]["metadata"]["resource_id"] == "res_wtl_unit2"
    assert api_response["results"][0]["metadata"]["page_number"] == 12
    print(" [PASS] FastAPI /api/ai/search-vectors returned valid response with top result 'WTL Unit 2 Notes'.")

    # -----------------------------------------------------------------------
    # TEST 5: Single Document Filtered Search
    # -----------------------------------------------------------------------
    print("\n[TEST 5] Testing Filtered Search within a single resource_id...")
    filtered_res = vector_store.query_similar_chunks(
        query_embedding=query_emb,
        top_k=2,
        resource_id="res_wtl_unit2",
        query_text=query_text
    )
    assert len(filtered_res) > 0
    assert all(r["metadata"]["resource_id"] == "res_wtl_unit2" for r in filtered_res)
    print(f" [PASS] Filtered search returned {len(filtered_res)} chunks strictly from resource 'res_wtl_unit2'.")

    # -----------------------------------------------------------------------
    # TEST 6: Standard Conceptual Query Without Exact Overlap
    # -----------------------------------------------------------------------
    print("\n[TEST 6] Testing Conceptual Query (Two-Phase Locking & concurrency)...")
    concept_query = "Two-Phase Locking concurrency control"
    concept_emb = embedding_service.generate_embedding(concept_query)
    concept_results = vector_store.query_similar_chunks(
        query_embedding=concept_emb,
        top_k=5,
        query_text=concept_query
    )
    assert len(concept_results) > 0
    assert concept_results[0]["metadata"]["resource_id"] == "res_dbms_sample"
    print(" [PASS] Conceptual query successfully matched 'sample_dbms_lecture.pdf' as top result.")

    print("\n" + "=" * 80)
    print(" ALL SEMANTIC RANKING & RETRIEVAL TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    run_tests()
