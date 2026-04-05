const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

// Apply authentication to all campaign routes
router.use(authenticateToken);

// GET /api/campaigns
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
        
        query += ` ORDER BY c.${sort} ${order}`;
        
        const offset = (page - 1) * limit;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
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
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/campaigns/:id
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
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/campaigns
router.post('/', async (req, res) => {
    try {
        const { name, client, status, budget, spend, impressions, clicks, conversions } = req.body;
        
        if (!name || !client || !budget) {
            return res.status(400).json({ 
                error: 'Missing required fields: name, client, budget'
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
        console.error('Error creating campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/campaigns/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, client, status, budget, spend, impressions, clicks, conversions } = req.body;
        
        const result = await pool.query(
            `UPDATE campaigns 
             SET name = COALESCE($1, name),
                 client = COALESCE($2, client),
                 status = COALESCE($3, status),
                 budget = COALESCE($4, budget),
                 spend = COALESCE($5, spend),
                 impressions = COALESCE($6, impressions),
                 clicks = COALESCE($7, clicks),
                 conversions = COALESCE($8, conversions),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND deleted_at IS NULL
             RETURNING *`,
            [name, client, status, budget, spend, impressions, clicks, conversions, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Campaign not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/campaigns/:id (soft delete)
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
        
        res.json({ message: 'Campaign deleted successfully', id: parseInt(id) });
    } catch (error) {
        console.error('Error deleting campaign:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;