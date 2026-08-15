require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const cafeRoutes = require('./routes/cafes');
const drinkRoutes = require('./routes/drinks');
const ratingRoutes = require('./routes/ratings');
const commentRoutes = require('./routes/comments');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  // Serves the frontend when running locally with `npm start`. On Vercel,
  // files in /public are served automatically by the CDN and never reach
  // this function, so this line is simply unused there — harmless either way.
  app.use(express.static(path.join(__dirname, 'public')));

  app.use('/api/auth', authRoutes);
  app.use('/api/cafes', cafeRoutes);
  app.use('/api/drinks', drinkRoutes);
  app.use('/api', ratingRoutes);
  app.use('/api', commentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', userRoutes);

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found.' });
    }
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  return app;
}

module.exports = createApp;
