const WebSocket = require('ws');
const supabase = require('./db');

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (socket) => {
  console.log('✅ New client connected (not yet authenticated)');

  socket.on('message', async (data) => {
    const message = data.toString();

    if (!socket.name) {
      // 1. Treat the first message as a Supabase access token, not a typed name
      const token = message;

      // 2. Ask Supabase to verify this token is genuine and get the real user behind it
      const { data: userData, error } = await supabase.auth.getUser(token);

      if (error || !userData.user) {
        console.log('❌ Invalid token — rejecting connection');
        socket.send('❌ Authentication failed');
        socket.close(); // 3. Refuse to keep talking to an unverified client
        return;
      }

      // 4. Identity now comes from the verified token, never from user input directly
      socket.name = userData.user.email;
      clients.set(socket.name, socket);
      console.log(`👤 Authenticated as: ${socket.name}`);

      const { data: history, error: historyError } = await supabase
        .from('messages')
        .select('sender_name, content, created_at')
        .eq('receiver_name', socket.name)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.log('⚠️  Error fetching history:', historyError.message);
      } else if (history.length > 0) {
        console.log(`📜 Sending ${history.length} past message(s) to ${socket.name}`);
        history.forEach((msg) => {
          socket.send(`[history] ${msg.sender_name}: ${msg.content}`);
        });
      }
      return;
    }

    if (message.startsWith('TO:')) {
      const [, targetName, ...rest] = message.split(':');
      const text = rest.join(':');

      const { error } = await supabase
        .from('messages')
        .insert({ sender_name: socket.name, receiver_name: targetName, content: text });

      if (error) {
        console.log('⚠️  Error saving message:', error.message);
      } else {
        console.log(`💾 Saved message from ${socket.name} to ${targetName}`);
      }

      const targetSocket = clients.get(targetName);

      if (targetSocket) {
        targetSocket.send(`${socket.name}: ${text}`);
        console.log(`➡️  Routed message from ${socket.name} to ${targetName}`);
      } else {
        console.log(`⚠️  ${targetName} is not connected — message saved for later`);
        socket.send(`⚠️ ${targetName} is not online, but your message was saved`);
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