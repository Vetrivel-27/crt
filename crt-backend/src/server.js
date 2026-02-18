const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const workerRoutes = require('./routes/worker');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'CRT API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Complaint Resolution Tracker API');
    console.log('='.repeat(50));
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ API Base URL: http://localhost:${PORT}`);
    console.log(`✓ Health Check: http://localhost:${PORT}/health`);
    console.log('='.repeat(50));
});

module.exports = app;
