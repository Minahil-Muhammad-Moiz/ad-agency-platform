const pool = require('../config/database');

class AlertService {
    constructor(io) {
        this.io = io;
        this.thresholds = {
            ctr: 1.0, // 1% CTR threshold
            budgetUtilization: 90, // 90% budget utilization
            roas: 0.5, // 0.5 ROAS threshold
            impressions: 100000 // 100k impressions threshold
        };
    }
    
    // Check all alert rules for a campaign
    async checkAlertRules(campaign, userId) {
        const alerts = [];
        
        // Rule 1: Check CTR threshold (below 1%)
        const ctr = campaign.impressions > 0 
            ? (campaign.clicks / campaign.impressions) * 100 
            : 0;
        
        if (ctr < this.thresholds.ctr && campaign.impressions > 1000) {
            alerts.push({
                campaign_id: campaign.id,
                alert_type: 'low_ctr',
                severity: 'warning',
                message: `CTR dropped to ${ctr.toFixed(2)}% (below ${this.thresholds.ctr}% threshold)`,
                threshold_value: this.thresholds.ctr,
                current_value: ctr,
                recommendation: 'Consider optimizing ad creative or targeting'
            });
        }
        
        // Rule 2: Check budget utilization (above 90%)
        const budgetUtilization = (campaign.spend / campaign.budget) * 100;
        
        if (budgetUtilization >= this.thresholds.budgetUtilization) {
            const severity = budgetUtilization >= 100 ? 'critical' : 'warning';
            alerts.push({
                campaign_id: campaign.id,
                alert_type: 'budget_exceeded',
                severity: severity,
                message: `Budget utilization at ${budgetUtilization.toFixed(2)}% (exceeds ${this.thresholds.budgetUtilization}% threshold)`,
                threshold_value: this.thresholds.budgetUtilization,
                current_value: budgetUtilization,
                recommendation: budgetUtilization >= 100 
                    ? 'Campaign budget exhausted. Consider increasing budget or pausing campaign.'
                    : 'Campaign approaching budget limit. Monitor spend closely.'
            });
        }
        
        // Rule 3: Check ROAS threshold (below 0.5)
        const roas = campaign.spend > 0 
            ? campaign.conversions / campaign.spend 
            : 0;
        
        if (roas < this.thresholds.roas && campaign.spend > 1000) {
            alerts.push({
                campaign_id: campaign.id,
                alert_type: 'low_roas',
                severity: 'warning',
                message: `ROAS dropped to ${roas.toFixed(2)} (below ${this.thresholds.roas} threshold)`,
                threshold_value: this.thresholds.roas,
                current_value: roas,
                recommendation: 'Review campaign performance and optimize conversions'
            });
        }
        
        // Rule 4: Check impressions growth (sudden drop)
        // This would require historical data - simplified version
        if (campaign.impressions > 0 && campaign.impressions < this.thresholds.impressions) {
            alerts.push({
                campaign_id: campaign.id,
                alert_type: 'low_impressions',
                severity: 'info',
                message: `Impressions at ${campaign.impressions.toLocaleString()} (below ${this.thresholds.impressions.toLocaleString()} threshold)`,
                threshold_value: this.thresholds.impressions,
                current_value: campaign.impressions,
                recommendation: 'Consider increasing bid or expanding targeting'
            });
        }
        
        // Save alerts to database and send real-time notifications
        for (const alert of alerts) {
            await this.saveAlert(alert, userId);
            await this.sendNotification(alert, userId);
        }
        
        return alerts;
    }
    
    // Save alert to database
    async saveAlert(alert, userId) {
        try {
            const result = await pool.query(
                `INSERT INTO alerts (campaign_id, alert_type, severity, message, threshold_value, current_value, recommendation, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [alert.campaign_id, alert.alert_type, alert.severity, alert.message, 
                 alert.threshold_value, alert.current_value, alert.recommendation]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error saving alert:', error);
            return null;
        }
    }
    
    // Send real-time notification via WebSocket
    async sendNotification(alert, userId) {
        if (this.io) {
            // Emit to user's room
            this.io.to(`user_${userId}`).emit('new_alert', {
                id: Date.now(),
                ...alert,
                timestamp: new Date().toISOString(),
                read: false
            });
            
            // Also emit a sound notification trigger
            this.io.to(`user_${userId}`).emit('notification_sound', {
                type: alert.severity,
                title: this.getAlertTitle(alert.alert_type),
                message: alert.message
            });
        }
    }
    
    getAlertTitle(alertType) {
        const titles = {
            'low_ctr': '⚠️ Low CTR Alert',
            'budget_exceeded': '💰 Budget Alert',
            'low_roas': '📉 Low ROAS Alert',
            'low_impressions': '👁️ Low Impressions Alert'
        };
        return titles[alertType] || '🔔 Campaign Alert';
    }
    
    // Get unread alerts for a user
    async getUnreadAlerts(userId) {
        try {
            const result = await pool.query(
                `SELECT a.*, c.name as campaign_name 
                 FROM alerts a
                 JOIN campaigns c ON a.campaign_id = c.id
                 WHERE c.user_id = $1 AND a.is_read = false
                 ORDER BY a.created_at DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching unread alerts:', error);
            return [];
        }
    }
    
    // Mark alert as read
    async markAsRead(alertId, userId) {
        try {
            const result = await pool.query(
                `UPDATE alerts 
                 SET is_read = true, read_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND EXISTS (
                     SELECT 1 FROM campaigns c 
                     WHERE c.id = alerts.campaign_id AND c.user_id = $2
                 )
                 RETURNING *`,
                [alertId, userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error marking alert as read:', error);
            return null;
        }
    }
    
    // Get alert history
    async getAlertHistory(userId, limit = 50) {
        try {
            const result = await pool.query(
                `SELECT a.*, c.name as campaign_name 
                 FROM alerts a
                 JOIN campaigns c ON a.campaign_id = c.id
                 WHERE c.user_id = $1
                 ORDER BY a.created_at DESC
                 LIMIT $2`,
                [userId, limit]
            );
            return result.rows;
        } catch (error) {
            console.error('Error fetching alert history:', error);
            return [];
        }
    }
}

module.exports = AlertService;