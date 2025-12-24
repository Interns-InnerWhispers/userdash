const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/selfcare - Get self-care dashboard data
router.get('/', async (req, res) => {
    try {
        const userId = req.user?.id || 1; // Default to user 1 for now, should come from auth
        
        // Get self-care streak (consecutive days with activities)
        const streakQuery = `
            WITH consecutive_days AS (
                SELECT DISTINCT DATE(completed_at) as activity_date
                FROM user_self_care_log
                WHERE user_id = ? AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                ORDER BY activity_date DESC
            ),
            streak_groups AS (
                SELECT 
                    activity_date,
                    DATE_SUB(activity_date, INTERVAL ROW_NUMBER() OVER (ORDER BY activity_date DESC) DAY) as group_date
                FROM consecutive_days
            )
            SELECT COUNT(*) as selfCareStreak
            FROM streak_groups
            WHERE group_date = (SELECT group_date FROM streak_groups LIMIT 1)
        `;
        
        // Get mindfulness minutes in last 7 days
        const mindfulnessQuery = `
            SELECT COALESCE(SUM(duration_seconds), 0) as totalSeconds
            FROM mindfulness_sessions
            WHERE user_id = ? 
            AND completed = TRUE 
            AND session_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        `;
        
        // Get journal entries count
        const journalQuery = `
            SELECT COUNT(*) as journalEntries
            FROM journal_entries
            WHERE user_id = ?
        `;
        
        // Get goals progress (completed tasks percentage)
        const goalsQuery = `
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE ROUND((SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 0)
                END as goalsProgress
            FROM tasks
            WHERE user_id = ?
        `;
        
        // Get sleep tracker data (average hours and quality from last 7 days)
        const sleepQuery = `
            SELECT 
                COALESCE(AVG(sleep_duration_hours), 0) as averageHours,
                COALESCE(AVG(sleep_quality), 0) as quality
            FROM sleep_logs
            WHERE user_id = ? 
            AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        `;
        
        // Execute all queries
        const [streakResult] = await db.query(streakQuery, [userId]);
        const [mindfulnessResult] = await db.query(mindfulnessQuery, [userId]);
        const [journalResult] = await db.query(journalQuery, [userId]);
        const [goalsResult] = await db.query(goalsQuery, [userId]);
        const [sleepResult] = await db.query(sleepQuery, [userId]);
        
        const selfCareData = {
            selfCareStreak: streakResult[0]?.selfCareStreak || 0,
            mindfulnessMinutes: Math.round((mindfulnessResult[0]?.totalSeconds || 0) / 60),
            journalEntries: journalResult[0]?.journalEntries || 0,
            goalsProgress: goalsResult[0]?.goalsProgress || 0,
            sleepTracker: {
                averageHours: parseFloat(sleepResult[0]?.averageHours || 0).toFixed(1),
                quality: Math.round(sleepResult[0]?.quality || 0)
            }
        };
        
        res.status(200).json(selfCareData);
    } catch (error) {
        console.error('Error fetching self-care dashboard data:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard data.' });
    }
});

// GET /api/selfcare/activities - Get all self-care activities
router.get('/activities', async (req, res) => {
    try {
        const [activities] = await db.query('SELECT * FROM self_care_activities ORDER BY category, name');
        res.status(200).json(activities);
    } catch (error) {
        console.error('Error fetching self-care activities:', error);
        res.status(500).json({ message: 'Server error while fetching activities.' });
    }
});

// POST /api/selfcare/log - Log a completed activity
router.post('/log', async (req, res) => {
    const { userId, activityId, notes } = req.body;

    if (!userId || !activityId) {
        return res.status(400).json({ message: 'User ID and Activity ID are required.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO user_self_care_log (user_id, activity_id, notes) VALUES (?, ?, ?)',
            [userId, activityId, notes]
        );
        res.status(201).json({ message: 'Activity logged successfully.', logId: result.insertId });
    } catch (error) {
        console.error('Error logging self-care activity:', error);
        res.status(500).json({ message: 'Server error while logging activity.' });
    }
});

// GET /api/selfcare/log/:userId - Get activity log for a user
router.get('/log/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [logs] = await db.query(
            `SELECT sca.name, sca.category, uscl.completed_at, uscl.notes 
             FROM user_self_care_log uscl
             JOIN self_care_activities sca ON uscl.activity_id = sca.id
             WHERE uscl.user_id = ?
             ORDER BY uscl.completed_at DESC`,
            [userId]
        );
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error fetching self-care log:', error);
        res.status(500).json({ message: 'Server error while fetching log.' });
    }
});

// AI Self Letters APIs

// GET /api/selfcare/ai-letters/:userId - Get all AI letters for a user
router.get('/ai-letters/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [letters] = await db.query(
            'SELECT * FROM ai_self_letters WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        res.status(200).json(letters);
    } catch (error) {
        console.error('Error fetching AI letters:', error);
        res.status(500).json({ message: 'Server error while fetching AI letters.' });
    }
});

// POST /api/selfcare/ai-letters - Save a new AI letter
router.post('/ai-letters', async (req, res) => {
    const { user_id, title, content, emotion, self_type, situation } = req.body;
    
    if (!user_id || !content) {
        return res.status(400).json({ message: 'User ID and content are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO ai_self_letters (user_id, title, content, emotion, self_type, situation) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, title || 'Letter to Myself', content, emotion, self_type, situation]
        );
        
        res.status(201).json({ 
            message: 'AI letter saved successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error saving AI letter:', error);
        res.status(500).json({ message: 'Server error while saving AI letter.' });
    }
});

// DELETE /api/selfcare/ai-letters/:id - Delete an AI letter
router.delete('/ai-letters/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('DELETE FROM ai_self_letters WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'AI letter not found.' });
        }
        
        res.status(200).json({ message: 'AI letter deleted successfully.' });
    } catch (error) {
        console.error('Error deleting AI letter:', error);
        res.status(500).json({ message: 'Server error while deleting AI letter.' });
    }
});

// Journal APIs

// GET /api/selfcare/journal/:userId - Get all journal entries for a user
router.get('/journal/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [entries] = await db.query(
            'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        res.status(200).json(entries);
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        res.status(500).json({ message: 'Server error while fetching journal entries.' });
    }
});

// POST /api/selfcare/journal - Save a new journal entry
router.post('/journal', async (req, res) => {
    const { user_id, title, content, mood, tags, is_favorite, reminder_time, reminder_date } = req.body;
    
    if (!user_id || !content) {
        return res.status(400).json({ message: 'User ID and content are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO journal_entries (user_id, title, content, mood, tags, is_favorite, reminder_time, reminder_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, title, content, mood, tags, is_favorite || false, reminder_time, reminder_date]
        );
        
        res.status(201).json({ 
            message: 'Journal entry saved successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error saving journal entry:', error);
        res.status(500).json({ message: 'Server error while saving journal entry.' });
    }
});

// PUT /api/selfcare/journal/:id - Update a journal entry
router.put('/journal/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, mood, tags, is_favorite, reminder_time, reminder_date } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE journal_entries SET title = ?, content = ?, mood = ?, tags = ?, is_favorite = ?, reminder_time = ?, reminder_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [title, content, mood, tags, is_favorite, reminder_time, reminder_date, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Journal entry not found.' });
        }
        
        res.status(200).json({ message: 'Journal entry updated successfully.' });
    } catch (error) {
        console.error('Error updating journal entry:', error);
        res.status(500).json({ message: 'Server error while updating journal entry.' });
    }
});

// DELETE /api/selfcare/journal/:id - Delete a journal entry
router.delete('/journal/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('DELETE FROM journal_entries WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Journal entry not found.' });
        }
        
        res.status(200).json({ message: 'Journal entry deleted successfully.' });
    } catch (error) {
        console.error('Error deleting journal entry:', error);
        res.status(500).json({ message: 'Server error while deleting journal entry.' });
    }
});

// Habit Tracker APIs

// GET /api/selfcare/habits/:userId - Get all habits for a user
router.get('/habits/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [habits] = await db.query(
            'SELECT * FROM habits WHERE user_id = ? AND is_active = TRUE ORDER BY created_at ASC',
            [userId]
        );
        
        res.status(200).json(habits);
    } catch (error) {
        console.error('Error fetching habits:', error);
        res.status(500).json({ message: 'Server error while fetching habits.' });
    }
});

// POST /api/selfcare/habits - Create a new habit
router.post('/habits', async (req, res) => {
    const { user_id, name, description, category, target_frequency, frequency_type, color, icon } = req.body;
    
    if (!user_id || !name) {
        return res.status(400).json({ message: 'User ID and habit name are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO habits (user_id, name, description, category, target_frequency, frequency_type, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, name, description, category, target_frequency || 1, frequency_type || 'daily', color || '#007bff', icon || 'star']
        );
        
        res.status(201).json({ 
            message: 'Habit created successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating habit:', error);
        res.status(500).json({ message: 'Server error while creating habit.' });
    }
});

// POST /api/selfcare/habit-completions - Log a habit completion
router.post('/habit-completions', async (req, res) => {
    const { habit_id, user_id, completion_date, notes } = req.body;
    
    if (!habit_id || !user_id) {
        return res.status(400).json({ message: 'Habit ID and user ID are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO habit_completions (habit_id, user_id, completion_date, notes) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE notes = VALUES(notes), completed_at = CURRENT_TIMESTAMP',
            [habit_id, user_id, completion_date || new Date().toISOString().split('T')[0], notes]
        );
        
        res.status(201).json({ 
            message: 'Habit completion logged successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error logging habit completion:', error);
        res.status(500).json({ message: 'Server error while logging habit completion.' });
    }
});

// GET /api/selfcare/habit-completions/:userId/:date - Get habit completions for a specific date
router.get('/habit-completions/:userId/:date', async (req, res) => {
    const { userId, date } = req.params;
    
    try {
        const [completions] = await db.query(
            'SELECT hc.*, h.name as habit_name FROM habit_completions hc JOIN habits h ON hc.habit_id = h.id WHERE hc.user_id = ? AND hc.completion_date = ?',
            [userId, date]
        );
        
        res.status(200).json(completions);
    } catch (error) {
        console.error('Error fetching habit completions:', error);
        res.status(500).json({ message: 'Server error while fetching habit completions.' });
    }
});

// Mindfulness APIs

// GET /api/selfcare/mindfulness/:userId - Get all mindfulness sessions for a user
router.get('/mindfulness/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [sessions] = await db.query(
            'SELECT * FROM mindfulness_sessions WHERE user_id = ? ORDER BY session_date DESC',
            [userId]
        );
        
        res.status(200).json(sessions);
    } catch (error) {
        console.error('Error fetching mindfulness sessions:', error);
        res.status(500).json({ message: 'Server error while fetching mindfulness sessions.' });
    }
});

// POST /api/selfcare/mindfulness - Log a mindfulness session
router.post('/mindfulness', async (req, res) => {
    const { user_id, technique, duration_seconds, completed, notes } = req.body;
    
    if (!user_id || !technique || !duration_seconds) {
        return res.status(400).json({ message: 'User ID, technique, and duration are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO mindfulness_sessions (user_id, technique, duration_seconds, completed, notes) VALUES (?, ?, ?, ?, ?)',
            [user_id, technique, duration_seconds, completed !== false, notes]
        );
        
        res.status(201).json({ 
            message: 'Mindfulness session logged successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error logging mindfulness session:', error);
        res.status(500).json({ message: 'Server error while logging mindfulness session.' });
    }
});

// Self Affirmations APIs

// GET /api/selfcare/affirmations/:userId - Get all affirmations for a user
router.get('/affirmations/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [affirmations] = await db.query(
            'SELECT * FROM self_affirmations WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        // Separate custom and favorite affirmations as expected by frontend
        const custom_affirmations = affirmations
            .filter(aff => !aff.is_favorite)
            .map(aff => aff.affirmation_text);
        const favorite_affirmations = affirmations
            .filter(aff => aff.is_favorite)
            .map(aff => aff.affirmation_text);
        
        // Calculate daily statistics
        const today = new Date().toDateString();
        const todaysAffirmations = affirmations.filter(aff => 
            new Date(aff.created_at).toDateString() === today
        );
        
        // Return additional fields needed by frontend
        res.status(200).json({
            custom_affirmations,
            favorite_affirmations,
            daily_count: todaysAffirmations.length, // Count of affirmations viewed today
            viewed_today: todaysAffirmations.map(aff => aff.affirmation_text), // Today's viewed affirmations
            last_visit: today // Return current date as last visit
        });
    } catch (error) {
        console.error('Error fetching affirmations:', error);
        res.status(500).json({ message: 'Server error while fetching affirmations.' });
    }
});

// PUT /api/selfcare/affirmations/:userId - Save user affirmations data
router.put('/affirmations/:userId', async (req, res) => {
    const { userId } = req.params;
    const { custom_affirmations, favorite_affirmations, daily_count, viewed_today, last_visit } = req.body;
    
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    
    try {
        // Delete existing affirmations for this user
        await db.query('DELETE FROM self_affirmations WHERE user_id = ?', [userId]);
        
        // Insert custom affirmations
        if (custom_affirmations && custom_affirmations.length > 0) {
            for (const affirmation of custom_affirmations) {
                await db.query(
                    'INSERT INTO self_affirmations (user_id, affirmation_text, category, is_favorite) VALUES (?, ?, ?, ?)',
                    [userId, affirmation, 'custom', false]
                );
            }
        }
        
        // Insert favorite affirmations
        if (favorite_affirmations && favorite_affirmations.length > 0) {
            for (const affirmation of favorite_affirmations) {
                await db.query(
                    'INSERT INTO self_affirmations (user_id, affirmation_text, category, is_favorite) VALUES (?, ?, ?, ?)',
                    [userId, affirmation, 'favorite', true]
                );
            }
        }
        
        res.status(200).json({ 
            message: 'Affirmations saved successfully.'
        });
    } catch (error) {
        console.error('Error saving affirmations:', error);
        res.status(500).json({ message: 'Server error while saving affirmations.' });
    }
});

// DELETE /api/selfcare/affirmations/:id - Delete an affirmation
router.delete('/affirmations/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('DELETE FROM self_affirmations WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Affirmation not found.' });
        }
        
        res.status(200).json({ message: 'Affirmation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting affirmation:', error);
        res.status(500).json({ message: 'Server error while deleting affirmation.' });
    }
});

// Self Letters APIs

// GET /api/selfcare/self-letters/:userId - Get all self letters for a user
router.get('/self-letters/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [letters] = await db.query(
            'SELECT * FROM self_letters WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        res.status(200).json(letters);
    } catch (error) {
        console.error('Error fetching self letters:', error);
        res.status(500).json({ message: 'Server error while fetching self letters.' });
    }
});

// POST /api/selfcare/self-letters - Save a new self letter
router.post('/self-letters', async (req, res) => {
    const { user_id, letter_type, theme, subject, content, mood, is_private } = req.body;
    
    if (!user_id || !content) {
        return res.status(400).json({ message: 'User ID and content are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO self_letters (user_id, letter_type, theme, subject, content, mood, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, letter_type, theme, subject, content, mood, is_private !== false]
        );
        
        res.status(201).json({ 
            message: 'Self letter saved successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error saving self letter:', error);
        res.status(500).json({ message: 'Server error while saving self letter.' });
    }
});

// PUT /api/selfcare/self-letters/:id - Update a self letter
router.put('/self-letters/:id', async (req, res) => {
    const { id } = req.params;
    const { letter_type, theme, subject, content, mood, is_private } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE self_letters SET letter_type = ?, theme = ?, subject = ?, content = ?, mood = ?, is_private = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [letter_type, theme, subject, content, mood, is_private, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Self letter not found.' });
        }
        
        res.status(200).json({ message: 'Self letter updated successfully.' });
    } catch (error) {
        console.error('Error updating self letter:', error);
        res.status(500).json({ message: 'Server error while updating self letter.' });
    }
});

// DELETE /api/selfcare/self-letters/:id - Delete a self letter
router.delete('/self-letters/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('DELETE FROM self_letters WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Self letter not found.' });
        }
        
        res.status(200).json({ message: 'Self letter deleted successfully.' });
    } catch (error) {
        console.error('Error deleting self letter:', error);
        res.status(500).json({ message: 'Server error while deleting self letter.' });
    }
});

// Coping Strategies APIs

// GET /api/selfcare/coping-strategies/:userId - Get all coping strategies for a user
router.get('/coping-strategies/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [strategies] = await db.query(
            'SELECT * FROM coping_strategies WHERE user_id = ? ORDER BY used_at DESC',
            [userId]
        );
        
        res.status(200).json(strategies);
    } catch (error) {
        console.error('Error fetching coping strategies:', error);
        res.status(500).json({ message: 'Server error while fetching coping strategies.' });
    }
});

// POST /api/selfcare/coping-strategies - Log a coping strategy usage
router.post('/coping-strategies', async (req, res) => {
    const { user_id, strategy_type, strategy_name, effectiveness_rating, notes } = req.body;
    
    if (!user_id || !strategy_type || !strategy_name) {
        return res.status(400).json({ message: 'User ID, strategy type, and strategy name are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO coping_strategies (user_id, strategy_type, strategy_name, effectiveness_rating, notes) VALUES (?, ?, ?, ?, ?)',
            [user_id, strategy_type, strategy_name, effectiveness_rating || 0, notes]
        );
        
        res.status(201).json({ 
            message: 'Coping strategy logged successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error logging coping strategy:', error);
        res.status(500).json({ message: 'Server error while logging coping strategy.' });
    }
});

// Goals endpoints for habit tracker
// GET /api/selfcare/goals/:userId - Get user's goals (habits)
router.get('/goals/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [habits] = await db.query(
            'SELECT * FROM habits WHERE user_id = ? AND is_active = TRUE ORDER BY created_at DESC',
            [userId]
        );
        
        // Get completions for each habit
        const [completions] = await db.query(
            'SELECT habit_id, completion_date, completed_at FROM habit_completions WHERE user_id = ?',
            [userId]
        );
        
        // Format the data
        const formattedHabits = habits.map(habit => {
            const habitCompletions = completions.filter(c => c.habit_id === habit.id);
            const completionsMap = {};
            habitCompletions.forEach(completion => {
                completionsMap[completion.completion_date] = true;
            });
            
            return {
                id: habit.id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                target_frequency: habit.target_frequency,
                frequency_type: habit.frequency_type,
                color: habit.color,
                icon: habit.icon,
                is_active: habit.is_active,
                created_at: habit.created_at,
                completions: completionsMap
            };
        });
        
        res.status(200).json(formattedHabits);
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ message: 'Server error while fetching goals.' });
    }
});

// POST /api/selfcare/goals - Create a new goal (habit)
router.post('/goals', async (req, res) => {
    const { userId, name, description, category, target_frequency, frequency_type, color, icon } = req.body;
    
    if (!userId || !name) {
        return res.status(400).json({ message: 'User ID and name are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO habits (user_id, name, description, category, target_frequency, frequency_type, color, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, name, description || null, category || null, target_frequency || 1, frequency_type || 'daily', color || '#007bff', icon || 'star']
        );
        
        res.status(201).json({ 
            message: 'Goal created successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ message: 'Server error while creating goal.' });
    }
});

// PUT /api/selfcare/goals/:id - Update a goal
router.put('/goals/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, category, target_frequency, frequency_type, color, icon, is_active } = req.body;
    
    try {
        const [result] = await db.query(
            'UPDATE habits SET name = ?, description = ?, category = ?, target_frequency = ?, frequency_type = ?, color = ?, icon = ?, is_active = ? WHERE id = ?',
            [name, description, category, target_frequency, frequency_type, color, icon, is_active !== false, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Goal not found.' });
        }
        
        res.status(200).json({ message: 'Goal updated successfully.' });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ message: 'Server error while updating goal.' });
    }
});

// DELETE /api/selfcare/goals/:id - Delete a goal
router.delete('/goals/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const [result] = await db.query('DELETE FROM habits WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Goal not found.' });
        }
        
        res.status(200).json({ message: 'Goal deleted successfully.' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ message: 'Server error while deleting goal.' });
    }
});

// POST /api/selfcare/goals/:goalId/complete - Mark a goal as complete for a date
router.post('/goals/:goalId/complete', async (req, res) => {
    const { goalId } = req.params;
    const { userId, completion_date } = req.body;
    
    if (!userId || !completion_date) {
        return res.status(400).json({ message: 'User ID and completion date are required.' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO habit_completions (habit_id, user_id, completion_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP',
            [goalId, userId, completion_date]
        );
        
        res.status(201).json({ 
            message: 'Goal completion logged successfully.',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error logging goal completion:', error);
        res.status(500).json({ message: 'Server error while logging goal completion.' });
    }
});

module.exports = router;
