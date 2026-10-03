"""
Embedding Service Module for Intelligent Academic Resource Retrieval System
============================================================================

Module Overview (For Viva & Presentation):
------------------------------------------
This module constitutes Step 2 (Vector Embedding Generation) of the AI Pipeline.

Key Concepts:
1. What are Vector Embeddings?
   An embedding is a numerical representation of text in a high-dimensional vector space
   (384 dimensions for all-MiniLM-L6-v2). Words and concepts with similar semantic meanings
   are mapped to coordinates close to each other in this mathematical space.

2. Why use Embeddings instead of Keyword Matching?
   - Keyword search fails when different words describe the same concept (synonyms)
     e.g., searching for "CPU Scheduling" vs "process dispatching".
   - Embeddings capture context, relationships, and semantic meaning rather than exact spelling.

3. Model Choice: `sentence-transformers/all-MiniLM-L6-v2`
   - Compact and fast (approx. 80MB model size).
   - Generates 384-dimensional dense vectors.
   - Optimized for sentence and paragraph semantic similarity matching.
"""

from typing import List, Union
import numpy as np
from sentence_transformers import SentenceTransformer

# Default lightweight sentence-transformer model
DEFAULT_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class EmbeddingService:
    """
    Singleton-style service for loading the SentenceTransformer model
    and generating dense vector embeddings.
    """

    _instance = None
    _model = None

    def __new__(cls, model_name: str = DEFAULT_MODEL_NAME):
        # Implement singleton pattern to avoid reloading model weights into memory multiple times
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialize_model(model_name)
        return cls._instance

    def _initialize_model(self, model_name: str) -> None:
        """Loads the SentenceTransformer model."""
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        # Warm up model to retrieve embedding dimension
        dummy_vector = self.model.encode("warmup", convert_to_numpy=True)
        self.embedding_dimension = int(dummy_vector.shape[0])

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generates a dense vector embedding for a single text string.

        Args:
            text (str): Input text (sentence or document chunk).

        Returns:
            List[float]: A 384-dimensional float vector.
        """
        if not text or not text.strip():
            # Return zero vector for empty text
            return [0.0] * self.embedding_dimension

        embedding = self.model.encode(text, convert_to_numpy=True)
        # Convert numpy array to standard Python list for JSON and ChromaDB compatibility
        return embedding.tolist()

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates vector embeddings for a batch of text chunks efficiently.

        Args:
            texts (List[str]): List of text chunks to embed.

        Returns:
            List[List[float]]: List of 384-dimensional float vectors.
        """
        if not texts:
            return []

        # Filter and handle empty texts safely
        cleaned_texts = [t if t and t.strip() else " " for t in texts]
        embeddings = self.model.encode(cleaned_texts, convert_to_numpy=True, batch_size=32)
        return embeddings.tolist()

    def get_dimension(self) -> int:
        """Returns the embedding vector dimension (384 for all-MiniLM-L6-v2)."""
        return self.embedding_dimension


# Global singleton instance for easy import
embedding_service = EmbeddingService()
