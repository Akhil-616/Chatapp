import React, { useState } from "react";
import { ViewMode } from "@/src/types";
import { Navbar } from "@/src/components/Navbar";
import { HeroSection } from "@/src/components/HeroSection";
import { ScrollShowcaseSection } from "@/src/components/ScrollShowcaseSection";
import { LoginModal } from "@/src/components/LoginModal";
import { AppView } from "@/src/components/AppView";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>("landing");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<"login" | "signup">("login");

  const openAuth = (mode: "login" | "signup" = "login") => {
    setLoginMode(mode);
    setIsLoginModalOpen(true);
  };

  if (currentView === "app") {
    return <AppView onBackToLanding={() => setCurrentView("landing")} />;
  }

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-white selection:text-black font-sans antialiased">
      {/* Discord-Style Transparent Navbar */}
      <Navbar
        currentView={currentView}
        onSwitchView={setCurrentView}
        onOpenLogin={openAuth}
      />

      {/* Main Landing Page */}
      <main>
        {/* Full Viewport Hero that Shrinks into a Card on Scroll */}
        <HeroSection
          onOpenLogin={openAuth}
        />

        {/* Free, Unboxed Scroll Flow + Monumental Wordmark (Antigravity Style) */}
        <ScrollShowcaseSection
          onOpenLogin={openAuth}
          onLaunchApp={() => setCurrentView("app")}
        />
      </main>

      {/* Login / Authentication Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        initialMode={loginMode}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccessLogin={() => {
          setIsLoginModalOpen(false);
          setCurrentView("app");
        }}
      />
    </div>
  );
}
