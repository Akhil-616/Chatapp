import React from "react";
import { ViewMode } from "@/src/types";

interface NavbarProps {
  currentView: ViewMode;
  onSwitchView: (view: ViewMode) => void;
  onOpenLogin: (mode?: "login" | "signup") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onSwitchView, onOpenLogin }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-transparent pointer-events-none">
      <div className="w-full flex h-20 sm:h-24 items-center justify-between px-6 sm:px-12 lg:px-16 pointer-events-auto">
        
        {/* Brand Wordmark on Left (Pure refined typography) */}
        <button
          onClick={() => onSwitchView("landing")}
          className="flex items-center text-left focus:outline-none cursor-pointer group transition-transform active:scale-95"
        >
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl md:text-[26px] font-extrabold tracking-[-0.045em] text-white group-hover:text-zinc-200 transition-colors leading-none select-none">
              Sajilo<span className="text-zinc-300 font-semibold ml-0.5">Patra</span>
            </span>
          </div>
        </button>

        {/* Right Action Buttons (Pure text, zero icons) */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => onOpenLogin("login")}
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-full transition-all cursor-pointer backdrop-blur-md"
          >
            Log In
          </button>

          <button
            onClick={() => onSwitchView("app")}
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-zinc-200 rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Launch App
          </button>
        </div>

      </div>
    </header>
  );
};
