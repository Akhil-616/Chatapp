import React, { useState } from "react";
import { 
  Code2, 
  Bot, 
  Layers, 
  MessageSquare, 
  LogIn, 
  UserPlus,
  Sparkles, 
  ShieldCheck,
  Send,
  Zap,
  Users
} from "lucide-react";

interface MainFeaturesSectionProps {
  onOpenLogin: (mode?: "login" | "signup") => void;
}

export const MainFeaturesSection: React.FC<MainFeaturesSectionProps> = ({ onOpenLogin }) => {
  const [activeCard, setActiveCard] = useState<number>(0);

  const featureCards = [
    {
      id: 0,
      title: "Real-Time Chat Engine",
      subtitle: "Low-latency WebSocket peer messaging with instant delivery receipts.",
      tag: "Messaging",
      snippet: {
        file: "chat_stream.tsx",
        badge: "0.8ms Latency",
        lines: [
          "// Instant WebSocket Frame Dispatch",
          "socket.send(JSON.stringify({",
          "  type: 'DIRECT_MESSAGE',",
          "  recipientId: 'student-982',",
          "  payload: 'Joining study group?'",
          "}));"
        ]
      }
    },
    {
      id: 1,
      title: "Campus Affinity Matcher",
      subtitle: "Discover peers across departments and shared study topics automatically.",
      tag: "Discovery",
      snippet: {
        file: "matcher.ai",
        badge: "98% Affinity",
        lines: [
          "// Cosine Similarity on Student Vectors",
          "const match = await engine.findPeer({",
          "  interests: ['Rust', 'Distributed Systems'],",
          "  term: 'Fall 2025',",
          "  campus: 'Tribhuvan University'",
          "});"
        ]
      }
    },
    {
      id: 2,
      title: "Write-Before-Send Security",
      subtitle: "Guaranteed message persistence with PostgreSQL WAL prior to socket dispatch.",
      tag: "Persistence",
      snippet: {
        file: "postgres_wal.sql",
        badge: "Zero Drop",
        lines: [
          "-- WAL Guarantee on Every Packet",
          "INSERT INTO message_vault (id, sender, payload)",
          "VALUES (gen_random_uuid(), 'user_1', $1)",
          "RETURNING state, dispatched_at;"
        ]
      }
    },
    {
      id: 3,
      title: "Verified Student Network",
      subtitle: "Encrypted JWT sessions and student roll verification for trusted chat.",
      tag: "Security",
      snippet: {
        file: "jwt_guard.ts",
        badge: "Argon2 / RLS",
        lines: [
          "// Zero-Trust Token Verification",
          "const session = await jwt.verify(token);",
          "if (!session.valid) throw Unauthorized();",
          "applyRowLevelSecurity(session.sub);"
        ]
      }
    }
  ];

  const narrativeRows = [
    {
      icon: MessageSquare,
      title: "The complete real-time messaging surface for campus collaboration",
      description: "A streamlined, zero-bloat communication environment. Connect seamlessly across campus faculties, solving complex problem sets and organizing hackathons in real time."
    },
    {
      icon: Users,
      title: "Rich, verified student profiles and interest review in your stream",
      description: "Gain an immediate understanding of research interests and academic focuses at a glance. Supported by verified student credentials, fostering confidence and organic study partnerships."
    },
    {
      icon: Zap,
      title: "An affinity engine that works as an active development partner",
      description: "Intuitively match with like-minded collaborators across departments. Discover study groups, exchange notes, and build project teams with students who share your technical trajectory."
    }
  ];

  return (
    <section id="features" className="py-16 sm:py-24 bg-[#fafafa] border-t border-zinc-200/80 text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="mb-12 text-center sm:text-left">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950">
            Explore the main features
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-2xl font-normal">
            Real-time peer chat, instantaneous socket routing, and context-aware student discovery.
          </p>
        </div>

        {/* 4-Card Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16">
          {featureCards.map((feat) => {
            const isSelected = activeCard === feat.id;
            return (
              <div
                key={feat.id}
                onMouseEnter={() => setActiveCard(feat.id)}
                onClick={() => setActiveCard(feat.id)}
                className={`group cursor-pointer rounded-2xl border transition-all duration-300 p-5 flex flex-col justify-between ${
                  isSelected 
                    ? "bg-white border-zinc-900 shadow-xl shadow-zinc-200/80 -translate-y-1" 
                    : "bg-white border-zinc-200 hover:border-zinc-400 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {feat.tag}
                    </span>
                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${
                      isSelected ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-600"
                    }`}>
                      {feat.snippet.badge}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight mb-1.5 group-hover:text-black">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-zinc-600 leading-relaxed mb-4">
                    {feat.subtitle}
                  </p>
                </div>

                <div className="rounded-xl bg-zinc-950 text-zinc-300 p-3 font-mono text-[10px] leading-relaxed overflow-hidden border border-zinc-800 shadow-inner">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-zinc-800 text-zinc-500">
                    <span>{feat.snippet.file}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  </div>
                  <div className="space-y-0.5 text-zinc-400">
                    {feat.snippet.lines.slice(0, 3).map((line, idx) => (
                      <p key={idx} className="truncate">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3 Detailed Narrative Rows */}
        <div className="space-y-10 sm:space-y-14 border-t border-zinc-200 pt-14 mb-16 max-w-4xl mx-auto">
          {narrativeRows.map((row, idx) => {
            const Icon = row.icon;
            return (
              <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <div className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                    {row.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-normal">
                    {row.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Prominent Call to Action Buttons: Log in and Sign up */}
        <div className="text-center pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onOpenLogin("login")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-zinc-950 text-white font-semibold text-xs sm:text-sm hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <LogIn className="h-4 w-4" />
            <span>Log in</span>
          </button>

          <button
            onClick={() => onOpenLogin("signup")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-zinc-900 border border-zinc-300 font-medium text-xs sm:text-sm hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Sign up</span>
          </button>
        </div>

      </div>
    </section>
  );
};
