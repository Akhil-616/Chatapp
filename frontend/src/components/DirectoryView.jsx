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
    <div className="flex-1 min-h-screen bg-[#030712] text-white p-8 pl-24 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Student Directory</h1>
        <p className="text-sm text-gray-400 mt-1">
          Browse and connect with peers across universities.
        </p>
      </div>

      <div className="relative mb-8 max-w-xl">
        <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, major, or university..."
          className="w-full bg-[#0d1117] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
        />
      </div>

      {loading ? (
        <div className="flex items-center space-x-2 text-gray-500 py-12">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading students...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <p className="text-gray-500 text-sm">No other registered students found yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id || student.username}
              className="bg-[#0b0e14] border border-gray-900 rounded-2xl p-5 hover:border-gray-800 transition"
            >
              <div className="flex items-center space-x-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm">
                  {getInitials(student)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">
                    {student.full_name || student.username}
                  </h3>
                  <p className="text-xs text-gray-400">
                    @{student.username} • Nepal Academic Network
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-3">
                Major: <span className="text-gray-200 font-medium">Registered Student</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {['Engineering', 'Computer Science', 'Collaboration'].map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#161b22] text-gray-400 text-[11px] px-2.5 py-1 rounded-md border border-gray-800/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                onClick={() => onOpenConversation(student.username)}
                className="w-full bg-white text-black font-semibold text-xs py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                Open Conversation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}