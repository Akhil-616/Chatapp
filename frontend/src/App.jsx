import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import MessagesView from './components/MessagesView';
import DirectoryView from './components/DirectoryView';
import NotificationsView from './components/NotificationsView';
import ProfileView from './components/ProfileView';
import FlowingParticlesCanvas from './components/FlowingParticlesCanvas';
import MarqueeWordmark from './components/MarqueeWordmark';
import RealtimeShowcaseSection from './components/RealtimeShowcaseSection';
import CommunityIdeasBoard from './components/CommunityIdeasBoard';
import CampusFooter from './components/CampusFooter';
import { WebSocketProvider } from './context/WebSocketContext';
import { Loader2 } from 'lucide-react';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');
  const [activeTab, setActiveTab] = useState('messages');
  const [activeChatUser, setActiveChatUser] = useState(null);

  const fetchProfile = async (userId, userEmail) => {
    if (!isSupabaseConfigured) {
      const fallbackUsername = userEmail ? userEmail.split('@')[0] : 'student';
      setUserProfile({ id: userId, username: fallbackUsername, email: userEmail, full_name: '' });
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Fetching profile for user ID:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, email')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Could not fetch from profiles table:', error.message);
      }

      if (data && data.username) {
        console.log('👤 Profile found:', data.username, data.full_name);
        setUserProfile(data);
      } else {
        // Fallback: derive username from email if profile row is missing
        const fallbackUsername = userEmail ? userEmail.split('@')[0] : 'student';
        console.log('ℹ️ Using fallback username:', fallbackUsername);
        setUserProfile({ id: userId, username: fallbackUsername, email: userEmail, full_name: '' });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setUserProfile({ id: userId, username: userEmail ? userEmail.split('@')[0] : 'student', email: userEmail, full_name: '' });
    } finally {
      setLoading(false);
    }
  };

  // Restore and subscribe to auth state
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;
    let subscription = null;

    async function initAuth() {
      try {
        const { data: { session } = {} } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session || null);
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!isMounted) return;
          setSession(session || null);
          if (session?.user) {
            fetchProfile(session.user.id, session.user.email);
          } else {
            setUserProfile(null);
            setLoading(false);
          }
        });
        subscription = data?.subscription;
      } catch (err) {
        console.warn('Auth initialization skipped:', err);
        if (isMounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const handleOpenConversation = (targetUsername) => {
    setActiveChatUser(targetUsername);
    setActiveTab('messages');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
  };

  // 1. Show loading spinner while checking initial auth status
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center text-white">
        <div className="flex items-center space-x-3 text-gray-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
          <span>Connecting to SajiloPatra...</span>
        </div>
      </div>
    );
  }

  // 2. If authenticated, render the Main Dashboard
  if (session && userProfile) {
    return (
      <WebSocketProvider session={session} username={userProfile.username}>
        <div className="flex min-h-screen bg-[#030712] overflow-hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onGoHome={() => setActiveTab('messages')}
          />

          <main className="flex-1 flex">
            {activeTab === 'messages' && (
              <MessagesView
                currentUsername={userProfile.username}
                activeChatUser={activeChatUser}
                setActiveChatUser={setActiveChatUser}
              />
            )}

            {activeTab === 'directory' && (
              <DirectoryView
                currentUsername={userProfile.username}
                onOpenConversation={handleOpenConversation}
              />
            )}

            {activeTab === 'notifications' && <NotificationsView />}

            {activeTab === 'profile' && (
              <ProfileView
                userProfile={userProfile}
                email={session.user.email}
                onLogout={handleLogout}
                onProfileUpdate={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
              />
            )}

            {activeTab === 'settings' && (
              <div className="flex-1 p-8 pl-24 text-white">
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-sm text-gray-500 mt-2">Configuration and Preferences.</p>
              </div>
            )}
          </main>
        </div>
      </WebSocketProvider>
    );
  }

  // 3. Otherwise, render Public Landing Page
  return (
    <div className="cj-canvas min-h-screen relative overflow-x-hidden">
      <div className="relative z-10">
        {/* Hero Section with Edge-to-Edge Dynamic Swirling Particle Canvas */}
        <div className="relative w-full overflow-hidden">
          {/* Dynamic Background Swirling Particle Canvas covering full hero background */}
          <FlowingParticlesCanvas className="opacity-90" />

          <div className="cj-wrap relative z-10">
            <header className="cj-header">
              <div className="cj-navpill">
                <div className="cj-brand">
                  <div className="cj-mark">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5H9l-4 4v-4H5.5C4.67 15 4 14.33 4 13.5v-8Z"
                        fill="#F2ECDE"
                      />
                    </svg>
                  </div>
                  <span className="cj-wordmark">connectjutti</span>
                </div>
                <span className="cj-navdivider"></span>
                <div className="cj-navactions">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('login');
                      setModalOpen(true);
                    }}
                    className="cj-btn cj-btn-text"
                  >
                    Log in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('signup');
                      setModalOpen(true);
                    }}
                    className="cj-btn cj-btn-accent"
                  >
                    Sign up
                  </button>
                </div>
              </div>
            </header>

            <section className="cj-hero">
              {/* Left Text Column */}
              <div className="cj-hero-text text-left">
                <div className="cj-eyebrow">
                  <span className="cj-status-dot"></span>
                  built for campus circles
                </div>
                <h1 className="cj-hero-title">
                  Talk to your<br />
                  <span className="cj-underline-wrap">
                    people.
                    <svg viewBox="0 0 160 14" preserveAspectRatio="none">
                      <path
                        d="M2 8 C 40 2, 120 2, 158 8"
                        stroke="#EFA23D"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <path
                        d="M2 12 C 40 7, 120 7, 158 12"
                        stroke="#1B6C5D"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                        opacity="0.6"
                      />
                    </svg>
                  </span>
                </h1>
                <p className="cj-subcopy">
                  ConnectJutti is where your campus keeps its group chats — circles, DMs, and study threads for people who already get you.
                </p>
                <div className="cj-cta-row">
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('signup');
                      setModalOpen(true);
                    }}
                    className="cj-btn cj-btn-solid"
                  >
                    Sign up free
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('login');
                      setModalOpen(true);
                    }}
                    className="cj-btn cj-btn-ghost"
                  >
                    Log in
                  </button>
                </div>
                <div className="cj-stat-row">
                  <span><b>12,400+</b> students</span>
                  <span className="cj-stat-sep"></span>
                  <span><b>180+</b> campus circles</span>
                </div>
              </div>

              {/* Right Collage Column */}
              <div className="cj-collage">
                <div className="cj-collage-inner">
                  <svg className="cj-connectors" viewBox="0 0 420 460">
                    <path
                      d="M155 200 C 110 230, 110 250, 155 268"
                      stroke="#17140F"
                      strokeOpacity="0.16"
                      strokeWidth="1.5"
                      strokeDasharray="3 6"
                      fill="none"
                    />
                    <path
                      d="M310 290 C 350 250, 355 160, 335 108"
                      stroke="#17140F"
                      strokeOpacity="0.16"
                      strokeWidth="1.5"
                      strokeDasharray="3 6"
                      fill="none"
                    />
                    <circle cx="155" cy="200" r="3.5" fill="#17140F" fillOpacity="0.32" />
                    <circle cx="155" cy="268" r="3.5" fill="#17140F" fillOpacity="0.32" />
                    <circle cx="335" cy="108" r="3.5" fill="#17140F" fillOpacity="0.32" />
                  </svg>

                  <div className="cj-chip cj-card-main">
                    <div className="cj-card-row">
                      <div className="cj-avatar">AS</div>
                      <div>
                        <div className="cj-card-name">Aashma Shrestha</div>
                        <div className="cj-card-sub">CS batch · KU</div>
                      </div>
                    </div>
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-[rgba(23,20,15,0.04)] text-xs text-[#17140F]">
                      "Is anyone studying at the department library?"
                    </div>
                    <div className="cj-status-tag">
                      <span className="cj-status-dot"></span>
                      online now
                    </div>
                  </div>

                  <div className="cj-chip cj-card-group">
                    <span className="cj-group-tag">BCA study circle · 6 members</span>
                    <div className="cj-typing-row">
                      <div className="cj-typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="cj-card-sub">Rojan is typing…</span>
                    </div>
                  </div>

                  <div className="cj-chip cj-card-handle">
                    <span className="cj-status-dot"></span>
                    @suman_kt
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Marquee Wordmark Scroller */}
        <MarqueeWordmark speed={28} />

        {/* Section 1: Realtime WebSocket & Chat Preview */}
        <RealtimeShowcaseSection />

        {/* Section 2: Community Design Lab & RFC Board */}
        <CommunityIdeasBoard />

        {/* Footer */}
        <CampusFooter
          onOpenAuth={(mode) => {
            setModalMode(mode);
            setModalOpen(true);
          }}
        />
      </div>

      <AuthModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
        onAuthSuccess={(newSession) => {
          setSession(newSession);
          fetchProfile(newSession.user.id, newSession.user.email);
        }}
      />
    </div>
  );
}
