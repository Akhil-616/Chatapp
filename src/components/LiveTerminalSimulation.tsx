import React, { useState, useRef, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Terminal, Send, Play, RotateCcw, ShieldCheck, Zap } from "lucide-react";

export const LiveTerminalSimulation: React.FC = () => {
  const [logs, setLogs] = useState<Array<{ type: 'system' | 'in' | 'out' | 'error' | 'success'; text: string; time: string }>>([
    { type: 'system', text: '--- SAJILO PATRA BACKEND TERMINAL SIMULATOR v1.0.4 ---', time: '00:00:01' },
    { type: 'system', text: 'WSS Engine listening on port 3000 (ws://127.0.0.1:3000)', time: '00:00:02' },
    { type: 'system', text: 'Connected to Supabase PostgreSQL (RLS Enabled: dual-tier rules active)', time: '00:00:02' },
    { type: 'success', text: 'AUTH: Token verified for user_id="std_akhil" -> connection upgraded', time: '00:00:03' },
    { type: 'in', text: 'MAP_REGISTRY: Client "akhil" stored in memory lookup table (Map size: 2)', time: '00:00:04' },
    { type: 'out', text: 'ROUTE_EVENT: akhil -> sirjan: "Hey! Did you test the matching layer?" [0.4ms]', time: '00:00:05' }
  ]);

  const [inputVal, setInputVal] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const runCommand = (cmd: string) => {
    const time = new Date().toTimeString().split(' ')[0];
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newLogs = [...logs, { type: 'in' as const, text: `$ ${trimmed}`, time }];

    if (trimmed.toLowerCase() === 'help') {
      newLogs.push({
        type: 'system',
        text: 'Available commands: connect <username>, send <user> <msg>, match, rls-check, jwt-verify, clear, status',
        time
      });
    } else if (trimmed.toLowerCase().startsWith('connect')) {
      const user = trimmed.split(' ')[1] || 'GuestUser';
      newLogs.push({
        type: 'success',
        text: `[WSS UPGRADE] Client "${user}" connected with signed JWT bearer. Added to active in-memory Map<string, WebSocket>.`,
        time
      });
    } else if (trimmed.toLowerCase().startsWith('send')) {
      const parts = trimmed.split(' ');
      const target = parts[1] || 'sirjan';
      const msg = parts.slice(2).join(' ') || 'Hello via WebSocket!';
      newLogs.push({
        type: 'out',
        text: `[PG WRITE] 1 row inserted into "messages" (id=msg_${Date.now().toString().slice(-4)})`,
        time
      });
      newLogs.push({
        type: 'success',
        text: `[WSS PUSH] In-memory route executed -> socket(${target}) delivered: "${msg}" (Latency: 0.7ms)`,
        time
      });
    } else if (trimmed.toLowerCase() === 'match') {
      newLogs.push({
        type: 'system',
        text: `[AFFINITY ENGINE] Computing Jaccard similarity across interest vectors (Courses: CS301, AI402)...`,
        time
      });
      newLogs.push({
        type: 'success',
        text: `[MATCH FOUND] Affinity 96% -> Akhil Bhandari matched with Kriti Sharma (Distributed Systems & Rust)`,
        time
      });
    } else if (trimmed.toLowerCase() === 'rls-check') {
      newLogs.push({
        type: 'system',
        text: `[POSTGRES RLS] Checking SELECT on 'messages': auth.uid()=current_user -> PASS. 0 unauthorized leaks.`,
        time
      });
    } else if (trimmed.toLowerCase() === 'jwt-verify') {
      newLogs.push({
        type: 'success',
        text: `[JWT CRYPTO] Signature verified with Supabase RS256 public key. Claims: { sub: "std_akhil", role: "authenticated" }`,
        time
      });
    } else if (trimmed.toLowerCase() === 'clear') {
      setLogs([]);
      setInputVal("");
      return;
    } else {
      newLogs.push({
        type: 'error',
        text: `Command not recognized: "${trimmed}". Type "help" for a list of simulated server actions.`,
        time
      });
    }

    setLogs(newLogs);
    setInputVal("");
  };

  return (
    <section id="terminal" className="py-16 md:py-20 border-b border-zinc-800 bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="pixel">INTERACTIVE CONSOLE</Badge>
              <span className="font-mono text-xs text-zinc-500">TERMINAL_SIMULATOR</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Terminal className="h-7 w-7 text-emerald-400" />
              Live WebSocket Server Simulation
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Test how the backend executes connection upgrades, in-memory Map lookups, write-before-send persistence, and token verification.
            </p>
          </div>

          {/* Quick Action Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'connect priya', cmd: 'connect priya' },
              { label: 'send akhil "Hi"', cmd: 'send akhil "Testing direct socket routing"' },
              { label: 'run match', cmd: 'match' },
              { label: 'jwt-verify', cmd: 'jwt-verify' },
              { label: 'rls-check', cmd: 'rls-check' }
            ].map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => runCommand(action.cmd)}
                className="text-[11px] font-mono border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-600 h-7"
              >
                <Zap className="h-3 w-3 text-amber-400 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Terminal Window */}
        <div className="rounded-xl border-2 border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden font-mono">
          {/* Header */}
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-zinc-400 ml-2 font-semibold">
                sajilo-patra-server • bash (tty1)
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-zinc-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                WSS: 3000
              </span>
              <button 
                onClick={() => runCommand('clear')}
                className="hover:text-white transition-colors cursor-pointer text-xs"
              >
                clear
              </button>
            </div>
          </div>

          {/* Terminal Screen Logs */}
          <div 
            ref={scrollRef}
            className="p-4 bg-black h-72 overflow-y-auto space-y-1.5 text-xs text-zinc-300 leading-relaxed font-mono"
          >
            {logs.map((log, index) => {
              let color = 'text-zinc-300';
              if (log.type === 'system') color = 'text-cyan-400';
              if (log.type === 'success') color = 'text-emerald-400';
              if (log.type === 'out') color = 'text-amber-300';
              if (log.type === 'error') color = 'text-red-400';
              if (log.type === 'in') color = 'text-white font-bold';

              return (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-zinc-600 select-none text-[10px]">{log.time}</span>
                  <span className={color}>{log.text}</span>
                </div>
              );
            })}
          </div>

          {/* Input Prompt */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              runCommand(inputVal);
            }}
            className="p-3 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-2"
          >
            <span className="text-emerald-400 font-bold text-xs pl-1">$</span>
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Type command ('help', 'connect akhil', 'match', 'jwt-verify')..."
              className="w-full bg-transparent text-xs text-white outline-none font-mono placeholder:text-zinc-600"
            />
            <Button 
              type="submit" 
              variant="pixel" 
              size="sm" 
              className="h-7 px-3 text-[11px]"
            >
              EXECUTE
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};
