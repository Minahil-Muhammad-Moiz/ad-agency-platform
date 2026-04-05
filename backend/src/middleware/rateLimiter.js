const rateLimit = require('express-rate-limit');

// Use direct numbers instead of .env for now
const rateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute (60000 milliseconds)
    max: 100, // 100 requests per minute
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { rateLimiter };