import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Search, Loader2 } from 'lucide-react';

export default function DirectoryView({ currentUsername, onOpenConversation }) {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDirectory() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, email')
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.error('Directory fetch error:', error.message);
        } else if (data) {
          const filtered = data.filter((u) => u.username !== currentUsername);
          setStudents(filtered);
        }
      } catch (err) {
        if (isMounted) console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDirectory();

    return () => {
      isMounted = false;
    };
  }, [currentUsername]);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.username?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
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

  return (
    <div className="flex-1 min-h-screen bg-[#F6F2EA] text-[#17140F] py-10 px-4 sm:px-8 pl-20 sm:pl-28 md:pl-64 flex flex-col items-center justify-start font-['Inter'] overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-['Space_Grotesk'] font-extrabold tracking-tight text-[#17140F]">Student Directory</h1>
          <p className="text-sm text-[#6B6355] mt-1">
            Browse and connect with peers across academic networks and universities.
          </p>
        </div>

        <div className="relative mb-8 max-w-xl">
          <Search className="w-4 h-4 text-[#8A8275] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, handle, or campus..."
            className="w-full bg-[#FFFCF5] border border-[rgba(23,20,15,0.14)] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#17140F] placeholder-[#8A8275] focus:outline-none focus:border-[#17140F] shadow-xs transition"
          />
        </div>

      {loading ? (
        <div className="flex items-center space-x-2 text-[#6B6355] py-12">
          <Loader2 className="w-5 h-5 animate-spin text-[#1B6C5D]" />
          <span className="font-['Space_Mono'] text-xs">Loading students...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] text-center text-[#8A8275] text-sm">
          No other registered students found. Invite classmates to join the network!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id || student.username}
              className="bg-[#FFFCF5] border border-[rgba(23,20,15,0.1)] rounded-2xl p-5 hover:border-[rgba(23,20,15,0.25)] shadow-xs transition"
            >
              <div className="flex items-center space-x-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold flex items-center justify-center text-sm shadow-xs">
                  {getInitials(student)}
                </div>
                <div>
                  <h3 className="font-['Space_Grotesk'] font-bold text-sm text-[#17140F]">
                    {student.full_name || student.username}
                  </h3>
                  <p className="text-xs text-[#6B6355]">
                    @{student.username} • {student.university || student.campus || 'Islington College Kathmandu'}
                  </p>
                </div>
              </div>

              <div className="text-xs text-[#6B6355] mb-3">
                Faculty: <span className="text-[#17140F] font-semibold">{student.department || 'BSc (Hons) Computing'}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {['Islington College', 'Computing', 'Peer Network'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#FAF6ED] text-[#6B6355] text-[11px] font-['Space_Mono'] px-2.5 py-1 rounded-md border border-[rgba(23,20,15,0.08)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onOpenConversation(student.username)}
                className="w-full bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold text-xs py-2.5 rounded-xl hover:bg-[#2b2519] transition shadow-xs cursor-pointer"
              >
                Open Conversation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}