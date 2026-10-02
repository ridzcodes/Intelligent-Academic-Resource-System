const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const resourceRoutes = require('./resourceRoutes');
const userRoutes = require('./userRoutes');

// API Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Intelligent Academic Resource System API is online and healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/resources', resourceRoutes);
router.use('/admin', userRoutes);

module.exports = router;
