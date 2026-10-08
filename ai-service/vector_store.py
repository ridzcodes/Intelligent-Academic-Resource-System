"""
Vector Store Module for Intelligent Academic Resource Retrieval System
======================================================================

Module Overview (For Viva & Presentation):
------------------------------------------
This module constitutes Step 3 (Vector Database Storage & Similarity Search)
of the AI Pipeline.

Key Concepts:
1. What is ChromaDB?
   ChromaDB is an open-source, lightweight, AI-native vector database designed to store
   dense embedding vectors alongside document text and structured metadata (e.g., page numbers,
   filenames, and resource IDs).

2. Why do we need a Vector Database?
   Standard relational databases (SQL) or document databases (MongoDB) index data using B-Trees
   or hash indices for exact/range matching. They cannot efficiently calculate geometric distances
   (such as Cosine Similarity or Euclidean Distance) across high-dimensional (384-D) vector spaces.
   ChromaDB uses Approximate Nearest Neighbor (ANN) search algorithms (HNSW) to find the most
   semantically similar document chunks in milliseconds.

3. Metadata Association:
   Every stored vector is linked with:
   - `resource_id`: The academic resource ID from MongoDB.
   - `filename`: Original PDF name.
   - `page_number`: Exact page where the text chunk was extracted.
   - `chunk_id`: Unique chunk identifier.
   - `chunk_index`: Sequence position of the chunk within the document.
"""

from pathlib import Path
from typing import List, Dict, Any, Optional
import re
import numpy as np
import chromadb
from chromadb.config import Settings

import os
# Persistent local storage directory inside ai-service
DEFAULT_CHROMA_DIR = Path(os.environ.get("CHROMA_DIR", Path(__file__).parent / "chroma_db"))
DEFAULT_TEST_CHROMA_DIR = Path(__file__).parent / "chroma_test_db"
DEFAULT_COLLECTION_NAME = "academic_resources"


class VectorStore:
    """
    Manages persistent vector storage, indexing, and similarity retrieval via ChromaDB.
    """

    _instance = None
    _client = None
    _collection = None

    def __new__(cls, persist_directory: Optional[Path] = None, collection_name: str = DEFAULT_COLLECTION_NAME):
        if cls._instance is None:
            cls._instance = super(VectorStore, cls).__new__(cls)
            cls._instance._initialize_db(persist_directory or DEFAULT_CHROMA_DIR, collection_name)
        return cls._instance

    def _initialize_db(self, persist_dir: Path, collection_name: str) -> None:
        """Initializes ChromaDB persistent client and retrieves or creates the collection."""
        self.persist_directory = Path(persist_dir)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.collection_name = collection_name

        # Create persistent ChromaDB client
        self.client = chromadb.PersistentClient(path=str(self.persist_directory))
        
        # Use cosine similarity space for vector distance comparison
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def switch_to_test_db(self, test_dir: Optional[Path] = None, collection_name: str = "test_academic_resources") -> None:
        """
        Switches the vector store to an isolated test ChromaDB directory (chroma_test_db)
        so that automated tests NEVER modify or reset the live production database.
        """
        target_dir = Path(test_dir) if test_dir else DEFAULT_TEST_CHROMA_DIR
        self._initialize_db(target_dir, collection_name)

    def switch_to_live_db(self, persist_dir: Optional[Path] = None, collection_name: str = DEFAULT_COLLECTION_NAME) -> None:
        """
        Switches the vector store back to the production ChromaDB directory.
        """
        target_dir = Path(persist_dir) if persist_dir else DEFAULT_CHROMA_DIR
        self._initialize_db(target_dir, collection_name)

    def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]],
        resource_id: str,
        filename: str
    ) -> int:
        """
        Stores a batch of document chunks, their embeddings, and metadata in ChromaDB.

        Args:
            chunks (List[Dict[str, Any]]): List of chunk dictionaries containing text, chunk_id, etc.
            embeddings (List[List[float]]): List of 384-dimensional vector embeddings.
            resource_id (str): Unique identifier of the academic resource.
            filename (str): Name of the source file.

        Returns:
            int: Number of vectors added.
        """
        if not chunks or not embeddings or len(chunks) != len(embeddings):
            raise ValueError("Chunks and embeddings must be non-empty and of matching length.")

        ids: List[str] = []
        documents: List[str] = []
        metadatas: List[Dict[str, Any]] = []

        for chunk in chunks:
            chunk_id = chunk.get("chunk_id", f"chunk_{len(ids)}")
            unique_vector_id = f"{resource_id}_{chunk_id}"
            
            ids.append(unique_vector_id)
            documents.append(chunk.get("text", ""))
            metadatas.append({
                "resource_id": str(resource_id),
                "filename": str(filename),
                "chunk_id": str(chunk_id),
                "chunk_index": int(chunk.get("chunk_index", len(ids) - 1)),
                "page_number": int(chunk.get("page_number", 1)),
                "character_count": int(chunk.get("character_count", len(chunk.get("text", "")))),
                "word_count": int(chunk.get("word_count", len(chunk.get("text", "").split())))
            })

        # Upsert into ChromaDB collection
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )

        return len(ids)

    def add_single_text(
        self,
        text: str,
        embedding: List[float],
        resource_id: str = "demo_resource",
        filename: str = "demo.txt",
        page_number: int = 1,
        chunk_id: str = "chunk_0",
        chunk_index: int = 0
    ) -> Dict[str, Any]:
        """
        Stores a single text chunk and its embedding vector into ChromaDB (useful for test endpoints).

        Args:
            text (str): The text content.
            embedding (List[float]): The 384-D vector embedding.
            resource_id (str): Resource identifier.
            filename (str): Source filename.
            page_number (int): Origin page number.
            chunk_id (str): Chunk identifier.
            chunk_index (int): Chunk index.

        Returns:
            Dict[str, Any]: Confirmation details including stored vector ID.
        """
        unique_vector_id = f"{resource_id}_{chunk_id}"
        metadata = {
            "resource_id": str(resource_id),
            "filename": str(filename),
            "chunk_id": str(chunk_id),
            "chunk_index": int(chunk_index),
            "page_number": int(page_number),
            "character_count": len(text),
            "word_count": len(text.split())
        }

        self.collection.upsert(
            ids=[unique_vector_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata]
        )

        return {
            "vector_id": unique_vector_id,
            "metadata": metadata,
            "document_preview": text[:100] + ("..." if len(text) > 100 else "")
        }

    def _compute_relevance_score(
        self,
        raw_similarity: float,
        chunk_text: str,
        query_text: Optional[str]
    ) -> float:
        """
        Computes a combined relevance score incorporating semantic cosine similarity
        and an optional lexical boost for exact phrase or keyword matches.

        Rules:
        - Normalizes query and chunk text to lowercase and strips punctuation.
        - Adds a reasonable lexical boost if the exact normalized phrase occurs in the chunk.
        - Does NOT blindly set score to 100%; caps at 0.98.
        """
        if not query_text or not query_text.strip() or not chunk_text:
            return round(raw_similarity, 4)

        # Normalize whitespace and convert to lowercase
        norm_query = " ".join(query_text.lower().split())
        norm_chunk = " ".join(chunk_text.lower().split())

        # Clean punctuation for robust matching
        clean_query = re.sub(r'[^\w\s]', ' ', norm_query)
        clean_query = " ".join(clean_query.split())

        clean_chunk = re.sub(r'[^\w\s]', ' ', norm_chunk)
        clean_chunk = " ".join(clean_chunk.split())

        boost = 0.0
        # 1. Exact full phrase match in chunk text
        if len(clean_query) >= 3 and clean_query in clean_chunk:
            boost = 0.15
        else:
            # 2. All significant query words present in chunk
            words = [w for w in clean_query.split() if len(w) > 2]
            if len(words) > 1 and all(w in clean_chunk for w in words):
                boost = 0.08

        # Combine similarity + lexical boost (bounded in [0.0, 0.98] to avoid false 100% claims)
        combined_score = min(0.98, max(0.0, raw_similarity + boost))
        return round(combined_score, 4)

    def query_similar_chunks(
        self,
        query_embedding: List[float],
        top_k: int = 8,
        resource_id: Optional[str] = None,
        query_text: Optional[str] = None,
        deduplicate_by_resource: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Searches ChromaDB for matching academic resources using hybrid semantic retrieval:
        1. Retrieves an expanded candidate pool (n_results = max(top_k * 10, 50)).
        2. Computes combined relevance score with exact phrase / lexical boost.
        3. Groups candidate chunks by resource_id (preventing duplicate PDF saturations).
        4. Selects the single highest-scoring chunk per resource as its representative result.
        5. Preserves page number, excerpt, resource_id, and metadata.
        6. Returns unique resources sorted by descending relevance score.

        Args:
            query_embedding (List[float]): 384-dimensional query vector.
            top_k (int): Number of unique resources to retrieve (default: 8).
            resource_id (Optional[str]): Optional filter to search within a specific document.
            query_text (Optional[str]): Original query text for exact phrase boost.
            deduplicate_by_resource (bool): Whether to group and deduplicate by resource_id (default: True).

        Returns:
            List[Dict[str, Any]]: List of unique matching resource chunks sorted by relevance.
        """
        total_vectors = self.collection.count()
        if total_vectors == 0:
            return []

        where_filter = {"resource_id": str(resource_id)} if resource_id else None

        # Candidate pool expansion: retrieve up to max(top_k * 10, 50) chunks when searching across documents
        if resource_id:
            n_candidates = min(top_k, total_vectors)
        else:
            n_candidates = min(max(top_k * 10, 50), total_vectors)

        # Query ChromaDB collection
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_candidates,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        if not results or not results.get("ids") or len(results["ids"]) == 0:
            return []

        ids = results["ids"][0]
        docs = results["documents"][0] if results.get("documents") else []
        metas = results["metadatas"][0] if results.get("metadatas") else []
        distances = results["distances"][0] if results.get("distances") else []

        # If searching within a specific resource or deduplication disabled, return scored chunks directly
        if resource_id or not deduplicate_by_resource:
            chunk_results: List[Dict[str, Any]] = []
            for i in range(len(ids)):
                distance = float(distances[i]) if i < len(distances) else 0.0
                raw_sim = max(0.0, min(1.0, 1.0 - distance))
                chunk_text = docs[i] if i < len(docs) else ""
                relevance_score = self._compute_relevance_score(raw_sim, chunk_text, query_text)

                chunk_results.append({
                    "id": ids[i],
                    "text": chunk_text,
                    "distance": round(distance, 4),
                    "similarity_score": relevance_score,
                    "metadata": metas[i] if i < len(metas) else {}
                })
            chunk_results.sort(key=lambda x: x["similarity_score"], reverse=True)
            return chunk_results[:top_k]

        # Group candidate chunks by resource_id to prevent multi-chunk saturation
        grouped: Dict[str, List[Dict[str, Any]]] = {}

        for i in range(len(ids)):
            meta = metas[i] if i < len(metas) else {}
            cand_res_id = str(meta.get("resource_id", ""))
            if not cand_res_id:
                cand_res_id = ids[i]

            distance = float(distances[i]) if i < len(distances) else 0.0
            raw_sim = max(0.0, min(1.0, 1.0 - distance))
            chunk_text = docs[i] if i < len(docs) else ""
            relevance_score = self._compute_relevance_score(raw_sim, chunk_text, query_text)

            chunk_item = {
                "id": ids[i],
                "text": chunk_text,
                "distance": round(distance, 4),
                "similarity_score": relevance_score,
                "raw_similarity": round(raw_sim, 4),
                "metadata": meta
            }

            if cand_res_id not in grouped:
                grouped[cand_res_id] = []
            grouped[cand_res_id].append(chunk_item)

        # For each resource_id, select the single highest-relevance chunk as the representative result
        unique_resource_results: List[Dict[str, Any]] = []

        for cand_res_id, chunk_list in grouped.items():
            # Sort chunks of this resource by relevance score descending (break ties with raw cosine similarity)
            chunk_list.sort(key=lambda x: (x["similarity_score"], x["raw_similarity"]), reverse=True)
            best_chunk = chunk_list[0]

            unique_resource_results.append({
                "id": best_chunk["id"],
                "text": best_chunk["text"],
                "distance": best_chunk["distance"],
                "similarity_score": best_chunk["similarity_score"],
                "metadata": best_chunk["metadata"]
            })

        # Sort all unique resources by their best relevance score in descending order
        unique_resource_results.sort(key=lambda x: x["similarity_score"], reverse=True)

        # Return the requested number of unique resources (default: 8)
        return unique_resource_results[:top_k]

    def get_resource_vectors(self, resource_id: str) -> Dict[str, Any]:
        """
        Retrieves all stored vector embeddings, chunk texts, and metadata for a specific resource.
        """
        if not resource_id:
            return {"ids": [], "embeddings": [], "documents": [], "metadatas": []}
        try:
            results = self.collection.get(
                where={"resource_id": str(resource_id)},
                include=["embeddings", "documents", "metadatas"]
            )
            return results or {"ids": [], "embeddings": [], "documents": [], "metadatas": []}
        except Exception:
            return {"ids": [], "embeddings": [], "documents": [], "metadatas": []}

    def compute_resource_centroid(self, resource_id: str) -> Optional[List[float]]:
        """
        Computes the normalized mean centroid embedding representing the entire resource.
        """
        vectors_data = self.get_resource_vectors(resource_id)
        embeddings = vectors_data.get("embeddings")
        if embeddings is None or len(embeddings) == 0:
            return None

        arr = np.array(embeddings, dtype=np.float32)
        centroid = np.mean(arr, axis=0)
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        return centroid.tolist()

    def recommend_similar_resources(
        self,
        resource_id: Optional[str] = None,
        source_embedding: Optional[List[float]] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Finds academically similar resources using Top-K Cross-Chunk Max-Pooling:
        1. Retrieves indexed chunk embeddings for the selected source resource.
           (If source is unindexed, falls back to source_embedding).
        2. Compares source chunk embeddings against candidate resource chunks.
        3. Excludes the source resource itself (Requirement 4).
        4. For each candidate resource:
           - Computes cross-chunk cosine similarity matrix across all source-candidate chunk pairs.
           - Calculates max_similarity = max cross-chunk similarity.
           - Calculates top3_mean_similarity = mean of top 3 cross-chunk similarities (or available if < 3).
           - Computes final_score = 0.6 * max_similarity + 0.4 * top3_mean_similarity.
           - Selects the best matching candidate chunk with citations (page_number, excerpt).
        5. Groups and deduplicates by resource_id (one recommendation per PDF/resource).
        6. Sorts unique resources by final_score in descending order.
        7. Returns the top_k recommendations.
        """
        total_vectors = self.collection.count()
        if total_vectors == 0:
            return []

        # 1. Obtain source chunk embeddings and metadata
        source_embs = None
        source_metas = []
        source_docs = []
        if resource_id:
            source_data = self.get_resource_vectors(resource_id)
            source_embs = source_data.get("embeddings")
            source_metas = source_data.get("metadatas", [])
            source_docs = source_data.get("documents", [])

        if (source_embs is None or len(source_embs) == 0) and source_embedding is not None:
            source_embs = [source_embedding]
            source_metas = [{"chunk_id": "fallback_centroid", "page_number": 1}]
            source_docs = [""]

        if source_embs is None or len(source_embs) == 0:
            return []

        source_arr = np.array(source_embs, dtype=np.float32)
        source_norms = np.linalg.norm(source_arr, axis=1, keepdims=True)
        source_normed = source_arr / np.maximum(source_norms, 1e-8)

        # 2. Retrieve all stored chunks from collection
        all_data = self.collection.get(include=["embeddings", "metadatas", "documents"])
        all_embs = all_data.get("embeddings")
        all_metas = all_data.get("metadatas", [])
        all_docs = all_data.get("documents", [])
        all_ids = all_data.get("ids", [])

        if all_embs is None or len(all_embs) == 0:
            return []

        all_arr = np.array(all_embs, dtype=np.float32)

        # 3. Group candidate chunks by resource_id (excluding source resource)
        grouped: Dict[str, Dict[str, Any]] = {}
        for i, meta in enumerate(all_metas):
            cand_res_id = str(meta.get("resource_id", ""))
            if not cand_res_id or (resource_id and cand_res_id == str(resource_id)):
                continue

            if cand_res_id not in grouped:
                grouped[cand_res_id] = {
                    "resource_id": cand_res_id,
                    "filename": meta.get("filename", ""),
                    "embeddings": [],
                    "metadatas": [],
                    "documents": [],
                    "ids": []
                }
            grouped[cand_res_id]["embeddings"].append(all_arr[i])
            grouped[cand_res_id]["metadatas"].append(meta)
            grouped[cand_res_id]["documents"].append(all_docs[i] if i < len(all_docs) else "")
            grouped[cand_res_id]["ids"].append(all_ids[i] if i < len(all_ids) else "")

        recommendations: List[Dict[str, Any]] = []

        # 4. Compute cross-chunk similarity for each candidate resource
        for cand_res_id, cdata in grouped.items():
            cand_arr = np.array(cdata["embeddings"], dtype=np.float32)
            cand_norms = np.linalg.norm(cand_arr, axis=1, keepdims=True)
            cand_normed = cand_arr / np.maximum(cand_norms, 1e-8)

            # Cross-chunk similarity matrix: (N_source, M_candidate)
            sim_matrix = np.dot(source_normed, cand_normed.T)
            flat_sims = np.sort(sim_matrix.flatten())[::-1]

            if len(flat_sims) == 0:
                continue

            max_similarity = float(flat_sims[0])
            k = min(3, len(flat_sims))
            top3_mean_similarity = float(np.mean(flat_sims[:k]))

            # Aggregated score: 60% peak cross-chunk similarity + 40% top-3 mean similarity
            final_score = round(0.6 * max_similarity + 0.4 * top3_mean_similarity, 4)

            # Identify the best matching candidate chunk and source chunk
            best_source_idx, best_cand_idx = np.unravel_index(np.argmax(sim_matrix), sim_matrix.shape)
            best_cand_meta = cdata["metadatas"][best_cand_idx]
            best_cand_text = cdata["documents"][best_cand_idx]
            best_source_meta = source_metas[best_source_idx] if best_source_idx < len(source_metas) else {}

            recommendations.append({
                "resource_id": str(cand_res_id),
                "similarity_score": final_score,
                "final_score": final_score,
                "max_similarity_score": round(max_similarity, 4),
                "max_similarity": round(max_similarity, 4),
                "avg_similarity_score": round(top3_mean_similarity, 4),
                "top3_mean_similarity": round(top3_mean_similarity, 4),
                "matched_chunks_count": len(cand_arr),
                "filename": best_cand_meta.get("filename", ""),
                "best_match_page": best_cand_meta.get("page_number", 1),
                "best_match_chunk_id": best_cand_meta.get("chunk_id", ""),
                "best_match_text": (best_cand_text[:250] + "...") if len(best_cand_text) > 250 else best_cand_text,
                "best_source_chunk_id": best_source_meta.get("chunk_id", ""),
                "best_source_page": best_source_meta.get("page_number", 1)
            })

        # 5. Sort recommendations by final similarity score descending
        recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)

        return recommendations[:top_k]

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics about the ChromaDB vector database."""
        return {
            "collection_name": self.collection_name,
            "total_vectors": self.collection.count(),
            "persist_directory": str(self.persist_directory)
        }

    def delete_by_resource_id(self, resource_id: str) -> int:
        """
        Deletes all vectors associated with a specific resource_id from ChromaDB.
        Prevents duplicate vectors when a document is re-indexed or replaced.

        Args:
            resource_id (str): Unique academic resource ID.

        Returns:
            int: Number of vectors deleted (or estimated).
        """
        try:
            existing = self.collection.get(where={"resource_id": str(resource_id)})
            count = len(existing["ids"]) if existing and "ids" in existing else 0
            if count > 0:
                self.collection.delete(where={"resource_id": str(resource_id)})
            return count
        except Exception as e:
            # Fallback if where filter finds no matches or raises
            return 0

    def reset(self) -> None:
        """Resets/empties the collection (for testing purposes)."""
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )


# Global singleton instance for easy import
vector_store = VectorStore()
