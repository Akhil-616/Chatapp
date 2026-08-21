import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { MessageSquare, Volume2, Sparkles, Zap, Wifi } from "lucide-react";

interface InteractiveChatNodesCanvasProps {
  className?: string;
  onSelectNode?: (nodeInfo: string) => void;
}

interface FloatingNode {
  id: string;
  type: "message" | "voice" | "typing" | "match" | "room";
  author: string;
  initials: string;
  campus: string;
  color: string;
  content: string;
  extra?: string;
  xPct: number; // percentage of container width
  yPct: number; // percentage of container height
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  scale: number;
}

export const InteractiveChatNodesCanvas: React.FC<InteractiveChatNodesCanvasProps> = ({
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse position in relative percentage [-0.5 to 0.5]
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 120 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);

  // Chat nodes positioned organically across the canvas (favoring the right & center-right)
  const [nodes] = useState<FloatingNode[]>([
    {
      id: "node-1",
      type: "message",
      author: "Aarav S.",
      initials: "AS",
      campus: "TU • Pulchowk",
      color: "bg-blue-600",
      content: "Anyone hacking on creative dev & shaders tonight? 🚀",
      xPct: 68,
      yPct: 22,
      vx: 0,
      vy: 0,
      baseX: 68,
      baseY: 22,
      scale: 1,
    },
    {
      id: "node-2",
      type: "voice",
      author: "Kriti A.",
      initials: "KA",
      campus: "Kathmandu University",
      color: "bg-indigo-600",
      content: "Voice Note",
      extra: "0:24 • Lo-fi & Code Room 🎧",
      xPct: 78,
      yPct: 48,
      vx: 0,
      vy: 0,
      baseX: 78,
      baseY: 48,
      scale: 1,
    },
    {
      id: "node-3",
      type: "match",
      author: "Rohan V.",
      initials: "RV",
      campus: "Tribhuvan Univ",
      color: "bg-violet-600",
      content: "98% Vibe Match",
      extra: "Sim Racing + Hackathons",
      xPct: 54,
      yPct: 68,
      vx: 0,
      vy: 0,
      baseX: 54,
      baseY: 68,
      scale: 1,
    },
    {
      id: "node-4",
      type: "typing",
      author: "Sneha T.",
      initials: "ST",
      campus: "KU Dept. of CS",
      color: "bg-emerald-600",
      content: "typing a voice note...",
      xPct: 82,
      yPct: 78,
      vx: 0,
      vy: 0,
      baseX: 82,
      baseY: 78,
      scale: 1,
    },
    {
      id: "node-5",
      type: "room",
      author: "Dorm Study Jam",
      initials: "🎙️",
      campus: "Live Voice Room",
      color: "bg-amber-600",
      content: "Late Night Anime & Study",
      extra: "6 students in call",
      xPct: 52,
      yPct: 35,
      vx: 0,
      vy: 0,
      baseX: 52,
      baseY: 35,
      scale: 1,
    },
  ]);

  // Background Canvas: Interactive Radar, Audio Signal Waves & Signal Connecting Beams
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const mouse = {
      x: width * 0.7,
      y: height * 0.5,
      targetX: width * 0.7,
      targetY: height * 0.5,
      isHovered: false,
      rippleRadius: 0,
    };

    // Equalizer bars data for acoustic aesthetic
    const eqBars: { x: number; y: number; height: number; speed: number; phase: number }[] = [];
    for (let i = 0; i < 40; i++) {
      eqBars.push({
        x: width * 0.45 + (i * (width * 0.52)) / 40,
        y: height * 0.9,
        height: 10 + Math.random() * 25,
        speed: 0.05 + Math.random() * 0.08,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.clientHeight || window.innerHeight;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.isHovered = true;
    };

    const handleMouseEnter = () => {
      mouse.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouse.isHovered = false;
      mouse.targetX = width * 0.7;
      mouse.targetY = height * 0.5;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.rippleRadius = 1;
    };

    const parent = canvas.parentElement;
    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove, { passive: true });
      parent.addEventListener("mouseenter", handleMouseEnter);
      parent.addEventListener("mouseleave", handleMouseLeave);
      parent.addEventListener("click", handleClick);
    }

    let time = 0;

    const render = () => {
      time += 0.02;

      // Silky spring cursor follow
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Deep dark canvas background
      ctx.fillStyle = "#040407";
      ctx.fillRect(0, 0, width, height);

      // 1. Subtle Radial Pulse Rings around Mouse (Frequency Radar Scan)
      const radarPhase = (time * 0.6) % 1;
      const ringCount = 3;
      for (let r = 0; r < ringCount; r++) {
        const ringProgress = (radarPhase + r / ringCount) % 1;
        const ringRadius = 40 + ringProgress * 320;
        const ringAlpha = (1 - ringProgress) * (mouse.isHovered ? 0.16 : 0.06);

        ctx.strokeStyle = `rgba(96, 165, 250, ${ringAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Expanding click ripple
      if (mouse.rippleRadius > 0) {
        mouse.rippleRadius += 6;
        const clickAlpha = Math.max(0, 1 - mouse.rippleRadius / 450);
        ctx.strokeStyle = `rgba(147, 197, 253, ${clickAlpha * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.rippleRadius, 0, Math.PI * 2);
        ctx.stroke();

        if (mouse.rippleRadius > 450) mouse.rippleRadius = 0;
      }

      // 2. Cursor Luminescence / Chat Glow Spotlight
      const glow = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 360
      );
      glow.addColorStop(0, "rgba(59, 130, 246, 0.14)");
      glow.addColorStop(0.4, "rgba(99, 102, 241, 0.06)");
      glow.addColorStop(0.8, "rgba(139, 92, 246, 0.015)");
      glow.addColorStop(1, "transparent");

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // 3. Dynamic Beams connecting the mouse cursor to floating node centers
      nodes.forEach((node) => {
        const nodeX = (node.xPct / 100) * width;
        const nodeY = (node.yPct / 100) * height;

        const dx = nodeX - mouse.x;
        const dy = nodeY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // When mouse is within radius, draw glowing chat frequency line
        if (dist < 420) {
          const beamIntensity = Math.pow(1 - dist / 420, 1.3);
          
          // Outer subtle glow beam
          ctx.strokeStyle = `rgba(96, 165, 250, ${beamIntensity * 0.35})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(nodeX, nodeY);
          ctx.stroke();

          // Inner sharp laser core
          ctx.strokeStyle = `rgba(255, 255, 255, ${beamIntensity * 0.75})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(nodeX, nodeY);
          ctx.stroke();

          // Flowing signal particle packet travelling along the beam
          const packetPos = (time * 1.5 + (node.id.charCodeAt(5) % 5)) % 1;
          const px = mouse.x + dx * packetPos;
          const py = mouse.y + dy * packetPos;

          ctx.fillStyle = "#ffffff";
          ctx.shadowColor = "rgba(147, 197, 253, 0.9)";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // 4. Ambient Audio Wave / Soundwave Equalizer at bottom of the hero card
      ctx.lineWidth = 2;
      for (let i = 0; i < eqBars.length; i++) {
        const bar = eqBars[i];
        const barX = (width * 0.42) + (i * (width * 0.55)) / eqBars.length;
        const currentH = Math.sin(time * 2 + bar.phase) * 12 + bar.height;
        const distToMouse = Math.abs(barX - mouse.x);
        const hoverAmp = distToMouse < 200 ? (1 - distToMouse / 200) * 18 : 0;
        
        const finalH = Math.max(3, currentH + hoverAmp);
        const alpha = 0.15 + (hoverAmp / 18) * 0.45;

        ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(barX, height - 36 - finalH / 2);
        ctx.lineTo(barX, height - 36 + finalH / 2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      resizeObserver.disconnect();
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("mouseenter", handleMouseEnter);
        parent.removeEventListener("mouseleave", handleMouseLeave);
        parent.removeEventListener("click", handleClick);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [nodes]);

  // Handle Mouse movement on DOM level for fluid spring physics on the message cards
  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / relXWidth(rect.width);
    const relY = (e.clientY - rect.top) / relYHeight(rect.height);
    mouseX.set(relX);
    mouseY.set(relY);
  };

  const relXWidth = (w: number) => (w > 0 ? w : 1);
  const relYHeight = (h: number) => (h > 0 ? h : 1);

  const handleContainerMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setActiveHoverNode(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouseMove}
      onMouseLeave={handleContainerMouseLeave}
      className={`absolute inset-0 w-full h-full overflow-hidden select-none ${className}`}
    >
      {/* Dynamic Background Canvas (Radar, Beams & Waveforms) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Floating Interactive Chat Bubbles with 3D Parallax & Magnetic Reaction */}
      <div className="absolute inset-0 pointer-events-none">
        {nodes.map((node, index) => {
          // Individual parallax offset based on node index
          const depthMultiplier = 18 + index * 8;
          const nodeX = useTransform(smoothMouseX, (v) => (v - 0.5) * depthMultiplier);
          const nodeY = useTransform(smoothMouseY, (v) => (v - 0.5) * depthMultiplier);

          const isHovered = activeHoverNode === node.id;

          return (
            <motion.div
              key={node.id}
              style={{
                left: `${node.xPct}%`,
                top: `${node.yPct}%`,
                x: nodeX,
                y: nodeY,
              }}
              onMouseEnter={() => setActiveHoverNode(node.id)}
              onMouseLeave={() => setActiveHoverNode(null)}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: isHovered ? 1.06 : 1, y: 0 }}
              transition={{
                opacity: { duration: 0.6, delay: 0.15 + index * 0.1 },
                scale: { duration: 0.25 },
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
            >
              {/* Card Container with Modern Glassmorphism & Clean Typography */}
              <div
                className={`px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl bg-[#09090f]/90 backdrop-blur-xl border transition-all duration-300 shadow-2xl flex items-center gap-3.5 ${
                  isHovered
                    ? "border-blue-400/90 shadow-blue-500/20 ring-2 ring-blue-400/30 scale-105"
                    : "border-zinc-800/90 hover:border-zinc-600/90"
                }`}
              >
                {/* Avatar with Status Pulse */}
                <div className="relative shrink-0">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${node.color} flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-md ring-2 ring-zinc-800`}
                  >
                    {node.initials}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#09090f] animate-pulse" />
                </div>

                {/* Content according to node type - using clean readable fonts */}
                <div className="text-left font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white tracking-tight">
                      {node.author}
                    </span>
                    <span className="text-xs text-zinc-400 hidden sm:inline font-normal">
                      {node.campus}
                    </span>
                  </div>

                  {/* Message Type */}
                  {node.type === "message" && (
                    <p className="text-xs sm:text-sm text-zinc-200 mt-0.5 max-w-[200px] sm:max-w-[260px] leading-snug font-normal">
                      {node.content}
                    </p>
                  )}

                  {/* Voice Note Type */}
                  {node.type === "voice" && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center gap-1.5 text-xs font-medium">
                        <Volume2 className="w-3 h-3 text-indigo-400 animate-bounce" />
                        <span>{node.extra}</span>
                      </div>
                      {/* Animated Sound Waveform Bars */}
                      <div className="flex items-center gap-0.5">
                        <span className="w-0.5 h-2 bg-indigo-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-indigo-400 rounded-full animate-pulse delay-75" />
                        <span className="w-0.5 h-1.5 bg-indigo-400 rounded-full" />
                        <span className="w-0.5 h-3 bg-indigo-400 rounded-full animate-pulse delay-150" />
                        <span className="w-0.5 h-2 bg-indigo-400 rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* Vibe Match Type */}
                  {node.type === "match" && (
                    <div className="mt-0.5">
                      <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {node.content}
                      </span>
                      <span className="text-xs text-zinc-400 block font-normal">
                        {node.extra}
                      </span>
                    </div>
                  )}

                  {/* Typing Indicator Type */}
                  {node.type === "typing" && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-400 font-medium">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-200" />
                      </span>
                      <span className="text-xs text-zinc-300 font-normal">{node.content}</span>
                    </div>
                  )}

                  {/* Live Room Type */}
                  {node.type === "room" && (
                    <div className="mt-0.5">
                      <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {node.content}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal">
                        {node.extra}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtle Interactive Quick Reaction Pill */}
                <div className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-zinc-800/80 text-zinc-400 group-hover:text-white group-hover:bg-blue-600 transition-all shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Vibe Signal Badge with Clean Font */}
      <div className="absolute right-8 top-12 hidden lg:flex flex-col gap-2 z-10 pointer-events-none opacity-70">
        <div className="px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-2 backdrop-blur-md">
          <Wifi className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>Real-time signals active</span>
        </div>
      </div>
    </div>
  );
};
