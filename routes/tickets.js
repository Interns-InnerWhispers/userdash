const express = require('express');
const db = require('../db');
const router = express.Router();

// POST /api/tickets - Create a new ticket
router.post('/', async (req, res) => {
    const { userId, subject, description } = req.body;

    if (!userId || !subject || !description) {
        return res.status(400).json({ message: 'User ID, subject, and description are required.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO tickets (user_id, subject, description) VALUES (?, ?, ?)',
            [userId, subject, description]
        );
        res.status(201).json({ message: 'Ticket created successfully.', ticketId: result.insertId });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error while creating ticket.' });
    }
});

// GET /api/tickets/:userId - Get all tickets for a user
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [tickets] = await db.query('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC', [userId]);
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error while fetching tickets.' });
    }
});

module.exports = router;
