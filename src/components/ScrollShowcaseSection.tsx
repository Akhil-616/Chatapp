import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Mic, 
  Phone, 
  Video, 
  Send, 
  GraduationCap, 
  Building2, 
  Users, 
  Mail, 
  SlidersHorizontal,
  Code2,
  Palette,
  Layers,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

interface ScrollShowcaseSectionProps {
  onOpenLogin: (mode?: "login" | "signup") => void;
  onLaunchApp?: () => void;
}

const SAMPLE_NICHES = [
  { label: "Anime & Manga", count: "1.4k" },
  { label: "Hackathons & Startups", count: "980" },
  { label: "Indie Music & Vinyl", count: "820" },
  { label: "Film Photography", count: "650" },
  { label: "Formula 1 & Sim Racing", count: "540" },
  { label: "UI/UX & Creative Dev", count: "1.1k" },
  { label: "Late Night Study", count: "2.3k" },
  { label: "Gaming & Esports", count: "1.8k" },
  { label: "AI Research & LLMs", count: "910" },
  { label: "Cafe Hopping", count: "1.2k" },
  { label: "Filmmaking & Cinema", count: "480" },
  { label: "Gym & Powerlifting", count: "1.5k" },
  { label: "Book Clubs & Philosophy", count: "610" },
  { label: "Dorm Cooking", count: "730" },
];

interface MatchedStudent {
  id: string;
  name: string;
  university: string;
  focus: string;
  scope: "Same Campus" | "Cross-University";
  isOnline?: boolean;
  statusText?: string;
}

const STUDENTS: MatchedStudent[] = [
  {
    id: "s1",
    name: "Aayush Sharma",
    university: "Tribhuvan University",
    focus: "Neural rendering research & late night cafe runs",
    scope: "Cross-University",
    isOnline: true,
  },
  {
    id: "s2",
    name: "Kriti Adhikari",
    university: "Kathmandu University",
    focus: "Digital sketching, lo-fi beats & seasonal anime",
    scope: "Same Campus",
    isOnline: true,
    statusText: "Listening to anime OSTs",
  },
  {
    id: "s3",
    name: "Sneha Tamang",
    university: "Kathmandu University",
    focus: "35mm analog film, jazz vinyl & book discussions",
    scope: "Same Campus",
    isOnline: true,
  },
];

export const ScrollShowcaseSection: React.FC<ScrollShowcaseSectionProps> = ({ 
  onOpenLogin,
}) => {
  const [selectedNiches, setSelectedNiches] = useState<string[]>([
    "Anime & Manga",
    "Hackathons & Startups",
    "Indie Music & Vinyl",
    "Late Night Study"
  ]);

  const [activeScope, setActiveScope] = useState<"all" | "Same Campus" | "Cross-University">("all");

  const toggleNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche) 
        ? prev.filter(item => item !== niche)
        : [...prev, niche]
    );
  };

  const filteredStudents = STUDENTS.filter(student => {
    if (activeScope === "all") return true;
    return student.scope === activeScope;
  });

  return (
    <div className="relative w-full bg-[#070709] text-white selection:bg-white selection:text-black">
      
      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT WRAPPER (Full Width, Centered, No Right Offset)
          ───────────────────────────────────────────────────────────── */}
      <div className="w-full">

        {/* ───────────────────────────────────────────────────────────
            SECTION 1: Campus Discovery & Niche Selection
            ─────────────────────────────────────────────────────────── */}
        <section 
          id="section-niches"
          className="py-14 sm:py-20 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto scroll-mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
            
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 text-left"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.08]">
                Pick your niches.<br />Find your people.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
                Tag your genuine interests—from indie music and midnight hackathons to anime and film photography. No awkward icebreakers needed.
              </p>
              
              {/* Dynamic Animated Frequency Gauge */}
              <div className="mt-7 p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                    <SlidersHorizontal className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Frequency Tuner</div>
                    <div className="text-[11px] text-zinc-400">
                      {selectedNiches.length} niches selected
                    </div>
                  </div>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-center gap-1">
                  {[40, 75, 55, 95, 60, 85, 45].map((height, idx) => (
                    <motion.div
                      key={idx}
                      animate={{ height: [`${Math.max(20, height * 0.3)}%`, `${height}%`, `${Math.max(20, height * 0.4)}%`] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2 + idx * 0.15,
                        ease: "easeInOut",
                      }}
                      className="w-1 bg-white rounded-full h-6"
                      style={{ maxHeight: "24px" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex flex-wrap gap-2.5 pt-2"
            >
              {SAMPLE_NICHES.map((item, idx) => {
                const isSelected = selectedNiches.includes(item.label);
                return (
                  <motion.button
                    key={idx}
                    onClick={() => toggleNiche(item.label)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2 border ${
                      isSelected
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] font-semibold"
                        : "bg-zinc-900/70 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isSelected ? "bg-black/10 text-zinc-800 font-semibold" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {item.count}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>

          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────
            SECTION 2: Same campus, or across universities
            ─────────────────────────────────────────────────────────── */}
        <section 
          id="section-campuses"
          className="py-14 sm:py-20 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto border-t border-zinc-900 scroll-mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
            
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 text-left"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.08]">
                Same campus, or across universities.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-zinc-300 font-normal leading-relaxed">
                Connect directly with students who share your deep subcultures, projects, and study sessions—whether walking through the same campus quad or across the city.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveScope("all")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeScope === "all"
                      ? "bg-white text-black border-white shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All Campuses</span>
                </button>
                <button
                  onClick={() => setActiveScope("Same Campus")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeScope === "Same Campus"
                      ? "bg-white text-black border-white shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Same Campus</span>
                </button>
                <button
                  onClick={() => setActiveScope("Cross-University")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    activeScope === "Cross-University"
                      ? "bg-white text-black border-white shadow-sm"
                      : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Cross-University</span>
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 divide-y divide-zinc-800/80 border-y border-zinc-800/80"
            >
              <AnimatePresence mode="popLayout">
                {filteredStudents.map((student) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="py-5 sm:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group text-left transition-colors"
                  >
                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-zinc-200 transition-colors">
                          {student.name}
                        </h3>
                      </div>

                      <p className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-zinc-500" />
                        {student.university}
                      </p>

                      <p className="text-sm text-zinc-300 font-normal pt-1 leading-relaxed">
                        {student.focus}
                      </p>
                    </div>

                    <div className="shrink-0 pt-2 sm:pt-0">
                      <button
                        onClick={() => onOpenLogin("login")}
                        className="px-6 py-2.5 border border-zinc-700 bg-zinc-900/60 hover:bg-white hover:text-black hover:border-white text-zinc-200 font-semibold text-xs tracking-wider uppercase transition-all duration-150 cursor-pointer"
                      >
                        CONNECT
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────
            SECTION 3: Chat, Voice & Video
            ─────────────────────────────────────────────────────────── */}
        <section 
          id="section-comms"
          className="py-14 sm:py-20 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto border-t border-zinc-900 scroll-mt-20"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-14 items-center">
            
            <motion.div
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 text-left"
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                Talk your way.<br className="hidden sm:inline" /> Text, voice, or video.
              </h2>

              <div className="mt-8 flex flex-col gap-4 text-left">
                <div className="border-l-2 border-white pl-4 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-white shrink-0" />
                  <h4 className="text-sm sm:text-base font-semibold text-white">Instant Peer Chat</h4>
                </div>

                <div className="border-l-2 border-zinc-400 pl-4 flex items-center gap-3">
                  <Mic className="w-5 h-5 text-zinc-300 shrink-0" />
                  <h4 className="text-sm sm:text-base font-semibold text-white">Voice Notes &amp; Audio Clips</h4>
                </div>

                <div className="border-l-2 border-zinc-600 pl-4 flex items-center gap-3">
                  <Phone className="w-5 h-5 text-zinc-400 shrink-0" />
                  <h4 className="text-sm sm:text-base font-semibold text-white">Voice Calling &amp; Co-study Rooms</h4>
                </div>

                <div className="border-l-2 border-zinc-700 pl-4 flex items-center gap-3">
                  <Video className="w-5 h-5 text-zinc-500 shrink-0" />
                  <h4 className="text-sm sm:text-base font-semibold text-white">Video Calling</h4>
                </div>
              </div>
            </motion.div>

            {/* Interactive Live Chat Mockup with Bouncy Typing Animation & Soundwaves */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 35 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 1.2, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 bg-[#040407] border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5 rounded-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-sm">
                      KA
                    </div>
                  </div>
                  <div className="text-left">
                    <h4 className="text-base font-semibold text-white">Kriti Adhikari</h4>
                    <span className="text-xs text-zinc-400 font-medium">
                      Kathmandu University • Active now
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onOpenLogin("login")} 
                    aria-label="Voice Call"
                    className="p-2.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer rounded-lg"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onOpenLogin("login")} 
                    aria-label="Video Call"
                    className="p-2.5 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer rounded-lg"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4 py-2">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    KA
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm max-w-sm text-sm text-zinc-200 leading-relaxed shadow-sm">
                    Saw your niche tags! Are you also staying up for the midnight anime release?
                  </div>
                </div>

                {/* Animated Voice Note with Oscillating Sine Waveform */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="bg-white text-black px-5 py-3 rounded-2xl rounded-tr-sm max-w-sm text-sm flex items-center gap-3 shadow-md">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 h-6">
                        {[12, 22, 16, 26, 18, 14, 24, 10, 20].map((h, i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [`${Math.max(6, h * 0.4)}px`, `${h}px`, `${Math.max(6, h * 0.3)}px`] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.9 + (i % 3) * 0.2,
                              ease: "easeInOut",
                            }}
                            className="w-1 bg-black rounded-full"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-zinc-700 font-semibold flex items-center gap-1">
                        <Mic className="w-3 h-3" /> Voice Note (0:18)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Animated Bouncy Typing Indicator */}
                <div className="flex items-center gap-3 text-left pt-1">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs shrink-0">
                    KA
                  </div>
                  <div className="bg-zinc-900/90 border border-zinc-800/80 px-4 py-2.5 rounded-full flex items-center gap-2 text-xs text-zinc-300">
                    <span className="font-medium text-zinc-400">Kriti Adhikari is typing</span>
                    <div className="flex items-center gap-1 pl-0.5">
                      <motion.span
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-1.5 h-1.5 rounded-full bg-white block"
                      />
                      <motion.span
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-white block"
                      />
                      <motion.span
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-white block"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="Type a message or record voice note..."
                  onClick={() => onOpenLogin("login")}
                  className="w-full bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-xl text-sm text-zinc-400 focus:outline-none cursor-pointer hover:border-zinc-700 transition-colors"
                />
                <button
                  onClick={() => onOpenLogin("login")}
                  className="px-6 py-3 border border-white bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 rounded-xl shadow-sm"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ───────────────────────────────────────────────────────────
            SECTION 4: Contact & Creators + Infinite Scrolling Wordmark
            ─────────────────────────────────────────────────────────── */}
        <section 
          id="section-creators"
          className="pt-14 sm:pt-20 pb-10 px-6 sm:px-12 lg:px-20 max-w-6xl mx-auto border-t border-zinc-900 scroll-mt-20"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-14 items-start mb-12 sm:mb-16">
            
            <div className="md:col-span-6 text-left">
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                Experience connection
              </h3>
              <p className="mt-4 text-base text-zinc-400 max-w-md">
                Start conversing freely with students who share your niche right now.
              </p>
              
              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => onOpenLogin("login")}
                  className="px-8 py-3.5 border border-white bg-white text-black font-semibold text-xs tracking-widest uppercase hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer rounded-full"
                >
                  LOG IN
                </button>
                <button
                  onClick={() => onOpenLogin("signup")}
                  className="px-8 py-3.5 border border-zinc-700 bg-zinc-900 text-white font-medium text-xs tracking-widest uppercase hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all cursor-pointer rounded-full"
                >
                  SIGN UP
                </button>
              </div>
            </div>

            <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 text-left">
              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-4 tracking-wide uppercase flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <span>Contact Us</span>
                </h4>
                <ul className="space-y-3 text-sm text-zinc-400 font-normal">
                  <li>
                    <a href="mailto:abc@gmail.com" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 group">
                      <span>abc@gmail.com</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                  <li>
                    <a href="mailto:support@sajilopatra.com" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 group">
                      <span>support@sajilopatra.com</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                  <li>
                    <a href="mailto:connect.sajilopatra@gmail.com" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 group">
                      <span>connect.sajilopatra@gmail.com</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                  <li>
                    <a href="mailto:feedback@sajilopatra.edu" className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 group">
                      <span>feedback@sajilopatra.edu</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-zinc-300 mb-4 tracking-wide uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>Creators of this app</span>
                </h4>
                <ul className="space-y-3 text-sm text-zinc-400 font-normal">
                  <li className="flex flex-col">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Aarav Shrestha</span>
                    </span>
                    <span className="text-xs text-zinc-400 pl-5">Lead Developer &amp; Systems</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Prashant KC</span>
                    </span>
                    <span className="text-xs text-zinc-400 pl-5">Full-Stack &amp; Algorithms</span>
                  </li>
                  <li className="flex flex-col">
                    <span className="text-white font-medium flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Sneha Tamang</span>
                    </span>
                    <span className="text-xs text-zinc-400 pl-5">UI/UX &amp; Creative Design</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

          {/* Continuous Horizontal Infinite Scrolling Wordmark */}
          <div className="w-full select-none overflow-hidden my-8 sm:my-14 py-4 relative">
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#070709] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#070709] to-transparent z-10 pointer-events-none" />

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                repeat: Infinity,
                duration: 22,
                ease: "linear",
              }}
              className="flex whitespace-nowrap will-change-transform"
            >
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <span className="text-[14vw] sm:text-[15.5vw] font-bold text-white tracking-tighter leading-[0.82] uppercase pr-8 sm:pr-14">
                    Sajilo Patra
                  </span>
                  <span className="text-[7vw] sm:text-[8vw] font-light text-zinc-700 tracking-tighter uppercase pr-8 sm:pr-14 select-none">
                    •
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
            <div className="font-bold text-white tracking-tight text-sm">
              Sajilo Patra
            </div>
            <div className="flex items-center gap-6">
              <span className="hover:text-zinc-300 transition-colors cursor-pointer">About</span>
              <span className="hover:text-zinc-300 transition-colors cursor-pointer">Campuses</span>
              <span className="hover:text-zinc-300 transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-zinc-300 transition-colors cursor-pointer">Terms</span>
            </div>
          </div>

        </section>

      </div>

    </div>
  );
};
