import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useWebSocket } from '../context/WebSocketContext';
import { Search, Loader2, UserPlus, Check, MessageSquare, Clock } from 'lucide-react';

export default function DirectoryView({ currentUsername, onOpenConversation }) {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

    async function loadDirectory() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, email, college, faculty, section, gender, bio')
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.debug('Directory fetch note:', error.message);
          // Fallback to base profiles selection
          const { data: baseData } = await supabase
            .from('profiles')
            .select('id, username, full_name, email')
            .order('created_at', { ascending: false });

          if (baseData) {
            const filtered = baseData.filter(
              (u) => u.username?.toLowerCase() !== (currentUsername || '').toLowerCase()
            );
            setStudents(filtered);
          }
        } else if (data) {
          const filtered = data.filter(
            (u) => u.username?.toLowerCase() !== (currentUsername || '').toLowerCase()
          );
          setStudents(filtered);
        }
      } catch (err) {
        if (isMounted) console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDirectory();
    loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [currentUsername, loadProfiles]);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.username?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.faculty?.toLowerCase().includes(q) ||
      s.section?.toLowerCase().includes(q) ||
      s.college?.toLowerCase().includes(q)
    );
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
            Browse and connect with peers across Islington College academic departments.
          </p>
        </div>

        <div className="relative mb-8 max-w-xl">
          <Search className="w-4 h-4 text-[#8A8275] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, handle, faculty, or section..."
            className="w-full bg-[#FFFCF5] border border-[rgba(23,20,15,0.14)] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] shadow-xs transition"
          />
        </div>

        {loading ? (
          <div className="flex items-center space-x-2 text-[#6B6355] py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#1B6C5D]" />
            <span className="font-['Space_Mono'] text-xs">Loading students...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] text-center text-[#8A8275] text-sm shadow-xs">
            No matching students found in the directory.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => {
              const relationship = getRelationshipWithUser(student);
              const isActionLoading = actionLoadingId === (student.id || student.username);
              const collegeDisplay = student.college || student.university || 'Islington College Kathmandu';

              // Tags to render: only real set values (omit if unset/blank)
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
                      <div className="text-xs text-[#6B6355] mb-3">
                        Faculty: <span className="text-[#17140F] font-semibold">{student.faculty.trim()}</span>
                      </div>
                    ) : null}

                    {/* Tags: real values only */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
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
