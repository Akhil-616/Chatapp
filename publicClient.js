// This client stands in for what a REAL end-user client (a browser, an app)
// would use: the public anon key. It's what login.js uses to simulate a
// person signing up/logging in directly, separate from the server's
// service-role connection in db.js.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;