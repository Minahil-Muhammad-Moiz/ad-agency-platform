const express = require('express');
const router = express.Router();
const { generateAdCopy, generateSocialCaptions, generateHashtags } = require('../services/groqService');
const { generateRequestId, logRequest } = require('../utils/logger');

// POST /generate/copy - Generate ad copy with streaming support
router.post('/copy', async (req, res) => {
    const requestId = generateRequestId();
    const { product, tone, platform, word_limit, stream } = req.body;
    
    // Validate required fields
    if (!product || !tone || !platform) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['product', 'tone', 'platform']
        });
    }
    
    logRequest(requestId, '/generate/copy', req.body);
    
    // Handle streaming if requested
    if (stream === true) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Send streaming response
        const result = await generateAdCopy({ product, tone, platform, word_limit: word_limit || 100 });
        res.write(`data: ${JSON.stringify(result)}\n\n`);
        res.end();
    } else {
        // Regular JSON response
        const result = await generateAdCopy({ product, tone, platform, word_limit: word_limit || 100 });
        res.json(result);
    }
});

// POST /generate/social - Generate social media captions
router.post('/social', async (req, res) => {
    const requestId = generateRequestId();
    const { platform, campaign_goal, brand_voice } = req.body;
    
    // Validate required fields
    if (!platform || !campaign_goal || !brand_voice) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['platform', 'campaign_goal', 'brand_voice']
        });
    }
    
    logRequest(requestId, '/generate/social', req.body);
    
    const captions = await generateSocialCaptions({ platform, campaign_goal, brand_voice });
    res.json({ captions });
});

// POST /generate/hashtags - Generate hashtags
router.post('/hashtags', async (req, res) => {
    const requestId = generateRequestId();
    const { content, industry } = req.body;
    
    // Validate required fields
    if (!content || !industry) {
        return res.status(400).json({ 
            error: 'Missing required fields',
            required: ['content', 'industry']
        });
    }
    
    logRequest(requestId, '/generate/hashtags', req.body);
    
    const hashtags = await generateHashtags({ content, industry });
    res.json({ hashtags });
});

module.exports = router;