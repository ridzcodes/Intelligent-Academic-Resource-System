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
import chromadb
from chromadb.config import Settings

# Persistent local storage directory inside ai-service
DEFAULT_CHROMA_DIR = Path(__file__).parent / "chroma_db"
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

    def query_similar_chunks(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        resource_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Searches ChromaDB for the closest vectors to a given query embedding.

        Args:
            query_embedding (List[float]): 384-dimensional query vector.
            top_k (int): Number of most similar results to retrieve (default: 5).
            resource_id (Optional[str]): Optional filter to search within a specific document.

        Returns:
            List[Dict[str, Any]]: List of matching chunks with similarity scores and metadata.
        """
        where_filter = {"resource_id": resource_id} if resource_id else None

        # Query ChromaDB collection
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
            include=["documents", "metadatas", "distances"]
        )

        matches: List[Dict[str, Any]] = []

        if results and results.get("ids") and len(results["ids"]) > 0:
            ids = results["ids"][0]
            docs = results["documents"][0] if results.get("documents") else []
            metas = results["metadatas"][0] if results.get("metadatas") else []
            distances = results["distances"][0] if results.get("distances") else []

            for i in range(len(ids)):
                distance = float(distances[i]) if i < len(distances) else 0.0
                similarity_score = max(0.0, min(1.0, 1.0 - distance))

                matches.append({
                    "id": ids[i],
                    "text": docs[i] if i < len(docs) else "",
                    "distance": round(distance, 4),
                    "similarity_score": round(similarity_score, 4),
                    "metadata": metas[i] if i < len(metas) else {}
                })

        return matches

    def get_stats(self) -> Dict[str, Any]:
        """Returns statistics about the ChromaDB vector database."""
        return {
            "collection_name": self.collection_name,
            "total_vectors": self.collection.count(),
            "persist_directory": str(self.persist_directory)
        }

    def reset(self) -> None:
        """Resets/empties the collection (for testing purposes)."""
        self.client.delete_collection(name=self.collection_name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )


# Global singleton instance for easy import
vector_store = VectorStore()
