const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Enable CORS for client communication
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded PDF files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Intelligent Academic Resource Retrieval System API',
    documentation: '/api/health',
    version: '1.0.0',
  });
});

// Mount Main API Routes
app.use('/api', routes);

// Centralized 404 and Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
