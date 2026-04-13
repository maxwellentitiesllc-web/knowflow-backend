// routes/auth.js — KnowFlow Authentication
const router = require('express').Router();
const { supabase, supabaseAdmin } = require('../db/client');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.json({ error: 'Email and password required' });
    if (password.length < 6) return res.json({ error: 'Password must be at least 6 characters' });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || '' },
        emailRedirectTo: process.env.FRONTEND_URL || 'https://timely-buttercream-148233.netlify.app'
      }
    });
    if (error) return res.json({ error: error.message });

    // Create profile row if user created
    if (data.user) {
      try {
        await supabaseAdmin.from('users').upsert({
          id: data.user.id,
          email,
          name: name || email.split('@')[0]
        });
      } catch (e) { /* profile insert failure is non-fatal */ }
    }

    res.json({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
      session: data.session || null
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ error: 'Email and password required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.json({ error: 'Invalid email or password' });

    res.json({
      user: { id: data.user.id, email: data.user.email },
      session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token }
    });
  } catch (err) {
    console.error('Signin error:', err.message);
    res.json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ error: 'Email required' });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: (process.env.FRONTEND_URL || 'https://timely-buttercream-148233.netlify.app') + '?reset=true'
    });
    if (error) return res.json({ error: error.message });
    res.json({ success: true });
  } catch (err) {
    res.json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/signout
router.post('/signout', async (req, res) => {
  try { await supabase.auth.signOut(); } catch (e) {}
  res.json({ success: true });
});

// Keep old /login route as alias so nothing breaks
router.post('/login', async (req, res) => {
  req.url = '/signin';
  router.handle(req, res);
});

// Keep old /logout route as alias
router.post('/logout', async (req, res) => {
  try { await supabase.auth.signOut(); } catch (e) {}
  res.json({ success: true });
});

module.exports = router;
