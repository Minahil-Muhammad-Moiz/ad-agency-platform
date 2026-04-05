-- Complete Database Setup Script
-- Run with: psql -U postgres -f database-setup.sql

-- Create database
DROP DATABASE IF EXISTS ad_agency_db;
CREATE DATABASE ad_agency_db;

-- Connect to database
\c ad_agency_db;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'account_manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create campaigns table
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
    user_id INTEGER REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'warning',
    message TEXT NOT NULL,
    threshold_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    recommendation TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_alerts_campaign_id ON alerts(campaign_id);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);

-- Insert test user (password: password123)
INSERT INTO users (email, password_hash, name) 
VALUES (
    'test@agency.com', 
    '$2b$10$EFlj/jOeAO3tx3HeBPpm4uG/zCo4S8keQklGPZASAPqvOJ.gaashG',
    'Test User'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample campaigns
INSERT INTO campaigns (name, client, status, budget, spend, impressions, clicks, conversions, user_id)
SELECT * FROM (VALUES 
    ('Summer Launch 2024', 'Lumiere Skincare', 'active', 50000, 32450, 2400000, 48000, 1200, 1),
    ('Holiday Special', 'Nike', 'active', 75000, 45000, 3500000, 70000, 2100, 1),
    ('Spring Campaign', 'Adidas', 'paused', 30000, 30000, 1200000, 36000, 900, 1),
    ('Brand Awareness', 'Puma', 'active', 60000, 20000, 1800000, 45000, 800, 1),
    ('Back to School', 'Lumiere Skincare', 'completed', 40000, 15000, 900000, 18000, 400, 1)
) AS v(name, client, status, budget, spend, impressions, clicks, conversions, user_id)
WHERE NOT EXISTS (SELECT 1 FROM campaigns LIMIT 1);

-- Create function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at 
    BEFORE UPDATE ON campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as users_count FROM users;
SELECT COUNT(*) as campaigns_count FROM campaigns;