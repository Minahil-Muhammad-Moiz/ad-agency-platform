-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS campaigns;
DROP TABLE IF EXISTS users;

-- Users table (for authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'account_manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns table (main table for Task 2.1)
CREATE TABLE campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
    budget DECIMAL(10, 2) NOT NULL,
    spend DECIMAL(10, 2) DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    conversions BIGINT DEFAULT 0,
    ctr DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN impressions > 0 THEN (clicks::DECIMAL / impressions) * 100 
            ELSE 0 
        END
    ) STORED,
    roas DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE 
            WHEN spend > 0 THEN conversions::DECIMAL / spend 
            ELSE 0 
        END
    ) STORED,
    user_id INTEGER REFERENCES users(id),
    deleted_at TIMESTAMP NULL,  -- For soft delete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table (for real-time notifications Task 2.3)
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    alert_type VARCHAR(100) NOT NULL,  -- 'low_ctr', 'budget_exceeded', etc.
    message TEXT NOT NULL,
    threshold_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_campaigns_deleted_at ON campaigns(deleted_at);

-- Insert sample user (password is 'password123' - we'll hash it in code)
INSERT INTO users (email, password_hash, name) 
VALUES ('admin@agency.com', 'temp_hash_will_replace', 'Admin User');

-- Insert sample campaigns for testing
INSERT INTO campaigns (name, client, status, budget, spend, impressions, clicks, conversions, user_id)
VALUES 
    ('Summer Sale 2024', 'Nike', 'active', 50000, 32450, 2400000, 48000, 1200, 1),
    ('Brand Awareness Q1', 'Adidas', 'active', 75000, 45000, 3500000, 70000, 2100, 1),
    ('Holiday Special', 'Puma', 'completed', 30000, 30000, 1200000, 36000, 900, 1),
    ('Spring Launch', 'Nike', 'active', 60000, 20000, 1800000, 45000, 800, 1),
    ('Back to School', 'Adidas', 'paused', 40000, 15000, 900000, 18000, 400, 1);

-- Create a function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for campaigns table
CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();