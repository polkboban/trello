const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing one or more Supabase environment variables");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

module.exports = { supabase, supabaseAdmin };
