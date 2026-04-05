const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const generateRoutes = require('./routes/generateRoutes');
const { requestLogger } = require('./utils/logger');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/generate', generateRoutes);

// Health check endpoint (required by assessment)
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'AI Content Generation Microservice',
        model: 'mixtral-8x7b-32768', // Groq's model
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: err.message 
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 AI Microservice running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
});