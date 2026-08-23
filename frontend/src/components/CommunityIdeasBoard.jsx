import { useState } from 'react';
import { Lightbulb, ThumbsUp, Sparkles, Send, Check } from 'lucide-react';

const INITIAL_IDEAS = [
  {
    id: 'idea-1',
    author: 'Suman Shrestha',
    campus: 'Kathmandu University',
    department: 'Computer Science',
    title: 'Offline-first SQLite sync for mountain campuses with patchy LTE',
    description: 'Cache group threads locally so messages queue up automatically and send as soon as WiFi connects at the department library.',
    votes: 42,
    tag: 'Protocol',
    isUpvoted: false,
  },
  {
    id: 'idea-2',
    author: 'Pooja Karki',
    campus: 'Pulchowk Campus (IOE)',
    department: 'Electronics & Comm.',
    title: 'Temporary voice note walkie-talkie mode for lab experiments',
    description: 'A push-to-talk button inside study circle threads that lets lab partners broadcast quick 5-second updates hands-free.',
    votes: 38,
    tag: 'Audio',
    isUpvoted: true,
  },
  {
    id: 'idea-3',
    author: 'Bipin Adhikari',
    campus: 'KIST College',
    department: 'BIM / Management',
    title: 'Ephemeral exam countdown study circles that auto-archive after finals',
    description: 'Circles created for a specific course final that automatically bundle pinned notes, export a PDF summary, and archive.',
    votes: 27,
    tag: 'Features',
    isUpvoted: false,
  },
];

export default function CommunityIdeasBoard() {
  const [ideas, setIdeas] = useState(INITIAL_IDEAS);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Computer Engineering');
  const [tag, setTag] = useState('Feature');
  const [submitted, setSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');

  const handleVote = (id) => {
    setIdeas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextVote = item.isUpvoted ? item.votes - 1 : item.votes + 1;
          return { ...item, votes: nextVote, isUpvoted: !item.isUpvoted };
        }
        return item;
      })
    );
  };

  const handleCreateIdea = (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newEntry = {
      id: `idea-${Date.now()}`,
      author: 'You (Campus Contributor)',
      campus: 'Your Campus',
      department,
      title: title.trim(),
      description: description.trim(),
      votes: 1,
      tag,
      isUpvoted: true,
    };

    setIdeas([newEntry, ...ideas]);
    setTitle('');
    setDescription('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const filteredIdeas =
    activeFilter === 'All'
      ? ideas
      : ideas.filter((item) => item.tag.toLowerCase() === activeFilter.toLowerCase());

  return (
    <section className="py-16 px-6 sm:px-12 max-w-[1180px] mx-auto border-t border-[rgba(23,20,15,0.08)]">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="cj-eyebrow mb-3">
          <span className="cj-status-dot"></span>
          CAMPUS RFC &amp; COMMUNITY LAB
        </div>
        <h2 className="font-['Space_Grotesk'] text-3xl sm:text-4xl font-bold tracking-tight text-[#17140F]">
          Built with students.<br />Shaped by your campus ideas.
        </h2>
        <p className="text-sm sm:text-base text-[#6B6355] mt-2.5">
          Propose new capabilities for ConnectJutti. Vote on protocol upgrades, audio features, and circle mechanics.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Propose Idea Form */}
        <div className="lg:col-span-5 bg-[#FFFCF5] rounded-3xl border border-[rgba(23,20,15,0.14)] p-6 shadow-md text-left">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[rgba(23,20,15,0.08)]">
            <div className="w-8 h-8 rounded-xl bg-[#EFA23D] text-[#17140F] flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Space_Grotesk'] font-bold text-base text-[#17140F]">
                Submit a Feature RFC
              </h3>
              <p className="text-xs text-[#6B6355] font-['Space_Mono']">
                Review period: Weekly student roundtable
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateIdea} className="space-y-4">
            <div>
              <label className="block text-xs font-['Space_Mono'] font-bold text-[#17140F] mb-1.5">
                Feature / Idea Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Code snippet syntax highlighting in circle chat"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.12)] rounded-xl px-3.5 py-2.5 text-xs text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-['Space_Mono'] font-bold text-[#17140F] mb-1.5">
                  Category
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.12)] rounded-xl px-3 py-2 text-xs text-[#17140F] focus:outline-none focus:border-[#1B6C5D]"
                >
                  <option value="Feature">Feature</option>
                  <option value="Protocol">Protocol / Speed</option>
                  <option value="Audio">Voice / Audio</option>
                  <option value="UI/UX">UI &amp; Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-['Space_Mono'] font-bold text-[#17140F] mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.12)] rounded-xl px-3 py-2 text-xs text-[#17140F] focus:outline-none focus:border-[#1B6C5D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-['Space_Mono'] font-bold text-[#17140F] mb-1.5">
                Why does campus need this?
              </label>
              <textarea
                required
                rows={3}
                placeholder="Explain the problem and how this solves it for daily circle chats..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#F2ECDE] border border-[rgba(23,20,15,0.12)] rounded-xl px-3.5 py-2.5 text-xs text-[#17140F] placeholder-[#6B6355]/60 focus:outline-none focus:border-[#1B6C5D] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#17140F] text-[#FFFCF5] font-['Space_Grotesk'] font-bold text-xs hover:bg-[#2b2519] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {submitted ? (
                <>
                  <Check className="w-4 h-4 text-[#1B6C5D]" />
                  <span>RFC Submitted &amp; Upvoted!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-[#EFA23D]" />
                  <span>Publish to Community Board</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Ideas List */}
        <div className="lg:col-span-7 space-y-4 text-left">
          {/* Filter Chips */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            <div className="flex items-center gap-2">
              {['All', 'Feature', 'Protocol', 'Audio', 'UI/UX'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-['Space_Mono'] font-bold transition-all cursor-pointer ${
                    activeFilter === f
                      ? 'bg-[#17140F] text-[#FFFCF5]'
                      : 'bg-[#FFFCF5] text-[#6B6355] border border-[rgba(23,20,15,0.1)] hover:text-[#17140F]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-['Space_Mono'] text-[#6B6355] shrink-0">
              {filteredIdeas.length} active discussions
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3.5">
            {filteredIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-5 rounded-2xl bg-[#FFFCF5] border border-[rgba(23,20,15,0.12)] shadow-xs flex items-start gap-4 hover:border-[rgba(23,20,15,0.22)] transition-all"
              >
                {/* Vote Button */}
                <button
                  type="button"
                  onClick={() => handleVote(idea.id)}
                  className={`flex flex-col items-center justify-center w-12 py-2.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    idea.isUpvoted
                      ? 'bg-[#1B6C5D] text-[#FFFCF5] border-[#1B6C5D]'
                      : 'bg-[#F2ECDE] text-[#17140F] border-[rgba(23,20,15,0.12)] hover:bg-[#eae2cf]'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${idea.isUpvoted ? 'fill-current' : ''}`} />
                  <span className="text-xs font-['Space_Mono'] font-bold mt-1">{idea.votes}</span>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-['Space_Mono'] font-bold px-2 py-0.5 rounded-full bg-[#F2ECDE] text-[#1B6C5D]">
                      {idea.tag}
                    </span>
                    <span className="text-xs text-[#6B6355] font-['Space_Mono'] truncate">
                      by {idea.author} · {idea.department}
                    </span>
                  </div>

                  <h4 className="font-['Space_Grotesk'] font-bold text-sm text-[#17140F] leading-snug">
                    {idea.title}
                  </h4>

                  <p className="text-xs text-[#6B6355] font-['Inter'] mt-1 leading-relaxed">
                    {idea.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#F2ECDE] border border-[rgba(23,20,15,0.08)] flex items-center justify-between text-xs text-[#6B6355]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EFA23D]" />
              <span className="font-['Space_Mono'] text-[11px]">
                Top RFC features ship in monthly campus sprint cycles.
              </span>
            </div>
            <span className="font-['Space_Mono'] font-bold text-[#17140F] text-[11px] hidden sm:inline">
              v1.2 Open Roadmap
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
