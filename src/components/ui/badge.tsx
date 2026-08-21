import * as React from "react";
import { cn } from "@/src/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "pixel" | "success";
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    secondary: "border-transparent bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
    destructive: "border-transparent bg-red-900/60 text-red-300 border border-red-700/50",
    outline: "text-zinc-300 border border-zinc-700",
    pixel: "bg-black text-white border border-white font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]",
    success: "bg-emerald-950 text-emerald-400 border border-emerald-700/60",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { Badge };
