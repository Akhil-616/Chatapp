import React, { useState, useEffect, useRef } from "react";
import { 
  AppSection, 
  Contact, 
  AppNotification, 
  ChatMessage, 
  UniversityMatchProfile 
} from "@/src/types";
import { 
  INITIAL_CONTACTS, 
  INITIAL_NOTIFICATIONS, 
  UNIVERSITY_MATCH_PROFILES 
} from "@/src/data/mockData";
import { 
  RealtimeChatManager, 
  RealtimeMessagePayload,
  realtimeBus
} from "@/src/lib/realtime";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Search, 
  Bell, 
  User, 
  Sparkles, 
  Send, 
  Heart, 
  Users, 
  Check, 
  X, 
  ArrowLeft,
  CheckCheck,
  Compass,
  Phone,
  Video,
  Mic,
  Play,
  Pause,
  GraduationCap,
  Info,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Settings
} from "lucide-react";
import confetti from "canvas-confetti";

interface AppViewProps {
  onBackToLanding: () => void;
}

export const AppView: React.FC<AppViewProps> = ({ onBackToLanding }) => {
  const [currentSection, setCurrentSection] = useState<AppSection>("messages");
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [selectedContact, setSelectedContact] = useState<Contact>(INITIAL_CONTACTS[0]);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [searchFilter, setSearchFilter] = useState("");
  const [typedMessage, setTypedMessage] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [showRightInspector, setShowRightInspector] = useState(false);
  const [isCallActive, setIsCallActive] = useState<"voice" | "video" | null>(null);
  const [callDuration, setCallDuration] = useState(0);

  // Filter for matching section
  const [selectedNicheFilter, setSelectedNicheFilter] = useState<string | null>(null);
  const [matchingScope, setMatchingScope] = useState<"all" | "Same Campus" | "Cross-University">("all");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const realtimeManagerRef = useRef<RealtimeChatManager | null>(null);

  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
    'user-akhil': [
      { 
        id: '1', 
        senderId: 'user-akhil', 
        receiverId: 'me', 
        content: 'Hey! The routing table lookup is completely optimized now.', 
        timestamp: '10:14 AM', 
        status: 'read', 
        isMe: false 
      },
      { 
        id: '2', 
        senderId: 'me', 
        receiverId: 'user-akhil', 
        content: 'Awesome! Did you test message persistence as well?', 
        timestamp: '10:15 AM', 
        status: 'read', 
        isMe: true 
      },
      { 
        id: '3', 
        senderId: 'user-akhil', 
        receiverId: 'me', 
        content: 'Yes, everything works reliably even during network drops.', 
        timestamp: '10:16 AM', 
        status: 'read', 
        isMe: false 
      },
      {
        id: '4',
        senderId: 'user-akhil',
        receiverId: 'me',
        content: 'Check out this quick voice note about the distributed architecture implementation.',
        timestamp: '10:18 AM',
        status: 'read',
        isMe: false,
        type: 'voice',
        voiceDuration: '0:22',
        voiceWaveform: [14, 24, 18, 28, 22, 16, 26, 12, 20, 30, 24, 18, 22, 14]
      }
    ],
    'user-sirjan': [
      { 
        id: '1', 
        senderId: 'user-sirjan', 
        receiverId: 'me', 
        content: 'Would you like to review the updated typography and layout guidelines?', 
        timestamp: 'Yesterday', 
        status: 'read', 
        isMe: false 
      },
      { 
        id: '2', 
        senderId: 'me', 
        receiverId: 'user-sirjan', 
        content: 'Yes, generous line spacing and spacious hierarchy make it much easier to read.', 
        timestamp: 'Yesterday', 
        status: 'read', 
        isMe: true 
      }
    ],
    'user-priya': [
      {
        id: '1',
        senderId: 'user-priya',
        receiverId: 'me',
        content: 'Hey, I just pushed the study group notes for our upcoming engineering project.',
        timestamp: '2 hours ago',
        status: 'read',
        isMe: false
      }
    ]
  });

  // Voice playback auto-stop timer
  useEffect(() => {
    let timer: number;
    if (playingVoiceId) {
      timer = window.setInterval(() => {
        setPlayingVoiceId(null);
      }, 12000);
    }
    return () => clearInterval(timer);
  }, [playingVoiceId]);

  // Realtime channel listener
  useEffect(() => {
    const manager = new RealtimeChatManager();
    realtimeManagerRef.current = manager;

    manager.initChannel(
      selectedContact.id,
      (incoming: RealtimeMessagePayload) => {
        const newMsg: ChatMessage = {
          id: incoming.id,
          senderId: incoming.senderId,
          receiverId: incoming.receiverId,
          content: incoming.content,
          timestamp: incoming.timestamp,
          status: 'read',
          isMe: false,
          type: incoming.type || 'text'
        };

        setChatHistories(prev => ({
          ...prev,
          [incoming.senderId]: [...(prev[incoming.senderId] || []), newMsg]
        }));
      }
    );

    return () => {
      manager.cleanup();
    };
  }, [selectedContact.id]);

  // Connect and sync history and live presence from WebSocket
  useEffect(() => {
    const unsubHistory = realtimeBus.subscribeHistory((messages) => {
      setChatHistories(prev => {
        const next = { ...prev };
        messages.forEach(m => {
          const peerKey = m.senderId === 'me' || m.senderId === 'aayush_s' 
            ? (m.receiverId.startsWith('user-') ? m.receiverId : `user-${m.receiverId}`) 
            : (m.senderId.startsWith('user-') ? m.senderId : `user-${m.senderId}`);
          
          if (!next[peerKey]) next[peerKey] = [];
          const exists = next[peerKey].some(existing => existing.content === m.content && existing.timestamp === m.timestamp);
          if (!exists) {
            next[peerKey].push({
              id: m.id,
              senderId: m.senderId,
              receiverId: m.receiverId,
              content: m.content,
              timestamp: m.timestamp,
              status: 'read',
              isMe: m.senderId === 'me' || m.senderId === 'aayush_s',
              type: 'text'
            });
          }
        });
        return next;
      });
    });

    const unsubPresence = realtimeBus.subscribePresence((onlineUsers) => {
      setContacts(prev => prev.map(c => {
        const handleName = c.handle.replace('@', '').toLowerCase();
        const rawId = c.id.replace('user-', '').toLowerCase();
        const isOnline = onlineUsers.some(u => {
          const lower = u.toLowerCase();
          return lower === handleName || lower === rawId || lower === rawId.replace('-', '_');
        });
        return {
          ...c,
          status: isOnline ? 'online' : c.status
        };
      }));
    });

    return () => {
      unsubHistory();
      unsubPresence();
    };
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistories, selectedContact.id]);

  // Call timer simulation
  useEffect(() => {
    let timer: number;
    if (isCallActive) {
      timer = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const activeMessages = chatHistories[selectedContact.id] || [
    { 
      id: 'init', 
      senderId: selectedContact.id, 
      receiverId: 'me', 
      content: selectedContact.lastMessage, 
      timestamp: selectedContact.lastMessageTime, 
      status: 'read', 
      isMe: false 
    }
  ];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typedMessage.trim()) return;

    const messageContent = typedMessage.trim();
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgId = `msg-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: msgId,
      senderId: 'me',
      receiverId: selectedContact.id,
      content: messageContent,
      timestamp: timestampStr,
      status: 'delivered',
      isMe: true
    };

    setChatHistories(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
    }));

    setTypedMessage("");

    if (realtimeManagerRef.current) {
      realtimeManagerRef.current.sendMessage({
        id: msgId,
        senderId: 'me',
        receiverId: selectedContact.id,
        content: messageContent,
        timestamp: timestampStr,
        type: 'text'
      });
    }

    // Interactive reply simulation
    setTimeout(() => {
      const replies = [
        `Got it! Let's continue working on this together.`,
        `Sounds good. I will check the syllabus notes and share the updates shortly.`,
        `That works perfectly. Let's sync up in the library study lounge.`
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        senderId: selectedContact.id,
        receiverId: 'me',
        content: randomReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        isMe: false
      };

      setChatHistories(prev => ({
        ...prev,
        [selectedContact.id]: [...(prev[selectedContact.id] || []), replyMsg]
      }));
    }, 1100);
  };

  const handleSendVoiceNote = () => {
    setIsVoiceRecording(false);
    const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const voiceMsg: ChatMessage = {
      id: `voice-${Date.now()}`,
      senderId: 'me',
      receiverId: selectedContact.id,
      content: 'Voice note recorded',
      timestamp: timestampStr,
      status: 'delivered',
      isMe: true,
      type: 'voice',
      voiceDuration: '0:14',
      voiceWaveform: [10, 18, 26, 14, 22, 30, 20, 16, 24, 18, 12]
    };

    setChatHistories(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), voiceMsg]
    }));
  };

  const handleNotificationAction = (id: string, action: 'accept' | 'reject') => {
    setNotifications(prev =>
      prev.map(notif => {
        if (notif.id === id) {
          return {
            ...notif,
            status: action === 'accept' ? 'accepted' : 'rejected'
          };
        }
        return notif;
      })
    );
    if (action === 'accept') {
      try {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.major.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.university.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.sharedInterests.some(i => i.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredMatchingProfiles = UNIVERSITY_MATCH_PROFILES.filter(p => {
    if (selectedNicheFilter && !p.interests.some(i => i.toLowerCase().includes(selectedNicheFilter.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const formatCallTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const sidebarNavItems = [
    { id: "messages" as AppSection, label: "Messages", icon: MessageSquare, badge: null },
    { id: "matching" as AppSection, label: "Matches", icon: Compass, badge: null },
    { id: "notifications" as AppSection, label: "Notifications", icon: Bell, badge: notifications.filter(n => n.status === 'pending').length },
    { id: "search" as AppSection, label: "Directory", icon: Search, badge: null },
    { id: "profile" as AppSection, label: "Profile", icon: User, badge: null },
  ];

  return (
    <div className="flex h-screen w-full bg-[#070709] text-zinc-100 font-sans overflow-hidden antialiased selection:bg-zinc-800 selection:text-white">
      
      {/* ─────────────────────────────────────────────────────────────
          SIDEBAR WITH OVERLAY HOVER EXPANSION (DOES NOT PUSH CHAT)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-[76px] shrink-0 h-full relative z-40">
        <motion.aside
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          initial={false}
          animate={{ width: isSidebarHovered ? 250 : 76 }}
          transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-y-0 left-0 bg-[#050508] shadow-2xl flex flex-col justify-between h-full select-none"
        >
          {/* Top: Brand Header */}
          <div className="h-16 px-4 flex items-center gap-3.5 shrink-0">
            <div 
              onClick={onBackToLanding}
              className="flex items-center gap-3.5 cursor-pointer group overflow-hidden w-full"
            >
              <div className="w-10 h-10 rounded-2xl bg-white text-black font-bold text-base flex items-center justify-center shrink-0 shadow-md">
                SP
              </div>
              {isSidebarHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-col min-w-0 overflow-hidden"
                >
                  <span className="font-bold text-base text-white tracking-tight group-hover:text-zinc-300 transition-colors truncate whitespace-nowrap">
                    Sajilo Patra
                  </span>
                  <span className="text-xs text-zinc-400 truncate whitespace-nowrap">
                    University Network
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Center: Navigation Items with Active Indicator */}
          <nav className="p-3 space-y-2 flex-grow overflow-y-auto overflow-x-hidden">
            {sidebarNavItems.map((item) => {
              const isActive = currentSection === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentSection(item.id)}
                  className={`w-full relative flex items-center gap-4 px-3.5 py-3.5 rounded-2xl text-[15px] font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                  }`}
                  title={!isSidebarHovered ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute inset-0 bg-zinc-900 rounded-2xl -z-10 shadow-sm"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}

                  <Icon className={`w-6 h-6 shrink-0 transition-colors ${isActive ? "text-white" : "text-zinc-400"}`} />

                  {isSidebarHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -4 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="truncate flex-grow text-left leading-none whitespace-nowrap text-[15px]"
                    >
                      {item.label}
                    </motion.span>
                  )}

                  {item.badge && item.badge > 0 && (
                    <span className={`rounded-full bg-zinc-700 text-white text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      isSidebarHovered ? "w-5 h-5 ml-auto" : "w-2.5 h-2.5 absolute top-3 right-3 bg-zinc-400"
                    }`}>
                      {isSidebarHovered ? item.badge : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom: Settings & Back to Landing */}
          <div className="p-3 space-y-2 overflow-hidden">
            <button
              onClick={() => setCurrentSection("profile")}
              className={`w-full flex items-center gap-4 px-3.5 py-3 rounded-2xl text-[14px] font-medium transition-colors cursor-pointer ${
                currentSection === "profile"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
              title={!isSidebarHovered ? "Settings" : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {isSidebarHovered && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="truncate whitespace-nowrap text-[14px]"
                >
                  Settings
                </motion.span>
              )}
            </button>

            <button
              onClick={onBackToLanding}
              className="w-full flex items-center gap-4 px-3.5 py-3 rounded-2xl text-[14px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors cursor-pointer"
              title={!isSidebarHovered ? "Return to Home" : undefined}
            >
              <ArrowLeft className="w-5 h-5 shrink-0" />
              {isSidebarHovered && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="truncate whitespace-nowrap text-[14px]"
                >
                  Home Page
                </motion.span>
              )}
            </button>
          </div>
        </motion.aside>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT VIEW AREA
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-grow flex h-full overflow-hidden bg-[#070709] relative">

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1: MESSAGES (SPACIOUS INSTAGRAM-STYLE SIZING)
            ═══════════════════════════════════════════════════════════ */}
        {currentSection === "messages" && (
          <div className="flex w-full h-full">
            
            {/* Conversations Column - ONLY border-r to divide users and chat */}
            <div className="w-[340px] lg:w-[370px] min-w-[320px] border-r border-zinc-800/80 flex flex-col h-full bg-[#060609] select-none shrink-0">
              
              {/* Header */}
              <div className="h-16 px-5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Messages
                </h2>
                <span className="text-xs text-zinc-400 font-medium">
                  {filteredContacts.length} chats
                </span>
              </div>

              {/* Search Sub-Header */}
              <div className="px-4 pb-2 bg-[#060609]">
                <div className="bg-zinc-900/70 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-sm focus-within:bg-zinc-900 transition-colors">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-transparent border-none text-white outline-none text-sm placeholder:text-zinc-500 leading-normal"
                  />
                </div>
              </div>

              {/* Contacts List */}
              <div className="flex-grow overflow-y-auto p-2.5 space-y-1">
                {filteredContacts.map(contact => {
                  const isSelected = selectedContact.id === contact.id;
                  const initials = contact.name.split(' ').map(n => n[0]).join('');

                  return (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all duration-150 flex items-center gap-3.5 ${
                        isSelected
                          ? "bg-zinc-900 text-white shadow-sm"
                          : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {/* Avatar (Larger Instagram-style Avatar) */}
                      <div className="shrink-0">
                        <div className={`w-13 h-13 rounded-full flex items-center justify-center font-bold text-base ${
                          isSelected ? "bg-white text-black" : "bg-zinc-800 text-zinc-200"
                        }`}>
                          {initials}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-baseline justify-between mb-0.5">
                          <h4 className="font-semibold text-[15px] text-white truncate">
                            {contact.name}
                          </h4>
                          <span className="text-xs text-zinc-500 shrink-0 ml-2 font-normal">
                            {contact.lastMessageTime}
                          </span>
                        </div>
                        <div className="text-[13px] text-zinc-400 truncate leading-relaxed">
                          {contact.lastMessage}
                        </div>
                        <div className="text-xs text-zinc-500 truncate mt-0.5">
                          {contact.university}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Chat Conversation Area */}
            <div className="flex-grow flex flex-col bg-[#040407] h-full relative overflow-hidden">
              
              {/* Chat Header */}
              <div className="h-16 px-5 sm:px-6 bg-[#070709]/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center shrink-0">
                    {selectedContact.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white tracking-tight">
                      {selectedContact.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-normal">
                      {selectedContact.major} • {selectedContact.university}
                    </p>
                  </div>
                </div>

                {/* Calling & Info Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCallActive("voice")}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Start Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsCallActive("video")}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                    title="Start Video Room"
                  >
                    <Video className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setShowRightInspector(prev => !prev)}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      showRightInspector
                        ? "bg-white text-black"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                    title="Toggle Student Details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Live Call Banner */}
              <AnimatePresence>
                {isCallActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-900 border-b border-zinc-800 px-6 py-3 flex items-center justify-between z-20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 text-white flex items-center justify-center">
                        {isCallActive === "voice" ? <Phone className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">
                          Active {isCallActive === "voice" ? "Voice Call" : "Video Room"} with {selectedContact.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          Duration: {formatCallTime(callDuration)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCallActive(null)}
                      className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                    >
                      End Call
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Message Stream */}
              <div className="flex-grow p-6 sm:p-10 overflow-y-auto space-y-6">
                {activeMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                  >
                    {/* Voice Note Bubble */}
                    {msg.type === "voice" ? (
                      <div
                        className={`px-5 py-4 rounded-2xl max-w-md flex items-center gap-4 ${
                          msg.isMe
                            ? "bg-white text-black rounded-tr-sm"
                            : "bg-zinc-900 border border-zinc-800 text-white rounded-tl-sm"
                        }`}
                      >
                        <button
                          onClick={() => setPlayingVoiceId(playingVoiceId === msg.id ? null : msg.id)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                            msg.isMe ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"
                          }`}
                        >
                          {playingVoiceId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 h-6">
                            {(msg.voiceWaveform || [12, 20, 16, 24, 18, 14, 22, 10, 18]).map((h, i) => {
                              const isThisPlaying = playingVoiceId === msg.id;
                              return (
                                <motion.div
                                  key={i}
                                  animate={isThisPlaying ? {
                                    height: [`${Math.max(4, h * 0.3)}px`, `${h}px`, `${Math.max(4, h * 0.4)}px`]
                                  } : { height: `${h}px` }}
                                  transition={isThisPlaying ? {
                                    repeat: Infinity,
                                    duration: 0.7 + (i % 3) * 0.2,
                                    ease: "easeInOut"
                                  } : { duration: 0.15 }}
                                  className={`w-1 rounded-full ${msg.isMe ? "bg-black" : "bg-white"}`}
                                />
                              );
                            })}
                          </div>
                          <span className={`text-xs font-semibold ${msg.isMe ? "text-zinc-700" : "text-zinc-400"}`}>
                            {playingVoiceId === msg.id ? "Playing Voice Note..." : `Voice Note (${msg.voiceDuration || "0:18"})`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Text Message Bubble */
                      <div
                        className={`max-w-xl px-5 py-3 rounded-2xl text-sm sm:text-base leading-relaxed ${
                          msg.isMe
                            ? "bg-white text-black font-normal rounded-tr-sm"
                            : "bg-zinc-900 text-zinc-100 rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center gap-1.5 mt-1.5 px-1 text-xs text-zinc-500 font-normal">
                      <span>{msg.timestamp}</span>
                      {msg.isMe && <CheckCheck className="w-3.5 h-3.5 text-zinc-400" />}
                    </div>
                  </motion.div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar - Seamless & Clean */}
              <div className="px-4 py-3 sm:px-6 sm:py-3 bg-[#040407]">
                
                {isVoiceRecording ? (
                  <div className="bg-zinc-900 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <Mic className="w-4 h-4 text-white" />
                      <span className="text-xs sm:text-sm font-medium text-zinc-200">
                        Recording Voice Clip...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsVoiceRecording(false)}
                        className="px-3 py-1 text-xs text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendVoiceNote}
                        className="px-3.5 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 cursor-pointer"
                      >
                        Send Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <form 
                    onSubmit={handleSendMessage}
                    className="bg-zinc-900/80 rounded-2xl px-4 py-2.5 flex items-center gap-3 focus-within:bg-zinc-900 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setIsVoiceRecording(true)}
                      className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-zinc-800 shrink-0"
                      title="Record Voice Note"
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder={`Message ${selectedContact.name}...`}
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      className="bg-transparent border-none text-white outline-none w-full text-sm placeholder:text-zinc-500 leading-normal"
                    />

                    <button
                      type="submit"
                      disabled={!typedMessage.trim()}
                      className="h-8 px-3.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>Send</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}

              </div>

            </div>

            {/* Student Info Inspector (Collapsible Right Side) */}
            <AnimatePresence>
              {showRightInspector && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 320, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="w-80 min-w-[320px] bg-[#060609] border-l border-zinc-800/80 p-6 flex flex-col h-full overflow-y-auto space-y-6 select-none z-10"
                >
                  <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-white text-black font-bold text-base flex items-center justify-center">
                        {selectedContact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white">
                          {selectedContact.name}
                        </h4>
                        <p className="text-xs text-zinc-400">
                          {selectedContact.university}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-900 space-y-2 text-xs leading-relaxed text-zinc-300">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Major:</span>
                        <span className="font-medium text-white">{selectedContact.major}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Campus:</span>
                        <span className="font-medium text-white">{selectedContact.university}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shared Interests */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-zinc-300">
                      Shared Focus Tags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.sharedInterests.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-950 border border-zinc-800 text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2: UNIVERSITY MATCHING
            ═══════════════════════════════════════════════════════════ */}
        {currentSection === "matching" && (
          <div className="w-full h-full overflow-y-auto p-8 sm:p-14 bg-[#070709] flex justify-center">
            <div className="max-w-4xl w-full space-y-10">
              
              {/* Header */}
              <div className="space-y-2 pb-6 border-b border-zinc-800">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  University Interest Matches
                </h1>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                  Connect with students across campuses who share your exact coursework, technical interests, and study focus.
                </p>
              </div>

              {/* Tag Filters */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-zinc-400">Filter by Study Focus</div>
                <div className="flex flex-wrap gap-2.5">
                  {["All", "Distributed Systems", "Machine Learning", "React", "WebSockets", "Dither Shaders", "Algorithms"].map((niche, idx) => {
                    const isSelected = (niche === "All" && !selectedNicheFilter) || selectedNicheFilter === niche;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedNicheFilter(niche === "All" ? null : niche)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-white text-black border-white shadow-sm"
                            : "bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white"
                        }`}
                      >
                        {niche}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Profiles */}
              <div className="divide-y divide-zinc-800/80 border-y border-zinc-800/80">
                {filteredMatchingProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="py-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-zinc-950/40 p-4 -mx-4 rounded-2xl transition-all"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-14 h-14 rounded-full object-cover border border-zinc-800 shrink-0"
                      />

                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-lg text-white">
                            {profile.name}
                          </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-zinc-400 leading-normal">
                          {profile.major} • {profile.year} • <span className="text-zinc-200 font-medium">{profile.university}</span>
                        </p>

                        <p className="text-sm text-zinc-300 leading-relaxed max-w-xl">
                          "{profile.bio}"
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                      <div className="flex flex-wrap gap-2 text-xs">
                        {profile.interests.map((interest, iIdx) => (
                          <span key={iIdx} className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                            {interest}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentSection("messages")}
                        className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                      >
                        Message Student
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3: NOTIFICATIONS
            ═══════════════════════════════════════════════════════════ */}
        {currentSection === "notifications" && (
          <div className="w-full h-full overflow-y-auto p-8 sm:p-14 bg-[#070709] flex justify-center">
            <div className="max-w-2xl w-full space-y-8">
              
              <div className="pb-4 border-b border-zinc-800">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Notifications
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Updates on connection requests and mentions.
                </p>
              </div>

              <div className="divide-y divide-zinc-800 border-y border-zinc-800">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="py-5 px-3 flex items-start gap-4 hover:bg-zinc-950/60 rounded-xl transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-0.5">
                      {notif.type === 'friend_request' && <User className="w-5 h-5" />}
                      {notif.type === 'like' && <Heart className="w-5 h-5" />}
                      {notif.type === 'mention' && <Users className="w-5 h-5" />}
                      {notif.type === 'security' && <Info className="w-5 h-5" />}
                      {notif.type === 'match_found' && <Sparkles className="w-5 h-5" />}
                    </div>

                    <div className="flex-grow space-y-1.5 text-left">
                      <div className="text-sm text-zinc-200 leading-relaxed">
                        <span className="font-bold text-white">{notif.userName}</span>{" "}
                        <span>{notif.actionText}</span>
                        {notif.messagePreview && (
                          <span className="italic text-zinc-400 ml-1">"{notif.messagePreview}"</span>
                        )}
                      </div>

                      <div className="text-xs text-zinc-500 font-normal">
                        {notif.timeAgo}
                      </div>

                      {notif.type === 'friend_request' && notif.status === 'pending' && (
                        <div className="flex gap-2.5 pt-2">
                          <button
                            onClick={() => handleNotificationAction(notif.id, 'accept')}
                            className="px-4 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleNotificationAction(notif.id, 'reject')}
                            className="px-4 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4: STUDENT DIRECTORY
            ═══════════════════════════════════════════════════════════ */}
        {currentSection === "search" && (
          <div className="w-full h-full overflow-y-auto p-8 sm:p-14 bg-[#070709] flex justify-center">
            <div className="max-w-4xl w-full space-y-8">
              
              <div className="space-y-2 pb-6 border-b border-zinc-800">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Student Directory
                </h1>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Browse and connect with peers across universities.
                </p>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 text-sm focus-within:border-zinc-600 transition-colors">
                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by student name, major, or university..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full bg-transparent border-none text-white outline-none text-sm placeholder:text-zinc-500 leading-normal"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4 hover:border-zinc-700 transition-all text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-white text-black font-semibold text-base flex items-center justify-center shrink-0">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-white">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-zinc-400 leading-normal">
                          {contact.university}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Major: <span className="text-white font-medium">{contact.major}</span>
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {contact.sharedInterests.map((interest, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full text-xs bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {interest}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setCurrentSection("messages");
                      }}
                      className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      Open Conversation
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5: PROFILE
            ═══════════════════════════════════════════════════════════ */}
        {currentSection === "profile" && (
          <div className="w-full h-full overflow-y-auto p-8 sm:p-14 bg-[#070709] flex justify-center">
            <div className="max-w-xl w-full space-y-8 text-left">
              
              <div className="pb-6 border-b border-zinc-800">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  Student Profile
                </h1>
                <p className="text-sm text-zinc-400 mt-1">
                  Manage your public details and university affiliation.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white text-black font-bold text-xl flex items-center justify-center shrink-0">
                    SP
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Student Account</h3>
                    <p className="text-xs text-zinc-400">Kathmandu University • Computer Engineering</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-900 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      defaultValue="Student Developer"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">University</label>
                    <input
                      type="text"
                      defaultValue="Kathmandu University"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Bio</label>
                    <textarea
                      rows={3}
                      defaultValue="Studying distributed systems and real-time networking. Looking for study partners and hackathon teammates."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-zinc-600 leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    try {
                      confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
                    } catch (e) {}
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

    </div>
  );
};
