import React, { useState } from "react";
import { DesignIdea } from "@/src/types";
import { INITIAL_DESIGN_IDEAS } from "@/src/data/mockData";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { 
  Lightbulb, 
  ThumbsUp, 
  Send, 
  Sparkles, 
  Check, 
  Filter, 
  Tag, 
  MessageSquare, 
  User, 
  GraduationCap,
  Layers,
  Search
} from "lucide-react";
import confetti from "canvas-confetti";

export const DesignIdeasForm: React.FC = () => {
  const [ideas, setIdeas] = useState<DesignIdea[]>(INITIAL_DESIGN_IDEAS);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DesignIdea['category']>("ui-ux");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [university, setUniversity] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleVote = (id: string) => {
    setIdeas(prev =>
      prev.map(idea => {
        if (idea.id === id) {
          const hasUpvoted = !idea.hasUpvoted;
          return {
            ...idea,
            upvotes: hasUpvoted ? idea.upvotes + 1 : idea.upvotes - 1,
            hasUpvoted
          };
        }
        return idea;
      })
    );
  };

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const parsedTags = tagsInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const newIdea: DesignIdea = {
        id: `idea-${Date.now()}`,
        title: title.trim(),
        category,
        description: description.trim(),
        author: author.trim() || "Student Contributor",
        university: university.trim() || "University Student",
        tags: parsedTags.length > 0 ? parsedTags : ["Feature Request", "UI Concept"],
        upvotes: 1,
        hasUpvoted: true,
        createdAt: "Just now",
        status: "under-review"
      };

      setIdeas([newIdea, ...ideas]);
      setIsSubmitting(false);
      setSubmittedSuccess(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (err) {}

      // Reset fields
      setTitle("");
      setDescription("");
      setAuthor("");
      setUniversity("");
      setTagsInput("");

      setTimeout(() => setSubmittedSuccess(false), 5000);
    }, 600);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesFilter = activeFilter === "all" || idea.category === activeFilter;
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <section id="design-ideas" className="py-16 md:py-20 border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="pixel">COMMUNITY LAB</Badge>
              <span className="font-mono text-xs text-amber-400">DESIGN_IDEAS_FORM</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
              <Lightbulb className="h-8 w-8 text-amber-400" />
              Submit Design Ideas & Feature Requests
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
              Propose architecture enhancements, UI themes, matching algorithms, or terminal tools. Built with shadcn component primitives.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Submission Form Column */}
          <div className="lg:col-span-5">
            <Card className="border-zinc-800 bg-black sticky top-20 shadow-2xl">
              <CardHeader className="p-6 pb-4 border-b border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Propose a Design Concept</span>
                  </CardTitle>
                  <Badge variant="pixel" className="text-[9px]">RFC FORM</Badge>
                </div>
                <CardDescription className="text-xs text-zinc-400">
                  Share your proposal for Sajilo Patra's frontend interface or WebSocket messaging layers.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmitIdea}>
                <CardContent className="p-6 space-y-4">
                  {submittedSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2 font-mono">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                      <span>Design idea submitted and added to community board!</span>
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-300 flex justify-between">
                      <span>IDEA TITLE *</span>
                      <span className="text-zinc-500 text-[10px]">Concise concept</span>
                    </label>
                    <Input
                      required
                      placeholder="e.g., Matrix Cosine Matching for Dorms"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-xs"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-300">CATEGORY *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'ui-ux', label: '🎨 UI/UX & Theme' },
                        { id: 'matching-algorithm', label: '🤝 Matching Algorithm' },
                        { id: 'websocket-engine', label: '⚡ WebSocket Engine' },
                        { id: 'security-rls', label: '🛡️ Security & RLS' },
                        { id: 'mobile-terminal', label: '💻 CLI / Terminal' }
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id as any)}
                          className={`text-left text-xs p-2 rounded-md border transition-all cursor-pointer ${
                            category === cat.id
                              ? "bg-zinc-800 border-white text-white font-medium"
                              : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-300">DESCRIPTION & MOTIVATION *</label>
                    <Textarea
                      required
                      rows={3}
                      placeholder="Describe why this improves the student experience or solves a real-world chat constraint..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-xs resize-none"
                    />
                  </div>

                  {/* Author & University */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-zinc-400">YOUR NAME</label>
                      <Input
                        placeholder="Sirjan / Akhil"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-zinc-400">UNIVERSITY / CAMPUS</label>
                      <Input
                        placeholder="Tribhuvan University"
                        value={university}
                        onChange={e => setUniversity(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-xs"
                      />
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-medium text-zinc-300">TAGS (COMMA SEPARATED)</label>
                    <Input
                      placeholder="WebSocket, Dither, Algorithm, Rust"
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-xs"
                    />
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 border-t border-zinc-800/80 mt-2">
                  <Button
                    type="submit"
                    variant="pixel"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="w-full h-11 text-xs gap-2"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSubmitting ? "Submitting RFC..." : "Submit Design Idea"}</span>
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Ideas Community Feed Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Search & Filter Header */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <Input
                  placeholder="Search design ideas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs bg-zinc-900 border-zinc-800"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All Ideas' },
                  { id: 'ui-ux', label: 'UI/UX' },
                  { id: 'matching-algorithm', label: 'Matching' },
                  { id: 'websocket-engine', label: 'WebSocket' },
                  { id: 'security-rls', label: 'Security' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                      activeFilter === f.id
                        ? "bg-white text-black font-semibold"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ideas List */}
            <div className="space-y-3.5">
              {filteredIdeas.map(idea => (
                <Card key={idea.id} className="bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 transition-all p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-grow">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="pixel" className="text-[9px]">
                          {idea.category.toUpperCase().replace('-', ' ')}
                        </Badge>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          by <span className="text-zinc-300 font-medium">{idea.author}</span> ({idea.university || "Campus"}) • {idea.createdAt}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-snug">
                        {idea.title}
                      </h4>

                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {idea.description}
                      </p>

                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        {idea.tags.map((tag, tIdx) => (
                          <span 
                            key={tIdx} 
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-400"
                          >
                            <Tag className="h-2.5 w-2.5 text-zinc-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Upvote Button */}
                    <button
                      onClick={() => handleVote(idea.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all shrink-0 cursor-pointer min-w-[52px] ${
                        idea.hasUpvoted
                          ? "bg-zinc-800 border-white text-white font-bold"
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 mb-1 ${idea.hasUpvoted ? "text-amber-400" : ""}`} />
                      <span className="font-mono text-xs">{idea.upvotes}</span>
                    </button>
                  </div>
                </Card>
              ))}

              {filteredIdeas.length === 0 && (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                  No design ideas matching "{searchQuery}". Submit the first one using the form!
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
