import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, session, username }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = () => {
    if (!session?.access_token || !username) return;

    // Use ws:// for local dev, wss:// for production
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('⚡ Connected to WebSocket server. Sending Auth...');
      ws.send(JSON.stringify({
        type: 'auth',
        token: session.access_token,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'auth_success':
            console.log('✅ Authenticated on WebSocket as', data.username);
            setIsConnected(true);
            break;

          case 'history':
            console.log(`📜 Loaded ${data.messages.length} messages`);
            setMessages(data.messages);
            break;

          case 'message':
            console.log('📩 Incoming message:', data);
            setMessages((prev) => [
              ...prev,
              {
                from: data.from,
                to: username,
                content: data.content,
                timestamp: new Date().toISOString(),
              },
            ]);
            break;

          case 'error':
            console.warn('⚠️ Server notice:', data.message);
            break;

          default:
            console.log('Received:', data);
        }
      } catch (err) {
        console.error('Error parsing incoming WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected. Retrying in 3s...');
      setIsConnected(false);
      // Auto-reconnect with fresh access token
      reconnectTimeoutRef.current = setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          connectWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      ws.close();
    };
  };

  useEffect(() => {
    if (session && username) {
      connectWebSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [session, username]);

  const sendMessage = (toUsername, content) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not open');
      return false;
    }

    const payload = {
      type: 'message',
      to: toUsername,
      content,
    };

    socketRef.current.send(JSON.stringify(payload));

    // Optimistically add our own message to local state
    setMessages((prev) => [
      ...prev,
      {
        from: username,
        to: toUsername,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);

    return true;
  };

  return (
    <WebSocketContext.Provider
      value={{
        messages,
        sendMessage,
        isConnected,
        onlineUsers,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);