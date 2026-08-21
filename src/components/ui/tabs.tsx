import * as React from "react";
import { cn } from "@/src/lib/utils";

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-lg bg-zinc-900/90 p-1 border border-zinc-800 text-zinc-400",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.value === value;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        isActive
          ? "bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.value !== value) return null;

  return (
    <div
      className={cn("mt-4 focus-visible:outline-none animate-in fade-in-50 duration-200", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
