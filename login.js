require('dotenv').config();
const readline = require('readline');
const supabase = require('./publicClient');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// 1. Wrap rl.question in a Promise so we can use clean async/await instead of nested callbacks
function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const email = await ask('Email: ');
  const password = await ask('Password: ');

  // 2. Try logging in first — this covers everyone who already has an account
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error) {
    console.log('\n✅ Logged in.');
    console.log('\nYour access token (paste as your first message in wscat):\n');
    console.log(data.session.access_token);
    rl.close();
    return;
  }

  // 3. No account yet — this is a first-time signup, so we also need a username
  console.log('No existing account, creating one...');

  let username;
  while (true) {
    username = await ask('Choose a username: ');

    // 4. Enforce uniqueness ourselves too (not just relying on the DB error),
    //    so the user gets a clean retry instead of a raw SQL error
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      console.log('❌ That username is already taken — try another.');
    } else {
      break;
    }
  }

  ({ data, error } = await supabase.auth.signUp({ email, password }));

  if (error) {
    console.log('❌ Signup failed:', error.message);
    rl.close();
    return;
  }

  // 5. Create the profile row that links this auth user to their chosen username
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, email: data.user.email, username });

  if (profileError) {
    console.log('❌ Could not create profile:', profileError.message);
    rl.close();
    return;
  }

  console.log('\n✅ Account created as:', username);
  console.log('\nYour access token (paste as your first message in wscat):\n');
  console.log(data.session.access_token);
  rl.close();
}

main();