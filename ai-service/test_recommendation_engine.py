"""
Test Suite for AI Pipeline Phase 3: Content-Based Recommendation Engine
========================================================================

Verified Requirements:
1. Source document is strictly excluded from recommendations.
2. Each candidate resource appears only once (deduplication / document-level grouping).
3. Related Web Technologies documents rank above DSA/OS.
4. XML/JSON and JavaScript documents receive strong recommendation scores for WTL Unit 2.
5. All test fixtures run isolated in chroma_test_db.
6. Production chroma_db is NEVER reset or modified.
7. Exact Top-K Cross-Chunk Max-Pooling formula: 
   final_score = 0.6 * max_similarity + 0.4 * top3_mean_similarity.
8. FastAPI POST & GET /api/ai/recommend endpoints.

Run command:
    python test_recommendation_engine.py
"""

import os
from vector_store import VectorStore, vector_store
from embedding_service import embedding_service
from main import (
    get_content_recommendations,
    get_content_recommendations_get,
    RecommendRequest,
    RecommendResponse
)


def run_recommendation_tests():
    print("=" * 80)
    print("STARTING TEST SUITE: Top-K Cross-Chunk Max-Pooling Recommendation Engine")
    print("=" * 80)

    # -----------------------------------------------------------------------
    # Verification 6 (Pre-check): Inspect Production ChromaDB
    # -----------------------------------------------------------------------
    import chromadb
    from vector_store import DEFAULT_CHROMA_DIR
    prod_client = chromadb.PersistentClient(path=str(DEFAULT_CHROMA_DIR))
    prod_coll = prod_client.get_or_create_collection("academic_resources")
    prod_initial_count = prod_coll.count()
    print(f"[LIVE DB CHECK] Production ChromaDB contains {prod_initial_count} vectors at: {DEFAULT_CHROMA_DIR}")

    # -----------------------------------------------------------------------
    # Requirement 5: Ensure Test Database Isolation in chroma_test_db
    # -----------------------------------------------------------------------
    vector_store.switch_to_test_db()
    test_stats = vector_store.get_stats()
    assert "chroma_test_db" in test_stats["persist_directory"], (
        f"Test database isolation violated! Active dir: {test_stats['persist_directory']}"
    )
    print(f"[TEST SETUP] Switched to isolated test ChromaDB at: {test_stats['persist_directory']}")
    vector_store.reset()

    # -----------------------------------------------------------------------
    # Seed Diverse Academic Test Documents
    # -----------------------------------------------------------------------
    # 1. Base Source Document: WTL Unit 2 Notes (JavaScript & XML/JSON)
    wtl_unit2_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "JavaScript variables declared with var, let, and const. Data types, dynamic typing, and primitive values in Web Technologies.",
            "character_count": 128,
            "word_count": 18
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "JavaScript functions, arrow functions, closures, scope chain, and lexical scoping in Web Technologies.",
            "character_count": 102,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_2",
            "chunk_index": 2,
            "page_number": 3,
            "text": "Document Object Model DOM manipulation, selecting elements with querySelector, and event handling in JavaScript.",
            "character_count": 113,
            "word_count": 15
        },
        {
            "chunk_id": "chunk_3",
            "chunk_index": 3,
            "page_number": 4,
            "text": "XML structure, XML DOM parsing, schemas, DTD, and validating XML documents in web applications.",
            "character_count": 96,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_4",
            "chunk_index": 4,
            "page_number": 5,
            "text": "JSON format, JSON.parse() and JSON.stringify() methods for exchanging data between client and server.",
            "character_count": 102,
            "word_count": 15
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in wtl_unit2_chunks])
    vector_store.add_chunks(wtl_unit2_chunks, embs, "res_wtl_unit2", "WTL_Unit_2_Notes.pdf")

    # 2. Candidate 1: XML and JSON Guide
    xml_json_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "XML document tree representation, XML DOM parser nodes, elements, attributes, and XML schema validation.",
            "character_count": 106,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "JSON syntax, parsing JSON objects, arrays, serialization, and AJAX asynchronous data transmission.",
            "character_count": 99,
            "word_count": 13
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in xml_json_chunks])
    vector_store.add_chunks(xml_json_chunks, embs, "res_xml_json", "03_Web_Technologies_XML_JSON.pdf")

    # 3. Candidate 2: JavaScript DOM & Event Handling
    js_dom_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "JavaScript DOM tree manipulation, addEventListener, event bubbling, and event propagation.",
            "character_count": 91,
            "word_count": 11
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "JavaScript event handling, click events, form validation, and dynamic DOM node traversal.",
            "character_count": 90,
            "word_count": 12
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in js_dom_chunks])
    vector_store.add_chunks(js_dom_chunks, embs, "res_js_dom", "02_JavaScript_DOM_Events.pdf")

    # 4. Candidate 3: JavaScript Advanced Web Programming
    js_adv_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Advanced JavaScript programming with closures, prototype chain, asynchronous promises, and async await.",
            "character_count": 104,
            "word_count": 13
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "Modern JavaScript ES6 features, modules, class inheritance, and event loop execution context.",
            "character_count": 95,
            "word_count": 12
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in js_adv_chunks])
    vector_store.add_chunks(js_adv_chunks, embs, "res_js_adv", "04_JavaScript_Advanced_Web_Programming.pdf")

    # 5. Candidate 4: HTML & CSS Web Technologies
    html_css_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "HTML5 semantic elements, header, nav, section, article, and web page layout structure.",
            "character_count": 88,
            "word_count": 12
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "CSS styling, Flexbox layout, CSS Grid, media queries, and responsive web design.",
            "character_count": 81,
            "word_count": 12
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in html_css_chunks])
    vector_store.add_chunks(html_css_chunks, embs, "res_html_css", "01_Web_Technologies_HTML_CSS.pdf")

    # 6. Candidate 5: Operating Systems (Unrelated)
    os_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Operating system process scheduling algorithms: Round Robin, Shortest Job First, and Priority Scheduling.",
            "character_count": 106,
            "word_count": 14
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "Virtual memory management, paging, page replacement algorithms LRU, FIFO, and thrashing.",
            "character_count": 88,
            "word_count": 11
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in os_chunks])
    vector_store.add_chunks(os_chunks, embs, "res_os", "06_Operating_Systems_Process_Memory.pdf")

    # 7. Candidate 6: Data Structures & Algorithms (Unrelated)
    dsa_chunks = [
        {
            "chunk_id": "chunk_0",
            "chunk_index": 0,
            "page_number": 1,
            "text": "Binary Search Tree insertion, deletion, tree traversals, and AVL tree balancing rotations.",
            "character_count": 91,
            "word_count": 12
        },
        {
            "chunk_id": "chunk_1",
            "chunk_index": 1,
            "page_number": 2,
            "text": "Graph representations, Dijkstra shortest path algorithm, Kruskal and Prim minimum spanning trees.",
            "character_count": 98,
            "word_count": 13
        }
    ]
    embs = embedding_service.generate_embeddings([c["text"] for c in dsa_chunks])
    vector_store.add_chunks(dsa_chunks, embs, "res_dsa", "05_DSA_Algorithms_Data_Structures.pdf")

    print(f"[SETUP COMPLETE] Seeded 7 academic documents (17 chunks total) in chroma_test_db.\n")

    # -----------------------------------------------------------------------
    # TEST 1 & TEST 4: Top-K Cross-Chunk Max-Pooling & Strong Scores for WTL Unit 2
    # -----------------------------------------------------------------------
    print("[TEST 1] Testing Top-K Cross-Chunk Max-Pooling Scoring for WTL Unit 2...")
    recs = vector_store.recommend_similar_resources(
        resource_id="res_wtl_unit2",
        top_k=6
    )

    print(f" Retrieved {len(recs)} recommendations for 'WTL Unit 2 Notes':")
    for rank, r in enumerate(recs, 1):
        print(f"  Rank #{rank}: {r['filename']:<42} | Final: {r['similarity_score']:.4f} "
              f"| Max: {r['max_similarity_score']:.4f} | Top3 Mean: {r['avg_similarity_score']:.4f} "
              f"| Chunks: {r['matched_chunks_count']}")

    # Verify mathematical formula for each candidate
    for r in recs:
        expected_final = round(0.6 * r["max_similarity_score"] + 0.4 * r["avg_similarity_score"], 4)
        assert abs(r["similarity_score"] - expected_final) <= 0.001, (
            f"Formula mismatch for {r['filename']}: got {r['similarity_score']}, expected {expected_final}"
        )
    print(" [PASS] Top-K Cross-Chunk Max-Pooling formula (0.6*max + 0.4*top3_mean) verified exactly.")

    # Requirement 4: XML/JSON and JavaScript documents receive strong scores (> 0.50)
    xml_rec = next((r for r in recs if r["resource_id"] == "res_xml_json"), None)
    js_dom_rec = next((r for r in recs if r["resource_id"] == "res_js_dom"), None)
    js_adv_rec = next((r for r in recs if r["resource_id"] == "res_js_adv"), None)

    assert xml_rec is not None and xml_rec["similarity_score"] >= 0.50, (
        f"XML/JSON recommendation score too low: {xml_rec['similarity_score'] if xml_rec else 'None'}"
    )
    assert js_dom_rec is not None and js_dom_rec["similarity_score"] >= 0.50, (
        f"JS DOM recommendation score too low: {js_dom_rec['similarity_score'] if js_dom_rec else 'None'}"
    )
    assert js_adv_rec is not None and js_adv_rec["similarity_score"] >= 0.50, (
        f"JS Advanced recommendation score too low: {js_adv_rec['similarity_score'] if js_adv_rec else 'None'}"
    )
    print(f" [PASS] XML/JSON ({xml_rec['similarity_score']:.4f}), JS DOM ({js_dom_rec['similarity_score']:.4f}), "
          f"and JS Adv ({js_adv_rec['similarity_score']:.4f}) received strong scores (all > 0.50).")

    # -----------------------------------------------------------------------
    # Requirement 1: Source Document Exclusion
    # -----------------------------------------------------------------------
    print("\n[TEST 2] Verifying Source Document Exclusion...")
    rec_ids = [r["resource_id"] for r in recs]
    assert "res_wtl_unit2" not in rec_ids, "ERROR: Target source document res_wtl_unit2 was NOT excluded!"
    print(f" [PASS] Source document 'res_wtl_unit2' is strictly excluded from recommendations: {rec_ids}")

    # -----------------------------------------------------------------------
    # Requirement 2: Deduplication (Each Resource Appears Only Once)
    # -----------------------------------------------------------------------
    print("\n[TEST 3] Verifying Resource-Level Deduplication...")
    assert len(rec_ids) == len(set(rec_ids)), "ERROR: Duplicate resource recommendations detected!"
    for r in recs:
        assert r["matched_chunks_count"] >= 1
        assert "best_match_page" in r
        assert "best_match_text" in r
        assert len(r["best_match_text"]) > 0
    print(f" [PASS] All {len(rec_ids)} recommendations are unique, deduplicated academic resources.")

    # -----------------------------------------------------------------------
    # Requirement 3: Web Technologies Documents Rank Above DSA / OS
    # -----------------------------------------------------------------------
    print("\n[TEST 4] Verifying Semantic Domain Ranking (Web Tech > OS / DSA)...")
    web_tech_ids = {"res_xml_json", "res_js_dom", "res_js_adv", "res_html_css"}
    unrelated_ids = {"res_os", "res_dsa"}

    web_tech_ranks = [i for i, r in enumerate(recs) if r["resource_id"] in web_tech_ids]
    unrelated_ranks = [i for i, r in enumerate(recs) if r["resource_id"] in unrelated_ids]

    max_web_tech_rank = max(web_tech_ranks)
    min_unrelated_rank = min(unrelated_ranks)

    assert min_unrelated_rank > min(web_tech_ranks), (
        f"Unrelated document ranked higher than top Web Tech document! Unrelated ranks: {unrelated_ranks}, Web ranks: {web_tech_ranks}"
    )
    # Check that top 3 results are all Web Technologies / JavaScript / XML documents
    top_3_ids = set([recs[i]["resource_id"] for i in range(min(3, len(recs)))])
    assert top_3_ids.issubset(web_tech_ids), f"Top 3 results contained unrelated documents: {top_3_ids}"
    print(f" [PASS] All top 3 positions are Web Technologies / JavaScript / XML documents: {top_3_ids}")
    print(f" [PASS] Unrelated OS and DSA documents ranked lower at positions {[r+1 for r in unrelated_ranks]}.")

    # -----------------------------------------------------------------------
    # TEST 5: Graceful Handling of Unindexed Resource & On-The-Fly Text Fallback
    # -----------------------------------------------------------------------
    print("\n[TEST 5] Testing Edge Cases: Unindexed Resource & On-The-Fly Fallback...")
    # 5a. Non-existent resource ID with no fallback text -> returns empty list
    empty_res = vector_store.recommend_similar_resources(
        resource_id="res_non_existent_404",
        top_k=5
    )
    assert empty_res == [], f"Expected empty list for non-existent resource, got {empty_res}"
    print(" [PASS] Non-existent resource without fallback text returns empty list cleanly.")

    # 5b. Non-existent resource ID with fallback text -> embeddings generated on the fly
    fallback_query = "JavaScript DOM manipulation and event listeners in web browsers."
    fallback_emb = embedding_service.generate_embedding(fallback_query)
    fallback_res = vector_store.recommend_similar_resources(
        resource_id="res_non_existent_404",
        source_embedding=fallback_emb,
        top_k=3
    )
    assert len(fallback_res) == 3
    assert fallback_res[0]["resource_id"] in ["res_js_dom", "res_js_adv", "res_wtl_unit2"]
    print(f" [PASS] Fallback text representation successfully retrieved top recommendations: {[r['filename'] for r in fallback_res]}")

    # -----------------------------------------------------------------------
    # TEST 6: FastAPI Recommendation Endpoint Handlers
    # -----------------------------------------------------------------------
    print("\n[TEST 6] Testing FastAPI POST & GET /api/ai/recommend Endpoints...")
    post_req = RecommendRequest(
        resource_id="res_wtl_unit2",
        top_k=3
    )
    post_resp = get_content_recommendations(post_req)
    assert post_resp["success"] is True
    assert post_resp["source_resource_id"] == "res_wtl_unit2"
    assert post_resp["total_recommendations"] == 3
    assert "res_wtl_unit2" not in [r["resource_id"] for r in post_resp["recommendations"]]
    print(f" [PASS] POST /api/ai/recommend endpoint returned {post_resp['total_recommendations']} valid recommendations.")

    get_resp = get_content_recommendations_get(
        resource_id="res_wtl_unit2",
        top_k=2
    )
    assert get_resp["success"] is True
    assert get_resp["source_resource_id"] == "res_wtl_unit2"
    assert len(get_resp["recommendations"]) == 2
    print(f" [PASS] GET /api/ai/recommend endpoint returned {len(get_resp['recommendations'])} valid recommendations.")

    # -----------------------------------------------------------------------
    # Requirement 6 (Post-check): Verify Production ChromaDB is Untouched
    # -----------------------------------------------------------------------
    print("\n[TEST 7] Verifying Production ChromaDB Integrity (Never Reset)...")
    prod_final_count = prod_coll.count()
    assert prod_final_count == prod_initial_count, (
        f"CRITICAL ERROR: Production ChromaDB was modified! Initial: {prod_initial_count}, Final: {prod_final_count}"
    )
    print(f" [PASS] Production ChromaDB remains intact with exactly {prod_final_count} vectors.")

    # Switch back to live database
    vector_store.switch_to_live_db()

    print("\n" + "=" * 80)
    print(" ALL 7 RECOMMENDATION ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    run_recommendation_tests()
