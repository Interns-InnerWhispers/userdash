const fs = require('fs');
const path = require('path');
const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/assessments
// Gets a list of all available assessments
router.get('/', (req, res) => {
    const assessmentsDir = path.join(__dirname, '..', '..', 'assessments');

    fs.readdir(assessmentsDir, (err, files) => {
        if (err) {
            console.error('Could not list the directory.', err);
            return res.status(500).json({ message: 'Server error while fetching assessments.' });
        }

        const htmlFiles = files.filter(file => path.extname(file).toLowerCase() === '.html');
        
        const assessments = htmlFiles.map(file => {
            // Create a more descriptive object for the frontend
            return {
                fileName: file,
                name: path.basename(file, '.html').replace(/-/g, ' ')
            };
        });

        res.status(200).json(assessments);
    });
});

// POST /api/assessments/scores
// Records a new assessment score for a user
router.post('/scores', async (req, res) => {
    const { userId, assessmentId, score } = req.body;

    if (!userId || !assessmentId || score === undefined) {
        return res.status(400).json({ message: 'User ID, Assessment ID, and score are required.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO assessment_scores (user_id, assessment_id, score) VALUES (?, ?, ?)',
            [userId, assessmentId, score]
        );
        res.status(201).json({ message: 'Assessment score saved successfully.', scoreId: result.insertId });
    } catch (error) {
        console.error('Error saving assessment score:', error);
        res.status(500).json({ message: 'Server error while saving score.' });
    }
});

// GET /api/assessments/scores/:userId
// Gets all assessment scores for a specific user
router.get('/scores/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const [scores] = await db.query(
            `SELECT a.name, a.description, asc.score, asc.taken_at 
             FROM assessment_scores asc
             JOIN assessments a ON asc.assessment_id = a.id
             WHERE asc.user_id = ?
             ORDER BY asc.taken_at DESC`,
            [userId]
        );

        if (scores.length === 0) {
            return res.status(404).json({ message: 'No scores found for this user.' });
        }

        res.status(200).json(scores);
    } catch (error) {
        console.error('Error fetching assessment scores:', error);
        res.status(500).json({ message: 'Server error while fetching scores.' });
    }
});

module.exports = router;
