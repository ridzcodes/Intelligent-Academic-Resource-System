const express = require('express');
const router = express.Router();
const {
  semanticSearch,
  recommendResources,
  getAiServiceHealth,
} = require('../controllers/aiController');

// Semantic Search (accepts POST with JSON body or GET with query params)
router.post('/semantic-search', semanticSearch);
router.get('/semantic-search', semanticSearch);

// Content-Based Recommendations (accepts POST with JSON body or GET with query params)
router.post('/recommend', recommendResources);
router.get('/recommend', recommendResources);

// AI Microservice Health & Connectivity check
router.get('/health', getAiServiceHealth);

module.exports = router;
