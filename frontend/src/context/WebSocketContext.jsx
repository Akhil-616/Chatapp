import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children, session, username }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectWebSocketRef = useRef(null);
  const supabaseChannelRef = useRef(null);

  // Helper to load dismissed notification IDs from localStorage
  const getDismissedNotificationIds = useCallback(() => {
    if (!username || typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem(`cj_viewed_notifs_${username.toLowerCase()}`);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {
      console.debug('Error reading viewed notifications:', e);
    }
    return new Set();
  }, [username]);

  // Helper to persist dismissed notification IDs in localStorage
  const saveDismissedNotificationId = useCallback((id) => {
    if (!username || !id || typeof window === 'undefined') return;
    try {
      const current = getDismissedNotificationIds();
      current.add(id);
      localStorage.setItem(
        `cj_viewed_notifs_${username.toLowerCase()}`,
        JSON.stringify(Array.from(current))
      );
    } catch (e) {
      console.debug('Error saving viewed notification:', e);
    }
  }, [username, getDismissedNotificationIds]);

  // Load registered user profiles for clean display names in notifications
  useEffect(() => {
    let isMounted = true;
    async function loadProfiles() {
      try {
        const { data } = await supabase.from('profiles').select('username, full_name');
        if (isMounted && data) {
          const map = {};
          data.forEach((p) => {
            if (p.username) {
              map[p.username.toLowerCase()] = p.full_name || p.username;
            }
          });
          setProfilesMap(map);
        }
      } catch (err) {
        console.debug('Could not prefetch profiles map:', err);
      }
    }
    loadProfiles();
    return () => {
      isMounted = false;
    };
  }, []);

  // Push single notification per person (replaces existing notification from same person if present)
  const pushNotification = useCallback(
    (senderUsername, messageTimestamp = new Date().toISOString()) => {
      if (!senderUsername || !username) return;
      const senderClean = senderUsername.trim();
      const senderLower = senderClean.toLowerCase();
      const userLower = username.toLowerCase().trim();

      if (senderLower === userLower) return;

      setNotifications((prev) => {
        const notifId = `notif_${senderLower}_${Date.now()}`;
        const newNotif = {
          id: notifId,
          from: senderClean,
          to: username,
          timestamp: messageTimestamp,
        };
        // Keep only ONE notification per person at a time (replace old one if present)
        const otherSenders = prev.filter(
          (n) => (n.from || '').toLowerCase().trim() !== senderLower
        );
        return [newNotif, ...otherSenders];
      });
    },
    [username]
  );

  // 1. Initial and recurring message history loader from Supabase
  const loadMessageHistory = useCallback(async () => {
    if (!username) return;
    try {
      const cleanUsername = username.trim();
      const userLower = cleanUsername.toLowerCase();
      const userEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : '';
      const emailPrefix = userEmail ? userEmail.split('@')[0] : '';

      let rawMessages = [];

      // Query 1: Targeted .or() filter
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `sender_username.ilike.${cleanUsername},receiver_username.ilike.${cleanUsername},sender_username.eq.${cleanUsername},receiver_username.eq.${cleanUsername}`
          )
          .order('created_at', { ascending: true })
          .limit(250);

        if (!error && Array.isArray(data) && data.length > 0) {
          rawMessages = data;
        }
      } catch (qErr) {
        console.debug('Targeted messages query attempt:', qErr);
      }

      // Query 2: Fallback query all recent messages and filter client-side
      if (rawMessages.length === 0) {
        try {
          const { data: allData, error: allErr } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(300);

          if (!allErr && Array.isArray(allData) && allData.length > 0) {
            rawMessages = allData.filter((m) => {
              const sender = (m.sender_username || m.sender || m.from || m.from_user || '').toLowerCase().trim();
              const receiver = (m.receiver_username || m.receiver || m.to || m.to_user || '').toLowerCase().trim();
              return (
                sender === userLower ||
                receiver === userLower ||
                (userEmail && (sender === userEmail || receiver === userEmail)) ||
                (emailPrefix && (sender === emailPrefix || receiver === emailPrefix))
              );
            });
          }
        } catch (fbErr) {
          console.debug('Fallback select all messages:', fbErr);
        }
      }

      if (rawMessages.length > 0) {
        const formatted = rawMessages.map((m) => ({
          id: m.id,
          from: m.sender_username || m.sender || m.from || m.from_user || 'student',
          to: m.receiver_username || m.receiver || m.to || m.to_user || cleanUsername,
          content: m.content || m.message || m.text || '',
          timestamp: m.created_at || m.timestamp || new Date().toISOString(),
        }));

        setMessages((prev) => {
          // Reconcile optimistic messages:
          // Keep pending temporary messages that have not yet been matched in fetched history
          const tempStillPending = prev.filter(
            (m) =>
              typeof m.id === 'string' &&
              m.id.startsWith('temp_') &&
              !formatted.some(
                (f) =>
                  (f.from || '').toLowerCase() === (m.from || '').toLowerCase() &&
                  (f.to || '').toLowerCase() === (m.to || '').toLowerCase() &&
                  f.content === m.content &&
                  Math.abs(new Date(f.timestamp || 0) - new Date(m.timestamp || 0)) < 30000
              )
          );

          const dbMap = new Map();
          formatted.forEach((m) => {
            const key = m.id
              ? `id_${m.id}`
              : `${(m.from || '').toLowerCase()}_${(m.to || '').toLowerCase()}_${m.content}_${m.timestamp}`;
            dbMap.set(key, m);
          });

          return [...Array.from(dbMap.values()), ...tempStillPending].sort(
            (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
          );
        });
      }
    } catch (err) {
      console.warn('Could not load past message history:', err);
    }
  }, [username, session]);

  // 2. Connect WebSocket server
  const connectWebSocket = useCallback(() => {
    if (!session?.access_token || !username) return;

    let wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      if (typeof window !== 'undefined') {
        const isSecure = window.location.protocol === 'https:';
        wsUrl = isSecure ? `wss://${window.location.host}` : `ws://${window.location.hostname}:8080`;
      } else {
        wsUrl = 'ws://localhost:8080';
      }
    }

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('⚡ Connected to WebSocket server. Sending Auth for:', username);
        ws.send(JSON.stringify({
          type: 'auth',
          token: session?.access_token || 'demo-session-token',
          username: username,
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
              if (data.messages && data.messages.length > 0) {
                setMessages((prev) => {
                  const map = new Map();
                  prev.forEach((m) => {
                    const key = m.id ? `id_${m.id}` : `${(m.from || '').toLowerCase()}_${(m.to || '').toLowerCase()}_${m.content}_${m.timestamp}`;
                    map.set(key, m);
                  });
                  data.messages.forEach((m) => {
                    const key = m.id ? `id_${m.id}` : `${(m.from || '').toLowerCase()}_${(m.to || '').toLowerCase()}_${m.content}_${m.timestamp}`;
                    map.set(key, m);
                  });
                  return Array.from(map.values()).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                });
              }
              break;

            case 'message': {
              const newMsg = {
                from: data.from,
                to: username,
                content: data.content,
                timestamp: new Date().toISOString(),
              };
              setMessages((prev) => {
                const exists = prev.some(
                  (m) =>
                    (m.from || '').toLowerCase() === (data.from || '').toLowerCase() &&
                    (m.to || '').toLowerCase() === (username || '').toLowerCase() &&
                    m.content === data.content &&
                    Math.abs(new Date(m.timestamp || 0) - new Date(newMsg.timestamp)) < 15000
                );
                if (exists) return prev;
                return [...prev, newMsg].sort(
                  (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
                );
              });

              if (data.from && data.from.toLowerCase() !== username.toLowerCase()) {
                pushNotification(data.from, newMsg.timestamp);
              }
              break;
            }

            case 'presence':
              if (Array.isArray(data.users)) {
                setOnlineUsers(new Set(data.users.map((u) => (typeof u === 'string' ? u.toLowerCase() : u))));
              }
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing incoming WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected. Retrying in 4s...');
        setIsConnected(false);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(async () => {
          const { data } = await supabase.auth.getSession();
          if (data?.session && connectWebSocketRef.current) {
            connectWebSocketRef.current();
          }
        }, 4000);
      };

      ws.onerror = () => {
        setIsConnected(false);
        try {
          ws.close();
        } catch (err) {
          console.debug('WS close on error:', err);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection init exception:', e);
      setIsConnected(false);
    }
  }, [session, username, pushNotification]);

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  // 3. Setup Supabase Realtime fallback channel for instant peer synchronization
  useEffect(() => {
    if (!username) return;

    const fetchHistory = async () => {
      await loadMessageHistory();
    };
    fetchHistory();

    const channel = supabase.channel(`campus-room-${username}`, {
      config: {
        broadcast: { self: false },
        presence: { key: username },
      },
    });

    supabaseChannelRef.current = channel;

    // Add listener for direct Supabase database row insertions
    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (!payload?.new) return;
          const row = payload.new;
          const from = row.sender_username || row.sender || row.from || row.from_user || 'student';
          const to = row.receiver_username || row.receiver || row.to || row.to_user || '';
          const content = row.content || row.message || row.text || '';
          const timestamp = row.created_at || row.timestamp || new Date().toISOString();

          const toLower = to.toLowerCase();
          const fromLower = from.toLowerCase();
          const userLower = username.toLowerCase();

          if (toLower === userLower || fromLower === userLower) {
            const newMsg = { id: row.id, from, to, content, timestamp };
            setMessages((prev) => {
              // 1. If row.id already exists, skip
              if (prev.some((m) => m.id && row.id && m.id === row.id)) {
                return prev;
              }

              // 2. If matching pending temporary message exists, replace it in-place
              let replaced = false;
              const updated = prev.map((m) => {
                if (
                  !replaced &&
                  (!m.id || (typeof m.id === 'string' && m.id.startsWith('temp_'))) &&
                  (m.from || '').toLowerCase() === fromLower &&
                  (m.to || '').toLowerCase() === toLower &&
                  m.content === content &&
                  Math.abs(new Date(m.timestamp || 0) - new Date(timestamp)) < 30000
                ) {
                  replaced = true;
                  return newMsg;
                }
                return m;
              });

              if (replaced) {
                return updated.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
              }

              // 3. Otherwise, append
              return [...prev, newMsg].sort(
                (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
              );
            });

            // If this is an incoming live message from a peer, push a single live notification
            if (toLower === userLower && fromLower !== userLower) {
              pushNotification(from, timestamp);
            }
          }
        }
      );

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (!payload) return;
        const toLower = (payload.to || '').toLowerCase();
        const fromLower = (payload.from || '').toLowerCase();
        const userLower = username.toLowerCase();

        if (toLower === userLower) {
          setMessages((prev) => {
            const exists = prev.some(
              (m) =>
                (m.id && payload.id && m.id === payload.id) ||
                ((m.from || '').toLowerCase() === fromLower &&
                  (m.to || '').toLowerCase() === toLower &&
                  m.content === payload.content &&
                  Math.abs(new Date(m.timestamp || 0) - new Date(payload.timestamp || 0)) < 15000)
            );
            if (exists) return prev;
            return [...prev, payload].sort(
              (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
            );
          });

          // Add single notification per person
          if (fromLower !== userLower) {
            pushNotification(payload.from, payload.timestamp);
          }
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activeList = Object.keys(state);
        setOnlineUsers(new Set(activeList.map((u) => (typeof u === 'string' ? u.toLowerCase() : u))));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ online_at: new Date().toISOString(), user: username });
          setIsConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [username, loadMessageHistory, pushNotification]);

  // Recurring background sync for Supabase message history
  useEffect(() => {
    if (!username) return;
    const interval = setInterval(() => {
      loadMessageHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, [username, loadMessageHistory]);

  useEffect(() => {
    if (session && username) {
      const initSocket = () => {
        connectWebSocket();
      };
      initSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (err) {
          console.debug('Socket close on unmount:', err);
        }
      }
    };
  }, [session, username, connectWebSocket]);

  // 4. Robust Send Message
  const sendMessage = async (toUsername, content) => {
    if (!content || !toUsername || !username) return false;

    const trimmedContent = content.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newMsg = {
      id: tempId,
      from: username,
      to: toUsername,
      content: trimmedContent,
      timestamp: new Date().toISOString(),
    };

    // Optimistically update local message state with tempId
    setMessages((prev) => [...prev, newMsg]);

    // 1) Send via WebSocket if ready (skipDb: true since direct Supabase persistence is handled below)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message',
          to: toUsername,
          content: trimmedContent,
          skipDb: true,
        })
      );
    }

    // 2) Persist directly to Supabase messages table and retrieve official row ID
    let officialId = null;
    try {
      const { data: inserted, error } = await supabase
        .from('messages')
        .insert({
          sender_username: username,
          receiver_username: toUsername,
          content: trimmedContent,
        })
        .select()
        .maybeSingle();

      if (!error && inserted) {
        officialId = inserted.id;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  id: inserted.id,
                  from: inserted.sender_username || username,
                  to: inserted.receiver_username || toUsername,
                  content: inserted.content || trimmedContent,
                  timestamp: inserted.created_at || newMsg.timestamp,
                }
              : m
          )
        );
      }
    } catch (err) {
      console.warn('Error persisting message to Supabase table:', err);
    }

    // 3) Broadcast via Supabase channel for peer delivery
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: {
          ...newMsg,
          id: officialId || tempId,
        },
      });
    }

    return true;
  };

  // 5. Dismiss a single notification (Mark as viewed / Completed reading)
  const dismissNotification = useCallback((id) => {
    saveDismissedNotificationId(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [saveDismissedNotificationId]);

  // 6. Dismiss all notifications (Mark all as viewed)
  const markAllNotificationsAsViewed = useCallback(() => {
    if (typeof window !== 'undefined' && username) {
      try {
        const allDismissed = getDismissedNotificationIds();
        notifications.forEach((n) => allDismissed.add(n.id));
        localStorage.setItem(
          `cj_viewed_notifs_${username.toLowerCase()}`,
          JSON.stringify(Array.from(allDismissed))
        );
      } catch (e) {
        console.debug('Error clearing notifications:', e);
      }
    }
    setNotifications([]);
  }, [username, notifications, getDismissedNotificationIds]);

  return (
    <WebSocketContext.Provider
      value={{
        messages,
        sendMessage,
        isConnected,
        onlineUsers,
        setMessages,
        notifications,
        unreadCount: notifications.length,
        dismissNotification,
        markAllNotificationsAsViewed,
        profilesMap,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to access WebSocket context
// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocket = () => useContext(WebSocketContext);