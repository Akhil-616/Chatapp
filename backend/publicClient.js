// This client stands in for what a REAL end-user client (a browser, an app)
// would use: the public anon key. It's what login.js uses to simulate a
// person signing up/logging in directly, separate from the server's
// service-role connection in db.js.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const DEFAULT_SUPABASE_URL = 'https://uhulsyidhzatyuxeiejz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_YYi7fmR59z8L6dUl3VonBQ_9X4E3ckS';

const supabase = createClient(
  process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY
);

module.exports = supabase;
