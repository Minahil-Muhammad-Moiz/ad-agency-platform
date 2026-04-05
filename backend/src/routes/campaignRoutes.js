const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

let alertService;

// Function to set alert service
router.setAlertService = (service) => {
    alertService = service;
};

// Apply authentication to all campaign routes
router.use(authenticateToken);

// GET /api/campaigns - List all campaigns with filter/sort/pagination
router.get('/', async (req, res) => {
    try {
        const { status, client, sort = 'created_at', order = 'DESC', page = 1, limit = 10 } = req.query;
        
        let query = `
            SELECT 
                c.*,
                CASE 
                    WHEN c.impressions > 0 THEN ROUND((c.clicks::DECIMAL / c.impressions) * 100, 2)
                    ELSE 0
                END as ctr,
                CASE 
                    WHEN c.spend > 0 THEN ROUND(c.conversions::DECIMAL / c.spend, 4)
                    ELSE 0
                END as roas
            FROM campaigns c
            WHERE c.deleted_at IS NULL
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (status) {
            query += ` AND c.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        
        if (client) {
            query += ` AND c.client ILIKE $${paramIndex}`;
            params.push(`%${client}%`);
            paramIndex++;
        }
        
        // Validate sort field to prevent SQL injection
        const allowedSortFields = ['name', 'client', 'status', 'budget', 'spend', 'impressions', 'clicks', 'conversions', 'created_at'];
        const validSort = allowedSortFields.includes(sort) ? sort : 'created_at';
        const validOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        
        query += ` ORDER BY c.${validSort} ${validOrder}`;
        
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM campaigns WHERE deleted_at IS NULL'
        );
        
        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT 
                c.*,
                CASE 
                    WHEN c.impressions > 0 THEN ROUND((c.clicks::DECIMAL / c.impressions) * 100, 2)
                    ELSE 0
                END as ctr,
                CASE 
                    WHEN c.spend > 0 THEN ROUND(c.conversions::DECIMAL / c.spend, 4)
                    ELSE 0
                END as roas
            FROM campaigns c
            WHERE c.id = $1 AND c.deleted_at IS NULL`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req, res) => {
    try {
        const { name, client, status, budget, spend, impressions, clicks, conversions } = req.body;
        
        // Input validation
        if (!name || !client || !budget) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['name', 'client', 'budget']
            });
        }
        
        if (budget <= 0) {
            return res.status(400).json({ error: 'Budget must be greater than 0' });
        }
        
        const result = await pool.query(
            `INSERT INTO campaigns (name, client, status, budget, spend, impressions, clicks, conversions, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [name, client, status || 'active', budget, spend || 0, impressions || 0, clicks || 0, conversions || 0, req.user.id]
        );
        
        res.status(201).json({
            success: true,
            data: result.rows[0],
            message: 'Campaign created successfully'
        });
    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/campaigns/:id - Update campaign with alert triggering
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, client, status, budget, spend, impressions, clicks, conversions } = req.body;
        
        // First, get the current campaign data
        const currentCampaign = await pool.query(
            'SELECT * FROM campaigns WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );
        
        if (currentCampaign.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let valueIndex = 1;
        
        if (name !== undefined) {
            updates.push(`name = $${valueIndex++}`);
            values.push(name);
        }
        if (client !== undefined) {
            updates.push(`client = $${valueIndex++}`);
            values.push(client);
        }
        if (status !== undefined) {
            updates.push(`status = $${valueIndex++}`);
            values.push(status);
        }
        if (budget !== undefined) {
            updates.push(`budget = $${valueIndex++}`);
            values.push(budget);
        }
        if (spend !== undefined) {
            updates.push(`spend = $${valueIndex++}`);
            values.push(spend);
        }
        if (impressions !== undefined) {
            updates.push(`impressions = $${valueIndex++}`);
            values.push(impressions);
        }
        if (clicks !== undefined) {
            updates.push(`clicks = $${valueIndex++}`);
            values.push(clicks);
        }
        if (conversions !== undefined) {
            updates.push(`conversions = $${valueIndex++}`);
            values.push(conversions);
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        
        if (updates.length === 1) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        
        values.push(id);
        
        const query = `
            UPDATE campaigns 
            SET ${updates.join(', ')}
            WHERE id = $${valueIndex} AND deleted_at IS NULL
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        // Trigger alert rules after successful update
        if (alertService && result.rows[0]) {
            await alertService.checkAlertRules(result.rows[0], req.user.id);
        }
        
        res.json({
            success: true,
            data: result.rows[0],
            message: 'Campaign updated successfully'
        });
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/campaigns/:id - Soft delete campaign
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `UPDATE campaigns SET deleted_at = CURRENT_TIMESTAMP 
             WHERE id = $1 AND deleted_at IS NULL
             RETURNING id`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Campaign deleted successfully', 
            id: parseInt(id) 
        });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;