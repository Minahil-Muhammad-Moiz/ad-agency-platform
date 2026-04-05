-- TASK Q3: Find top 5 campaigns by ROAS for each client in last 30 days

-- SOLUTION 1: Using ROW_NUMBER() (Best for PostgreSQL)
WITH campaign_roas AS (
    SELECT 
        client,
        name as campaign_name,
        id as campaign_id,
        -- Calculate ROAS (Return on Ad Spend)
        CASE 
            WHEN spend > 0 THEN ROUND((conversions::DECIMAL / spend), 4)
            ELSE 0
        END as roas,
        created_at,
        -- Rank campaigns within each client by ROAS
        ROW_NUMBER() OVER (
            PARTITION BY client 
            ORDER BY (CASE WHEN spend > 0 THEN conversions::DECIMAL / spend ELSE 0 END) DESC
        ) as rank
    FROM campaigns
    WHERE 
        deleted_at IS NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND spend > 0  -- Only include campaigns with spend
)
SELECT 
    client,
    campaign_name,
    campaign_id,
    roas,
    rank
FROM campaign_roas
WHERE rank <= 5
ORDER BY client, rank;

-- SOLUTION 2: Using RANK() (includes ties)
WITH campaign_roas AS (
    SELECT 
        client,
        name as campaign_name,
        id as campaign_id,
        CASE 
            WHEN spend > 0 THEN ROUND((conversions::DECIMAL / spend), 4)
            ELSE 0
        END as roas,
        RANK() OVER (
            PARTITION BY client 
            ORDER BY (CASE WHEN spend > 0 THEN conversions::DECIMAL / spend ELSE 0 END) DESC
        ) as rank
    FROM campaigns
    WHERE 
        deleted_at IS NULL
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT 
    client,
    campaign_name,
    campaign_id,
    roas,
    rank
FROM campaign_roas
WHERE rank <= 5
ORDER BY client, rank;

-- SOLUTION 3: Using LATERAL join (Alternative approach)
SELECT DISTINCT ON (client, roas_rank)
    c.client,
    c.name as campaign_name,
    c.id as campaign_id,
    CASE 
        WHEN c.spend > 0 THEN ROUND((c.conversions::DECIMAL / c.spend), 4)
        ELSE 0
    END as roas,
    ranked.roas_rank
FROM campaigns c
CROSS JOIN LATERAL (
    SELECT COUNT(*) as roas_rank
    FROM campaigns c2
    WHERE 
        c2.client = c.client
        AND c2.deleted_at IS NULL
        AND c2.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND (CASE WHEN c2.spend > 0 THEN c2.conversions::DECIMAL / c2.spend ELSE 0 END) >=
            (CASE WHEN c.spend > 0 THEN c.conversions::DECIMAL / c.spend ELSE 0 END)
) ranked
WHERE 
    c.deleted_at IS NULL
    AND c.created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND ranked.roas_rank <= 5
ORDER BY c.client, roas DESC;

-- Verify results
SELECT 
    client,
    COUNT(*) as total_campaigns,
    AVG(roas) as avg_roas
FROM (
    SELECT 
        client,
        CASE 
            WHEN spend > 0 THEN ROUND((conversions::DECIMAL / spend), 4)
            ELSE 0
        END as roas
    FROM campaigns
    WHERE deleted_at IS NULL
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
) t
GROUP BY client
ORDER BY client;

-- EXPLANATION:
-- This query finds the top 5 campaigns by ROAS for each client
-- ROAS = Revenue (conversions) / Ad Spend
-- Higher ROAS means better return on investment