// routes/health.js
const router = require('express').Router();
const { supabase } = require('../db/client');

router.get('/', async (req, res) => {
  // Test DB connection
  const { error } = await supabase.from('article_cache').select('id').limit(1);
  res.json({
    status: 'ok',
    service: 'KnowFlow API',
    company: 'Maxwell Entities LLC',
    timestamp: new Date().toISOString(),
    database: error ? 'error' : 'connected',
    version: '1.0.0'
  });
});

module.exports = router;
