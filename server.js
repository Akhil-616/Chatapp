const WebSocket = require('ws');
const supabase = require('./db');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Map();

wss.on('connection', (socket) => {
  console.log('✅ New client connected (not yet authenticated)');

  socket.on('message', async (data) => {
    // 1. Parse the raw text as JSON instead of splitting it by hand.
    //    Wrapped in try/catch because JSON.parse throws on anything malformed —
    //    without this, one bad message from a client would crash the server.
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch (err) {
      socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    // 2. Branch on the envelope's `type` field instead of guessing from string shape
    if (msg.type === 'auth') {
      const { data: userData, error } = await supabase.auth.getUser(msg.token);

      if (error || !userData.user) {
        socket.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
        socket.close();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userData.user.id)
        .single();

      if (profileError || !profile) {
        socket.send(JSON.stringify({ type: 'auth_error', message: 'No profile found' }));
        socket.close();
        return;
      }

      socket.name = profile.username;
      clients.set(socket.name, socket);
      console.log(`👤 Authenticated as: ${socket.name}`);

      // 3. Every response is now a structured, labeled object too —
      //    the client always knows what kind of thing it just received
      socket.send(JSON.stringify({ type: 'auth_success', username: socket.name }));

      // --- In server.js ---
      const { data: history, error: historyError } = await supabase
        .from('messages')
        .select('sender_username, receiver_username, content, created_at')
        .or(`sender_username.eq.${socket.name},receiver_username.eq.${socket.name}`)
        .order('created_at', { ascending: true });

      if (!historyError && history && history.length > 0) {
        socket.send(JSON.stringify({
          type: 'history',
          messages: history.map((m) => ({
            from: m.sender_username,
            to: m.receiver_username,
            content: m.content,
            timestamp: m.created_at,
          })),
        }));
        console.log(`📜 Sent ${history.length} past message(s) to ${socket.name}`);
      }
      return;
    }

    // 4. Guard: reject anything else until this connection has authenticated
    if (!socket.name) {
      socket.send(JSON.stringify({ type: 'error', message: 'Not authenticated yet' }));
      return;
    }

    if (msg.type === 'message') {
      // 5. Fields are read by NAME now (msg.to, msg.content) — not by string position
      const { to, content } = msg;

      const { error } = await supabase
        .from('messages')
        .insert({ sender_username: socket.name, receiver_username: to, content });

      if (error) {
        console.log('⚠️  Error saving message:', error.message);
      } else {
        console.log(`💾 Saved message from ${socket.name} to ${to}`);
      }

      const targetSocket = clients.get(to);

      if (targetSocket) {
        targetSocket.send(JSON.stringify({ type: 'message', from: socket.name, content }));
        console.log(`➡️  Routed message from ${socket.name} to ${to}`);
      } else {
        console.log(`⚠️  ${to} is not connected — message saved for later`);
        socket.send(JSON.stringify({ type: 'error', message: `${to} is not online, message saved` }));
      }
      return;
    }

    // 6. Unknown type — structured rejection instead of silent failure
    socket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
  });

  socket.on('close', () => {
    if (socket.name) {
      clients.delete(socket.name);
      console.log(`❌ ${socket.name} disconnected`);
    }
  });
});

console.log('🚀 WebSocket server running on ws://localhost:8080');