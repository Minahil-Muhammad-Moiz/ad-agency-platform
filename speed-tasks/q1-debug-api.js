/**
 * TASK Q1: Debug Express.js API
 * 
 * Original code had 4 bugs:
 * 1. No input validation for ID parameter
 * 2. SQL Injection vulnerability (using string concatenation)
 * 3. No error handling for invalid ID format
 * 4. Missing status code for not found
 */

// FIXED CODE - No SQL Injection, Proper Validation

const express = require('express');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({
    host: 'localhost',
    database: 'ad_agency_db',
    user: 'postgres',
    password: 'postgres'
});

app.use(express.json());

// FIXED: Get campaign by ID with parameterized query
app.get('/api/campaigns/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // FIX 1: Validate ID is a number
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ 
                error: 'Invalid campaign ID. ID must be a number.' 
            });
        }
        
        // FIX 2: Use parameterized query to prevent SQL injection
        // WRONG: `SELECT * FROM campaigns WHERE id = ${id}`
        // RIGHT: Using $1 parameter
        const result = await pool.query(
            'SELECT * FROM campaigns WHERE id = $1 AND deleted_at IS NULL',
            [parseInt(id)]
        );
        
        // FIX 3: Handle not found case with proper status code
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: `Campaign with ID ${id} not found` 
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
        
    } catch (error) {
        // FIX 4: Proper error handling
        console.error('Database error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Test endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`✅ Debugged API running on port ${PORT}`);
    console.log(`Test with: curl http://localhost:${PORT}/api/campaigns/1`);
});

module.exports = app;

/**
 * BUGS FIXED:
 * 
 * Bug 1: No input validation
 * - Added check for valid numeric ID
 * - Returns 400 for invalid IDs
 * 
 * Bug 2: SQL Injection vulnerability
 * - Changed from string concatenation to parameterized queries
 * - Using $1 placeholder instead of ${id}
 * 
 * Bug 3: No error handling for invalid ID
 * - Added try-catch block
 * - Returns proper error messages
 * 
 * Bug 4: Missing 404 status code
 * - Returns 404 when campaign not found
 * - Previously returned empty array with 200
 */