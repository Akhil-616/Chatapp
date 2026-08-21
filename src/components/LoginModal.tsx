import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { X, Lock, Mail, User, ArrowRight, UserCheck, AlertCircle } from "lucide-react";
import { loginUser, signupUser, setStoredAuthUser } from "@/src/lib/auth";
import { realtimeBus } from "@/src/lib/realtime";

interface LoginModalProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  initialMode = "login", 
  onClose, 
  onSuccessLogin 
}) => {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("Aayush Shrestha");
  const [email, setEmail] = useState("student@tu.edu.np");
  const [password, setPassword] = useState("password123");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    if (mode === "login") {
      const res = await loginUser(email, password);
      setIsLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }
      realtimeBus.connectWebSocket();
      onSuccessLogin();
      onClose();
    } else {
      // Signup mode: extract username or clean handle
      const username = (name || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "_");
      const res = await signupUser(email, password, username);
      setIsLoading(false);
      if (res.error) {
        setErrorMessage(res.error);
        return;
      }
      realtimeBus.connectWebSocket();
      onSuccessLogin();
      onClose();
    }
  };

  const handleGuestEntry = () => {
    setStoredAuthUser({
      id: "user-guest",
      email: "guest@sajilopatra.edu.np",
      username: "aayush_s",
      token: "dev-token-aayush_s",
    });
    realtimeBus.connectWebSocket();
    onSuccessLogin();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-[#09090d] p-6 sm:p-7 text-white shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Clean Header */}
        <div className="text-left mb-5">
          <h2 className="text-xl font-bold tracking-tight text-white">
            {mode === "login" ? "Welcome back" : "Join Sajilo Patra"}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === "login" 
              ? "Sign in to your campus channels and peer chat."
              : "Discover students by niches across campuses."}
          </p>
        </div>

        {/* Minimal Auth Tab Toggle */}
        <div className="flex border-b border-zinc-800 mb-5">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`pb-2.5 px-4 text-xs font-semibold transition-colors relative cursor-pointer ${
              mode === "login"
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Log In
            {mode === "login" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`pb-2.5 px-4 text-xs font-semibold transition-colors relative cursor-pointer ${
              mode === "signup"
                ? "text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Sign Up
            {mode === "signup" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Aayush Shrestha"
                  className="pl-9 h-10 bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs focus:border-zinc-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Campus or Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@tu.edu.np"
                className="pl-9 h-10 bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs focus:border-zinc-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-9 h-10 bg-zinc-950 border-zinc-800 text-white rounded-lg text-xs focus:border-zinc-500"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-lg bg-white text-black hover:bg-zinc-200 font-semibold text-xs transition-all shadow-sm mt-3 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === "login" ? "Continue" : "Create Account"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleGuestEntry}
              className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Or enter directly as Guest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
