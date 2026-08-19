const WebSocket = require('ws');
const supabase = require('./db');

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (socket) => {
  console.log('✅ New client connected (not yet authenticated)');

  socket.on('message', async (data) => {
    const message = data.toString();

    if (!socket.name) {
      const token = message;

      const { data: userData, error } = await supabase.auth.getUser(token);

      if (error || !userData.user) {
        console.log('❌ Invalid token — rejecting connection');
        socket.send('❌ Authentication failed');
        socket.close();
        return;
      }

      // 1. Token only proves WHO they are (their auth id) — it doesn't carry their
      //    chosen username, so we look that up from the linked profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userData.user.id)
        .single();

      if (profileError || !profile) {
        console.log('❌ No profile found for this account');
        socket.send('❌ No profile found — please sign up again');
        socket.close();
        return;
      }

      // 2. From here on, identity = verified username, not email — this is what
      //    people will now type when addressing a message (shorter, no @domain.com)
      socket.name = profile.username;
      clients.set(socket.name, socket);
      console.log(`👤 Authenticated as: ${socket.name}`);

      const { data: history, error: historyError } = await supabase
        .from('messages')
        .select('sender_username, content, created_at')
        .eq('receiver_username', socket.name)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.log('⚠️  Error fetching history:', historyError.message);
      } else if (history.length > 0) {
        console.log(`📜 Sending ${history.length} past message(s) to ${socket.name}`);
        history.forEach((msg) => {
          socket.send(`[history] ${msg.sender_username}: ${msg.content}`);
        });
      }
      return;
    }

    if (message.startsWith('TO:')) {
      const [, targetUsername, ...rest] = message.split(':');
      const text = rest.join(':');

      const { error } = await supabase
        .from('messages')
        .insert({ sender_username: socket.name, receiver_username: targetUsername, content: text });

      if (error) {
        console.log('⚠️  Error saving message:', error.message);
      } else {
        console.log(`💾 Saved message from ${socket.name} to ${targetUsername}`);
      }

      const targetSocket = clients.get(targetUsername);

      if (targetSocket) {
        targetSocket.send(`${socket.name}: ${text}`);
        console.log(`➡️  Routed message from ${socket.name} to ${targetUsername}`);
      } else {
        console.log(`⚠️  ${targetUsername} is not connected — message saved for later`);
        socket.send(`⚠️ ${targetUsername} is not online, but your message was saved`);
      }
    }
  });

  socket.on('close', () => {
    if (socket.name) {
      clients.delete(socket.name);
      console.log(`❌ ${socket.name} disconnected`);
    }
  });
});

console.log('🚀 WebSocket server running on ws://localhost:8080');