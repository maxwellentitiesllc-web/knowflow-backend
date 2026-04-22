// routes/pexels.js — Pexels proxy (hides API key from frontend)
// Maxwell Entities LLC
const router = require('express').Router();

// GET /api/pexels/videos?query=ocean
router.get('/videos', async (req, res) => {
  try {
    const q = (req.query.query || 'nature').toString().slice(0, 80);
    const r = await fetch(
      'https://api.pexels.com/videos/search?query=' + encodeURIComponent(q) +
      '&per_page=5&orientation=portrait&size=medium',
      { headers: { Authorization: process.env.PEXELS_KEY || '' } }
    );
    if (!r.ok) return res.status(502).json({ error: 'Pexels upstream error', status: r.status });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Pexels videos error:', err.message);
    res.status(500).json({ error: 'Could not fetch videos' });
  }
});

// GET /api/pexels/photos?query=sunrise
router.get('/photos', async (req, res) => {
  try {
    const q = (req.query.query || 'nature').toString().slice(0, 80);
    const r = await fetch(
      'https://api.pexels.com/v1/search?query=' + encodeURIComponent(q) +
      '&per_page=3&orientation=landscape',
      { headers: { Authorization: process.env.PEXELS_KEY || '' } }
    );
    if (!r.ok) return res.status(502).json({ error: 'Pexels upstream error', status: r.status });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Pexels photos error:', err.message);
    res.status(500).json({ error: 'Could not fetch photos' });
  }
});

module.exports = router;
