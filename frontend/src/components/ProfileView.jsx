import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { GENDER_OPTIONS, getCollegeFromEmail } from '../lib/collegeUtils';
import { STARTER_SKILLS } from '../lib/skillsData';
import { Loader2, Check, AlertCircle, User, AtSign, School, Lock, BookOpen, Layers, Sparkles } from 'lucide-react';

export default function ProfileView({ userProfile, email, onLogout, onProfileUpdate }) {
  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [gender, setGender] = useState(userProfile?.gender || '');
  const [section, setSection] = useState(userProfile?.section || '');
  const [faculty, setFaculty] = useState(userProfile?.faculty || '');
  
  // College is strictly derived from the verified email domain and is read-only
  const derivedCollege = userProfile?.college || getCollegeFromEmail(email || userProfile?.email);

  // Skills state
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [selectedSkillNames, setSelectedSkillNames] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

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

  // Load canonical skills and user's profile_skills
  useEffect(() => {
    let isMounted = true;

    async function loadSkillsData() {
      try {
        setLoadingSkills(true);
        const { data: authData } = await supabase.auth.getUser();
        const currentUserId = authData?.user?.id || userProfile?.id;
        const usernameKey = (userProfile?.username || 'user').toLowerCase();

        // 1. Fetch canonical skills from DB
        let canonicalList = [];
        const { data: dbSkills, error: skillsErr } = await supabase
          .from('skills')
          .select('id, name')
          .order('name');

        if (!skillsErr && dbSkills && dbSkills.length > 0) {
          canonicalList = dbSkills;
        } else {
          // Fallback to starter skills list
          canonicalList = STARTER_SKILLS.map((name, idx) => ({
            id: `seed-skill-${idx}`,
            name,
          }));
        }

        if (isMounted) {
          setAllSkills(canonicalList);
        }

        // 2. Fetch user's profile_skills
        const userSelectedIds = [];
        const userSelectedNames = [];

        if (currentUserId) {
          try {
            const { data: mySkills, error: mySkillsErr } = await supabase
              .from('profile_skills')
              .select('skill_id, skills(id, name)')
              .eq('profile_id', currentUserId);

            if (!mySkillsErr && mySkills) {
              mySkills.forEach((item) => {
                if (item.skill_id) userSelectedIds.push(item.skill_id);
                if (item.skills?.name) userSelectedNames.push(item.skills.name);
              });
            }
          } catch (e) {
            console.debug('profile_skills query exception:', e);
          }
        }

        // Check localStorage fallback for optimistic/offline sync
        try {
          const rawLocal = localStorage.getItem(`cj_user_skills_${usernameKey}`);
          if (rawLocal) {
            const parsed = JSON.parse(rawLocal);
            if (Array.isArray(parsed)) {
              parsed.forEach((skillItem) => {
                const name = typeof skillItem === 'string' ? skillItem : skillItem.name;
                const id = typeof skillItem === 'string' ? null : skillItem.id;
                if (name && !userSelectedNames.includes(name)) {
                  userSelectedNames.push(name);
                }
                if (id && !userSelectedIds.includes(id)) {
                  userSelectedIds.push(id);
                }
              });
            }
          }
        } catch (e) {
          console.debug('Error loading local skills:', e);
        }

        if (isMounted) {
          setSelectedSkillIds(userSelectedIds);
          setSelectedSkillNames(userSelectedNames);
        }
      } catch (err) {
        console.error('Error loading skills:', err);
      } finally {
        if (isMounted) {
          setLoadingSkills(false);
        }
      }
    }

    loadSkillsData();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.id, userProfile?.username]);

  // Instant toggle handler per click
  const handleToggleSkill = async (skill) => {
    const isSelected =
      (skill.id && selectedSkillIds.includes(skill.id)) ||
      selectedSkillNames.includes(skill.name);

    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id || userProfile?.id;
    const usernameKey = (userProfile?.username || 'user').toLowerCase();

    // Optimistic UI updates
    let nextIds = [...selectedSkillIds];
    let nextNames = [...selectedSkillNames];

    if (isSelected) {
      nextIds = nextIds.filter((id) => id !== skill.id);
      nextNames = nextNames.filter((name) => name !== skill.name);
    } else {
      if (skill.id && !nextIds.includes(skill.id)) nextIds.push(skill.id);
      if (skill.name && !nextNames.includes(skill.name)) nextNames.push(skill.name);
    }

    setSelectedSkillIds(nextIds);
    setSelectedSkillNames(nextNames);

    // Save to local storage for instant sync across components & reloads
    try {
      localStorage.setItem(
        `cj_user_skills_${usernameKey}`,
        JSON.stringify(nextNames)
      );
    } catch (e) {
      console.debug('Error caching user skills locally:', e);
    }

    // Persist to Supabase profile_skills table
    if (currentUserId) {
      try {
        if (isSelected) {
          // Remove row from profile_skills
          if (skill.id && !skill.id.startsWith('seed-skill-')) {
            await supabase
              .from('profile_skills')
              .delete()
              .eq('profile_id', currentUserId)
              .eq('skill_id', skill.id);
          } else {
            // Find DB skill id if skill was rendered from fallback
            const { data: dbSkill } = await supabase
              .from('skills')
              .select('id')
              .eq('name', skill.name)
              .maybeSingle();

            if (dbSkill?.id) {
              await supabase
                .from('profile_skills')
                .delete()
                .eq('profile_id', currentUserId)
                .eq('skill_id', dbSkill.id);
            }
          }
        } else {
          // Insert row into profile_skills
          let targetSkillId = skill.id;
          if (!targetSkillId || targetSkillId.startsWith('seed-skill-')) {
            // Find or resolve canonical skill row ID
            const { data: dbSkill } = await supabase
              .from('skills')
              .select('id')
              .eq('name', skill.name)
              .maybeSingle();

            if (dbSkill?.id) {
              targetSkillId = dbSkill.id;
            }
          }

          if (targetSkillId && !targetSkillId.startsWith('seed-skill-')) {
            await supabase
              .from('profile_skills')
              .insert({
                profile_id: currentUserId,
                skill_id: targetSkillId,
              });
          }
        }
      } catch (dbErr) {
        console.debug('profile_skills persistence note:', dbErr);
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSaved(false);

    try {
      const cleanFullName = fullName.trim() || null;
      const cleanGender = gender.trim() || null;
      const cleanSection = section.trim() || null;
      const cleanFaculty = faculty.trim() || null;

      // 1. Update Supabase Auth user_metadata
      try {
        await supabase.auth.updateUser({
          data: {
            full_name: cleanFullName,
            college: derivedCollege,
            gender: cleanGender,
            section: cleanSection,
            faculty: cleanFaculty,
          },
        });
      } catch (authMetaErr) {
        console.debug('Auth metadata update note:', authMetaErr);
      }

      // 2. Update profiles row in Supabase database
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || userProfile?.id;

      if (currentUserId) {
        try {
          const { error: dbErr } = await supabase
            .from('profiles')
            .update({
              full_name: cleanFullName,
              college: derivedCollege,
              gender: cleanGender,
              section: cleanSection,
              faculty: cleanFaculty,
            })
            .eq('id', currentUserId);

          if (dbErr) {
            console.debug('Direct full column update failed, attempting standard columns:', dbErr.message);
            await supabase
              .from('profiles')
              .update({
                full_name: cleanFullName,
              })
              .eq('id', currentUserId);
          }
        } catch (dbErr) {
          console.debug('Profiles table update exception:', dbErr);
        }
      }

      // 3. Persist locally for instant responsive state updates
      const updatedData = {
        ...userProfile,
        full_name: cleanFullName || '',
        college: derivedCollege,
        gender: cleanGender || '',
        section: cleanSection || '',
        faculty: cleanFaculty || '',
      };

      if (typeof window !== 'undefined' && userProfile?.username) {
        localStorage.setItem(
          `cj_profile_${userProfile.username.toLowerCase()}`,
          JSON.stringify({
            full_name: cleanFullName || '',
            college: derivedCollege,
            gender: cleanGender || '',
            section: cleanSection || '',
            faculty: cleanFaculty || '',
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
    <div className="flex-1 min-h-screen bg-[#F6F2EA] text-[#17140F] py-10 px-4 sm:px-8 pl-20 sm:pl-28 md:pl-64 flex flex-col items-center justify-start font-['Inter'] overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-['Space_Grotesk'] font-extrabold tracking-tight text-[#17140F]">Student Profile</h1>
          <p className="text-sm text-[#6B6355] mt-1">
            Manage your academic identity, circle details, and public skills.
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
                <span className="text-[#8A8275]">{email || userProfile?.email}</span>
              </p>
              <p className="text-[11px] font-['Space_Mono'] text-[#1B6C5D] font-bold mt-1">
                {derivedCollege}
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
          <form onSubmit={handleSaveProfile} className="space-y-5">
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

            {/* College Affiliation (Strictly Read-Only, Derived from email) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-['Space_Grotesk'] font-bold text-[#17140F] flex items-center space-x-1.5">
                  <School className="w-3.5 h-3.5 text-[#1B6C5D]" />
                  <span>College Affiliation</span>
                </label>
                <span className="inline-flex items-center space-x-1 text-[10px] font-['Space_Mono'] text-[#6B6355] bg-[#FAF6ED] px-2 py-0.5 rounded border border-[rgba(23,20,15,0.08)]">
                  <Lock className="w-3 h-3 text-[#8A8275]" />
                  <span>Read-only</span>
                </span>
              </div>
              <input
                type="text"
                disabled
                value={derivedCollege}
                className="w-full bg-[#F2ECDE]/70 border border-[rgba(23,20,15,0.1)] rounded-xl px-4 py-2.5 text-sm text-[#6B6355] cursor-not-allowed font-medium"
              />
              <p className="text-[11px] text-[#1B6C5D] font-['Space_Mono'] mt-1 flex items-center space-x-1">
                <span>Verified college derived automatically from your institutional email domain.</span>
              </p>
            </div>

            {/* Faculty & Section in a 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Faculty */}
              <div>
                <label className="block text-xs font-['Space_Grotesk'] font-bold text-[#17140F] mb-1.5 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#1B6C5D]" />
                  <span>Faculty (Optional)</span>
                </label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="e.g. BSc (Hons) Computing"
                  className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition"
                />
              </div>

              {/* Section */}
              <div>
                <label className="block text-xs font-['Space_Grotesk'] font-bold text-[#17140F] mb-1.5 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#1B6C5D]" />
                  <span>Section (Optional)</span>
                </label>
                <input
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. Section A, L5C1"
                  className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] transition"
                />
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-['Space_Grotesk'] font-bold text-[#17140F] mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#1B6C5D]" />
                <span>Gender (Optional)</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#FAF6ED] border border-[rgba(23,20,15,0.14)] rounded-xl px-4 py-2.5 text-sm text-[#17140F] focus:outline-none focus:border-[#17140F] transition cursor-pointer"
              >
                <option value="">Select gender (optional)</option>
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Tag Editor (Replaces Academic Bio) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-['Space_Grotesk'] font-bold text-[#17140F] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1B6C5D]" />
                  <span>Skills & Expertise</span>
                </label>
                <span className="text-[11px] font-['Space_Mono'] text-[#8A8275]">
                  {selectedSkillNames.length} selected • Click to toggle
                </span>
              </div>

              {loadingSkills && allSkills.length === 0 ? (
                <div className="flex items-center space-x-2 py-4 text-xs text-[#6B6355]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#1B6C5D]" />
                  <span>Loading available skills...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 p-3.5 bg-[#FAF6ED] border border-[rgba(23,20,15,0.12)] rounded-2xl">
                  {allSkills.map((skill) => {
                    const isSelected =
                      (skill.id && selectedSkillIds.includes(skill.id)) ||
                      selectedSkillNames.includes(skill.name);

                    return (
                      <button
                        key={skill.id || skill.name}
                        type="button"
                        onClick={() => handleToggleSkill(skill)}
                        className={`text-xs font-['Space_Grotesk'] font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-[#17140F] text-[#FFFCF5] border-[#17140F] shadow-xs'
                            : 'bg-[#FFFCF5] text-[#6B6355] border-[rgba(23,20,15,0.14)] hover:border-[#17140F] hover:text-[#17140F]'
                        }`}
                      >
                        <span>{skill.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-[#FFFCF5] stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[11px] text-[#8A8275] mt-1.5">
                Select your technical and collaborative skills to be discovered in the student directory. Changes save instantly.
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
    </div>
  );
}

