import { useState, useRef } from 'react';
import { Send, Code2, Sparkles, CheckCheck, Wifi, ArrowUpRight } from 'lucide-react';

export default function RealtimeShowcaseSection() {
  const containerRef = useRef(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'aashma',
      name: 'Aashma Shrestha',
      initials: 'AS',
      text: "Hey! Are you coming to Islington's Carnival next week?",
      time: '11:42 PM',
      isMe: false,
    },
  ]);
  const [isTyping, setIsTyping] = useState(true);

  // 3D perspective tilt
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'me',
      name: 'You',
      initials: 'ME',
      text: typedMessage.trim(),
      time: 'Just now',
      isMe: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setTypedMessage('');
    setIsTyping(false);

    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'aashma',
            name: 'Aashma Shrestha',
            initials: 'AS',
            text: 'Great! Just invited you to the circle thread 🚀',
            time: 'Just now',
            isMe: false,
          },
        ]);
        setIsTyping(false);
      }, 1100);
    }, 700);
  };

  return (
    <section className="py-16 px-6 sm:px-12 max-w-[1180px] mx-auto">
      {/* Eyebrow & Heading */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="cj-eyebrow mb-3">
          <span className="cj-status-dot"></span>
          REAL-TIME INTERACTION MESH
        </div>
        <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold tracking-tight text-[#17140F]">
          Talk your way.<br />Instant DMs, group chats, and circle threads.
        </h2>
        <p className="text-sm sm:text-base text-[#6B6355] mt-2.5">
          Low-latency WebSocket peer frames, typing indicators, and live campus circle indicators.
        </p>
      </div>

      {/* 3D Tilt Container */}
      <div style={{ perspective: '1200px' }} className="w-full">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setRotate({ x: 0, y: 0 });
          }}
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${isHovered ? 1.01 : 1}, ${isHovered ? 1.01 : 1}, 1)`,
            transition: isHovered ? 'transform 0.12s ease-out' : 'transform 0.4s ease-out',
          }}
          className="rounded-3xl border border-[rgba(23,20,15,0.14)] bg-[#FFFCF5] p-4 sm:p-6 shadow-xl relative select-none"
        >
          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 mb-4 rounded-xl bg-[#F2ECDE] border border-[rgba(23,20,15,0.1)] text-xs font-['Space_Mono'] text-[#6B6355]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EFA23D]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#1B6C5D]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#17140F]" />
              </div>
              <span className="ml-2 font-bold text-[#17140F]">
                connectjutti : mesh_router.js & student_stream.jsx
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex text-[11px] text-[#1B6C5D] font-semibold items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                WSS: CONNECTED (Port 3000)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFCF5] text-[#17140F] border border-[rgba(23,20,15,0.1)]">
                Live Preview
              </span>
            </div>
          </div>

          {/* Dual-Pane Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Pane: Code & Architecture */}
            <div className="lg:col-span-6 bg-[#17140F] rounded-2xl p-5 font-['Space_Mono'] text-xs text-[#FFFCF5] flex flex-col justify-between overflow-hidden shadow-inner min-h-[360px] text-left">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2 text-white">
                    <Code2 className="w-4 h-4 text-[#EFA23D]" />
                    <span className="font-bold">src/ws/meshRouter.js</span>
                  </div>
                  <span className="text-zinc-400">ESM · Node.js</span>
                </div>

                <div className="space-y-1 text-zinc-300 leading-relaxed overflow-x-auto text-[11px] sm:text-xs">
                  <p className="text-[#EFA23D]">// 1. Direct O(1) Memory Lookup Table</p>
                  <p><span className="text-pink-400">const</span> clientRegistry = <span className="text-pink-400">new</span> <span className="text-amber-300">Map</span>();</p>
                  <br />
                  <p><span className="text-pink-400">async function</span> <span className="text-blue-300">routePeerPacket</span>(sender, target, payload) &#123;</p>
                  <p className="pl-4 text-zinc-400">// Verify active session token</p>
                  <p className="pl-4"><span className="text-pink-400">const</span> valid = <span className="text-pink-400">await</span> auth.<span className="text-blue-300">verifyJWT</span>(sender.token);</p>
                  <p className="pl-4 text-zinc-400">// Instant memory dispatch</p>
                  <p className="pl-4"><span className="text-pink-400">const</span> targetSock = clientRegistry.<span className="text-blue-300">get</span>(target.username);</p>
                  <p className="pl-4"><span className="text-pink-400">if</span> (targetSock &amp;&amp; targetSock.readyState === <span className="text-emerald-400">OPEN</span>) &#123;</p>
                  <p className="pl-8">targetSock.<span className="text-blue-300">send</span>(JSON.<span className="text-blue-300">stringify</span>(payload));</p>
                  <p className="pl-4">&#125;</p>
                  <p>&#125;</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                <span className="text-[#EFA23D] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Latency: 0.8ms • Zero Packet Loss
                </span>
                <span>UTF-8 · Ln 18, Col 4</span>
              </div>
            </div>

            {/* Right Pane: Live Chat Stream Mockup */}
            <div className="lg:col-span-6 bg-[#F2ECDE] rounded-2xl p-5 flex flex-col justify-between border border-[rgba(23,20,15,0.1)] min-h-[360px] text-left">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(23,20,15,0.12)]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EFA23D] text-[#17140F] font-['Space_Grotesk'] font-bold text-xs flex items-center justify-center">
                      AS
                    </div>
                    <div>
                      <div className="font-['Space_Grotesk'] font-bold text-sm text-[#17140F]">
                        Aashma Shrestha
                      </div>
                      <div className="text-[11px] font-['Space_Mono'] text-[#1B6C5D] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1B6C5D]" />
                        KU CS Circle · Online
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-['Space_Mono'] px-2 py-0.5 rounded-full bg-[#FFFCF5] text-[#17140F] border border-[rgba(23,20,15,0.1)]">
                    Active Chat
                  </span>
                </div>

                {/* Message Stream */}
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          m.isMe
                            ? 'bg-[#17140F] text-[#FFFCF5] rounded-tr-xs'
                            : 'bg-[#FFFCF5] text-[#17140F] border border-[rgba(23,20,15,0.1)] rounded-tl-xs shadow-xs'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] font-['Space_Mono'] text-[#6B6355] mt-1 px-1 flex items-center gap-1">
                        {m.time}
                        {m.isMe && <CheckCheck className="w-3 h-3 text-[#1B6C5D]" />}
                      </span>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-['Space_Mono'] text-[#6B6355]">
                        Aashma is typing
                      </span>
                      <div className="cj-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Input */}
              <form onSubmit={handleSendMessage} className="mt-4 pt-3 border-t border-[rgba(23,20,15,0.1)] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message or press enter..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  className="flex-1 bg-[#FFFCF5] border border-[rgba(23,20,15,0.14)] rounded-xl px-3.5 py-2 text-xs text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D]"
                />
                <button
                  type="submit"
                  disabled={!typedMessage.trim()}
                  className="px-3.5 py-2 rounded-xl bg-[#17140F] text-[#FFFCF5] font-semibold text-xs hover:bg-[#2b2519] disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4 pt-2 text-center">
            <span className="text-[11px] font-['Space_Mono'] text-[#6B6355] inline-flex items-center gap-1">
              <span>✦ Hover to tilt with 3D perspective physics · Type in the live chat window</span>
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
