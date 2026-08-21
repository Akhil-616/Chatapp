// This client is SERVER-ONLY. It uses the service role key, which bypasses
// Row Level Security entirely -- that's intentional: our server already
// verifies every user's identity itself (via their JWT) before touching the
// database, so it acts as the trusted gatekeeper instead of relying on RLS.
// This key must NEVER be sent to a client or committed to a public repo.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false, // no real user session to keep alive server-side
      persistSession: false,
    },
  }
);

module.exports = supabase;