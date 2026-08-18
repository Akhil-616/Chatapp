require('dotenv').config();
const readline = require('readline');
const supabase = require('./db');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Email: ', (email) => {
  rl.question('Password: ', async (password) => {

    // 1. Try logging in first (in case this account already exists)
    let { data, error } = await supabase.auth.signInWithPassword({ email, password });

    // 2. If login failed because the account doesn't exist yet, create one
    if (error) {
      console.log('No existing account, signing up instead...');
      ({ data, error } = await supabase.auth.signUp({ email, password }));
    }

    if (error) {
      console.log('❌ Auth failed:', error.message);
    } else {
      console.log('\n✅ Success, logged in as:', data.user.email);
      console.log('\nCopy this token — paste it as your FIRST message in wscat:\n');
      console.log(data.session.access_token);
    }

    rl.close();
  });
});