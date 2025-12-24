const express = require('express');
const router = express.Router();
const db = require('../db');

// Get sleep data for dashboard (frontend expects /api/sleep/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockSleepData = [
        { date: '2024-01-20', bedTime: '22:30', wakeTime: '06:30', durationHrs: 8, quality: 'Good' },
        { date: '2024-01-19', bedTime: '23:00', wakeTime: '07:00', durationHrs: 8, quality: 'Good' },
        { date: '2024-01-18', bedTime: '22:00', wakeTime: '06:00', durationHrs: 8, quality: 'Great' }
    ];
    
    res.json(mockSleepData);
});

// Get sleep analysis for a user (average and quality)
router.get('/analysis/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for now - replace with actual database query when ready
    const sleepAnalysis = {
        averageHours: 7.5,
        quality: 4
    };
    
    res.json(sleepAnalysis);
});

// Get all sleep logs for a user
router.get('/logs/:userId', (req, res) => {
    const { userId } = req.params;
    const query = 'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY log_date DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching sleep logs:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Create a new sleep log
router.post('/logs', (req, res) => {
    const { userId, sleepDuration, sleepQuality, logDate, notes } = req.body;
    if (!userId || !sleepDuration || !sleepQuality || !logDate) {
        return res.status(400).json({ message: 'User ID, sleep duration, quality, and date are required.' });
    }

    const query = 'INSERT INTO sleep_logs (user_id, sleep_duration_hours, sleep_quality, log_date, notes) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [userId, sleepDuration, sleepQuality, logDate, notes], (err, result) => {
        if (err) {
            console.error('Error creating sleep log:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(201).json({ sleepLogId: result.insertId, message: 'Sleep log created successfully' });
    });
});

module.exports = router;
