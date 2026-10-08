/**
 * AI Controller
 * =============
 * Handles AI-powered semantic search requests by proxying queries to the
 * Python FastAPI microservice (Sentence-Transformers + ChromaDB) and enriching
 * vector search results with MongoDB academic resource records.
 */

const mongoose = require('mongoose');
const Resource = require('../models/Resource');
const { RESOURCE_STATUS } = require('../utils/constants');
const { searchVectors, getRecommendations, checkAiHealth } = require('../utils/aiClient');

/**
 * @desc    Execute Semantic Search across indexed academic PDF documents
 * @route   POST /api/ai/semantic-search (or GET /api/ai/semantic-search)
 * @access  Public
 */
const semanticSearch = async (req, res, next) => {
  try {
    const query = req.body.query || req.query.q || req.query.query || req.query.search;
    const topK = parseInt(req.body.top_k || req.query.top_k || req.query.limit || '8', 10);
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
 * @desc    Get Content-Based Recommendations for an academic resource
 * @route   POST /api/ai/recommend (or GET /api/ai/recommend)
 * @access  Public
 */
const recommendResources = async (req, res, next) => {
  try {
    const resourceId =
      req.body.resource_id ||
      req.body.resourceId ||
      req.query.resource_id ||
      req.query.resourceId ||
      req.params.id ||
      null;

    let text = req.body.text || req.query.text || null;
    const topK = parseInt(req.body.top_k || req.query.top_k || req.query.limit || '6', 10);

    let sourceResource = null;

    // If resourceId is provided, retrieve source resource details from MongoDB
    if (resourceId && mongoose.Types.ObjectId.isValid(resourceId)) {
      sourceResource = await Resource.findById(resourceId).populate(
        'uploadedBy',
        'name email department'
      );

      // If resource exists in DB and no custom text provided, generate descriptive fallback text
      if (sourceResource && !text) {
        text = `${sourceResource.title}. Subject: ${sourceResource.subject}. Department: ${sourceResource.department}. Description: ${sourceResource.description} ${sourceResource.tags?.join(' ') || ''}`.trim();
      }
    }

    if (!resourceId && (!text || text.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'A valid resource ID or text content is required to generate recommendations.',
      });
    }

    // Step 1: Call Python FastAPI AI Microservice (ChromaDB Cosine Similarity)
    let aiResponse;
    try {
      aiResponse = await getRecommendations({
        resourceId: resourceId ? resourceId.toString() : null,
        text: text ? text.trim() : null,
        topK,
      });
    } catch (aiError) {
      console.error('[AI Recommendation Error]:', aiError.message);
      return res.status(503).json({
        success: false,
        isAiOffline: true,
        message:
          aiError.message ||
          'AI Recommendation microservice is temporarily unavailable. Please verify that the Python FastAPI server is running.',
      });
    }

    const rawRecommendations = aiResponse.recommendations || [];

    // Step 2: Extract distinct recommendation resource IDs from MongoDB
    const recIds = rawRecommendations
      .map((r) => r.resource_id)
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    let resourceMap = new Map();
    if (recIds.length > 0) {
      const dbResources = await Resource.find({
        _id: { $in: recIds },
        status: RESOURCE_STATUS.APPROVED,
      }).populate('uploadedBy', 'name email department year');

      dbResources.forEach((doc) => {
        resourceMap.set(doc._id.toString(), doc);
      });
    }

    // Step 3: Enrich recommendations with MongoDB Resource document & AI metrics
    const enrichedRecommendations = rawRecommendations
      .map((rec) => {
        const dbDoc = resourceMap.get(rec.resource_id.toString());
        // Double check: Exclude current viewing resource or unapproved resource
        if (resourceId && rec.resource_id.toString() === resourceId.toString()) {
          return null;
        }
        if (!dbDoc) {
          // If document does not exist in MongoDB or is not approved, skip in student view
          return null;
        }

        return {
          _id: dbDoc._id,
          resourceId: dbDoc._id,
          title: dbDoc.title,
          subject: dbDoc.subject,
          department: dbDoc.department,
          semester: dbDoc.semester,
          resourceType: dbDoc.resourceType,
          description: dbDoc.description,
          tags: dbDoc.tags,
          fileSize: dbDoc.fileSize,
          fileOriginalName: dbDoc.fileOriginalName,
          fileUrl: dbDoc.fileUrl,
          downloadCount: dbDoc.downloadCount,
          viewsCount: dbDoc.viewsCount,
          uploadedBy: dbDoc.uploadedBy,
          createdAt: dbDoc.createdAt,
          similarityScore: rec.similarity_score,
          maxSimilarityScore: rec.max_similarity_score,
          avgSimilarityScore: rec.avg_similarity_score,
          matchedChunksCount: rec.matched_chunks_count,
          bestMatchPage: rec.best_match_page,
          bestMatchExcerpt: rec.best_match_text,
          bestMatchChunkId: rec.best_match_chunk_id,
          resource: dbDoc,
        };
      })
      .filter(Boolean);

    res.status(200).json({
      success: true,
      sourceResourceId: resourceId || null,
      sourceResource: sourceResource || null,
      totalRecommendations: enrichedRecommendations.length,
      recommendations: enrichedRecommendations,
      message: aiResponse.message || 'Recommendations retrieved successfully',
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
  recommendResources,
  getAiServiceHealth,
};
