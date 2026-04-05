const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.stack);
    
    // Handle specific error types
    if (err.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({ error: 'Duplicate entry', details: err.detail });
    }
    
    if (err.code === '23503') { // PostgreSQL foreign key violation
        return res.status(400).json({ error: 'Invalid reference', details: err.detail });
    }
    
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = { errorHandler };