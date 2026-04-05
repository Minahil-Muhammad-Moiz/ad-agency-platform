const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

let alertService;

// Function to set alert service
router.setAlertService = (service) => {
    alertService = service;
};

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/notifications/unread - Get unread notifications
router.get('/unread', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT a.*, c.name as campaign_name 
             FROM alerts a
             JOIN campaigns c ON a.campaign_id = c.id
             WHERE c.user_id = $1 AND a.is_read = false
             ORDER BY a.created_at DESC`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            count: result.rows.length,
            notifications: result.rows
        });
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/notifications/history - Get notification history
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        const result = await pool.query(
            `SELECT a.*, c.name as campaign_name 
             FROM alerts a
             JOIN campaigns c ON a.campaign_id = c.id
             WHERE c.user_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2`,
            [req.user.id, limit]
        );
        
        res.json({
            success: true,
            count: result.rows.length,
            notifications: result.rows
        });
    } catch (error) {
        console.error('Error fetching notification history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `UPDATE alerts 
             SET is_read = true, read_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND EXISTS (
                 SELECT 1 FROM campaigns c 
                 WHERE c.id = alerts.campaign_id AND c.user_id = $2
             )
             RETURNING *`,
            [id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        res.json({
            success: true,
            notification: result.rows[0]
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', async (req, res) => {
    try {
        await pool.query(
            `UPDATE alerts 
             SET is_read = true, read_at = CURRENT_TIMESTAMP
             WHERE is_read = false AND campaign_id IN (
                 SELECT id FROM campaigns WHERE user_id = $1
             )`,
            [req.user.id]
        );
        
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;