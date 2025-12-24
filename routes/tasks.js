const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all tasks for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT * FROM tasks 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

    const [rows] = await db.query(query, [userId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { userId, title, description, dueDate } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ message: 'User ID and title are required.' });
    }

    const query = `
      INSERT INTO tasks (user_id, title, description, due_date)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [
      userId,
      title,
      description,
      dueDate
    ]);

    res.status(201).json({
      taskId: result.insertId,
      message: 'Task created successfully'
    });
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update a task
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;

    const query = `
      UPDATE tasks 
      SET completed = ? 
      WHERE id = ?
    `;

    const [result] = await db.query(query, [completed, taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a task
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const query = 'DELETE FROM tasks WHERE id = ?';
    const [result] = await db.query(query, [taskId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
