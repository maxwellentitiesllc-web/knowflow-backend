// db/client.js — Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Public client (for user-authenticated requests)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Admin client (for server-side operations — never expose to frontend)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = { supabase, supabaseAdmin };
