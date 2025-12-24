const express = require('express');
const router = express.Router();
const db = require('../db');

// Get mindfulness data for a user (frontend expects /api/mindfulness/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockMindfulnessData = {
        weeklyData: [50, 45, 55, 40, 35, 30, 15],
        yesterdayMinutes: 18,
        message: 'Your calm time is growing'
    };
    
    res.json(mockMindfulnessData);
});

// Get mindfulness sessions
router.get('/sessions/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = 'SELECT * FROM mindfulness_sessions WHERE user_id = ? ORDER BY session_date DESC LIMIT 30';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching mindfulness sessions:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Create a new mindfulness session
router.post('/sessions', (req, res) => {
    const { userId, duration, type, notes } = req.body;
    
    if (!userId || !duration) {
        return res.status(400).json({ message: 'User ID and duration are required.' });
    }
    
    const query = 'INSERT INTO mindfulness_sessions (user_id, duration, type, notes, session_date) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [userId, duration, type || 'meditation', notes, new Date()], (err, result) => {
        if (err) {
            console.error('Error creating mindfulness session:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ sessionId: result.insertId, message: 'Mindfulness session created successfully' });
    });
});

module.exports = router;
