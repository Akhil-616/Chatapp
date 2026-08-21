import React, { useState } from "react";
import { ARCHITECTURE_LAYERS } from "@/src/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Layers, Bug, CheckCircle2, ChevronRight, Code2, AlertTriangle, ShieldCheck } from "lucide-react";

export const ArchitectureExplorer: React.FC = () => {
  const [selectedLayerNum, setSelectedLayerNum] = useState<number>(1);
  const activeLayer = ARCHITECTURE_LAYERS.find(l => l.number === selectedLayerNum) || ARCHITECTURE_LAYERS[0];

  return (
    <section id="architecture" className="py-16 md:py-20 border-b border-zinc-800 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="pixel">SYSTEM ARCHITECTURE</Badge>
            <span className="font-mono text-xs text-zinc-400">LAYER_BY_LAYER_EVOLUTION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            The 5-Layer Engineering Blueprint
          </h2>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
            Built progressively in layers of increasing capability—from raw socket listening to verified stateless JWT authentication and Postgres RLS debugging.
          </p>
        </div>

        {/* Layer Selector Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-8">
          {ARCHITECTURE_LAYERS.map(layer => {
            const isSelected = layer.number === selectedLayerNum;
            return (
              <button
                key={layer.number}
                onClick={() => setSelectedLayerNum(layer.number)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-zinc-900 border-white text-white shadow-md shadow-white/5 ring-1 ring-white/20" 
                    : "bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] mb-1.5">
                  <span className={isSelected ? "text-white font-bold" : "text-zinc-500"}>
                    LAYER 0{layer.number}
                  </span>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                </div>
                <div className="text-xs font-semibold line-clamp-1">
                  {layer.name.split(":")[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Layer Deep Dive Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-5">
            <Card className="bg-zinc-950 border-zinc-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="pixel" className="text-[10px]">
                  {activeLayer.badge}
                </Badge>
                <span className="font-mono text-xs text-zinc-500">STAGE_0{activeLayer.number}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{activeLayer.name}</h3>
              <p className="text-zinc-300 text-sm leading-relaxed mb-6 font-medium">
                {activeLayer.summary}
              </p>

              <div className="space-y-4 pt-4 border-t border-zinc-800 text-xs">
                <div>
                  <div className="font-mono text-[11px] text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-zinc-400" /> Core Technical Principle
                  </div>
                  <p className="text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                    {activeLayer.technicalPrinciple}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg">
                    <div className="font-mono text-[11px] text-red-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400" /> Real-World Problem
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {activeLayer.realWorldProblem}
                    </p>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg">
                    <div className="font-mono text-[11px] text-emerald-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Solution Applied
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      {activeLayer.solutionDetail}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card className="bg-zinc-950 border-zinc-800 h-full flex flex-col justify-between overflow-hidden">
              <CardHeader className="bg-zinc-900/90 border-b border-zinc-800 p-3.5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <span className="font-mono text-[11px] text-zinc-400 ml-2">layer_{activeLayer.number}_spec.ts</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono border-zinc-700 text-zinc-400">
                  TYPESCRIPT
                </Badge>
              </CardHeader>
              <CardContent className="p-4 bg-black font-mono text-xs text-zinc-300 overflow-x-auto flex-grow flex items-center">
                <pre className="text-xs text-zinc-300 font-mono leading-relaxed w-full">
                  <code>{activeLayer.diagramCode}</code>
                </pre>
              </CardContent>
              <div className="p-3 bg-zinc-900/50 border-t border-zinc-800/80 font-mono text-[11px] text-zinc-500 flex justify-between">
                <span>STATUS: VERIFIED & UNIT-TESTED</span>
                <span>SUPABASE + POSTGRES</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
