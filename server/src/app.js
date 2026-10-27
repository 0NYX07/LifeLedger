const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const obligationRoutes = require('./routes/obligation.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const activityRoutes = require('./routes/activity.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Allowed origins
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const allowedOrigins = clientOrigin.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'LifeLedger API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount application API routes
app.use('/api/auth', authRoutes);
app.use('/api/obligations', obligationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on LifeLedger API`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
