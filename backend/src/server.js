require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Import middleware
const { rateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

// Import Alert Service
const AlertService = require('./services/alertService');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true
    }
});

// Initialize Alert Service with io
const alertService = new AlertService(io);

// Make io and alertService accessible to routes
app.set('io', io);
app.set('alertService', alertService);

// Store connected users
const connectedUsers = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);
    
    // User joins with their ID
    socket.on('register-user', (userId) => {
        connectedUsers.set(userId, socket.id);
        socket.join(`user_${userId}`);
        console.log(`✅ User ${userId} registered with socket ${socket.id}`);
    });
    
    // User requests to join campaign room
    socket.on('join-campaign', (campaignId) => {
        socket.join(`campaign_${campaignId}`);
        console.log(`📢 Socket ${socket.id} joined campaign ${campaignId}`);
    });
    
    socket.on('disconnect', () => {
        // Remove user from connectedUsers
        for (let [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                console.log(`❌ User ${userId} disconnected`);
                break;
            }
        }
        console.log('🔌 Client disconnected:', socket.id);
    });
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting
app.use(rateLimiter);

// Pass alertService to routes
campaignRoutes.setAlertService(alertService);
notificationRoutes.setAlertService(alertService);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Campaign Management API with WebSocket',
        timestamp: new Date().toISOString(),
        websocket: 'active',
        connectedUsers: connectedUsers.size
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket server ready`);
});