const express = require('express');
const router = express.Router();
const db = require('../db');

// Get notifications for a user (frontend expects /api/notifications/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockNotifications = [
        { type: 'alert', title: 'New order', status: '200 OK', date: '2 days' },
        { type: 'update', title: 'Payment process', status: '200 OK', date: '2 days' },
        { type: 'log', title: 'API connection', status: '200 OK', date: '2 days' },
        { type: 'log', title: 'Database restore', status: '200 OK', date: 'Mar 5' }
    ];
    
    res.json(mockNotifications);
});

// Mark notification as read
router.put('/:notificationId/read', (req, res) => {
    const { notificationId } = req.params;
    const query = 'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?';
    
    // This would need user_id from request body or auth middleware
    db.query(query, [notificationId, req.body.userId || 1], (err, result) => {
        if (err) {
            console.error('Error marking notification as read:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json({ message: 'Notification marked as read' });
    });
});

module.exports = router;
