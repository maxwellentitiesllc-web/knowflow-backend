// routes/users.js
const router = require('express').Router();
const { supabaseAdmin } = require('../db/client');

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/:id — update preferences
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['name', 'daily_time_minutes', 'self_rating', 'preferred_topics',
                     'notifications_enabled', 'family_safe_mode'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/streak — update daily streak
router.post('/:id/streak', async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users').select('streak_days, last_active_date').eq('id', req.params.id).single();

    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().toISOString().split('T')[0];
    const last = user.last_active_date;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    let newStreak = 1;
    if (last === yesterday) newStreak = (user.streak_days || 0) + 1;
    else if (last === today) newStreak = user.streak_days;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ streak_days: newStreak, last_active_date: today,
                total_articles_read: user.total_articles_read + 1 })
      .eq('id', req.params.id).select().single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ streak: newStreak, user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
