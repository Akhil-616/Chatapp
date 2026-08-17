const WebSocket = require('ws');
const supabase = require('./db'); // our Supabase connection

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (socket) => {
  console.log('✅ New client connected (not yet named)');

  socket.on('message', async (data) => {
    const message = data.toString();

    if (!socket.name) {
      socket.name = message;
      clients.set(socket.name, socket);
      console.log(`👤 Client registered as: ${socket.name}`);

      // 5. Fetch this person's missed messages from the database
      const { data: history, error } = await supabase
        .from('messages')
        .select('sender_name, content, created_at')
        .eq('receiver_name', socket.name)
        .order('created_at', { ascending: true });

      if (error) {
        console.log('⚠️  Error fetching history:', error.message);
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

      // 6. Save the message to the database FIRST, before trying to deliver it live
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