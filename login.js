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

  // 3. No account yet — this is a first-time signup, so we also need a full name and username
  console.log('No existing account, creating one...');

  const fullName = (await ask('Enter your full name: ')).trim();

  let username;
  while (true) {
    username = (await ask('Choose a username: ')).trim().toLowerCase();

    if (!username) {
      console.log('❌ Username cannot be empty.');
      continue;
    }

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

  ({ data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name: fullName,
      },
    },
  }));

  if (error) {
    console.log('❌ Signup failed:', error.message);
    rl.close();
    return;
  }

  // 5. Create / sync the profile row (if DB trigger didn't already create it)
  if (data.user && data.session) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email,
        username,
        full_name: fullName || null,
      }, { onConflict: 'id' });

    if (profileError) {
      console.log('ℹ️  Profile note:', profileError.message);
    }
  }

  console.log('\n✅ Account registered for:', fullName || username, `(@${username})`);
  if (data.session?.access_token) {
    console.log('\nYour access token (paste as your first message in wscat):\n');
    console.log(data.session.access_token);
  } else {
    console.log('\n✉️ Verification email sent. Please confirm your email before connecting.');
  }
  rl.close();
}

main();