// routes/deleteAccount.js — App Store required account deletion
// Maxwell Entities LLC
const router = require('express').Router();
const { supabase, supabaseAdmin } = require('../db/client');

// DELETE /api/auth/delete-account
// Client sends: Authorization: Bearer <access_token>
// Because the `users` table has `on delete cascade` on user_id foreign keys,
// deleting the auth user automatically removes all their rows across tables.
router.delete('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ error: 'Authorization token required' });

    // Validate the token & get the user id
    const { data: userData, error: getUserErr } = await supabase.auth.getUser(token);
    if (getUserErr || !userData || !userData.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const userId = userData.user.id;

    // Remove the user profile row first (cascade will clean related rows)
    try {
      await supabaseAdmin.from('users').delete().eq('id', userId);
    } catch (e) { /* profile delete failure is non-fatal — continue */ }

    // Delete the auth user — this is the permanent step
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) {
      console.error('Auth delete error:', delErr.message);
      return res.status(500).json({ error: 'Could not delete account: ' + delErr.message });
    }

    res.json({ ok: true, message: 'Account permanently deleted' });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Server error during deletion' });
  }
});

module.exports = router;
