import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Check, AlertCircle, User, AtSign, School, FileText } from 'lucide-react';

export default function ProfileView({ userProfile, email, onLogout, onProfileUpdate }) {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [bio, setBio] = useState(
    userProfile?.bio || 'Student Developer. Studying distributed systems and real-time networking.'
  );
  const [university, setUniversity] = useState(
    userProfile?.university || 'Tribhuvan University / Kathmandu University'
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getInitials = (name, fallback) => {
    const text = (name && name.trim()) || fallback || 'U';
    const parts = text.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSaved(false);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || userProfile?.id;

      if (!currentUserId) {
        throw new Error('User is not authenticated');
      }

      // Update profiles row in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
        })
        .eq('id', currentUserId);

      if (error) throw error;

      const updatedData = {
        ...userProfile,
        full_name: fullName.trim(),
      };

      if (onProfileUpdate) {
        onProfileUpdate(updatedData);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMsg(err.message || 'Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  const displayName = fullName || userProfile?.username || 'Student';

  return (
    <div className="flex-1 min-h-screen bg-[#030712] text-white p-8 pl-24 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Student Profile</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your personal details, campus identity, and public handle.
        </p>
      </div>

      <div className="bg-[#0b0e14] border border-gray-900 rounded-2xl p-6 space-y-6">
        {/* User Header Card */}
        <div className="flex items-center space-x-4 pb-4 border-b border-gray-900">
          <div className="w-14 h-14 rounded-full bg-white text-black font-extrabold flex items-center justify-center text-base shadow-sm">
            {getInitials(fullName, userProfile?.username)}
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">
              {displayName}
            </h3>
            <p className="text-xs text-gray-400 flex items-center space-x-2">
              <span>@{userProfile?.username || 'username'}</span>
              <span>•</span>
              <span className="text-gray-500">{email}</span>
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>Profile successfully updated in database!</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-gray-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Suman Kumar"
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-all"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Your real name shown to peers in directory and conversation headers.
            </p>
          </div>

          {/* Username Handle (Read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <AtSign className="w-3.5 h-3.5 text-gray-400" />
              <span>Username Handle</span>
            </label>
            <input
              type="text"
              disabled
              value={userProfile?.username || ''}
              className="w-full bg-[#12161c] border border-gray-800/80 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed font-mono"
            />
            <p className="text-[11px] text-gray-600 mt-1">
              Unique handle used for message routing and peer discovery.
            </p>
          </div>

          {/* University */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <School className="w-3.5 h-3.5 text-gray-400" />
              <span>University Affiliation</span>
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Tribhuvan University / Kathmandu University"
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span>Academic Bio</span>
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other students about your interests, courses, or projects..."
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-white text-black font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-200 transition flex items-center space-x-2 disabled:opacity-50 active:scale-95"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition active:scale-95"
            >
              Log Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}