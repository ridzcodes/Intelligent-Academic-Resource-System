/**
 * AI Controller
 * =============
 * Handles AI-powered semantic search requests by proxying queries to the
 * Python FastAPI microservice (Sentence-Transformers + ChromaDB) and enriching
 * vector search results with MongoDB academic resource records.
 */

const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { searchVectors, checkAiHealth } = require('../utils/aiClient');

/**
 * @desc    Execute Semantic Search across indexed academic PDF documents
 * @route   POST /api/ai/semantic-search (or GET /api/ai/semantic-search)
 * @access  Public
 */
const semanticSearch = async (req, res, next) => {
  try {
    const query = req.body.query || req.query.q || req.query.query || req.query.search;
    const topK = parseInt(req.body.top_k || req.query.top_k || req.query.limit || '6', 10);
    const resourceIdFilter = req.body.resource_id || req.query.resource_id || null;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required for semantic search',
      });
    }

    if (query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
      });
    }

    // Step 1: Query Python AI Microservice (FastAPI + ChromaDB)
    let aiResponse;
    try {
      aiResponse = await searchVectors(query, topK, resourceIdFilter);
    } catch (aiError) {
      console.error('[AI Semantic Search Error]:', aiError.message);
      return res.status(503).json({
        success: false,
        isAiOffline: true,
        message:
          aiError.message ||
          'AI Semantic Search microservice is temporarily unavailable. Please verify that the Python FastAPI server is running.',
      });
    }

    const rawMatches = aiResponse.results || [];

    // Step 2: Extract distinct resource_ids to enrich with MongoDB Resource details
    const resourceIds = rawMatches
      .map((m) => m.metadata?.resource_id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    let resourceMap = new Map();
    if (resourceIds.length > 0) {
      const dbResources = await Resource.find({ _id: { $in: resourceIds } })
        .populate('uploadedBy', 'name email department');
      
      dbResources.forEach((doc) => {
        resourceMap.set(doc._id.toString(), doc);
      });
    }

    // Step 3: Format and enrich results with both vector chunk citations & MongoDB metadata
    const enrichedResults = rawMatches.map((match) => {
      const matchedResId = match.metadata?.resource_id;
      const dbResource = matchedResId ? resourceMap.get(matchedResId.toString()) : null;

      return {
        id: match.id,
        text: match.text,
        similarityScore: match.similarity_score,
        distance: match.distance,
        pageNumber: match.metadata?.page_number || 1,
        filename: match.metadata?.filename || dbResource?.fileOriginalName || 'Document.pdf',
        resourceId: matchedResId || null,
        chunkId: match.metadata?.chunk_id || 'chunk_0',
        chunkIndex: match.metadata?.chunk_index ?? 0,
        resource: dbResource || null,
      };
    });

    res.status(200).json({
      success: true,
      mode: 'semantic',
      query: query.trim(),
      totalResults: enrichedResults.length,
      results: enrichedResults,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check Python AI Microservice Health & Connectivity
 * @route   GET /api/ai/health
 * @access  Public
 */
const getAiServiceHealth = async (req, res, next) => {
  try {
    const health = await checkAiHealth();
    res.status(health.online ? 200 : 503).json({
      success: health.online,
      microservice: 'Python FastAPI Vector Search',
      status: health.online ? 'connected' : 'disconnected',
      details: health.data || health.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  semanticSearch,
  getAiServiceHealth,
};
