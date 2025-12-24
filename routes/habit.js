const express = require('express');
const router = express.Router();

// Mock data or replace with your DB logic
const habitCompletionData = {
  1: [
    { habitName: "Morning Routine", completionPercent: 80 },
    { habitName: "Exercise", completionPercent: 60 },
    { habitName: "Reading", completionPercent: 90 }
  ],
  2: [
    { habitName: "Meditation", completionPercent: 70 },
    { habitName: "Workout", completionPercent: 50 }
  ]
};

router.get('/habit-completion/:userId', (req, res) => {
  const userId = req.params.userId;
  const data = habitCompletionData[userId] || [];
  res.json(data);
});

module.exports = router;