const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/statistics/:userId
// Fetches user statistics including mindful days, journals, sessions, and profile completion
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        console.log('Fetching statistics for user:', userId);
        
        // Get mindful days (count of mood entries)
        const [mindfulDaysResult] = await db.query(
            'SELECT COUNT(DISTINCT DATE(entry_date)) as mindful_days FROM mood WHERE user_id = ?',
            [userId]
        );
        console.log('Mindful days query result:', mindfulDaysResult);

        // Get journals written (count of journal entries - assuming mood entries with notes)
        const [journalsResult] = await db.query(
            'SELECT COUNT(*) as journals_written FROM mood WHERE user_id = ? AND notes IS NOT NULL AND notes != ""',
            [userId]
        );
        console.log('Journals query result:', journalsResult);

        // Get sessions completed (count of self-care activities completed)
        const [sessionsResult] = await db.query(
            'SELECT COUNT(*) as sessions_completed FROM user_self_care_log WHERE user_id = ?',
            [userId]
        );
        console.log('Sessions query result:', sessionsResult);

        // Calculate profile completion
        const [userResult] = await db.query(
            'SELECT first_name, last_name, email, date_of_birth, gender, phone, emergency_contact, address, country_timezone, languages, communication_preference, profile_visibility FROM users WHERE id = ?',
            [userId]
        );
        console.log('User profile query result:', userResult);

        let profileCompletion = 0;
        if (userResult.length > 0) {
            const user = userResult[0];
            const fields = ['first_name', 'last_name', 'email', 'date_of_birth', 'gender', 'phone', 'emergency_contact', 'address', 'country_timezone', 'languages', 'communication_preference', 'profile_visibility'];
            const filledFields = fields.filter(field => user[field] && user[field] !== '' && user[field] !== null).length;
            profileCompletion = Math.round((filledFields / fields.length) * 100);
        }
        console.log('Profile completion calculated:', profileCompletion);

        const statistics = {
            mindful_days: mindfulDaysResult[0]?.mindful_days || 0,
            journals_written: journalsResult[0]?.journals_written || 0,
            sessions_completed: sessionsResult[0]?.sessions_completed || 0,
            profile_completion: profileCompletion
        };

        console.log('Final statistics:', statistics);
        res.status(200).json(statistics);
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({ message: 'Server error while fetching user statistics.' });
    }
});

module.exports = router;
