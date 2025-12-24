const express = require('express');
const router = express.Router();
const db = require('../db');

// Get activity statistics for a user (frontend expects /api/stats/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockStats = {
        habitsCompletion: 80,
        energyImprovement: 75,
        betterSleep: 65
    };
    
    res.json(mockStats);
});

// Get detailed statistics for a user
router.get('/detailed/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock detailed statistics
    const detailedStats = {
        weeklyStats: {
            mood: 4.2,
            sleep: 7.5,
            exercise: 3,
            meditation: 15
        },
        monthlyStats: {
            mood: 4.0,
            sleep: 7.2,
            exercise: 4,
            meditation: 12
        },
        achievements: [
            { type: 'streak', value: 5, description: '5 day self-care streak' },
            { type: 'goal', value: 3, description: '3 goals completed' }
        ]
    };
    
    res.json(detailedStats);
});

module.exports = router;
