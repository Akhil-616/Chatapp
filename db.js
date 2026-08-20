// 1. Load variables from .env into process.env
require('dotenv').config();

// 2. Import the Supabase client library
const { createClient } = require('@supabase/supabase-js');

// 3. Create one shared client using the URL + key from .env
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 4. Export it so server.js can reuse this same connection
module.exports = supabase;   