import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';

const WebSocketContext = createContext(null);

// Helper to safely merge/deduplicate incoming messages into existing message state
const mergeMessageList = (existingList = [], incomingList = []) => {
  const incoming = Array.isArray(incomingList) ? incomingList : [incomingList];
  if (incoming.length === 0) return existingList;

  const result = [...existingList];

  for (const newMsg of incoming) {
    if (!newMsg || typeof newMsg.content !== 'string') continue;

    const fromClean = (newMsg.from || newMsg.sender_username || '').trim();
    const toClean = (newMsg.to || newMsg.receiver_username || '').trim();
    const fromLower = fromClean.toLowerCase();
    const toLower = toClean.toLowerCase();
    const content = newMsg.content;
    const isNewTemp = typeof newMsg.id === 'string' && newMsg.id.startsWith('temp_');
    const newTimestamp = new Date(newMsg.timestamp || newMsg.created_at || Date.now()).getTime();

    const normalizedMsg = {
      id: newMsg.id || `msg_${fromLower}_${toLower}_${newTimestamp}`,
      from: fromClean,
      to: toClean,
      content: content,
      timestamp: newMsg.timestamp || newMsg.created_at || new Date(newTimestamp).toISOString(),
    };

    // 1. If incoming has an exact real database ID, check if it already exists
    if (newMsg.id && !isNewTemp) {
      const exactIndex = result.findIndex((m) => m.id && String(m.id) === String(newMsg.id));
      if (exactIndex !== -1) {
        result[exactIndex] = { ...result[exactIndex], ...normalizedMsg };
        continue;
      }

      // 2. Check if this official DB message replaces an optimistic temp message
      const tempIndex = result.findIndex((m) => {
        const mIsTemp = !m.id || (typeof m.id === 'string' && m.id.startsWith('temp_'));
        if (!mIsTemp) return false;
        const mFrom = (m.from || '').toLowerCase().trim();
        const mTo = (m.to || '').toLowerCase().trim();
        const mContent = m.content;
        const mTime = new Date(m.timestamp || 0).getTime();
        return (
          mFrom === fromLower &&
          mTo === toLower &&
          mContent === content &&
          Math.abs(mTime - newTimestamp) < 60000
        );
      });

      if (tempIndex !== -1) {
        result[tempIndex] = normalizedMsg;
        continue;
      }
    } else if (isNewTemp) {
      // 3. If incoming is temp, check if the exact temp ID already exists
      const exactTempIndex = result.findIndex((m) => m.id && String(m.id) === String(newMsg.id));
      if (exactTempIndex !== -1) {
        continue;
      }
    }

    // 4. Otherwise, append
    result.push(normalizedMsg);
  }

  return result.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
};

export const WebSocketProvider = ({ children, session, username }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [profilesList, setProfilesList] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(session?.user?.id || null);

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
  const saveDismissedNotificationId = useCallback(
    (id) => {
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
    },
    [username, getDismissedNotificationIds]
  );

  // Load all registered user profiles
  const loadProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data) {
        setProfilesList(data);
        const map = {};
        data.forEach((p) => {
          if (p.username) {
            map[p.username.toLowerCase()] = p.full_name || p.username;
          }
        });
        setProfilesMap(map);

        // Resolve current user ID if not already known
        if (username) {
          const myProfile = data.find(
            (p) => p.username?.toLowerCase() === username.toLowerCase()
          );
          if (myProfile?.id) {
            setCurrentUserId(myProfile.id);
          }
        }
      }
    } catch (err) {
      console.debug('Could not fetch profiles map:', err);
    }
  }, [username]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadProfiles();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadProfiles]);

  // Load Friend Requests from Supabase (and sync with localStorage fallback)
  const loadFriendRequests = useCallback(async () => {
    if (!username) return;

    let dbRequests = [];
    try {
      const { data, error } = await supabase.from('friend_requests').select('*');
      if (!error && Array.isArray(data)) {
        dbRequests = data;
      }
    } catch (err) {
      console.debug('Direct friend_requests query note:', err);
    }

    // Merge with any locally recorded requests (for instant reactivity in preview)
    let localReqs = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('cj_friend_requests');
        if (raw) localReqs = JSON.parse(raw);
      } catch (e) {
        console.debug('Local friend requests read error:', e);
      }
    }

    // Deduplicate requests
    const combined = [...dbRequests];
    localReqs.forEach((lr) => {
      const exists = combined.some(
        (cr) =>
          cr.id === lr.id ||
          (cr.requester_id === lr.requester_id && cr.addressee_id === lr.addressee_id) ||
          (cr.requester_id === lr.addressee_id && cr.addressee_id === lr.requester_id)
      );
      if (!exists) {
        combined.push(lr);
      }
    });

    setFriendRequests(combined);
  }, [username]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadFriendRequests();
      }
    })();
    const interval = setInterval(loadFriendRequests, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadFriendRequests]);

  // Push single notification per person
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
        const otherSenders = prev.filter(
          (n) => (n.from || '').toLowerCase().trim() !== senderLower
        );
        return [newNotif, ...otherSenders];
      });
    },
    [username]
  );

  // Load message history from Supabase
  const loadMessageHistory = useCallback(async () => {
    if (!username) return;
    try {
      const cleanUsername = username.trim();
      const userLower = cleanUsername.toLowerCase();
      const userEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : '';
      const emailPrefix = userEmail ? userEmail.split('@')[0] : '';

      let rawMessages = [];

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(
            `sender_username.ilike.${cleanUsername},receiver_username.ilike.${cleanUsername},sender_username.eq.${cleanUsername},receiver_username.eq.${cleanUsername}`
          )
          .order('created_at', { ascending: true })
          .limit(300);

        if (!error && Array.isArray(data) && data.length > 0) {
          rawMessages = data;
        }
      } catch (qErr) {
        console.debug('Targeted messages query attempt:', qErr);
      }

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

        setMessages((prev) => mergeMessageList(prev, formatted));
      }
    } catch (err) {
      console.warn('Could not load past message history:', err);
    }
  }, [username, session]);

  // Connect WebSocket
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
        ws.send(
          JSON.stringify({
            type: 'auth',
            token: session?.access_token || 'demo-session-token',
            username: username,
          })
        );
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
                setMessages((prev) => mergeMessageList(prev, data.messages));
              }
              break;

            case 'message_ack':
              if (data.message) {
                setMessages((prev) => mergeMessageList(prev, data.message));
              }
              break;

            case 'message': {
              const newMsg = {
                id: data.id,
                from: data.from,
                to: username,
                content: data.content,
                timestamp: data.timestamp || new Date().toISOString(),
              };
              setMessages((prev) => mergeMessageList(prev, newMsg));

              if (data.from && data.from.toLowerCase() !== username.toLowerCase()) {
                pushNotification(data.from, newMsg.timestamp);
              }
              break;
            }

            case 'presence':
              if (Array.isArray(data.users)) {
                setOnlineUsers(
                  new Set(data.users.map((u) => (typeof u === 'string' ? u.toLowerCase() : u)))
                );
              }
              break;

            case 'error':
              console.warn('⚠️ Server notice/error:', data.message);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error('Error parsing incoming WebSocket message:', err);
        }
      };

      ws.onclose = () => {
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
      };
    } catch (e) {
      console.warn('WebSocket connection init exception:', e);
      setIsConnected(false);
    }
  }, [session, username, pushNotification]);

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  // Setup Supabase Realtime channel for messages and friend request updates
  useEffect(() => {
    if (!username) return;

    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadMessageHistory();
        await loadFriendRequests();
      }
    })();

    const channel = supabase.channel(`campus-room-${username}`, {
      config: {
        broadcast: { self: false },
        presence: { key: username },
      },
    });

    supabaseChannelRef.current = channel;

    // Listen for direct message inserts in Supabase
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
            setMessages((prev) => mergeMessageList(prev, newMsg));

            if (toLower === userLower && fromLower !== userLower) {
              pushNotification(from, timestamp);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friend_requests' },
        () => {
          loadFriendRequests();
        }
      )
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (!payload) return;
        const toLower = (payload.to || '').toLowerCase();
        const fromLower = (payload.from || '').toLowerCase();
        const userLower = username.toLowerCase();

        if (toLower === userLower) {
          setMessages((prev) => mergeMessageList(prev, payload));
          if (fromLower !== userLower) {
            pushNotification(payload.from, payload.timestamp);
          }
        }
      })
      .on('broadcast', { event: 'friend_request_sync' }, () => {
        loadFriendRequests();
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
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [username, loadMessageHistory, loadFriendRequests, pushNotification]);

  // Recurring background sync for messages
  useEffect(() => {
    if (!username) return;
    const interval = setInterval(() => {
      loadMessageHistory();
    }, 5000);
    return () => clearInterval(interval);
  }, [username, loadMessageHistory]);

  useEffect(() => {
    if (session && username) {
      const timer = setTimeout(() => {
        connectWebSocket();
      }, 0);
      return () => {
        clearTimeout(timer);
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        if (socketRef.current) {
          try {
            socketRef.current.close();
          } catch (err) {
            console.debug('Socket close on unmount:', err);
          }
        }
      };
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

  // Helper to persist friend requests locally
  const syncFriendRequestsState = (updatedList) => {
    setFriendRequests(updatedList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cj_friend_requests', JSON.stringify(updatedList));
      } catch (e) {
        console.debug('Error caching friend requests:', e);
      }
    }
  };

  // Resolve user identifiers for current user and any target
  const myResolvedId = useMemo(() => {
    if (currentUserId) return currentUserId;
    if (session?.user?.id) return session.user.id;
    const myP = profilesList.find((p) => p.username?.toLowerCase() === username?.toLowerCase());
    return myP?.id || `user_${username?.toLowerCase()}`;
  }, [currentUserId, session, profilesList, username]);

  /**
   * Bidirectional Relationship Status Computation
   * Checks both directions:
   * ((requester = me AND addressee = target) OR (requester = target AND addressee = me))
   */
  const getRelationshipWithUser = useCallback(
    (target) => {
      if (!target || !username) return { status: 'none' };

      const targetUsername = typeof target === 'string' ? target : target.username;
      const targetId =
        typeof target === 'object' && target.id
          ? target.id
          : profilesList.find((p) => p.username?.toLowerCase() === targetUsername?.toLowerCase())?.id ||
            `user_${targetUsername?.toLowerCase()}`;

      const myId = myResolvedId;
      const myUserLower = username.toLowerCase().trim();
      const targetUserLower = targetUsername.toLowerCase().trim();

      if (myUserLower === targetUserLower) {
        return { status: 'self' };
      }

      // Check all friend requests bidirectionally
      const match = friendRequests.find((req) => {
        const reqReqId = String(req.requester_id || req.requester_username || '').toLowerCase();
        const reqAddId = String(req.addressee_id || req.addressee_username || '').toLowerCase();
        const strMyId = String(myId).toLowerCase();
        const strTargetId = String(targetId).toLowerCase();

        const matchDirect =
          (reqReqId === strMyId || reqReqId === myUserLower) &&
          (reqAddId === strTargetId || reqAddId === targetUserLower);

        const matchReverse =
          (reqReqId === strTargetId || reqReqId === targetUserLower) &&
          (reqAddId === strMyId || reqAddId === myUserLower);

        return matchDirect || matchReverse;
      });

      if (!match) {
        return { status: 'none' };
      }

      if (match.status === 'accepted') {
        return { status: 'accepted', request: match };
      }

      if (match.status === 'pending') {
        const reqReqId = String(match.requester_id || match.requester_username || '').toLowerCase();
        const isSender = reqReqId === String(myId).toLowerCase() || reqReqId === myUserLower;
        if (isSender) {
          return { status: 'sent', request: match };
        } else {
          return { status: 'received', request: match };
        }
      }

      return { status: 'none' };
    },
    [username, myResolvedId, profilesList, friendRequests]
  );

  /**
   * Action 1: Send Friend Request (A -> B)
   * Inserts row with status = 'pending'
   */
  const sendFriendRequest = async (target) => {
    if (!target || !username) return { success: false, error: 'Invalid target' };

    const targetUsername = typeof target === 'string' ? target : target.username;
    const targetUser =
      typeof target === 'object' && target.id
        ? target
        : profilesList.find((p) => p.username?.toLowerCase() === targetUsername?.toLowerCase()) || {
            id: `user_${targetUsername?.toLowerCase()}`,
            username: targetUsername,
          };

    const myId = myResolvedId;
    const targetId = targetUser.id;

    // Check if an existing relationship already exists in either direction
    const existing = getRelationshipWithUser(targetUser);
    if (existing.status !== 'none') {
      return { success: false, error: `Relationship already exists (${existing.status})` };
    }

    const newRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      requester_id: myId,
      requester_username: username,
      addressee_id: targetId,
      addressee_username: targetUsername,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Optimistically add to state
    const nextList = [...friendRequests, newRequest];
    syncFriendRequestsState(nextList);

    // Persist to Supabase friend_requests table
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          requester_id: myId,
          addressee_id: targetId,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        const updated = nextList.map((r) => (r.id === newRequest.id ? { ...r, id: data.id } : r));
        syncFriendRequestsState(updated);
      }
    } catch (err) {
      console.debug('Supabase friend request insert note:', err);
    }

    // Broadcast sync event to peer
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'friend_request_sync',
        payload: { type: 'request_sent', from: username, to: targetUsername },
      });
    }

    return { success: true };
  };

  /**
   * Action 2: Accept Friend Request (B accepts A's request)
   * Updates row's status to 'accepted'
   */
  const acceptFriendRequest = async (requestId) => {
    if (!requestId) return { success: false };

    // Update in local state
    const nextList = friendRequests.map((r) =>
      String(r.id) === String(requestId) ? { ...r, status: 'accepted' } : r
    );
    syncFriendRequestsState(nextList);

    // Update in Supabase
    try {
      await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);
    } catch (err) {
      console.debug('Supabase friend request accept error:', err);
    }

    // Broadcast sync event
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'friend_request_sync',
        payload: { type: 'request_accepted', id: requestId },
      });
    }

    return { success: true };
  };

  /**
   * Action 3: Decline Friend Request (B declines A's request)
   * Deletes the row entirely — allowing future re-requests
   */
  const declineFriendRequest = async (requestId) => {
    if (!requestId) return { success: false };

    // Remove entirely from local state
    const nextList = friendRequests.filter((r) => String(r.id) !== String(requestId));
    syncFriendRequestsState(nextList);

    // Delete row from Supabase
    try {
      await supabase.from('friend_requests').delete().eq('id', requestId);
    } catch (err) {
      console.debug('Supabase friend request delete error:', err);
    }

    // Broadcast sync event
    if (supabaseChannelRef.current) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'friend_request_sync',
        payload: { type: 'request_declined', id: requestId },
      });
    }

    return { success: true };
  };

  // Get all pending incoming friend requests for the current user
  const incomingFriendRequests = useMemo(() => {
    if (!username) return [];
    const myId = String(myResolvedId).toLowerCase();
    const myUserLower = username.toLowerCase().trim();

    return friendRequests.filter((req) => {
      if (req.status !== 'pending') return false;
      const addId = String(req.addressee_id || req.addressee_username || '').toLowerCase();
      return addId === myId || addId === myUserLower;
    });
  }, [friendRequests, username, myResolvedId]);

  // Robust Send Message
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
    setMessages((prev) => mergeMessageList(prev, newMsg));

    // 1) Send via WebSocket (which enforces server-side friendship check, saves to Supabase & acks)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'message',
          to: toUsername,
          content: trimmedContent,
          tempId: tempId,
        })
      );
    }

    // 2) Client-side persistence attempt
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
          mergeMessageList(prev, {
            id: inserted.id,
            from: inserted.sender_username || username,
            to: inserted.receiver_username || toUsername,
            content: inserted.content || trimmedContent,
            timestamp: inserted.created_at || newMsg.timestamp,
          })
        );
      }
    } catch (err) {
      console.debug('Direct client insert note (handled by backend server):', err);
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

  // Dismiss a single notification
  const dismissNotification = useCallback(
    (id) => {
      saveDismissedNotificationId(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    },
    [saveDismissedNotificationId]
  );

  // Dismiss all notifications
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
        unreadCount: notifications.length + incomingFriendRequests.length,
        dismissNotification,
        markAllNotificationsAsViewed,
        profilesMap,
        profilesList,
        loadProfiles,
        friendRequests,
        incomingFriendRequests,
        getRelationshipWithUser,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        currentUserId: myResolvedId,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook to access WebSocket context
// eslint-disable-next-line react-refresh/only-export-components
export const useWebSocket = () => useContext(WebSocketContext);
