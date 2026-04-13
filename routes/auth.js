// routes/auth.js
const router = require('express').Router();
const { supabase, supabaseAdmin } = require('../db/client');

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });

    // Create user profile row
    if (authData.user) {
      await supabaseAdmin.from('users').insert({
        id: authData.user.id,
        email,
        name: name || email.split('@')[0]
      });
    }

    res.json({
      message: 'Account created! Check your email to confirm.',
      user: { id: authData.user?.id, email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      token: data.session.access_token,
      user: { id: data.user.id, email: data.user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  await supabase.auth.signOut();
  res.json({ message: 'Logged out' });
});

module.exports = router;

// POST /api/auth/phone-otp - send SMS code
router.post('/phone-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) return res.json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not send code. Please try again.' });
  }
});

// POST /api/auth/verify-otp - verify SMS code
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, token } = req.body;
    if (!phone || !token) return res.status(400).json({ error: 'Phone and code required' });
    const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) return res.json({ error: error.message });
    res.json({ user: data.user, session: data.session });
  } catch (e) {
    res.status(500).json({ error: 'Verification failed.' });
  }
});

// POST /api/auth/reset-password - send password reset email
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return res.json({ error: error.message });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/signout
router.post('/signout', async (req, res) => {
  try {
    await supabase.auth.signOut();
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});
