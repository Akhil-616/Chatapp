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
      if (!msg.token || typeof msg.token !== 'string') {
        socket.send(JSON.stringify({ type: 'auth_error', message: 'Missing or invalid token format' }));
        socket.close();
        return;
      }

      const { data: userData, error } = await supabase.auth.getUser(msg.token);

      if (error || !userData.user) {
        socket.send(JSON.stringify({ type: 'auth_error', message: 'Invalid or expired token' }));
        socket.close();
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profileError || !profile || !profile.username) {
        socket.send(JSON.stringify({ type: 'auth_error', message: 'No profile found' }));
        socket.close();
        return;
      }

      socket.userId = userData.user.id;
      socket.name = profile.username;
      socket.fullName = profile.full_name || '';
      clients.set(socket.name, socket);
      console.log(`👤 Authenticated as: ${socket.name} (${socket.fullName || 'No full name'})`);

      // 3. Structured auth success response
      socket.send(JSON.stringify({
        type: 'auth_success',
        username: socket.name,
        full_name: socket.fullName,
      }));

      // --- Past message history with safe matching ---
      const safeUsername = socket.name.replace(/[^a-zA-Z0-9_-]/g, '');
      const { data: history, error: historyError } = await supabase
        .from('messages')
        .select('sender_username, receiver_username, content, created_at')
        .or(`sender_username.eq.${safeUsername},receiver_username.eq.${safeUsername}`)
        .order('created_at', { ascending: true })
        .limit(100);

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
      // 5. Input validation on payload fields
      const { to, content } = msg;

      if (!to || typeof to !== 'string' || !to.trim()) {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid recipient' }));
        return;
      }

      if (!content || typeof content !== 'string' || !content.trim()) {
        socket.send(JSON.stringify({ type: 'error', message: 'Message content cannot be empty' }));
        return;
      }

      if (content.length > 4000) {
        socket.send(JSON.stringify({ type: 'error', message: 'Message content exceeds length limit (4000 chars)' }));
        return;
      }

      const cleanTo = to.trim().toLowerCase();
      const cleanContent = content.trim();

      const { error } = await supabase
        .from('messages')
        .insert({ sender_username: socket.name, receiver_username: cleanTo, content: cleanContent });

      if (error) {
        console.log('⚠️  Error saving message:', error.message);
      } else {
        console.log(`💾 Saved message from ${socket.name} to ${cleanTo}`);
      }

      const targetSocket = clients.get(cleanTo);

      if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(JSON.stringify({
          type: 'message',
          from: socket.name,
          to: cleanTo,
          content: cleanContent,
        }));
        console.log(`➡️  Routed message from ${socket.name} to ${cleanTo}`);
      } else {
        console.log(`⚠️  ${cleanTo} is not connected — message saved for later`);
        socket.send(JSON.stringify({ type: 'notice', message: `${cleanTo} is not online, message saved` }));
      }
      return;
    }

    // 6. Unknown type — structured rejection
    socket.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
  });

  socket.on('close', () => {
    // Only delete from clients map if this exact socket is the currently mapped one
    if (socket.name && clients.get(socket.name) === socket) {
      clients.delete(socket.name);
      console.log(`❌ ${socket.name} disconnected`);
    }
  });
});

console.log('🚀 WebSocket server running on ws://localhost:8080');