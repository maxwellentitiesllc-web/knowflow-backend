// server.js — KnowFlow API Server
// Maxwell Entities LLC
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set("trust proxy", 1); // Required for Render/Heroku deployments
const PORT = process.env.PORT || 3001;

// ── Security middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// CORS — only allow your frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5173',
    /\.vercel\.app$/  // allow all Vercel preview URLs
  ],
  credentials: true
}));

// Rate limiting — prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// Stricter limit for AI endpoints (they cost money)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'AI request limit reached. Please wait a moment.' }
});
app.use('/api/ai/', aiLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/health',    require('./routes/health'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/articles',  require('./routes/articles'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/assessment',require('./routes/assessment'));
app.use('/api/ads',       require('./routes/ads'));
app.use('/api/tts',        require('./routes/tts'));

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Error handler ─────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An error occurred. Please try again.'
      : err.message
  });
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 KnowFlow API running on http://localhost:${PORT}`);
  console.log(`📡 Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\nRoutes available:`);
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/auth/signup`);
  console.log(`  POST /api/auth/login`);
  console.log(`  GET  /api/articles/feed`);
  console.log(`  POST /api/ai/search`);
  console.log(`  POST /api/ai/digest`);
  console.log(`  POST /api/ai/chat`);
  console.log(`  POST /api/assessment/submit`);
  console.log(`  POST /api/ads/enquiry\n`);
});

module.exports = app;
