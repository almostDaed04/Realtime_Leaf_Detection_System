require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth.routes');
const predictRoutes = require('./routes/predict.routes');
const historyRoutes = require('./routes/history.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Render, Cloudflare, Vercel)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Reflect request origin to allow Vercel, localhost, and other clients
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>LeafScan API — Online</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 16px; border: 1px solid #334155; text-align: center; max-width: 480px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
          h1 { color: #10b981; margin: 0 0 0.5rem; font-size: 1.8rem; }
          p { color: #94a3b8; line-height: 1.6; margin-bottom: 1.5rem; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 4px 12px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
          .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
          .btn:hover { background: #10b981; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● Backend Online</div>
          <h1>Leaf Identification System API Server 🌿</h1>
          <p>This is the backend REST API server. To use the full web app with leaf identification and scanning, visit the live frontend:</p>
          <a class="btn" href="https://realtime-leaf-detection-system.vercel.app">Go to LeafScan Web App →</a>
        </div>
      </body>
      </html>
    `);
  }

  res.json({
    name: 'Leaf Identification System API',
    status: 'online',
    version: '1.0.0',
    frontend: 'https://realtime-leaf-detection-system.vercel.app',
    health: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Unable to start backend: ${error.message}`);
    process.exitCode = 1;
  }
};

startServer();

module.exports = app;
