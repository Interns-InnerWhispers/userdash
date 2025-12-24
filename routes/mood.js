const express = require('express');
const router = express.Router();
const db = require('../db');

// Log a mood entry
router.post('/log', (req, res) => {
    const { userId, moodRating, notes } = req.body;

    if (!userId || !moodRating) {
        return res.status(400).json({ message: 'User ID and mood rating are required.' });
    }

    const query = 'INSERT INTO mood (user_id, mood_rating, notes) VALUES (?, ?, ?)';
    db.query(query, [userId, moodRating, notes], (err, result) => {
        if (err) {
            console.error('Error logging mood:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ moodLogId: result.insertId, message: 'Mood logged successfully' });
    });
});

// Get mood history for a user
router.get('/log/:userId', (req, res) => {
    const { userId } = req.params;

    const query = 'SELECT * FROM mood WHERE user_id = ? ORDER BY entry_date DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching mood history:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Get mood data for dashboard (frontend expects /api/mood/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockMoodData = [
        { day: 'Mon', mood: 2, emoji: '😐' },
        { day: 'Tue', mood: 3, emoji: '🙂' },
        { day: 'Wed', mood: 4, emoji: '😄' },
        { day: 'Thu', mood: 3, emoji: '🙂' },
        { day: 'Fri', mood: 5, emoji: '🤩' },
        { day: 'Sat', mood: 4, emoji: '😄' },
        { day: 'Sun', mood: 5, emoji: '🤩' }
    ];
    
    res.json(mockMoodData);
});

// Get mood data for the last 7 days
router.get('/week/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockMoodData = [
        { day: '2025-12-08', moodLevel: 4 },
        { day: '2025-12-09', moodLevel: 3 },
        { day: '2025-12-10', moodLevel: 5 },
        { day: '2025-12-11', moodLevel: 2 },
        { day: '2025-12-12', moodLevel: 4 },
        { day: '2025-12-13', moodLevel: 3 },
        { day: '2025-12-14', moodLevel: 4 }
    ];
    
    res.json(mockMoodData);
});

module.exports = router;
