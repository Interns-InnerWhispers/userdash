const express = require('express');
const router = express.Router();
const db = require('../db');

// Get goals for a user (frontend expects /api/goals/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockGoals = [
        { id: 1, title: 'Goal 1', progress: 70 },
        { id: 2, title: 'Goal 2', progress: 55 }
    ];
    
    res.json(mockGoals);
});

// Get detailed goals with milestones
router.get('/detailed/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = 'SELECT * FROM goals WHERE user_id = ? ORDER BY created_date DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching goals:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Create a new goal
router.post('/', (req, res) => {
    const { userId, title, description, targetDate, milestones } = req.body;
    
    if (!userId || !title) {
        return res.status(400).json({ message: 'User ID and title are required.' });
    }
    
    const query = 'INSERT INTO goals (user_id, title, description, target_date, created_date) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [userId, title, description, targetDate, new Date()], (err, result) => {
        if (err) {
            console.error('Error creating goal:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ goalId: result.insertId, message: 'Goal created successfully' });
    });
});

// Update goal progress
router.put('/:goalId', (req, res) => {
    const { goalId } = req.params;
    const { progress, status } = req.body;
    
    const query = 'UPDATE goals SET progress = ?, status = ?, updated_date = ? WHERE id = ?';
    db.query(query, [progress, status, new Date(), goalId], (err, result) => {
        if (err) {
            console.error('Error updating goal:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Goal not found' });
        }
        res.json({ message: 'Goal updated successfully' });
    });
});

module.exports = router;
