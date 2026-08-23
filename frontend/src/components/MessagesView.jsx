import { useState, useEffect, useRef, useMemo } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { supabase } from '../lib/supabaseClient';
import { Phone, Video, Info, Send, Search, Wifi, WifiOff, Sparkles, MessageSquare } from 'lucide-react';

export default function MessagesView({ currentUsername, activeChatUser, setActiveChatUser }) {
  const { messages, sendMessage, onlineUsers } = useWebSocket();
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePeers, setAvailablePeers] = useState([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const messagesEndRef = useRef(null);

  // Load registered peer profiles from Supabase to populate the conversation list
  useEffect(() => {
    let isMounted = true;
    async function loadPeers() {
      setLoadingPeers(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, campus, department')
          .order('created_at', { ascending: false });

        if (!isMounted) return;
        if (!error && data) {
          const others = data.filter((u) => u.username && u.username.toLowerCase() !== (currentUsername || '').toLowerCase());
          setAvailablePeers(others);
        }
      } catch (err) {
        console.warn('Could not load peer list:', err);
      } finally {
        if (isMounted) setLoadingPeers(false);
      }
    }

    loadPeers();
    return () => {
      isMounted = false;
    };
  }, [currentUsername]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatUser]);

  // Derive conversation list from message history combined with peers
  const curLower = (currentUsername || '').toLowerCase().trim();

  const combinedUsernames = useMemo(() => {
    const messageChatUsers = Array.from(
      new Set(
        messages
          .flatMap((m) => {
            const fromLower = (m.from || '').toLowerCase().trim();
            const toLower = (m.to || '').toLowerCase().trim();
            if (fromLower === curLower && m.to) return [m.to];
            if (toLower === curLower && m.from) return [m.from];
            return [];
          })
          .filter(Boolean)
      )
    );

    const list = [];
    const seenLower = new Set();

    const addUsername = (u) => {
      if (!u) return;
      const lower = u.toLowerCase().trim();
      if (lower === curLower || seenLower.has(lower)) return;
      seenLower.add(lower);
      list.push(u);
    };

    if (activeChatUser) addUsername(activeChatUser);
    messageChatUsers.forEach(addUsername);
    availablePeers.forEach((p) => addUsername(p.username));

    // Sort conversations so peers with the most recent messages appear first
    list.sort((a, b) => {
      const aLower = a.toLowerCase().trim();
      const bLower = b.toLowerCase().trim();

      let aTime = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        const fromLower = (m.from || '').toLowerCase().trim();
        const toLower = (m.to || '').toLowerCase().trim();
        if ((fromLower === curLower && toLower === aLower) || (fromLower === aLower && toLower === curLower)) {
          aTime = new Date(m.timestamp || 0).getTime();
          break;
        }
      }

      let bTime = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        const fromLower = (m.from || '').toLowerCase().trim();
        const toLower = (m.to || '').toLowerCase().trim();
        if ((fromLower === curLower && toLower === bLower) || (fromLower === bLower && toLower === curLower)) {
          bTime = new Date(m.timestamp || 0).getTime();
          break;
        }
      }

      return bTime - aTime;
    });

    return list;
  }, [messages, activeChatUser, availablePeers, curLower]);

  // Auto-select conversation with latest message, or first peer
  useEffect(() => {
    if (!activeChatUser && combinedUsernames.length > 0) {
      setActiveChatUser(combinedUsernames[0]);
    }
  }, [activeChatUser, combinedUsernames, setActiveChatUser]);

  // Filter list by search query
  const filteredChatList = useMemo(() => {
    return combinedUsernames.filter((u) => {
      if (!u) return false;
      const peer = availablePeers.find((p) => p.username?.toLowerCase() === u.toLowerCase());
      const q = searchQuery.toLowerCase();
      return (
        u.toLowerCase().includes(q) ||
        (peer?.full_name && peer.full_name.toLowerCase().includes(q)) ||
        (peer?.campus && peer.campus.toLowerCase().includes(q))
      );
    });
  }, [combinedUsernames, availablePeers, searchQuery]);

  // Get conversation between current user and selected chat user
  const currentConversation = messages.filter((m) => {
    if (!m || !activeChatUser || !currentUsername) return false;
    const fromLower = (m.from || '').toLowerCase().trim();
    const toLower = (m.to || '').toLowerCase().trim();
    const activeLower = activeChatUser.toLowerCase().trim();

    return (
      (fromLower === curLower && toLower === activeLower) ||
      (fromLower === activeLower && (toLower === curLower || !toLower))
    );
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatUser) return;
    sendMessage(activeChatUser, inputText.trim());
    setInputText('');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const activePeerMeta = availablePeers.find((p) => p.username === activeChatUser);

  return (
    <div className="flex flex-1 h-screen bg-[#F6F2EA] text-[#17140F] pl-16 overflow-hidden font-['Inter']">
      {/* Left Chat List Column */}
      <div className="w-80 border-r border-[rgba(23,20,15,0.1)] flex flex-col h-full bg-[#FFFCF5] shrink-0">
        {/* Header */}
        <div className="p-4 px-5 flex items-center justify-between border-b border-[rgba(23,20,15,0.08)]">
          <div className="flex items-center space-x-2">
            <h2 className="font-['Space_Grotesk'] font-bold text-xl text-[#17140F]">Messages</h2>
            <span className="w-2 h-2 rounded-full bg-[#1B6C5D]" />
          </div>
          <span className="text-xs font-['Space_Mono'] font-bold text-[#6B6355] bg-[#FAF6ED] px-2 py-0.5 rounded-md border border-[rgba(23,20,15,0.08)]">
            {filteredChatList.length} chats
          </span>
        </div>

        {/* Search */}
        <div className="p-3.5 border-b border-[rgba(23,20,15,0.06)]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A8275] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.12)] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {filteredChatList.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#8A8275]">
              {loadingPeers ? 'Loading conversations...' : 'No conversations found. Explore the Directory to connect!'}
            </div>
          ) : (
            filteredChatList.map((user) => {
              const isSelected = user === activeChatUser;
              const peerMeta = availablePeers.find((p) => p.username === user);
              const displayName = peerMeta?.full_name || user;

              // Find last message
              const userLower = user.toLowerCase().trim();
              const userMsgs = messages.filter((m) => {
                const fromLower = (m.from || '').toLowerCase().trim();
                const toLower = (m.to || '').toLowerCase().trim();
                return (
                  (fromLower === curLower && toLower === userLower) ||
                  (fromLower === userLower && (toLower === curLower || !toLower))
                );
              });
              const lastMsg = userMsgs[userMsgs.length - 1];
              const isUserInListOnline = onlineUsers.has(user.toLowerCase());

              return (
                <button
                  key={user}
                  onClick={() => setActiveChatUser(user)}
                  className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] shadow-xs'
                      : 'hover:bg-[#FAF6ED]/70 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold flex items-center justify-center text-xs shadow-xs">
                      {getInitials(displayName)}
                    </div>
                    {isUserInListOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#FFFCF5]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-['Space_Grotesk'] font-bold text-sm truncate text-[#17140F]">
                        {displayName}
                      </span>
                      {lastMsg?.timestamp && (
                        <span className="text-[10px] font-['Space_Mono'] text-[#8A8275]">
                          {new Date(lastMsg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6355] truncate mt-0.5">
                      {lastMsg ? lastMsg.content : `Start chatting with @${user}`}
                    </p>
                    <p className="text-[10px] text-[#8A8275] truncate mt-0.5">
                      {peerMeta?.campus || 'Nepal Academic Network'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      {activeChatUser ? (
        <div className="flex-1 flex flex-col h-full bg-[#F6F2EA]">
          {/* Top Bar with Center Online Status Bar */}
          <div className="h-18 px-6 border-b border-[rgba(23,20,15,0.1)] flex items-center justify-between bg-[#FFFCF5] shadow-xs">
            {/* Left: User Profile Info */}
            <div className="flex items-center space-x-3.5 min-w-0 max-w-[32%]">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold flex items-center justify-center text-xs shadow-xs">
                  {getInitials(activePeerMeta?.full_name || activeChatUser)}
                </div>
                {activeChatUser && onlineUsers.has(activeChatUser.toLowerCase()) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#FFFCF5]" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-['Space_Grotesk'] font-bold text-base text-[#17140F] leading-tight truncate">
                  {activePeerMeta?.full_name || activeChatUser}
                </h3>
                <p className="text-xs text-[#6B6355] truncate font-medium">
                  @{activeChatUser} • {activePeerMeta?.campus || 'Nepal Academic Network'}
                </p>
              </div>
            </div>

            {/* CENTER: Online Status Bar (Reflects target user's online state from WebSocket map) */}
            {(() => {
              const isTargetOnline = Boolean(activeChatUser && onlineUsers.has(activeChatUser.toLowerCase()));
              return (
                <div className="flex items-center justify-center px-3">
                  <div
                    className={`px-3.5 py-1.5 rounded-full flex items-center space-x-2 text-xs font-['Space_Mono'] font-bold border transition-all duration-300 shadow-2xs ${
                      isTargetOnline
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-[#FAF6ED] border-[rgba(23,20,15,0.12)] text-[#8A8275]'
                    }`}
                  >
                    {/* Green Light if target user is online, otherwise Gray/Muted */}
                    <div className="relative flex items-center justify-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                          isTargetOnline
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse'
                            : 'bg-neutral-400'
                        }`}
                      />
                      {isTargetOnline && (
                        <span className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-ping" />
                      )}
                    </div>

                    {/* Status Label */}
                    <span className="tracking-tight text-[11px] uppercase">
                      {isTargetOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>

                    {/* Live Icon Badge */}
                    {isTargetOnline ? (
                      <Wifi className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-[#8A8275] ml-0.5" />
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Right: Action Buttons (Call, Video Call, Info) */}
            <div className="flex items-center space-x-2 text-[#6B6355]">
              <button
                type="button"
                className="p-2.5 rounded-xl border border-[rgba(23,20,15,0.1)] hover:border-[rgba(23,20,15,0.2)] bg-[#FAF6ED] hover:bg-[#F2ECDE] hover:text-[#17140F] transition shadow-2xs cursor-pointer"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl border border-[rgba(23,20,15,0.1)] hover:border-[rgba(23,20,15,0.2)] bg-[#FAF6ED] hover:bg-[#F2ECDE] hover:text-[#17140F] transition shadow-2xs cursor-pointer"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-2.5 rounded-xl border border-[rgba(23,20,15,0.1)] hover:border-[rgba(23,20,15,0.2)] bg-[#FAF6ED] hover:bg-[#F2ECDE] hover:text-[#17140F] transition shadow-2xs cursor-pointer"
                title="Conversation Details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Empty state / Welcome */}
            {currentConversation.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.12)] text-[#17140F] font-['Space_Grotesk'] font-bold flex items-center justify-center text-xl mb-3 shadow-xs">
                  {getInitials(activePeerMeta?.full_name || activeChatUser)}
                </div>
                <h4 className="font-['Space_Grotesk'] font-bold text-lg text-[#17140F]">
                  {activePeerMeta?.full_name || activeChatUser}
                </h4>
                <p className="text-xs text-[#6B6355] mt-0.5">
                  @{activeChatUser} • {activePeerMeta?.campus || 'Nepal Academic Network'}
                </p>
                <div className="mt-4 p-4 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] shadow-xs max-w-md text-xs text-[#6B6355] flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-[#EFA23D] shrink-0" />
                  <span>
                    Direct end-to-end synchronized chat stream. Type a message below to start chatting with {activeChatUser}.
                  </span>
                </div>
              </div>
            )}

            {/* Render conversation bubbles */}
            {currentConversation.map((msg, index) => {
              const isMe = (msg.from || '').toLowerCase().trim() === curLower;
              return (
                <div
                  key={msg.id || index}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-[#17140F] text-[#FFFCF5] rounded-br-xs shadow-xs font-normal'
                        : 'bg-[#FFFCF5] text-[#17140F] border border-[rgba(23,20,15,0.12)] rounded-bl-xs shadow-xs font-normal'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.timestamp && (
                      <span
                        className={`block text-[10px] font-['Space_Mono'] mt-1 text-right ${
                          isMe ? 'text-[#EFE9DC]/70' : 'text-[#8A8275]'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSend}
            className="p-4 px-6 bg-[#FFFCF5] border-t border-[rgba(23,20,15,0.1)] flex items-center space-x-3 shadow-sm"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activePeerMeta?.full_name || activeChatUser}...`}
              className="flex-1 bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-3 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition font-['Inter']"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-[#17140F] text-[#FFFCF5] px-5 py-3 rounded-xl text-xs font-['Space_Grotesk'] font-bold flex items-center space-x-2 hover:bg-[#2b2519] transition disabled:opacity-40 shadow-xs cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-[#8A8275] text-sm bg-[#F6F2EA] p-8">
          <div className="w-12 h-12 rounded-full bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] flex items-center justify-center text-[#17140F] mb-3 shadow-xs">
            <MessageSquare className="w-5 h-5 text-[#1B6C5D]" />
          </div>
          <p className="font-['Space_Grotesk'] font-bold text-base text-[#17140F]">No Active Conversation</p>
          <p className="text-xs text-[#6B6355] mt-1">Select a student from the left or open one from the Directory to start messaging.</p>
        </div>
      )}
    </div>
  );
}
