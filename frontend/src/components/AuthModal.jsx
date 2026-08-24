import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getCollegeFromEmail } from '../lib/collegeUtils';
import { X, Mail, Lock, User, AtSign, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setUsername('');
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are missing in your environment configuration.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        onAuthSuccess(data.session);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase credentials (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY) are missing in your environment configuration.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    // Barrier: strictly enforce Islington College email domain
    if (!cleanEmail.endsWith('@islingtoncollege.edu.np')) {
      setErrorMsg('Access Restricted: Only Islington College students with an official @islingtoncollege.edu.np email can sign up.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      // 1. Check if username is already taken in the profiles table
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingUser) {
        throw new Error('That username is already taken. Please choose another.');
      }

      // 2. Perform Supabase Auth Sign Up with metadata for the DB trigger
      const cleanUsername = username.trim().toLowerCase();
      const cleanFullName = fullName.trim();
      const derivedCollege = getCollegeFromEmail(cleanEmail);

      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: cleanFullName,
            username: cleanUsername,
            college: derivedCollege,
            university: derivedCollege,
            bio: '',
          },
        },
      });

      if (authError) {
        if (
          authError.message?.toLowerCase().includes('error sending confirmation email') ||
          authError.message?.toLowerCase().includes('rate limit')
        ) {
          throw new Error(
            'Supabase Email Rate Limit Exceeded: Supabase free tier limits built-in emails to ~3-4/hour. Please configure Custom SMTP (e.g. Resend/Brevo) or disable "Confirm email" in Supabase Auth settings for instant sign-up.'
          );
        }
        throw authError;
      }

      // 3. If an active session was returned (email confirmation off or instant login),
      // ensure the profile row is synced as a fallback to the server trigger
      if (authData.session && authData.user) {
        try {
          await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: authData.user.email,
              username: cleanUsername,
              full_name: cleanFullName || null,
              college: derivedCollege,
            }, { onConflict: 'id' });
        } catch (syncErr) {
          console.log('Database trigger handled profile creation:', syncErr);
        }

        onAuthSuccess(authData.session);
        onClose();
      } else if (authData.user && !authData.session) {
        // Email confirmation is ON — user is created in auth.users, DB trigger creates profile row
        setInfoMsg('Account created! A confirmation link has been sent to your Islington email. Please verify your email before logging in.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-[#FFFCF5] border border-[rgba(23,20,15,0.14)] rounded-2xl p-6 md:p-8 shadow-2xl text-[#17140F]">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => { resetForm(); onClose(); }}
          className="absolute top-5 right-5 text-[#6B6355] hover:text-[#17140F] transition-colors p-1.5 rounded-full hover:bg-[rgba(23,20,15,0.06)]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-[#17140F] tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Join ConnectJutti'}
          </h2>
          <p className="text-sm text-[#6B6355] mt-1 font-['Inter']">
            {mode === 'login'
              ? 'Sign in to your campus channels and peer chat.'
              : 'Discover circles and study threads across campuses.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[rgba(23,20,15,0.14)] mb-6">
          <button
            type="button"
            onClick={() => handleModeSwitch('login')}
            className={`pb-2.5 text-sm font-semibold transition-all relative ${
              mode === 'login'
                ? 'text-[#17140F] border-b-2 border-[#17140F]'
                : 'text-[#6B6355] hover:text-[#17140F]'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('signup')}
            className={`ml-6 pb-2.5 text-sm font-semibold transition-all relative ${
              mode === 'signup'
                ? 'text-[#17140F] border-b-2 border-[#17140F]'
                : 'text-[#6B6355] hover:text-[#17140F]'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 text-xs leading-relaxed font-medium">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[#1B6C5D] text-xs leading-relaxed font-medium">
            {infoMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#6B6355] mb-1.5 font-['Inter']">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6B6355] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aashma Shrestha"
                    className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.14)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D] focus:ring-1 focus:ring-[#1B6C5D] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6355] mb-1.5 font-['Inter']">Username (Handle)</label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-[#6B6355] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="aashma"
                    className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.14)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D] focus:ring-1 focus:ring-[#1B6C5D] transition-all font-['Space_Mono']"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#6B6355] font-['Inter']">
                {mode === 'signup' ? 'Islington College Email' : 'Islington Email or Account'}
              </label>
              {mode === 'signup' && (
                <span className="text-[10px] font-['Space_Mono'] font-bold text-[#1B6C5D] bg-[#1B6C5D]/10 px-2 py-0.5 rounded-md">
                  @islingtoncollege.edu.np required
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B6355] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student.id@islingtoncollege.edu.np"
                className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.14)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D] focus:ring-1 focus:ring-[#1B6C5D] transition-all"
              />
            </div>
            {mode === 'signup' && (
              <p className="text-[11px] text-[#8A8275] mt-1">
                Only students with official Islington College email credentials can register.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6B6355] mb-1.5 font-['Inter']">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B6355] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.14)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D] focus:ring-1 focus:ring-[#1B6C5D] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#17140F] text-[#FFFCF5] hover:bg-[#2b2519] font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 text-sm transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
          >
            <span>{loading ? 'Please wait...' : mode === 'login' ? 'Continue' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}