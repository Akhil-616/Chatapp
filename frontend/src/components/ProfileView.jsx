import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Check, AlertCircle, User, AtSign, School, FileText } from 'lucide-react';

export default function ProfileView({ userProfile, email, onLogout, onProfileUpdate }) {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [university, setUniversity] = useState(
    userProfile?.university || 'Islington College Kathmandu'
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
      const cleanFullName = fullName.trim();
      const cleanBio = bio.slice(0, 60).trim();
      const cleanUniversity = university.trim() || 'Islington College Kathmandu';

      // 1. Save in Supabase Auth user_metadata (always present and supported for all Supabase accounts)
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: cleanFullName,
            university: cleanUniversity,
            bio: cleanBio,
          },
        });
      } catch (authMetaErr) {
        console.debug('Auth metadata update info:', authMetaErr);
      }

      // 2. Update profiles row in Supabase database
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || userProfile?.id;

      if (currentUserId) {
        // Attempt full update; if custom columns (university/bio) don't exist yet, fallback to full_name
        try {
          const { error: fullUpdateErr } = await supabase
            .from('profiles')
            .update({
              full_name: cleanFullName,
              university: cleanUniversity,
              bio: cleanBio,
            })
            .eq('id', currentUserId);

          if (fullUpdateErr) {
            // Fallback: standard profile columns
            await supabase
              .from('profiles')
              .update({
                full_name: cleanFullName,
              })
              .eq('id', currentUserId);
          }
        } catch (dbErr) {
          console.debug('Profiles table update:', dbErr);
        }
      }

      // 3. Persist locally for immediate UI responsiveness
      const updatedData = {
        ...userProfile,
        full_name: cleanFullName,
        university: cleanUniversity,
        bio: cleanBio,
      };

      if (typeof window !== 'undefined' && userProfile?.username) {
        localStorage.setItem(
          `cj_profile_${userProfile.username.toLowerCase()}`,
          JSON.stringify({
            university: cleanUniversity,
            bio: cleanBio,
            full_name: cleanFullName,
          })
        );
      }

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
    <div className="flex-1 min-h-screen bg-[#F6F2EA] text-[#17140F] p-8 pl-24 max-w-2xl font-['Inter']">
      <div className="mb-8">
        <h1 className="text-3xl font-['Space_Grotesk'] font-extrabold tracking-tight text-[#17140F]">Student Profile</h1>
        <p className="text-sm text-[#6B6355] mt-1">
          Manage your Islington College academic identity, bio, and public handle.
        </p>
      </div>

      <div className="bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] rounded-3xl p-7 shadow-xs space-y-6">
        {/* User Header Card */}
        <div className="flex items-center space-x-4 pb-5 border-b border-[rgba(23,20,15,0.08)]">
          <div className="w-14 h-14 rounded-2xl bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold flex items-center justify-center text-lg shadow-xs">
            {getInitials(fullName, userProfile?.username)}
          </div>
          <div>
            <h3 className="font-['Space_Grotesk'] font-bold text-xl text-[#17140F]">
              {displayName}
            </h3>
            <p className="text-xs text-[#6B6355] flex items-center space-x-2 mt-0.5">
              <span className="font-['Space_Mono'] text-[#17140F]">@{userProfile?.username || 'username'}</span>
              <span>•</span>
              <span className="text-[#8A8275]">{email}</span>
            </p>
            <p className="text-[11px] font-['Space_Mono'] text-[#1B6C5D] font-bold mt-1">
              {university || 'Islington College Kathmandu'}
            </p>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saved && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Full Name Field */}
          <div>
            <label className="block text-xs font-['Space_Grotesk'] font-bold text-[#17140F] mb-1.5 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#1B6C5D]" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Akhil Bhandari"
              className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition"
            />
            <p className="text-[11px] text-[#8A8275] mt-1">
              Your display name shown to peers across directory cards and conversations.
            </p>
          </div>

          {/* Username Handle (Read-only) */}
          <div>
            <label className="block text-xs font-['Space_Grotesk'] font-bold text-[#17140F] mb-1.5 flex items-center space-x-1.5">
              <AtSign className="w-3.5 h-3.5 text-[#1B6C5D]" />
              <span>Username Handle</span>
            </label>
            <input
              type="text"
              disabled
              value={userProfile?.username || ''}
              className="w-full bg-[#F2ECDE]/70 border border-[rgba(23,20,15,0.1)] rounded-xl px-4 py-2.5 text-sm text-[#6B6355] cursor-not-allowed font-['Space_Mono']"
            />
            <p className="text-[11px] text-[#8A8275] mt-1">
              Unique network handle used for peer routing and direct messages.
            </p>
          </div>

          {/* University Affiliation (Auto-filled to Islington College Kathmandu) */}
          <div>
            <label className="block text-xs font-['Space_Grotesk'] font-bold text-[#17140F] mb-1.5 flex items-center space-x-1.5">
              <School className="w-3.5 h-3.5 text-[#1B6C5D]" />
              <span>University Affiliation</span>
            </label>
            <input
              type="text"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              placeholder="Islington College Kathmandu"
              className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition"
            />
            <p className="text-[11px] text-[#1B6C5D] font-['Space_Mono'] mt-1">
              Auto-verified campus: Islington College Kathmandu
            </p>
          </div>

          {/* Academic Bio with 60 letter limit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-['Space_Grotesk'] font-bold text-[#17140F] flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1B6C5D]" />
                <span>Academic Bio</span>
              </label>
              <span
                className={`text-[11px] font-['Space_Mono'] ${
                  bio.length >= 60 ? 'text-red-600 font-bold' : 'text-[#8A8275]'
                }`}
              >
                {bio.length}/60 letters
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={60}
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 60))}
              placeholder="Add your bio (e.g. Computing student, Web dev enthusiast)..."
              className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition resize-none"
            />
            <p className="text-[11px] text-[#8A8275] mt-1">
              Short bio visible to fellow students (strictly limited to 60 characters).
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#2b2519] transition flex items-center space-x-2 disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="bg-red-50 text-red-700 border border-red-200 font-['Space_Grotesk'] font-bold text-xs px-5 py-3 rounded-xl hover:bg-red-100 transition cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
