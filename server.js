const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

// 1. Map to track who's connected: name -> their socket connection
const clients = new Map();

wss.on('connection', (socket) => {
  console.log('✅ New client connected (not yet named)');

  socket.on('message', (data) => {
    const message = data.toString();

    // 2. First message a client sends is treated as their name
    if (!socket.name) {
      socket.name = message;
      clients.set(socket.name, socket);
      console.log(`👤 Client registered as: ${socket.name}`);
      return;
    }

    // 3. After that, expect messages in the format "TO:<targetName>:<text>"
    if (message.startsWith('TO:')) {
      const [, targetName, ...rest] = message.split(':');
      const text = rest.join(':'); // rejoin in case the message itself had a ":"

      // 4. Look up the target client's socket by name
      const targetSocket = clients.get(targetName);

      if (targetSocket) {
        // 5. Send directly down THAT client's connection
        targetSocket.send(`${socket.name}: ${text}`);
        console.log(`➡️  Routed message from ${socket.name} to ${targetName}`);
      } else {
        console.log(`⚠️  ${targetName} is not connected`);
        socket.send(`⚠️ ${targetName} is not online`);
      }
    }
  });

  socket.on('close', () => {
    // 6. Clean up the map so we don't route to a dead connection
    if (socket.name) {
      clients.delete(socket.name);
      console.log(`❌ ${socket.name} disconnected`);
    }
  });
});

console.log('🚀 WebSocket server running on ws://localhost:8080');