import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Zap, Users, Database, ShieldCheck, Terminal, Network, ArrowUpRight } from "lucide-react";

export const FeaturesShowcase: React.FC = () => {
  const features = [
    {
      icon: Zap,
      badge: "Layer 01 & 02",
      title: "Real-Time WebSocket Engine",
      description: "Full-duplex TCP persistent socket with an in-memory client connection lookup table Map<UserId, WebSocket> providing sub-millisecond direct packet routing.",
      stats: "< 1.2ms routing latency"
    },
    {
      icon: Users,
      badge: "Layer 05",
      title: "University Interest Matching",
      description: "Intelligent matching algorithm connecting university students by shared courses, research topics, hackathon goals, and campus hobbies.",
      stats: "Multivariate Affinity Scoring"
    },
    {
      icon: Database,
      badge: "Layer 03",
      title: "Write-Before-Send Persistence",
      description: "Guaranteed message durability: messages commit to Supabase Postgres before dispatch. Offline students receive missed packets on reconnect.",
      stats: "Zero packet loss guarantee"
    },
    {
      icon: ShieldCheck,
      badge: "Layer 04 & 05",
      title: "Stateless JWT Auth & Hardened RLS",
      description: "Cryptographic token verification on socket upgrade with tight PostgreSQL Row Level Security policies preventing unauthorized message sniffing.",
      stats: "Dual-tier Auth/Anon RLS"
    }
  ];

  return (
    <section id="features" className="py-16 md:py-20 border-b border-zinc-800 bg-zinc-950/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="pixel">SPECS & CAPABILITIES</Badge>
              <span className="font-mono text-xs text-zinc-500">ENGINE_OVERVIEW</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Engineered for High Throughput & Campus Trust
            </h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-md">
            Solving the core challenges of real-time messaging from raw socket listeners to relational student profile graphs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <Card key={idx} className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-600 transition-all group flex flex-col justify-between">
                <CardHeader className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-black border border-zinc-800 group-hover:border-zinc-500 text-white transition-colors">
                      <Icon className="h-5 w-5 text-zinc-200" />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-zinc-800">
                      {feat.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold text-white group-hover:text-zinc-100">
                    {feat.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-2 line-clamp-4">
                    {feat.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between font-mono text-[11px] text-zinc-400">
                    <span>{feat.stats}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-300" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
