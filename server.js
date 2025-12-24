const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDb = require('./initDb');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/assessments', require('./routes/assessments'));
app.use('/api/tickets', require('./routes/tickets'));
const selfCareRoutes = require('./routes/selfcare');
const moodRoutes = require('./routes/mood');
const taskRoutes = require('./routes/tasks');
const sleepRoutes = require('./routes/sleep');
app.use('/api/selfcare', selfCareRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/statistics', require('./routes/statistics'));
app.use('/api/habit', require('./routes/habit'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/streak', require('./routes/streak'));
app.use('/api/journal', require('./routes/journal'));
app.use('/api/mindfulness', require('./routes/mindfulness'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/charts', require('./routes/charts'));

app.get('/', (req, res) => {
  res.send('Backend server is running.');
});

const PORT = process.env.PORT || 5000;

// 🔥 START SERVER ONLY AFTER DB INIT
(async () => {
  await initDb();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
