import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import MessagesView from './components/MessagesView';
import DirectoryView from './components/DirectoryView';
import NotificationsView from './components/NotificationsView';
import ProfileView from './components/ProfileView';
import { WebSocketProvider } from './context/WebSocketContext';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');
  const [activeTab, setActiveTab] = useState('messages');
  const [activeChatUser, setActiveChatUser] = useState(null);

  const fetchProfile = async (userId, userEmail) => {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
    <div className="relative min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-hidden flex flex-col justify-between">
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 150px 150px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 300px 80px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 450px 220px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 600px 380px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 800px 100px, #ffffff, rgba(0,0,0,0))',
          backgroundSize: '850px 850px'
        }}
      />

      <header className="relative z-10 w-full px-8 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black font-extrabold flex items-center justify-center text-sm tracking-tighter">
            SP
          </div>
          <span className="font-bold text-lg tracking-tight">SajiloPatra</span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => { setModalMode('login'); setModalOpen(true); }}
            className="text-xs font-semibold text-gray-300 hover:text-white transition px-4 py-2"
          >
            Log In
          </button>
          <button
            onClick={() => { setModalMode('signup'); setModalOpen(true); }}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-white text-black hover:bg-gray-200 transition shadow-sm"
          >
            Launch App
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 -mt-10">
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight text-white mb-6">
          Sajilo<br />Patra
        </h1>
        <p className="max-w-md md:max-w-lg text-sm md:text-base text-gray-400 font-light leading-relaxed mb-10">
          Match your vibes. Share your frequency. Connect and talk with other college students who share your niche.
        </p>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => { setModalMode('login'); setModalOpen(true); }}
            className="px-8 py-3 rounded-full bg-white text-black font-semibold text-sm hover:bg-gray-200 transition shadow-[0_0_25px_rgba(255,255,255,0.25)] active:scale-95"
          >
            Log in
          </button>
          <button
            onClick={() => { setModalMode('signup'); setModalOpen(true); }}
            className="px-8 py-3 rounded-full bg-[#181a20] text-gray-200 font-semibold text-sm border border-gray-800 hover:border-gray-700 hover:text-white transition active:scale-95"
          >
            Sign up
          </button>
        </div>
      </main>

      <footer className="relative z-10 pb-8 text-center">
        <span className="text-[10px] tracking-[0.25em] text-gray-500 uppercase font-mono">
          Scroll to explore
        </span>
        <div className="w-[1px] h-3 bg-gray-600 mx-auto mt-2 opacity-50" />
      </footer>

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