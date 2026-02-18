/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
    }

    if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Resource already exists';
    }

    if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
