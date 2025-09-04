const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'Bharat KYC API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// SDK endpoint
app.get('/api/v1/sdk', (req, res) => {
  res.json({
    name: 'Bharat KYC SDK',
    version: '1.0.0',
    description: 'Lightweight KYC solution for rural India',
    features: [
      'AI-Powered Document Guidance',
      'Voice-Guided Interface',
      'Offline-First Design',
      'Multilingual Support'
    ],
    documentation: '/docs'
  });
});

// Serve static files from documentation
app.use('/docs', express.static(path.join(__dirname, '../../05-Documentation')));

// Serve wireframes
app.use('/wireframes', express.static(path.join(__dirname, '../../05-Documentation/Wireframes')));

// Serve SDK files
app.use('/sdk', express.static(path.join(__dirname, '../../04-Source_Code')));

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Bharat KYC API Documentation',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check endpoint',
      'GET /api/v1/status': 'API status information',
      'GET /api/v1/sdk': 'SDK information and features',
      'GET /docs': 'Project documentation',
      'GET /wireframes': 'Interactive wireframes',
      'GET /sdk': 'SDK source code'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
    availableEndpoints: [
      '/health',
      '/api/v1/status',
      '/api/v1/sdk',
      '/docs',
      '/wireframes',
      '/sdk'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bharat KYC App server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 Documentation: http://localhost:${PORT}/docs`);
  console.log(`🎨 Wireframes: http://localhost:${PORT}/wireframes`);
  console.log(`🔧 SDK: http://localhost:${PORT}/sdk`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
