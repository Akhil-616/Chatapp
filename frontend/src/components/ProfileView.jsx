import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProfileView({ userProfile, email, onLogout }) {
  const [bio, setBio] = useState(
    'Student Developer. Studying distributed systems and real-time networking.'
  );
  const [saved, setSaved] = useState(false);

  const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'AA');

  return (
    <div className="flex-1 min-h-screen bg-[#030712] text-white p-8 pl-24 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Student Profile</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your public details and university affiliation.
        </p>
      </div>

      <div className="bg-[#0b0e14] border border-gray-900 rounded-2xl p-6 space-y-6">
        {/* User Card */}
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-white text-black font-extrabold flex items-center justify-center text-base">
            {getInitials(userProfile?.username || 'User')}
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              @{userProfile?.username || 'username'}
            </h3>
            <p className="text-xs text-gray-500">{email}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Username Handle
            </label>
            <input
              type="text"
              disabled
              value={userProfile?.username || ''}
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              University
            </label>
            <input
              type="text"
              defaultValue="Tribhuvan University / Kathmandu University"
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 2000);
            }}
            className="bg-white text-black font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-gray-200 transition"
          >
            {saved ? 'Saved!' : 'Save Profile'}
          </button>
          <button
            onClick={onLogout}
            className="bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-xs px-5 py-2.5 rounded-xl hover:bg-red-500/20 transition"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}