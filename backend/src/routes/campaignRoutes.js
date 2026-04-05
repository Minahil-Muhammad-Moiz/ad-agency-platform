const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

// Apply authentication to all campaign routes
router.use(authenticateToken);

// GET /api/campaigns - List all campaigns with filtering, sorting, pagination
router.get('/', async (req, res, next) => {
    try {
        const { 
            status, 
            client, 
            sort = 'created_at', 
            order = 'DESC',
            page = 1, 
            limit = 10 
        } = req.query;
        
        let query = 'SELECT * FROM campaigns WHERE deleted_at IS NULL';
        const params = [];
        let paramIndex = 1;
        
        // Apply filters
        if (status) {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        if (client) {
            query += ` AND client ILIKE $${paramIndex}`;
            params.push(`%${client}%`);
            paramIndex++;
        }
        
        // Apply sorting
        query += ` ORDER BY ${sort} ${order}`;
        
        // Apply pagination
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count for pagination
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM campaigns WHERE deleted_at IS NULL'
        );
        
        res.json({
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'SELECT * FROM campaigns WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req, res, next) => {
    try {
        const { name, client, status, budget, spend, impressions, clicks, conversions } = req.body;
        
        // Validate required fields
        if (!name || !client || !budget) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'client', 'budget']
            });
        }
        
        const result = await pool.query(
            `INSERT INTO campaigns (name, client, status, budget, spend, impressions, clicks, conversions, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [name, client, status || 'active', budget, spend || 0, impressions || 0, clicks || 0, conversions || 0, req.user.id]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Build dynamic update query
        const setClause = [];
        const params = [];
        let paramIndex = 1;
        
        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id' && key !== 'created_at' && key !== 'deleted_at') {
                setClause.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }
        
        if (setClause.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }
        
        params.push(id);
        
        const query = `
            UPDATE campaigns 
            SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        
        const result = await pool.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        // Check for alert rules after update
        await checkAlertRules(result.rows[0], req.app.get('io'), req.user.id);
        
        res.json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/campaigns/:id - Soft delete campaign
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `UPDATE campaigns 
             SET deleted_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        res.json({ message: 'Campaign deleted successfully', id: parseInt(id) });
    } catch (error) {
        next(error);
    }
});

// Helper function to check alert rules
async function checkAlertRules(campaign, io, userId) {
    const alerts = [];
    
    // Rule 1: Check if CTR is below 1%
    const ctr = (campaign.clicks / campaign.impressions) * 100;
    if (ctr < 1 && campaign.impressions > 0) {
        alerts.push({
            campaign_id: campaign.id,
            alert_type: 'low_ctr',
            message: `CTR dropped to ${ctr.toFixed(2)}% (below 1% threshold)`,
            threshold_value: 1,
            current_value: ctr
        });
    }
    
    // Rule 2: Check if spend exceeds 90% of budget
    const spendPercentage = (campaign.spend / campaign.budget) * 100;
    if (spendPercentage > 90) {
        alerts.push({
            campaign_id: campaign.id,
            alert_type: 'budget_exceeded',
            message: `Budget usage at ${spendPercentage.toFixed(2)}% (exceeds 90% threshold)`,
            threshold_value: 90,
            current_value: spendPercentage
        });
    }
    
    // Save alerts to database and emit via WebSocket
    for (const alert of alerts) {
        const result = await pool.query(
            `INSERT INTO alerts (campaign_id, alert_type, message, threshold_value, current_value)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [alert.campaign_id, alert.alert_type, alert.message, alert.threshold_value, alert.current_value]
        );
        
        // Emit to the specific user's room
        io.to(`user_${userId}`).emit('campaign_alert', result.rows[0]);
    }
}

module.exports = router;