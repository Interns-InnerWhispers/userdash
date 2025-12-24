const express = require('express');
const router = express.Router();
const db = require('../db');

// Get charts data for a user (frontend expects /api/charts/{userId})
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Mock data for testing - replace with actual database query when ready
    const mockChartsData = {
        // Activity trends chart
        activityTrends: [
            { date: '2024-01-15', value: 75 },
            { date: '2024-01-16', value: 82 },
            { date: '2024-01-17', value: 68 },
            { date: '2024-01-18', value: 90 },
            { date: '2024-01-19', value: 85 },
            { date: '2024-01-20', value: 78 }
        ],
        // Sleep quality chart
        sleepQuality: [
            { date: '2024-01-15', quality: 4 },
            { date: '2024-01-16', quality: 3 },
            { date: '2024-01-17', quality: 5 },
            { date: '2024-01-18', quality: 4 },
            { date: '2024-01-19', quality: 3 },
            { date: '2024-01-20', quality: 4 }
        ],
        // Mood distribution chart
        moodDistribution: [
            { mood: 'Happy', count: 12 },
            { mood: 'Neutral', count: 8 },
            { mood: 'Sad', count: 3 },
            { mood: 'Excited', count: 15 }
        ],
        // Weekly activity heatmap
        weeklyActivity: [
            { day: 'Mon', activities: 3 },
            { day: 'Tue', activities: 2 },
            { day: 'Wed', activities: 4 },
            { day: 'Thu', activities: 1 },
            { day: 'Fri', activities: 3 },
            { day: 'Sat', activities: 5 },
            { day: 'Sun', activities: 2 }
        ]
    };
    
    res.json(mockChartsData);
});

// Get specific chart data
router.get('/:userId/:chartType', (req, res) => {
    const { userId, chartType } = req.params;
    
    let chartData;
    switch (chartType) {
        case 'activity':
            chartData = {
                type: 'line',
                data: [
                    { date: '2024-01-15', value: 75 },
                    { date: '2024-01-16', value: 82 },
                    { date: '2024-01-17', value: 68 }
                ]
            };
            break;
        case 'sleep':
            chartData = {
                type: 'bar',
                data: [
                    { date: '2024-01-15', hours: 7.5 },
                    { date: '2024-01-16', hours: 8.2 },
                    { date: '2024-01-17', hours: 6.8 }
                ]
            };
            break;
        case 'mood':
            chartData = {
                type: 'pie',
                data: [
                    { category: 'Happy', value: 45 },
                    { category: 'Neutral', value: 30 },
                    { category: 'Sad', value: 10 },
                    { category: 'Excited', value: 15 }
                ]
            };
            break;
        default:
            return res.status(404).json({ message: 'Chart type not found' });
    }
    
    res.json(chartData);
});

module.exports = router;
