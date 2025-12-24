const express = require('express');
const router = express.Router();
const db = require('../db');

// Get journal entries for a user (frontend expects /api/journal/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockJournalData = [1, 1, 0, 1, 0.7, 0.5, 1];
    
    res.json(mockJournalData);
});

// Get detailed journal entries
router.get('/entries/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = 'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC LIMIT 30';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching journal entries:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Create a new journal entry
router.post('/entries', (req, res) => {
    const { userId, content, mood, tags } = req.body;
    
    if (!userId || !content) {
        return res.status(400).json({ message: 'User ID and content are required.' });
    }
    
    const query = 'INSERT INTO journal_entries (user_id, content, mood, tags, entry_date) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [userId, content, mood, tags, new Date()], (err, result) => {
        if (err) {
            console.error('Error creating journal entry:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ entryId: result.insertId, message: 'Journal entry created successfully' });
    });
});

module.exports = router;
