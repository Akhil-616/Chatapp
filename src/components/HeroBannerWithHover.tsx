import React, { useState, useRef } from "react";
import { Terminal, Send, Sparkles, CheckCheck, Code2, Users, Cpu, ArrowUpRight, Play, Maximize2 } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

interface HeroBannerWithHoverProps {
  onOpenLogin: () => void;
}

export const HeroBannerWithHover: React.FC<HeroBannerWithHoverProps> = ({ onOpenLogin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<"code" | "match">("code");

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate tilt angles based on center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4; // Max 4 deg tilt
    const rotateY = ((x - centerX) / centerX) * 4;

    setMousePos({ x, y });
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-24">
      {/* 3D Perspective Wrapper */}
      <div 
        style={{ perspective: "1200px" }}
        className="w-full"
      >
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={onOpenLogin}
          style={{
            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(${isHovered ? 1.015 : 1}, ${isHovered ? 1.015 : 1}, 1)`,
            transition: isHovered ? "transform 0.15s ease-out" : "transform 0.5s ease-out",
          }}
          className="group relative cursor-pointer overflow-hidden rounded-[24px] sm:rounded-[36px] border border-zinc-800 bg-[#09090b] p-3 sm:p-5 shadow-2xl shadow-black/80 transition-shadow hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] hover:border-zinc-600 select-none"
        >
          {/* Dynamic Cursor Spotlight Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              background: isHovered
                ? `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.08), transparent 70%)`
                : "none",
            }}
          />

          {/* Top Window Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 mb-2 rounded-t-2xl bg-zinc-900/90 border-b border-zinc-800/80 text-xs font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-zinc-700 group-hover:bg-red-500/80 transition-colors" />
                <span className="h-3 w-3 rounded-full bg-zinc-700 group-hover:bg-yellow-500/80 transition-colors" />
                <span className="h-3 w-3 rounded-full bg-zinc-700 group-hover:bg-emerald-500/80 transition-colors" />
              </div>
              <span className="ml-3 font-semibold text-zinc-300">
                sajilo-patra : workspace - router.ts & interest_engine.ts
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex text-[11px] text-emerald-400 font-mono items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                WSS: CONNECTED (Port 3000)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Click to Launch
              </span>
            </div>
          </div>

          {/* Inner Dual-Pane Layout matching Antigravity IDE UI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 bg-black rounded-2xl p-3 sm:p-5 border border-zinc-800/80">
            
            {/* Left Pane: Code Editor Interface */}
            <div className="lg:col-span-7 bg-[#111113] rounded-xl border border-zinc-800/80 p-4 sm:p-5 font-mono text-xs text-zinc-300 flex flex-col justify-between overflow-hidden shadow-inner min-h-[340px]">
              <div>
                {/* Editor File Tab */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-[11px] text-zinc-500">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <Code2 className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold">src/server/websocketRouter.ts</span>
                  </div>
                  <span className="text-zinc-500">TypeScript 5.8</span>
                </div>

                {/* Simulated Real-Time Code */}
                <div className="space-y-1 text-zinc-400 leading-relaxed overflow-x-auto text-[11px] sm:text-xs">
                  <p className="text-zinc-500">// Layer 2: In-Memory Client Map & Direct Route</p>
                  <p><span className="text-purple-400">const</span> activeSockets = <span className="text-purple-400">new</span> <span className="text-yellow-300">Map</span>&lt;<span className="text-blue-300">UserId</span>, <span className="text-blue-300">WebSocket</span>&gt;();</p>
                  <br />
                  <p><span className="text-purple-400">async function</span> <span className="text-blue-400">dispatchFrame</span>(senderId: <span className="text-blue-300">string</span>, targetId: <span className="text-blue-300">string</span>, payload: <span className="text-blue-300">Message</span>) &#123;</p>
                  <p className="pl-4 text-zinc-500">// 1. Write-before-send persistence guarantee</p>
                  <p className="pl-4"><span className="text-purple-400">const</span> saved = <span className="text-purple-400">await</span> postgres.<span className="text-blue-400">insertMessage</span>(payload);</p>
                  <p className="pl-4 text-zinc-500">// 2. Direct O(1) in-memory socket dispatch</p>
                  <p className="pl-4"><span className="text-purple-400">const</span> targetSock = activeSockets.<span className="text-blue-400">get</span>(targetId);</p>
                  <p className="pl-4"><span className="text-purple-400">if</span> (targetSock &amp;&amp; targetSock.readyState === <span className="text-emerald-400">OPEN</span>) &#123;</p>
                  <p className="pl-8">targetSock.<span className="text-blue-400">send</span>(JSON.<span className="text-blue-400">stringify</span>(saved));</p>
                  <p className="pl-4">&#125;</p>
                  <p>&#125;</p>
                </div>
              </div>

              {/* Bottom Status bar */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Latency: 0.8ms • Zero Packet Loss
                </span>
                <span>UTF-8 • Ln 24, Col 12</span>
              </div>
            </div>

            {/* Right Pane: AI Agent & Interest Matching Surface */}
            <div className="lg:col-span-5 bg-[#141417] rounded-xl border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between shadow-inner min-h-[340px]">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-white text-xs font-mono">Campus Affinity Matcher</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    98% Match
                  </span>
                </div>

                {/* Match Summary Card */}
                <div className="rounded-xl border border-zinc-700/60 bg-zinc-900/90 p-3.5 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center">
                        KS
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Kriti Sharma</div>
                        <div className="text-[11px] text-zinc-400">Tribhuvan University • Final Year</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400">Active Now</span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed font-sans pt-1">
                    "Building high-throughput microservices in Rust & WebSockets. Looking for a distributed systems hackathon partner!"
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {["Distributed Systems", "WebSockets", "Rust", "PostgreSQL"].map((tag, idx) => (
                      <span key={idx} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black text-zinc-300 border border-zinc-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Simulated Chat Message In Hero */}
                <div className="space-y-2 font-sans text-xs">
                  <div className="bg-zinc-800/80 text-zinc-200 p-2.5 rounded-xl rounded-tl-none border border-zinc-700/50">
                    Hey! Saw we have identical research tags. Want to collaborate on the real-time pipeline?
                  </div>
                </div>
              </div>

              {/* Action Trigger */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-medium">Click banner to sign in</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors">
                  <span>Enter App</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>

          </div>

          {/* Interactive Hint Indicator */}
          <div className="mt-3 text-center">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <span>✦ Hover to tilt with 3D perspective physics • Click anywhere to Log In</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
