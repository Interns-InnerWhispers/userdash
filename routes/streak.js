const express = require('express');
const router = express.Router();
const db = require('../db');

// Get self-care streak for a user (frontend expects /api/streak/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockStreakData = {
        currentStreak: 5,
        weeklyActivity: [0, 1, 1, 1, 1, 1, 0],
        message: '5 days of self-care in a row Keep nurturing your routine.'
    };
    
    res.json(mockStreakData);
});

// Update streak
router.post('/update', (req, res) => {
    const { userId, activity, date } = req.body;
    
    if (!userId || !activity) {
        return res.status(400).json({ message: 'User ID and activity are required.' });
    }
    
    const query = 'INSERT INTO self_care_streak (user_id, activity, date) VALUES (?, ?, ?)';
    db.query(query, [userId, activity, date || new Date()], (err, result) => {
        if (err) {
            console.error('Error updating streak:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ streakId: result.insertId, message: 'Streak updated successfully' });
    });
});

module.exports = router;
