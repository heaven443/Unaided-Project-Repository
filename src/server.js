require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const dealRoutes = require('./routes/dealRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database & migrations
initDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'caletracker-backend',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'CaleTracker API Service',
    version: '1.0.0',
    documentation: '/api/health, /api/deals, /api/auth'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  🚀 CaleTracker Backend running on port ${PORT}`);
  console.log(`  🔗 Local:  http://localhost:${PORT}`);
  console.log(`  🩺 Health: http://localhost:${PORT}/api/health`);
  console.log(`  🏷️  Deals:  http://localhost:${PORT}/api/deals`);
  console.log(`===============================================`);
});

module.exports = { app, server };

