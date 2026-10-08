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
const searchVectors = async (query, topK = 8, resourceId = null) => {
  const url = `${AI_SERVICE_BASE_URL}/api/ai/search-vectors`;

  const payload = {
    query: query.trim(),
    top_k: Number(topK) || 8,
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

const fs = require('fs');

/**
 * Triggers full PDF extraction, cleaning, chunking, embedding generation
 * (all-MiniLM-L6-v2), and ChromaDB indexing on the Python AI microservice.
 * 
 * @param {Object} params
 * @param {string} params.resourceId - MongoDB Resource ObjectId
 * @param {string} params.filePath - Full physical file path on server
 * @param {string} params.filename - Original or sanitized file name
 * @param {number} [params.chunkSize=500] - Characters per chunk
 * @param {number} [params.chunkOverlap=50] - Characters overlap
 * @returns {Promise<Object>} Indexing metrics { success, status, resource_id, total_chunks, vectors_stored, ... }
 */
const indexDocument = async ({
  resourceId,
  filePath,
  filename,
  chunkSize = 500,
  chunkOverlap = 50,
}) => {
  const url = `${AI_SERVICE_BASE_URL}/api/ai/index`;

  if (!fs.existsSync(filePath)) {
    throw new Error(`File does not exist on disk at path: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', blob, filename || 'document.pdf');
  formData.append('resource_id', resourceId.toString());
  formData.append('chunk_size', String(chunkSize));
  formData.append('chunk_overlap', String(chunkOverlap));

  try {
    const controller = new AbortController();
    // 60-second timeout for large academic PDFs
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      let parsedError = errorBody;
      try {
        const jsonErr = JSON.parse(errorBody);
        parsedError = jsonErr.detail || jsonErr.message || errorBody;
      } catch (e) {}
      throw new Error(
        `FastAPI Indexing Error (${response.status}): ${parsedError || response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI indexing microservice timed out while extracting/embedding PDF.');
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
 * Deletes vector chunks for a specific resource from ChromaDB.
 * 
 * @param {string} resourceId - Unique resource ID
 * @returns {Promise<Object>}
 */
const deleteIndexedVectors = async (resourceId) => {
  if (!resourceId) return { success: false, message: 'No resource ID provided' };
  const url = `${AI_SERVICE_BASE_URL}/api/ai/vectors/${encodeURIComponent(resourceId)}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'DELETE',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, message: `Status ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.warn(`[AI Client] Warning deleting vectors for ${resourceId}:`, error.message);
    return { success: false, message: error.message };
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

/**
 * Retrieves content-based recommendations from Python AI Microservice (ChromaDB Cosine Similarity)
 * 
 * @param {Object} params
 * @param {string} [params.resourceId] - Source resource ID
 * @param {string} [params.text] - Fallback/Direct text representation (title, subject, description)
 * @param {number} [params.topK=5] - Number of unique recommended resources
 * @returns {Promise<Object>} Recommendation response
 */
const getRecommendations = async ({ resourceId = null, text = null, topK = 5 } = {}) => {
  const url = `${AI_SERVICE_BASE_URL}/api/ai/recommend`;

  const payload = {
    top_k: Number(topK) || 5,
    ...(resourceId ? { resource_id: resourceId.toString() } : {}),
    ...(text ? { text: text.trim() } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

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
      let parsedError = errorBody;
      try {
        const jsonErr = JSON.parse(errorBody);
        parsedError = jsonErr.detail || jsonErr.message || errorBody;
      } catch (e) {}
      throw new Error(
        `AI Recommendation Microservice Error (${response.status}): ${parsedError || response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI recommendation microservice timed out.');
    }
    if (error.cause?.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
      throw new Error(
        `Cannot connect to AI Service at ${AI_SERVICE_BASE_URL}. Ensure the FastAPI server is running with 'uvicorn main:app --reload --port 8000'.`
      );
    }
    throw error;
  }
};

module.exports = {
  searchVectors,
  indexDocument,
  deleteIndexedVectors,
  checkAiHealth,
  getRecommendations,
  AI_SERVICE_BASE_URL,
};
