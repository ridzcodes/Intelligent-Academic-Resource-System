from pathlib import Path
from vector_store import vector_store
from indexing_pipeline import index_pdf_document
from test_indexing_pipeline import create_sample_academic_pdf

def test_duplicate_prevention():
    test_pdf = Path("test_duplicate_prevent.pdf")
    create_sample_academic_pdf(test_pdf)
    
    # Use isolated test database (chroma_test_db) to avoid modifying live database
    vector_store.switch_to_test_db()
    
    try:
        initial_count = vector_store.get_stats()["total_vectors"]
        
        # 1st Indexing
        res1 = index_pdf_document(test_pdf, "res_duplicate_test", "test_duplicate_prevent.pdf", 60, 15)
        count_after_first = vector_store.get_stats()["total_vectors"]
        assert count_after_first == initial_count + res1["vectors_stored"], "First indexing failed"
        
        # 2nd Indexing of the EXACT SAME resource
        res2 = index_pdf_document(test_pdf, "res_duplicate_test", "test_duplicate_prevent.pdf", 60, 15)
        count_after_second = vector_store.get_stats()["total_vectors"]
        assert count_after_second == count_after_first, f"Duplicate vectors created! Expected {count_after_first}, got {count_after_second}"
        
        # Delete resource vectors
        deleted = vector_store.delete_by_resource_id("res_duplicate_test")
        count_after_delete = vector_store.get_stats()["total_vectors"]
        assert count_after_delete == initial_count, f"Cleanup failed! Expected {initial_count}, got {count_after_delete}"
        
        print("=" * 80)
        print("DUPLICATE PREVENTION & VECTOR CLEANUP TEST PASSED SUCCESSFULLY!")
        print(f"Initial: {initial_count} -> After 1st Index: {count_after_first} -> After 2nd Index: {count_after_second} -> After Delete: {count_after_delete}")
        print("=" * 80)
    finally:
        if test_pdf.exists():
            test_pdf.unlink()

if __name__ == "__main__":
    test_duplicate_prevention()
