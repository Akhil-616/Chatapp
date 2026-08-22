import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Phone, Video, Info, Mic, Send, Search } from 'lucide-react';

export default function MessagesView({ currentUsername, activeChatUser, setActiveChatUser }) {
  const { messages, sendMessage } = useWebSocket();
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatUser]);

  // Derive conversation list from message history
  const conversationUsers = Array.from(
    new Set(
      messages.flatMap((m) => [
        m.from === currentUsername ? m.to : m.from,
      ]).filter(Boolean)
    )
  );

  // Ensure activeChatUser is in conversation list if selected from directory
  if (activeChatUser && !conversationUsers.includes(activeChatUser)) {
    conversationUsers.unshift(activeChatUser);
  }

  // Filter conversation list by search
  const filteredChatList = conversationUsers.filter((u) =>
    u.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get conversation between current user and selected chat user
  const currentConversation = messages.filter(
    (m) =>
      (m.from === currentUsername && m.to === activeChatUser) ||
      (m.from === activeChatUser && (m.to === currentUsername || !m.to))
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatUser) return;
    sendMessage(activeChatUser, inputText.trim());
    setInputText('');
  };

  const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'U');

  return (
    <div className="flex flex-1 h-screen bg-[#030712] text-white pl-16">
      {/* Left Chat List Column */}
      <div className="w-80 border-r border-gray-900 flex flex-col h-full bg-[#05070a]">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-900/80">
          <h2 className="font-bold text-lg">Messages</h2>
          <span className="text-xs text-gray-500 font-mono">
            {conversationUsers.length} chats
          </span>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto space-y-1 px-2">
          {filteredChatList.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              No conversations yet. Go to Directory to start chatting!
            </div>
          ) : (
            filteredChatList.map((user) => {
              const isSelected = user === activeChatUser;
              // Find last message
              const userMsgs = messages.filter(
                (m) =>
                  (m.from === currentUsername && m.to === user) ||
                  (m.from === user && (m.to === currentUsername || !m.to))
              );
              const lastMsg = userMsgs[userMsgs.length - 1];

              return (
                <button
                  key={user}
                  onClick={() => setActiveChatUser(user)}
                  className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 transition-all ${
                    isSelected
                      ? 'bg-[#161b22] border border-gray-800'
                      : 'hover:bg-gray-900/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs">
                    {getInitials(user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate text-white">
                        {user}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {lastMsg ? lastMsg.content : 'No messages yet'}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      Nepal Academic Network
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
        <div className="flex-1 flex flex-col h-full bg-[#030712]">
          {/* Header */}
          <div className="h-16 px-6 border-b border-gray-900 flex items-center justify-between bg-[#05070a]">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center text-xs">
                {getInitials(activeChatUser)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white leading-tight">
                  {activeChatUser}
                </h3>
                <p className="text-[11px] text-gray-400">
                  Registered Student • Nepal Academic Network
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-gray-400">
              <button className="hover:text-white transition">
                <Phone className="w-4 h-4" />
              </button>
              <button className="hover:text-white transition">
                <Video className="w-4 h-4" />
              </button>
              <button className="hover:text-white transition">
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Empty state / Welcome */}
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center text-xl mb-3 border border-gray-800">
                {getInitials(activeChatUser)}
              </div>
              <h4 className="font-bold text-base text-white">{activeChatUser}</h4>
              <p className="text-xs text-gray-400 mt-0.5">
                @{activeChatUser} • Nepal Academic Network
              </p>
              <p className="text-xs text-gray-500 mt-2 max-w-sm">
                No messages yet. Send a message below to start chatting with {activeChatUser}.
              </p>
            </div>

            {/* Render conversation bubbles */}
            {currentConversation.map((msg, index) => {
              const isMe = msg.from === currentUsername;
              return (
                <div
                  key={index}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-white text-black rounded-br-none font-medium'
                        : 'bg-[#161b22] text-white border border-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.content}</p>
                    {msg.timestamp && (
                      <span
                        className={`block text-[9px] mt-1 text-right ${
                          isMe ? 'text-gray-600' : 'text-gray-500'
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
            className="p-4 bg-[#05070a] border-t border-gray-900 flex items-center space-x-3"
          >
            <button
              type="button"
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-900 transition"
            >
              <Mic className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeChatUser}...`}
              className="flex-1 bg-[#0d1117] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-white text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 hover:bg-gray-200 transition disabled:opacity-40"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
          Select a conversation or open one from the Directory.
        </div>
      )}
    </div>
  );
}