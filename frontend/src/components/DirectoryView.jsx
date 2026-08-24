import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWebSocket } from '../context/WebSocketContext';
import { STARTER_SKILLS } from '../lib/skillsData';
import { Search, Loader2, UserPlus, Check, MessageSquare, Clock, Sparkles, X } from 'lucide-react';

export default function DirectoryView({ currentUsername, onOpenConversation }) {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilters, setSelectedSkillFilters] = useState([]);
  const [filterSkillsList, setFilterSkillsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const {
    getRelationshipWithUser,
    sendFriendRequest,
    acceptFriendRequest,
    loadProfiles,
  } = useWebSocket();

  useEffect(() => {
    let isMounted = true;

    async function loadDirectoryAndSkills() {
      try {
        // 1. Fetch available skills from DB / starter list
        let canonicalSkills = [];
        try {
          const { data: dbSkills, error: skillsErr } = await supabase
            .from('skills')
            .select('id, name')
            .order('name');

          if (!skillsErr && dbSkills && dbSkills.length > 0) {
            canonicalSkills = dbSkills;
          } else {
            canonicalSkills = STARTER_SKILLS.map((name, idx) => ({
              id: `seed-skill-${idx}`,
              name,
            }));
          }
        } catch {
          canonicalSkills = STARTER_SKILLS.map((name, idx) => ({
            id: `seed-skill-${idx}`,
            name,
          }));
        }

        if (isMounted) {
          setFilterSkillsList(canonicalSkills);
        }

        // 2. Fetch all profile_skills join mappings
        const skillsByProfileId = {};
        try {
          const { data: psData } = await supabase
            .from('profile_skills')
            .select('profile_id, skill_id, skills(id, name)');

          if (psData) {
            psData.forEach((row) => {
              const skillName = row.skills?.name;
              if (skillName && row.profile_id) {
                if (!skillsByProfileId[row.profile_id]) {
                  skillsByProfileId[row.profile_id] = [];
                }
                if (!skillsByProfileId[row.profile_id].includes(skillName)) {
                  skillsByProfileId[row.profile_id].push(skillName);
                }
              }
            });
          }
        } catch (err) {
          console.debug('profile_skills fetch note:', err);
        }

        // 3. Fetch profiles
        let profilesData = [];
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, email, college, faculty, section, gender')
          .order('created_at', { ascending: false });

        if (error) {
          console.debug('Directory fetch fallback:', error.message);
          const { data: baseData } = await supabase
            .from('profiles')
            .select('id, username, full_name, email')
            .order('created_at', { ascending: false });

          if (baseData) profilesData = baseData;
        } else if (data) {
          profilesData = data;
        }

        // 4. Attach skills to each student, with localStorage sync
        const enrichedStudents = profilesData
          .filter((u) => u.username?.toLowerCase() !== (currentUsername || '').toLowerCase())
          .map((student) => {
            const studentSkills = [...(skillsByProfileId[student.id] || [])];
            const usernameKey = (student.username || '').toLowerCase();

            try {
              const rawLocal = localStorage.getItem(`cj_user_skills_${usernameKey}`);
              if (rawLocal) {
                const parsed = JSON.parse(rawLocal);
                if (Array.isArray(parsed)) {
                  parsed.forEach((skillItem) => {
                    const name = typeof skillItem === 'string' ? skillItem : skillItem.name;
                    if (name && !studentSkills.includes(name)) {
                      studentSkills.push(name);
                    }
                  });
                }
              }
            } catch (e) {
              console.debug('Error reading student local skills:', e);
            }

            return {
              ...student,
              skills: studentSkills,
            };
          });

        if (isMounted) {
          setStudents(enrichedStudents);
        }
      } catch (err) {
        console.error('Error loading directory:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDirectoryAndSkills();
    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [currentUsername, loadProfiles]);

  const toggleSkillFilter = (skillName) => {
    setSelectedSkillFilters((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName]
    );
  };

  // Filtering logic: Match text query AND (if any skill filters active) match ANY selected skill (OR)
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesText =
      !q ||
      s.username?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.faculty?.toLowerCase().includes(q) ||
      s.section?.toLowerCase().includes(q) ||
      s.college?.toLowerCase().includes(q);

    const matchesSkills =
      selectedSkillFilters.length === 0 ||
      (Array.isArray(s.skills) &&
        s.skills.some((skillName) => selectedSkillFilters.includes(skillName)));

    return matchesText && matchesSkills;
  });

  const getInitials = (user) => {
    const name = user.full_name || user.username || 'U';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleAction = async (student, relationship) => {
    const studentId = student.id || student.username;
    setActionLoadingId(studentId);

    try {
      if (relationship.status === 'none') {
        await sendFriendRequest(student);
      } else if (relationship.status === 'received' && relationship.request?.id) {
        await acceptFriendRequest(relationship.request.id);
      } else if (relationship.status === 'accepted') {
        onOpenConversation(student.username);
      }
    } catch (err) {
      console.error('Relationship action error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-[#F6F2EA] text-[#17140F] py-10 px-4 sm:px-8 pl-20 sm:pl-28 md:pl-64 flex flex-col items-center justify-start font-['Inter'] overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-['Space_Grotesk'] font-extrabold tracking-tight text-[#17140F]">
            Student Directory
          </h1>
          <p className="text-sm text-[#6B6355] mt-1">
            Browse and connect with peers across Islington College academic departments and skillsets.
          </p>
        </div>

        {/* Search & Skill Filters Section */}
        <div className="mb-8 space-y-4">
          {/* Text Search Input */}
          <div className="relative max-w-xl">
            <Search className="w-4 h-4 text-[#8A8275] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, handle, faculty, or section..."
              className="w-full bg-[#FFFCF5] border border-[rgba(23,20,15,0.14)] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] shadow-xs transition"
            />
          </div>

          {/* Skill Filter Chips Bar */}
          <div className="bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] rounded-2xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-['Space_Grotesk'] font-bold text-[#17140F] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1B6C5D]" />
                <span>Filter by Skills (Match Any):</span>
              </span>
              {selectedSkillFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSkillFilters([])}
                  className="text-[11px] font-['Space_Mono'] text-[#1B6C5D] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <X className="w-3 h-3" />
                  <span>Clear filters ({selectedSkillFilters.length})</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {filterSkillsList.map((skill) => {
                const isFilterActive = selectedSkillFilters.includes(skill.name);
                return (
                  <button
                    key={skill.id || skill.name}
                    type="button"
                    onClick={() => toggleSkillFilter(skill.name)}
                    className={`text-xs font-['Space_Grotesk'] font-semibold px-3 py-1 rounded-full border transition-all cursor-pointer select-none flex items-center space-x-1 ${
                      isFilterActive
                        ? 'bg-[#17140F] text-[#FFFCF5] border-[#17140F] shadow-xs'
                        : 'bg-[#FAF6ED] text-[#6B6355] border-[rgba(23,20,15,0.1)] hover:border-[#17140F] hover:text-[#17140F]'
                    }`}
                  >
                    <span>{skill.name}</span>
                    {isFilterActive && <Check className="w-3 h-3 text-[#FFFCF5] stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Directory Cards Grid */}
        {loading ? (
          <div className="flex items-center space-x-2 text-[#6B6355] py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#1B6C5D]" />
            <span className="font-['Space_Mono'] text-xs">Loading students & skills...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] text-center text-[#8A8275] text-sm shadow-xs">
            No matching students found with the selected search criteria and skill filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const relationship = getRelationshipWithUser(student);
              const isActionLoading = actionLoadingId === (student.id || student.username);
              const collegeDisplay = student.college || student.university || 'Islington College Kathmandu';

              // Tags to render: only real set values
              const tags = [];
              if (collegeDisplay) tags.push(collegeDisplay);
              if (student.gender && student.gender.trim()) tags.push(student.gender.trim());
              if (student.section && student.section.trim()) tags.push(student.section.trim());

              return (
                <div
                  key={student.id || student.username}
                  className="bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] rounded-2xl p-5 hover:border-[rgba(23,20,15,0.22)] shadow-xs transition flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center space-x-3.5 mb-3.5">
                      <div className="w-11 h-11 rounded-full bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {getInitials(student)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-['Space_Grotesk'] font-bold text-sm text-[#17140F] truncate">
                          {student.full_name || student.username}
                        </h3>
                        <p className="text-xs text-[#6B6355] truncate">
                          <span className="font-['Space_Mono'] text-[#17140F]">@{student.username}</span>
                          <span className="mx-1.5">•</span>
                          <span>{collegeDisplay}</span>
                        </p>
                      </div>
                    </div>

                    {/* Faculty: only render if set */}
                    {student.faculty && student.faculty.trim() ? (
                      <div className="text-xs text-[#6B6355] mb-2.5">
                        Faculty: <span className="text-[#17140F] font-semibold">{student.faculty.trim()}</span>
                      </div>
                    ) : null}

                    {/* Institutional & Demographic Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-[#FAF6ED] text-[#6B6355] text-[11px] font-['Space_Mono'] px-2.5 py-1 rounded-md border border-[rgba(23,20,15,0.08)]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Skill Tags (Below college tag): only render if user has at least 1 skill */}
                    {student.skills && student.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-1 text-[10px] font-['Space_Mono'] text-[#8A8275] mb-1.5">
                          <Sparkles className="w-3 h-3 text-[#1B6C5D]" />
                          <span>Skills:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {student.skills.slice(0, 4).map((skillName) => (
                            <span
                              key={skillName}
                              className="bg-[#F2ECDE]/80 text-[#6B6355] text-[11px] font-['Space_Mono'] px-2.5 py-0.5 rounded-md border border-[rgba(23,20,15,0.08)]"
                            >
                              {skillName}
                            </span>
                          ))}
                          {student.skills.length > 4 && (
                            <span className="bg-[#FAF6ED] text-[#8A8275] text-[10px] font-['Space_Mono'] px-2 py-0.5 rounded-md border border-[rgba(23,20,15,0.08)]">
                              +{student.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Single Relationship-Aware Action Button */}
                  <div className="pt-2">
                    {relationship.status === 'none' && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleAction(student, relationship)}
                        className="w-full bg-[#17140F] text-[#FFFCF5] hover:bg-[#2b2519] font-['Space_Grotesk'] font-bold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5 text-[#FFFCF5]" />
                        )}
                        <span>Add Friend</span>
                      </button>
                    )}

                    {relationship.status === 'sent' && (
                      <button
                        type="button"
                        disabled
                        className="w-full bg-[#FAF6ED] text-[#8A8275] font-['Space_Grotesk'] font-bold text-xs py-2.5 rounded-xl border border-[rgba(23,20,15,0.1)] flex items-center justify-center space-x-2 cursor-not-allowed"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#8A8275]" />
                        <span>Request Sent</span>
                      </button>
                    )}

                    {relationship.status === 'received' && (
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleAction(student, relationship)}
                        className="w-full bg-[#1B6C5D] text-[#FFFCF5] hover:bg-[#155448] font-['Space_Grotesk'] font-bold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[#FFFCF5]" />
                        )}
                        <span>Accept Request</span>
                      </button>
                    )}

                    {relationship.status === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => handleAction(student, relationship)}
                        className="w-full bg-[#17140F] text-[#FFFCF5] hover:bg-[#2b2519] font-['Space_Grotesk'] font-bold text-xs py-2.5 rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#FFFCF5]" />
                        <span>Message</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

