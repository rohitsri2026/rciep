"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, ChevronRight, Clock, Bookmark, HelpCircle, Star, Share2,
  ChevronLeft, Info, Filter, Brain, Calculator, Globe, Laptop, Award, Flame, Sparkles, RotateCcw, BookOpen, Trophy, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  passMarks: number;
  type: string;
  status: string;
  visibility: string;
  allowMultipleAttempts: boolean;
  startDate: string | null;
  endDate: string | null;
  subjectId: string;
  categoryId: string | null;
  subject?: Subject;
  category?: Category | null;
  hasOngoing: boolean;
  ongoingAttemptId: string | null;
  completedCount: number;
  formattedStartDate?: string;
  isUpcoming?: boolean;
  _count?: {
    questions: number;
  };
  createdAt?: string;
}

interface Result {
  attemptId: string;
  testId: string;
  testName: string;
  subjectName: string;
  subjectColor: string;
  categoryName: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
}

// ─── Horizontal Scroll Container (Carousel) ────────────────────
function HorizontalRow({ 
  title, 
  subtitle, 
  children, 
  onViewAll,
  icon
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  onViewAll?: () => void;
  icon?: React.ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "250px" }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.85;
      rowRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="space-y-3 relative group/row border-b border-slate-100/50 pb-6 last:border-0 min-h-[350px]"
    >
      {/* Title & View All alignment (close to title) */}
      <div className="space-y-1 px-1">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            {icon && <span className="text-[#4F46E5] flex items-center justify-center">{icon}</span>}
            {title}
          </h3>
          {onViewAll && (
            <button 
              onClick={onViewAll}
              className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-0.5 group/link bg-transparent border-0 cursor-pointer transition-all animate-fade-in"
            >
              View All <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5" />
            </button>
          )}
        </div>
        {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
      </div>

      {isVisible ? (
        <div className="relative px-1">
          {/* Left Arrow (Premium Netflix/Testbook Style) */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-9.5 h-9.5 rounded-full bg-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-200/60 flex items-center justify-center text-slate-700 hover:text-[#4F46E5] opacity-0 group-hover/row:opacity-100 transition-all duration-350 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Edge Gradient Fades */}
          <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#F7F8FC] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
          <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#F7F8FC] to-transparent z-10 pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />

          {/* Scrollable Area */}
          <div 
            ref={rowRef}
            className="flex gap-4.5 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
          >
            {children}
          </div>

          {/* Right Arrow (Premium Netflix/Testbook Style) */}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-9.5 h-9.5 rounded-full bg-white backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.12)] border border-slate-200/60 flex items-center justify-center text-slate-700 hover:text-[#4F46E5] opacity-0 group-hover/row:opacity-100 transition-all duration-350 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      ) : (
        /* Loader placeholder matching cards list structure */
        <div className="flex gap-4.5 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {[1, 2, 3, 4, 5].map((i) => (
            <MarketTestCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Marketpla// ─── Shimmer Loading Skeleton Card ────────────────────────────
function MarketTestCardSkeleton() {
  return (
    <Card className="min-w-[250px] w-[250px] sm:min-w-[270px] sm:w-[270px] border border-slate-200/60 bg-white rounded-xl overflow-hidden flex flex-col justify-between h-[360px] animate-pulse">
      <div className="h-14 w-full bg-slate-200 relative overflow-hidden" />
      <div className="p-3 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-slate-200 rounded" />
            <div className="h-3 w-10 bg-slate-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-1 py-2 border-y border-slate-100">
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
            <div className="h-8 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg space-y-1.5">
          <div className="h-2.5 w-1/2 bg-slate-200 rounded" />
          <div className="h-2.5 w-2/3 bg-slate-200 rounded" />
        </div>
      </div>
      <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex gap-1">
          <div className="w-5 h-5 bg-slate-200 rounded-full" />
          <div className="w-5 h-5 bg-slate-200 rounded-full" />
        </div>
        <div className="h-8 w-16 bg-slate-200 rounded-lg" />
      </div>
    </Card>
  );
}

// ─── Marketplace Test Card (Compact, High Density, Shorter) ─────
function MarketTestCard({ 
  test, 
  isBookmarked, 
  onToggleBookmark, 
  onShare,
  onPreview,
  sectionType
}: { 
  test: Test; 
  isBookmarked: boolean; 
  onToggleBookmark: () => void; 
  onShare: () => void;
  onPreview: () => void;
  sectionType?: string;
}) {
  const language = test.title.toLowerCase().includes("hindi") ? "Hindi" : "English";
  const negativeMarking = test.type === "MOCK_TEST" ? "0.25" : "0.00";
  const difficulty = test.title.toLowerCase().includes("hard") || test.title.toLowerCase().includes("advanced") ? "HARD" : test.title.toLowerCase().includes("easy") || test.title.toLowerCase().includes("basic") ? "EASY" : "MEDIUM";
  
  // Deterministic mock variables based on test ID
  const rating = Math.min(5, 4.2 + (test.completedCount % 5) * 0.15);
  const studentsCount = 1200 + (test.completedCount * 140) + (test.duration * 32);
  const recommendationRate = 88 + (test.completedCount % 11);
  const subjectName = test.subject?.name || "General";
  
  // Extract first letter for visual icon placeholder
  const initial = subjectName.substring(0, 1).toUpperCase();

  // Map Subject to Icon
  const getSubjectIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("quant") || n.includes("math") || n.includes("arithmetic") || n.includes("numerical")) {
      return <Calculator className="w-4 h-4 text-white" />;
    }
    if (n.includes("reasoning") || n.includes("intelligence") || n.includes("logic")) {
      return <Brain className="w-4 h-4 text-white" />;
    }
    if (n.includes("english") || n.includes("comprehension") || n.includes("verbal")) {
      return <BookOpen className="w-4 h-4 text-white" />;
    }
    if (n.includes("knowledge") || n.includes("gk") || n.includes("history") || n.includes("polity") || n.includes("current")) {
      return <Globe className="w-4 h-4 text-white" />;
    }
    if (n.includes("computer") || n.includes("it") || n.includes("networking") || n.includes("software")) {
      return <Laptop className="w-4 h-4 text-white" />;
    }
    return <HelpCircle className="w-4 h-4 text-white" />;
  };

  const getSubjectGradient = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("quant") || n.includes("math") || n.includes("numerical")) {
      return "linear-gradient(135deg, #1e3a8a, #3b82f6)";
    }
    if (n.includes("reasoning") || n.includes("intelligence") || n.includes("logic")) {
      return "linear-gradient(135deg, #4c1d95, #6366f1)";
    }
    if (n.includes("english") || n.includes("comprehension")) {
      return "linear-gradient(135deg, #064e3b, #10b981)";
    }
    if (n.includes("knowledge") || n.includes("gk") || n.includes("polity") || n.includes("current")) {
      return "linear-gradient(135deg, #78350f, #f59e0b)";
    }
    if (n.includes("computer") || n.includes("networking")) {
      return "linear-gradient(135deg, #881337, #f43f5e)";
    }
    return "linear-gradient(135deg, #1e293b, #475569)";
  };

  const getExamLogo = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("ssc")) return "SSC";
    if (t.includes("sbi") || t.includes("ibps") || t.includes("bank") || t.includes("rbi")) return "BANK";
    if (t.includes("rrb") || t.includes("railway")) return "RLY";
    if (t.includes("police") || t.includes("upp") || t.includes("constable")) return "POLICE";
    return "GOVT";
  };

  const isTrending = sectionType === "trending" || test.completedCount > 25;
  const isRecommended = sectionType === "recommended" || (test.completedCount > 10 && rating >= 4.5);
  const isNew = sectionType === "latest" || (test.completedCount < 5);
  const isTopRated = rating >= 4.7;
  const isFastRevision = test.duration <= 30;

  const getRecommendationBadge = () => {
    if (isTrending) {
      return (
        <span className="text-rose-600 bg-rose-50 border border-rose-100 text-[8.5px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
          <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Trending
        </span>
      );
    }
    if (isRecommended) {
      return (
        <span className="text-violet-600 bg-violet-50 border border-violet-100 text-[8.5px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5 fill-violet-500 text-violet-500" /> Recommended
        </span>
      );
    }
    if (isNew) {
      return (
        <span className="text-blue-600 bg-blue-50 border border-blue-100 text-[8.5px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5 text-blue-500" /> New
        </span>
      );
    }
    if (isTopRated) {
      return (
        <span className="text-amber-600 bg-amber-50 border border-amber-100 text-[8.5px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
          <Award className="w-2.5 h-2.5 text-amber-500" /> Top Rated
        </span>
      );
    }
    if (isFastRevision) {
      return (
        <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 text-[8.5px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5 text-emerald-500" /> Fast Revision
        </span>
      );
    }
    return (
      <span className="text-slate-500 border border-slate-200 bg-slate-50 px-1 py-0.2 rounded text-[8.5px] uppercase">
        {test.type === "MOCK_TEST" ? "MOCK" : test.type === "PREVIOUS_YEAR_PAPER" ? "PYP" : "QUIZ"}
      </span>
    );
  };

  return (
    <Card className="min-w-[250px] w-[250px] sm:min-w-[270px] sm:w-[270px] snap-start border border-slate-200/80 bg-white hover:border-[#4F46E5] hover:ring-1 hover:ring-[#4F46E5]/20 hover:shadow-[0_20px_35px_-12px_rgba(79,70,229,0.25)] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] rounded-xl overflow-hidden flex flex-col justify-between group relative">
      
      {/* Quick Preview Hover Overlay */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30 pointer-events-none group-hover:pointer-events-auto">
        <Button 
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-[11px] px-5 h-9 rounded-xl shadow-lg border-0 cursor-pointer transition-transform duration-300 translate-y-3 group-hover:translate-y-0"
        >
          Quick Preview
        </Button>
        <Button
          onClick={() => window.location.href = `/student/test/${test.id}`}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-[11px] px-5 h-9 rounded-xl shadow-lg border-0 cursor-pointer transition-transform duration-300 translate-y-3 group-hover:translate-y-0"
        >
          {test.hasOngoing ? "Resume Test" : "Start Test"}
        </Button>
      </div>

      {/* Dynamic top header with Gradient & Icon */}
      <div 
        className="h-14 w-full relative overflow-hidden flex items-center px-3"
        style={{ background: getSubjectGradient(subjectName) }}
      >
        {/* Subtle grid lines background overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
        
        <div className="relative z-10 flex items-center justify-between w-full">
          {/* Subject Circle Icon */}
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            {getSubjectIcon(subjectName)}
          </div>

          {/* Exam Logo indicator pill */}
          <Badge className="bg-black/25 text-white/95 border border-white/10 text-[7.5px] font-black rounded-md px-1.5 py-0.5 tracking-wider animate-in zoom-in-50 duration-200">
            {getExamLogo(test.title)}
          </Badge>
        </div>

        {/* Difficulty ribbon badge */}
        <span className={`absolute top-0 right-0 text-[8px] font-black px-2 py-0.5 rounded-bl-lg shadow-sm border-l border-b ${
          difficulty === "HARD" ? "border-rose-300 bg-rose-505 text-white" :
          difficulty === "EASY" ? "border-emerald-300 bg-emerald-505 text-white" :
          "border-amber-300 bg-amber-505 text-white"
        }`}>
          {difficulty}
        </span>
      </div>

      <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Header Metadata with Dynamic Section Badges */}
          <div className="flex justify-between items-center text-[9px] font-bold text-slate-455">
            <span className="truncate max-w-[100px] uppercase tracking-wider">{subjectName}</span>
            
            {/* Dynamic Section Overlay Tags */}
            {getRecommendationBadge()}
          </div>

          {/* Title - Compact 2-line height */}
          <h4 className="font-extrabold text-slate-800 text-[13px] leading-snug tracking-tight group-hover:text-[#4F46E5] transition-colors line-clamp-2 h-9">
            {test.title}
          </h4>

          {/* Detailed Row (Compact layout, 25-30% shorter) */}
          <div className="grid grid-cols-3 gap-1 border-y border-slate-100 py-1.5 text-center text-[10px]">
            <div>
              <span className="text-[7.5px] font-bold text-slate-400 block uppercase">Questions</span>
              <strong className="text-slate-700 block font-extrabold mt-0.2">{test._count?.questions || 20} Qs</strong>
            </div>
            <div>
              <span className="text-[7.5px] font-bold text-slate-400 block uppercase">Time</span>
              <strong className="text-slate-700 block font-extrabold mt-0.2">{test.duration} min</strong>
            </div>
            <div>
              <span className="text-[7.5px] font-bold text-slate-400 block uppercase">Marks</span>
              <strong className="text-slate-700 block font-extrabold mt-0.2">{test.totalMarks} M</strong>
            </div>
          </div>
        </div>

        {/* 6. Social Proof / Trust metrics block */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-100/50 pt-2 px-0.5">
          <div className="flex items-center gap-0.5">
            <div className="flex text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-slate-200 fill-slate-200"}`} />
              ))}
            </div>
            <span className="font-extrabold text-slate-700 ml-0.5">{rating.toFixed(1)}</span>
          </div>
          <span className="h-2.5 w-px bg-slate-200" />
          <span className="font-bold text-slate-600 truncate max-w-[80px]">{studentsCount.toLocaleString()} Attempts</span>
          <span className="h-2.5 w-px bg-slate-200" />
          <span className="font-extrabold text-emerald-600 whitespace-nowrap">👍 {recommendationRate}%</span>
        </div>

      </div>

      {/* Action Footer Bar (Slimmer) */}
      <div className="px-3 pb-3 pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(); }}
            className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-slate-100 rounded-lg border-0 bg-transparent cursor-pointer"
            title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onShare(); }}
            className="text-slate-400 hover:text-[#4F46E5] p-1.5 hover:bg-slate-100 rounded-lg border-0 bg-transparent cursor-pointer"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="text-slate-455 hover:text-indigo-650 p-1.5 hover:bg-slate-100 rounded-lg border-0 bg-transparent cursor-pointer"
            title="Preview details"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button
          onClick={() => window.location.href = `/student/test/${test.id}`}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-[10.5px] px-3.5 h-8.5 rounded-lg active:scale-95 transition-all shadow-sm shadow-indigo-500/10"
        >
          {test.hasOngoing ? "Resume" : "Start"}
        </Button>
      </div>
    </Card>
  );
}

// ─── Main Marketplace Catalog Client ───────────────────────────
export function BrowseTestsClient() {
  const [tests, setTests] = useState<Test[]>([]);
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [previewTest, setPreviewTest] = useState<Test | null>(null);

  // Filters State
  const [search, setSearch] = useState("");
  const [examType, setExamType] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [questionsFilter, setQuestionsFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Filter Chips Active List
  const [activeChips, setActiveChips] = useState<string[]>([]);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(15);

  // Load Data
  async function fetchCatalogData() {
    try {
      const res = await fetch("/api/student/dashboard");
      if (res.ok) {
        const data = await res.json();
        setTests(data.availableTests || []);
        setRecentResults(data.recentResults || []);
      }
    } catch (err) {
      console.error("Failed to load mock tests catalog data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalogData();
      try {
        const saved = localStorage.getItem("rci_student_bookmarks");
        if (saved) setBookmarks(JSON.parse(saved));
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);


  const handleToggleBookmark = (id: string) => {
    setBookmarks(prev => {
      const updated = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem("rci_student_bookmarks", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleShare = async (test: Test) => {
    const url = `${window.location.origin}/student/test/${test.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: test.title, text: test.title, url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  };

  // Dynamic filter subjects and categories from available tests
  const availableSubjects = Array.from(new Map(
    tests.filter(t => t.subject).map(t => [t.subject!.id, t.subject!])
  ).values());

  const availableCategories = Array.from(new Map(
    tests.filter(t => t.category).map(t => [t.category!.id, t.category!])
  ).values());

  // Ongoing attempt check
  const ongoingAttempt = tests.find(t => t.hasOngoing);

  // Quick Chips Definition
  const filterChips = [
    { id: "ssc", label: "SSC" },
    { id: "banking", label: "Banking" },
    { id: "railway", label: "Railway" },
    { id: "police", label: "UP Police" },
    { id: "free", label: "Free" },
    { id: "premium", label: "Premium" },
    { id: "english", label: "English" },
    { id: "hindi", label: "Hindi" }
  ];

  const handleToggleChip = (chipId: string) => {
    setActiveChips(prev => {
      const isAlreadyActive = prev.includes(chipId);
      const next = isAlreadyActive ? prev.filter(c => c !== chipId) : [...prev, chipId];
      return next;
    });
  };

  // Checks if user has search filters applied (including chips)
  const isFilteredMode = 
    search !== "" || 
    examType !== "all" || 
    subjectFilter !== "all" || 
    categoryFilter !== "all" || 
    difficultyFilter !== "all" || 
    languageFilter !== "all" || 
    durationFilter !== "all" || 
    questionsFilter !== "all" || 
    priceFilter !== "all" ||
    activeChips.length > 0;

  // Filter Logic (Dropdowns + Active Quick Chips)
  const filteredTests = tests.filter(test => {
    // Search Title/Description
    const query = search.toLowerCase();
    const matchesSearch = query === "" || 
      test.title.toLowerCase().includes(query) || 
      (test.description && test.description.toLowerCase().includes(query));

    // Exam Type
    const matchesType = examType === "all" || test.type === examType;

    // Subject
    const matchesSubject = subjectFilter === "all" || test.subjectId === subjectFilter;

    // Category
    const matchesCategory = categoryFilter === "all" || test.categoryId === categoryFilter;

    // Difficulty
    const diff = test.title.toLowerCase().includes("hard") || test.title.toLowerCase().includes("advanced") ? "HARD" : test.title.toLowerCase().includes("easy") || test.title.toLowerCase().includes("basic") ? "EASY" : "MEDIUM";
    const matchesDiff = difficultyFilter === "all" || diff === difficultyFilter;

    // Language
    const language = test.title.toLowerCase().includes("hindi") ? "HINDI" : "ENGLISH";
    const matchesLanguage = languageFilter === "all" || language === languageFilter;

    // Duration
    let matchesDuration = true;
    if (durationFilter === "short") matchesDuration = test.duration < 30;
    else if (durationFilter === "medium") matchesDuration = test.duration >= 30 && test.duration <= 60;
    else if (durationFilter === "long") matchesDuration = test.duration > 60;

    // Question Count
    const qs = test._count?.questions || 20;
    let matchesQuestions = true;
    if (questionsFilter === "low") matchesQuestions = qs < 20;
    else if (questionsFilter === "medium") matchesQuestions = qs >= 20 && qs <= 50;
    else if (questionsFilter === "high") matchesQuestions = qs > 50;

    // Price (Free/Premium)
    let matchesPrice = true;
    if (priceFilter === "free") matchesPrice = test.visibility === "PUBLIC";
    else if (priceFilter === "premium") matchesPrice = test.visibility === "PRIVATE";

    // Quick Chips filtering (And condition: matches all chosen chips)
    let matchesChips = true;
    if (activeChips.length > 0) {
      const comb = (test.title + " " + (test.description || "")).toLowerCase();
      matchesChips = activeChips.every(chip => {
        if (chip === "free") return test.visibility === "PUBLIC";
        if (chip === "premium") return test.visibility === "PRIVATE";
        if (chip === "english") return !test.title.toLowerCase().includes("hindi");
        if (chip === "hindi") return test.title.toLowerCase().includes("hindi");
        if (chip === "ssc") return comb.includes("ssc");
        if (chip === "banking") return comb.includes("bank") || comb.includes("sbi") || comb.includes("ibps");
        if (chip === "railway") return comb.includes("railway") || comb.includes("rrb");
        if (chip === "police") return comb.includes("police") || comb.includes("upp");
        return true;
      });
    }

    return matchesSearch && matchesType && matchesSubject && matchesCategory && matchesDiff && matchesLanguage && matchesDuration && matchesQuestions && matchesPrice && matchesChips;
  });

  // Sort Logic
  const sortedTests = [...filteredTests].sort((a, b) => {
    if (sortBy === "newest" || sortBy === "recently-added") {
      return b.id.localeCompare(a.id);
    }
    if (sortBy === "popular" || sortBy === "most-attempted") {
      return b.completedCount - a.completedCount;
    }
    if (sortBy === "highest-rated") {
      return b.totalMarks - a.totalMarks;
    }
    return 0;
  });

  // Calculate active filters list and count
  const getActiveFiltersList = () => {
    const list: string[] = [];
    if (search) list.push(`Search: "${search}"`);
    if (examType !== "all") list.push(`Type: ${examType.replace("_", " ")}`);
    if (subjectFilter !== "all") {
      const sub = availableSubjects.find(s => s.id === subjectFilter);
      list.push(`Subject: ${sub ? sub.name : subjectFilter}`);
    }
    if (categoryFilter !== "all") {
      const cat = availableCategories.find(c => c.id === categoryFilter);
      list.push(`Category: ${cat ? cat.name : categoryFilter}`);
    }
    if (difficultyFilter !== "all") list.push(`Difficulty: ${difficultyFilter}`);
    if (languageFilter !== "all") list.push(`Language: ${languageFilter}`);
    if (durationFilter !== "all") list.push(`Duration: ${durationFilter}`);
    if (questionsFilter !== "all") list.push(`Questions: ${questionsFilter}`);
    if (priceFilter !== "all") list.push(`Access: ${priceFilter}`);
    activeChips.forEach(chip => {
      list.push(`Tag: ${chip.toUpperCase()}`);
    });
    return list;
  };
  const activeFiltersList = getActiveFiltersList();
  const activeFiltersCount = activeFiltersList.length;

  // Categorized Marketplace Sections
  const trendingTests = [...tests].sort((a, b) => b.completedCount - a.completedCount).slice(0, 8);
  const latestTests = [...tests].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);

  // Subject recommendations from attempted tests
  const attemptedSubjectIds = Array.from(new Set(recentResults.map(r => {
    const t = tests.find(test => test.title === r.testName);
    return t?.subjectId;
  }).filter(Boolean))) as string[];

  // 10. AI Recommended section
  const recommendedTests = tests.filter(test => 
    attemptedSubjectIds.includes(test.subjectId) && !test.hasOngoing
  ).slice(0, 8);

  // Grouped Categories
  const sscTests = tests.filter(t => t.title.toLowerCase().includes("ssc") || (t.description && t.description.toLowerCase().includes("ssc"))).slice(0, 8);
  const bankingTests = tests.filter(t => t.title.toLowerCase().includes("bank") || t.title.toLowerCase().includes("ibps") || t.title.toLowerCase().includes("sbi") || (t.description && t.description.toLowerCase().includes("bank"))).slice(0, 8);
  const railwayTests = tests.filter(t => t.title.toLowerCase().includes("railway") || t.title.toLowerCase().includes("rrb") || (t.description && t.description.toLowerCase().includes("railway"))).slice(0, 8);
  const policeTests = tests.filter(t => t.title.toLowerCase().includes("police") || t.title.toLowerCase().includes("upp") || (t.description && t.description.toLowerCase().includes("police"))).slice(0, 8);
  
  // Extra bottom sections
  const previousPapers = tests.filter(t => t.type === "PREVIOUS_YEAR_PAPER").slice(0, 8);
  const freeTests = tests.filter(t => t.visibility === "PUBLIC").slice(0, 8);
  
  // Most bookmarked (seeded by bookmarks bookmarks state, or completedCount fallback)
  const mostBookmarked = [...tests].sort((a, b) => (bookmarks.includes(b.id) ? 1 : 0) - (bookmarks.includes(a.id) ? 1 : 0) || b.completedCount - a.completedCount).slice(0, 8);
  
  // Recently updated (latest createdAt)
  const recentlyUpdated = [...tests].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8);

  // Practice sets (type PRACTICE_QUIZ)
  const practiceSets = tests.filter(t => t.type === "PRACTICE_QUIZ" || t.type === "DAILY_QUIZ").slice(0, 8);

  // Set filter categories helper
  const activateSubCatFilter = (typeKey: string, queryStr: string) => {
    if (typeKey === "subject") {
      setSubjectFilter(queryStr);
    } else if (typeKey === "search") {
      setSearch(queryStr);
    } else if (typeKey === "type") {
      setExamType(queryStr);
    } else if (typeKey === "price") {
      setPriceFilter(queryStr);
    } else if (typeKey === "chip") {
      setActiveChips([queryStr]);
    }
    // Smooth scroll up to sticky filter bar
    document.getElementById("marketplace-filters")?.scrollIntoView({ behavior: "smooth" });
  };

  const clearAllFilters = () => {
    setSearch("");
    setExamType("all");
    setSubjectFilter("all");
    setCategoryFilter("all");
    setDifficultyFilter("all");
    setLanguageFilter("all");
    setDurationFilter("all");
    setQuestionsFilter("all");
    setPriceFilter("all");
    setSortBy("newest");
    setActiveChips([]);
  };

  // Infinite Scroll Trigger
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isFilteredMode) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && sortedTests.length > visibleCount) {
          setVisibleCount(prev => prev + 12);
        }
      },
      { threshold: 0.1 }
    );
    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [isFilteredMode, sortedTests.length, visibleCount]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 md:px-8 xl:px-12 pb-16">
        <div className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MarketTestCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-[1600px] w-full mx-auto px-4 md:px-8 xl:px-12 pb-20 font-sans">
      
      {/* ════════════════════════════════════════════════════════════
          HEADER (Browse Mock Tests Portal)
          ════════════════════════════════════════════════════════════ */}
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          Browse Mock Tests
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Find mock tests based on exam, subject, difficulty and language.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════
          8. CONTINUE PREVIOUS EXAM (Slim Banner)
          ════════════════════════════════════════════════════════════ */}
      {ongoingAttempt && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl px-4 py-2 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-white shrink-0 animate-pulse" />
            <span className="text-xs font-bold truncate">
              Resume Previous Exam: <span className="font-extrabold">{ongoingAttempt.title}</span>
            </span>
          </div>
          <Button
            onClick={() => window.location.href = `/student/test/${ongoingAttempt.id}`}
            className="bg-white text-orange-600 hover:bg-orange-50 font-black text-[11px] px-3.5 h-7.5 rounded-lg shrink-0 active:scale-95 transition-all shadow-xs"
          >
            Continue
          </Button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          7. STICKY FILTER TOOLBAR & QUICK CHIPS
          ════════════════════════════════════════════════════════════ */}
      <div 
        id="marketplace-filters"
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border border-slate-200/80 p-3 sm:p-4 rounded-xl shadow-md space-y-3 transition-all duration-300"
      >
        {/* Quick Filter Chips (Row 1) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0 mr-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-405" /> Quick Filters:
          </span>
          {filterChips.map((chip) => {
            const isActive = activeChips.includes(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => handleToggleChip(chip.id)}
                className={`shrink-0 text-[10.5px] font-extrabold px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#4F46E5]/30 hover:bg-white"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
          {isFilteredMode && (
            <button
              onClick={clearAllFilters}
              className="shrink-0 text-[10.5px] font-black px-2.5 py-1.5 rounded-full border border-rose-250 bg-rose-50 text-rose-600 hover:bg-rose-100/50 cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Inputs & Dropdowns (Row 2) - Grouped Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Search bar */}
          <div className="relative flex-grow sm:flex-grow-0 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search mock exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8.5 h-8.5 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#4F46E5] text-xs bg-white rounded-lg"
            />
          </div>

          {/* Filters Group Grid */}
          <div className="flex flex-wrap gap-2.5 items-center flex-1 min-w-[280px]">
            {/* Exam */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Exam:</span>
              <Select value={examType} onValueChange={(val) => setExamType(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[85px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Exams</SelectItem>
                  <SelectItem value="MOCK_TEST">Mock Test</SelectItem>
                  <SelectItem value="PRACTICE_QUIZ">Practice Quiz</SelectItem>
                  <SelectItem value="SECTIONAL_TEST">Sectional Test</SelectItem>
                  <SelectItem value="PREVIOUS_YEAR_PAPER">PY Paper</SelectItem>
                  <SelectItem value="DAILY_QUIZ">Daily Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Subject:</span>
              <Select value={subjectFilter} onValueChange={(val) => setSubjectFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[90px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Category:</span>
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[95px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Diff:</span>
              <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[75px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="EASY">Beginner</SelectItem>
                  <SelectItem value="MEDIUM">Intermediate</SelectItem>
                  <SelectItem value="HARD">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Lang:</span>
              <Select value={languageFilter} onValueChange={(val) => setLanguageFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[80px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">Languages</SelectItem>
                  <SelectItem value="ENGLISH">English</SelectItem>
                  <SelectItem value="HINDI">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Time:</span>
              <Select value={durationFilter} onValueChange={(val) => setDurationFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[85px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">Any Duration</SelectItem>
                  <SelectItem value="short">&lt; 30 mins</SelectItem>
                  <SelectItem value="medium">30 - 60 mins</SelectItem>
                  <SelectItem value="long">&gt; 60 mins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Count */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Qs:</span>
              <Select value={questionsFilter} onValueChange={(val) => setQuestionsFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[80px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">Any Questions</SelectItem>
                  <SelectItem value="low">&lt; 20 Qs</SelectItem>
                  <SelectItem value="medium">20 - 50 Qs</SelectItem>
                  <SelectItem value="high">&gt; 50 Qs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Free/Premium */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-lg text-slate-650 hover:border-[#4F46E5]/30 hover:bg-white transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-slate-400 select-none">Access:</span>
              <Select value={priceFilter} onValueChange={(val) => setPriceFilter(val || "all")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[80px] bg-transparent shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">Free & Paid</SelectItem>
                  <SelectItem value="free">Free Only</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#4F46E5]/5 border border-[#4F46E5]/20 px-2.5 py-0.5 rounded-lg text-[#4F46E5] hover:bg-[#4F46E5]/10 transition-all duration-250 shrink-0">
              <span className="text-[9.5px] font-black uppercase text-[#4F46E5]/70 select-none">Sort:</span>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val || "newest")}>
                <SelectTrigger className="h-7 border-0 p-0 text-xs w-[105px] bg-transparent text-[#4F46E5] font-extrabold shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="recently-added">Recently Added</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="most-attempted">Most Attempted</SelectItem>
                  <SelectItem value="highest-rated">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>

        {/* Active Filters Summary block */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs text-slate-500 animate-in fade-in duration-200">
            <span className="font-extrabold text-[#4F46E5] bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md text-[10px]">
              {activeFiltersCount} Filter{activeFiltersCount === 1 ? "" : "s"} Applied
            </span>
            <div className="flex flex-wrap gap-1.5 items-center">
              {activeFiltersList.map((f, i) => (
                <Badge key={i} variant="secondary" className="bg-slate-50 text-slate-600 border border-slate-200/60 text-[9px] font-semibold py-0.5 px-2 rounded">
                  {f}
                </Badge>
              ))}
            </div>
            <button 
              onClick={clearAllFilters}
              className="ml-auto shrink-0 text-[10.5px] font-black text-rose-600 hover:text-rose-800 bg-transparent border-0 cursor-pointer flex items-center gap-1.5 hover:underline"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          CATALOG SECTIONS (With Carousel Rows, 4-5 cards/row on desktop)
          ════════════════════════════════════════════════════════════ */}
      {!isFilteredMode ? (
        <div className="space-y-8">
          
          {/* SECTION 1: AI Recommended */}
          {recommendedTests.length > 0 && (
            <HorizontalRow 
              title="AI Recommended for You" 
              subtitle="Personalized recommendations matching your weak and strong preparation areas"
              icon={<Sparkles className="w-4.5 h-4.5 text-violet-500 fill-violet-500/10" />}
            >
              {recommendedTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="recommended"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 2: Trending Mock Tests */}
          {trendingTests.length > 0 && (
            <HorizontalRow 
              title="Trending Mock Tests" 
              subtitle="High-volume attempts by top ranking candidates today"
              onViewAll={() => activateSubCatFilter("price", "all")}
              icon={<Flame className="w-4.5 h-4.5 text-rose-500 fill-rose-500/15" />}
            >
              {trendingTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="trending"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 3: Latest Mock Tests */}
          {latestTests.length > 0 && (
            <HorizontalRow 
              title="Latest Mock Tests" 
              subtitle="Newly uploaded test matrices matching the current syllabus"
              icon={<Sparkles className="w-4.5 h-4.5 text-blue-500" />}
            >
              {latestTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="latest"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 4: SSC Mocks */}
          {sscTests.length > 0 && (
            <HorizontalRow 
              title="SSC Practice Mocks" 
              subtitle="Exams for SSC CGL, CHSL, MTS and CPO syllabus"
              onViewAll={() => activateSubCatFilter("chip", "ssc")}
              icon={<Trophy className="w-4.5 h-4.5 text-amber-500 fill-amber-500/10" />}
            >
              {sscTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="ssc"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 5: Banking Mocks */}
          {bankingTests.length > 0 && (
            <HorizontalRow 
              title="Banking & Financial Sector" 
              subtitle="IBPS PO, SBI Clerk, and RBI Grade B mock series"
              onViewAll={() => activateSubCatFilter("chip", "banking")}
              icon={<Award className="w-4.5 h-4.5 text-indigo-500 fill-indigo-500/10" />}
            >
              {bankingTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="banking"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 6: Railway Mocks */}
          {railwayTests.length > 0 && (
            <HorizontalRow 
              title="Railway Recruitment Mock Series" 
              subtitle="RRB NTPC, ALP, and technician mock sets"
              onViewAll={() => activateSubCatFilter("chip", "railway")}
              icon={<Laptop className="w-4.5 h-4.5 text-sky-500" />}
            >
              {railwayTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="railway"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 7: UP Police Mocks */}
          {policeTests.length > 0 && (
            <HorizontalRow 
              title="UP Police Preparation Sets" 
              subtitle="State recruitment mock sets for SI and Constables"
              onViewAll={() => activateSubCatFilter("chip", "police")}
              icon={<Award className="w-4.5 h-4.5 text-emerald-500" />}
            >
              {policeTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="police"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 8: Previous Year Papers */}
          {previousPapers.length > 0 && (
            <HorizontalRow 
              title="Previous Year Original Papers" 
              subtitle="Direct original test papers from past exams with official keys"
              onViewAll={() => activateSubCatFilter("type", "PREVIOUS_YEAR_PAPER")}
              icon={<BookOpen className="w-4.5 h-4.5 text-teal-500" />}
            >
              {previousPapers.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="pyq"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 9: Free Practice Tests */}
          {freeTests.length > 0 && (
            <HorizontalRow 
              title="Free Practice Tests" 
              subtitle="Instant access quizzes with no coins or premium tier required"
              onViewAll={() => activateSubCatFilter("price", "free")}
              icon={<Star className="w-4.5 h-4.5 text-yellow-500 fill-yellow-400/20" />}
            >
              {freeTests.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="free"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 10: Most Bookmarked */}
          {mostBookmarked.length > 0 && (
            <HorizontalRow 
              title="Most Bookmarked Exams" 
              subtitle="Tests saved by peers for revision and late attempts"
              icon={<Bookmark className="w-4.5 h-4.5 text-purple-500 fill-purple-500/10" />}
            >
              {mostBookmarked.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="bookmarked"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 11: Recently Updated */}
          {recentlyUpdated.length > 0 && (
            <HorizontalRow 
              title="Recently Updated" 
              subtitle="Modified instruction set or corrected question keys"
              icon={<Clock className="w-4.5 h-4.5 text-orange-500" />}
            >
              {recentlyUpdated.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="updated"
                />
              ))}
            </HorizontalRow>
          )}

          {/* SECTION 12: Practice Sets */}
          {practiceSets.length > 0 && (
            <HorizontalRow 
              title="General Practice Sets" 
              subtitle="Daily speed tests, quizzes and sub-sectional evaluation mocks"
              onViewAll={() => activateSubCatFilter("type", "PRACTICE_QUIZ")}
              icon={<Zap className="w-4.5 h-4.5 text-[#4F46E5] fill-[#4F46E5]/10" />}
            >
              {practiceSets.map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType="practice"
                />
              ))}
            </HorizontalRow>
          )}

        </div>
      ) : (
        /* ════════════════════════════════════════════════════════════
            GRID SEARCH CATALOGUE (Filtered view - 6 cards/row on desktop)
            ════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-extrabold text-slate-500">
              Found {sortedTests.length} mock test{sortedTests.length === 1 ? "" : "s"} matching filters
            </span>
          </div>

          {sortedTests.length === 0 ? (
            /* EMPTY STATE ILLUSTRATION */
            <div className="bg-white border border-slate-150 rounded-2xl p-12 flex flex-col items-center text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                <HelpCircle className="w-6.5 h-6.5 text-[#4F46E5] animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 flex items-center justify-center gap-1.5">
                  <span className="text-lg">📄</span> No {
                    subjectFilter !== "all" 
                      ? availableSubjects.find(s => s.id === subjectFilter)?.name 
                      : categoryFilter !== "all" 
                      ? availableCategories.find(c => c.id === categoryFilter)?.name 
                      : activeChips.length > 0 
                      ? activeChips[0].toUpperCase() 
                      : "Mock"
                  } Tests Available
                </h3>
                <p className="text-xs text-slate-450 max-w-sm">We couldn&apos;t find any mock exams matching your parameters. Adjust filters to discover more.</p>
              </div>
              <Button 
                onClick={clearAllFilters}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs h-9 px-6 rounded-xl shadow-md cursor-pointer"
              >
                Browse Other Categories
              </Button>
            </div>
          ) : (
            /* DENSE 6-COLUMN GRID on XL desktop layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
              {sortedTests.slice(0, visibleCount).map(test => (
                <MarketTestCard
                  key={test.id}
                  test={test}
                  isBookmarked={bookmarks.includes(test.id)}
                  onToggleBookmark={() => handleToggleBookmark(test.id)}
                  onShare={() => handleShare(test)}
                  onPreview={() => setPreviewTest(test)}
                  sectionType={test.type === "PREVIOUS_YEAR_PAPER" ? "pyq" : "practice"}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll target spinner */}
          {sortedTests.length > visibleCount && (
            <div ref={loaderRef} className="flex justify-center pt-8 pb-4">
              <div className="h-8 w-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TEST DETAILS PREVIEW DRAWER/MODAL
          ════════════════════════════════════════════════════════════ */}
      {previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[85vh]">
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex justify-between items-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-black tracking-wider bg-slate-100 text-slate-600 uppercase">
                  {previewTest.subject?.name || "General"}
                </span>
                <button 
                  onClick={() => setPreviewTest(null)}
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full w-6 h-6 flex items-center justify-center font-black text-xs bg-transparent border-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight tracking-tight">
                  {previewTest.title}
                </h3>
                <span className="inline-block text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                  {previewTest.category?.name || "General Category"}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <strong className="text-xs text-slate-700 block font-black">Exam Instructions & Overview:</strong>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {previewTest.description || "No customized instructions specified. Read instructions thoroughly before commencing the exam attempt."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[9px] text-slate-450 uppercase block font-bold">Total Marks</span>
                  <strong className="text-slate-700 font-extrabold">{previewTest.totalMarks} Marks</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-455 uppercase block font-bold">Passing Marks</span>
                  <strong className="text-slate-700 font-extrabold">{previewTest.passMarks} Marks</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-455 uppercase block font-bold">Total Questions</span>
                  <strong className="text-slate-700 font-extrabold">{previewTest._count?.questions || 20} Questions</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-455 uppercase block font-bold">Negative Marking</span>
                  <strong className="text-rose-600 font-extrabold">-{previewTest.type === "MOCK_TEST" ? "0.25" : "0.00"} per error</strong>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setPreviewTest(null)}
                className="flex-1 text-xs font-bold border-slate-200 rounded-xl h-10 bg-white"
              >
                Close Preview
              </Button>
              <Button
                onClick={() => window.location.href = `/student/test/${previewTest.id}`}
                className="flex-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-xs shadow-md shadow-indigo-500/10 h-10 rounded-xl active:scale-[0.98] transition-all"
              >
                Start Test
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
