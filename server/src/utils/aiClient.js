/**
 * AI Microservice HTTP Client
 * =============================
 * Communicates with the Python FastAPI microservice (port 8000)
 * for Sentence-Transformer embeddings, ChromaDB vector indexing, and semantic search.
 * 
 * Flow for College Viva:
 * [React SearchPage] -> [Express Backend: /api/ai/semantic-search]
 *   -> [aiClient.searchVectors()] -> [FastAPI: POST /api/ai/search-vectors]
 *   -> [SentenceTransformer: all-MiniLM-L6-v2] -> [ChromaDB Cosine Search]
 *   -> [Express enriches with MongoDB metadata] -> [React displays chunk + page + resource]
 */

const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Searches ChromaDB vector database using the Python AI microservice.
 * 
 * @param {string} query - Natural language search query
 * @param {number} topK - Maximum number of relevant chunks to retrieve (default: 5)
 * @param {string|null} resourceId - Optional resource ID filter
 * @returns {Promise<Object>} Search results object containing results array
 */
const searchVectors = async (query, topK = 6, resourceId = null) => {
  const url = `${AI_SERVICE_BASE_URL}/api/ai/search-vectors`;

  const payload = {
    query: query.trim(),
    top_k: Number(topK) || 6,
    ...(resourceId ? { resource_id: resourceId } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 8-second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `AI Microservice returned error (${response.status}): ${errorBody || response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI semantic search microservice timed out. Please verify that the Python service is running.');
    }
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      throw new Error(
        `Cannot connect to AI Service at ${AI_SERVICE_BASE_URL}. Ensure the FastAPI server is running with 'uvicorn main:app --reload --port 8000'.`
      );
    }
    throw error;
  }
};

/**
 * Checks the status and health of the Python AI microservice.
 * 
 * @returns {Promise<Object>} Microservice health status
 */
const checkAiHealth = async () => {
  const url = `${AI_SERVICE_BASE_URL}/api/ai/health`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { online: false, message: `Status code ${response.status}` };
    }

    const data = await response.json();
    return { online: true, data };
  } catch (error) {
    return {
      online: false,
      message: error.message || 'Unable to reach Python AI microservice',
    };
  }
};

module.exports = {
  searchVectors,
  checkAiHealth,
  AI_SERVICE_BASE_URL,
};
