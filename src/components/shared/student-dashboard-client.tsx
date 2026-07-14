"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  GraduationCap, Award, AlertCircle, Search, 
  BookOpen, Calendar, ChevronRight, Play, CheckCircle2, 
  XCircle, Flame, Clock, Target, Bookmark, Sparkles, 
  TrendingUp, Award as PrizeIcon, HelpCircle, BarChart3,
  Activity, Star, Share2, ChevronDown, ChevronUp, Users,
  Trophy, Zap, User, Brain, Calculator, Globe, Laptop, RotateCcw, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface DashboardMetrics {
  availableExams: number;
  pendingAttempts: number;
  completedExams: number;
  averageScore: string;
}

// ─── Mini SVG Sparkline ────────────────────────────────────────
function MiniSparkline({ data, color = "#4F46E5" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const w = 60, h = 24, pad = 2;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i * (w - 2 * pad)) / (data.length - 1);
    const y = h - pad - ((v - min) * (h - 2 * pad)) / range;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 opacity-60">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Mini Circular Progress ────────────────────────────────────
function CircularProgress({ pct, size = 40, stroke = 3.5, color = "#4F46E5", bgColor = "#e2e8f0", children }: { pct: number; size?: number; stroke?: number; color?: string; bgColor?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bgColor} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ─── Performance Chart ─────────────────────────────────────────
function PerformanceChart({ results }: { results: Result[] }) {
  if (results.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-4">
        {/* Animated chart illustration */}
        <div className="relative">
          <svg width="80" height="80" viewBox="0 0 80 80" className="animate-pulse">
            <rect x="8" y="50" width="10" height="20" rx="3" fill="#c7d2fe" />
            <rect x="24" y="35" width="10" height="35" rx="3" fill="#a5b4fc" />
            <rect x="40" y="25" width="10" height="45" rx="3" fill="#818cf8" />
            <rect x="56" y="15" width="10" height="55" rx="3" fill="#6366f1" />
            <line x1="4" y1="72" x2="72" y2="72" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <polyline points="12,48 28,33 44,23 60,13" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
          </svg>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center animate-bounce">
            <TrendingUp className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-slate-700">No performance data yet</p>
          <p className="text-xs text-slate-500 max-w-xs">Attempt your first mock test to visualize your learning trajectory and track progress.</p>
        </div>
        <Button
          onClick={() => document.getElementById("tests-section")?.scrollIntoView({ behavior: "smooth" })}
          className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold h-9 px-5 rounded-xl shadow-md shadow-indigo-500/15 active:scale-[0.97] transition-all"
        >
          <Play className="mr-1.5 h-3.5 w-3.5 fill-white" /> Start Practice
        </Button>
      </div>
    );
  }

  // Get last 7 completed attempts chronologically
  const chartData = [...results]
    .slice(0, 7)
    .reverse()
    .map((r, i) => ({
      score: r.percentage,
      name: r.testName,
      index: i + 1,
    }));

  const height = 180;
  const width = 500;
  const padding = 35;

  const points = chartData.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / Math.max(1, chartData.length - 1);
    const y = height - padding - (d.score * (height - 2 * padding)) / 100;
    return { x, y, score: d.score, name: d.name, index: d.index };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : "";

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px] h-52 overflow-visible">
        {/* X & Y Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = height - padding - (val * (height - 2 * padding)) / 100;
          return (
            <g key={val}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={y + 3}
                className="text-[9px] font-black fill-slate-400"
                textAnchor="end"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill="url(#performanceGradient)"
            opacity={0.15}
          />
        )}

        {/* Connect line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#4F46E5"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive nodes */}
        {points.map((p, i) => (
          <g key={i} className="group/node cursor-pointer">
            <circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill="#FFFFFF"
              stroke="#4F46E5"
              strokeWidth={3.5}
              className="transition-all duration-150 group-hover/node:r-6.5"
            />
            {/* Tooltip */}
            <g className="opacity-0 group-hover/node:opacity-100 transition-opacity duration-150 pointer-events-none">
              <rect
                x={p.x - 30}
                y={p.y - 32}
                width={60}
                height={22}
                rx={6}
                fill="#1E293B"
                className="shadow-sm"
              />
              <text
                x={p.x}
                y={p.y - 18}
                className="text-[10px] font-black fill-white"
                textAnchor="middle"
              >
                {p.score}%
              </text>
            </g>
            {/* Label axis */}
            <text
              x={p.x}
              y={height - 12}
              className="text-[9px] font-bold fill-slate-400"
              textAnchor="middle"
            >
              Test {p.index}
            </text>
          </g>
        ))}

        <defs>
          <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Accordion Widget Wrapper ──────────────────────────────────
function AccordionWidget({ 
  title, icon: Icon, iconColor, badgeText, borderColor, defaultOpen = false, children 
}: { 
  title: string; icon: React.ElementType; iconColor: string; badgeText?: string; borderColor: string; defaultOpen?: boolean; children: React.ReactNode 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition-all duration-200`}
      style={{ borderLeft: `3px solid ${borderColor}` }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-0 cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badgeText && (
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{badgeText}</span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>
      <div className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 pt-1 border-t border-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}


function getSubjectGradient(subjectName: string) {
  const name = subjectName.toLowerCase();
  if (name.includes("math") || name.includes("quant") || name.includes("arithmetic")) {
    return "from-[#4F46E5] to-[#6366F1]";
  }
  if (name.includes("reasoning") || name.includes("aptitude") || name.includes("logic")) {
    return "from-[#7C3AED] to-[#8B5CF6]";
  }
  if (name.includes("english") || name.includes("verbal") || name.includes("lang")) {
    return "from-[#0EA5E9] to-[#38BDF8]";
  }
  if (name.includes("general awareness") || name.includes("gk") || name.includes("history") || name.includes("science") || name.includes("polity")) {
    return "from-[#10B981] to-[#34D399]";
  }
  return "from-[#6366F1] to-[#8B5CF6]";
}

function getSubjectIcon(subjectName: string) {
  const name = subjectName.toLowerCase();
  if (name.includes("math") || name.includes("quant") || name.includes("arithmetic")) {
    return <Calculator className="w-4 h-4 text-white" />;
  }
  if (name.includes("reasoning") || name.includes("aptitude") || name.includes("logic")) {
    return <Brain className="w-4 h-4 text-white" />;
  }
  if (name.includes("english") || name.includes("verbal") || name.includes("lang")) {
    return <Globe className="w-4 h-4 text-white" />;
  }
  if (name.includes("general awareness") || name.includes("gk") || name.includes("history") || name.includes("science") || name.includes("polity")) {
    return <BookOpen className="w-4 h-4 text-white" />;
  }
  return <Laptop className="w-4 h-4 text-white" />;
}

function getExamLogo(title: string) {
  const name = title.toUpperCase();
  if (name.includes("SSC") || name.includes("CGL") || name.includes("CHSL")) return "SSC";
  if (name.includes("BANK") || name.includes("PO") || name.includes("CLERK") || name.includes("IBPS") || name.includes("SBI")) return "BANK";
  if (name.includes("RAILWAY") || name.includes("NTPC") || name.includes("RRB") || name.includes("ALP")) return "RLY";
  if (name.includes("POLICE") || name.includes("SI") || name.includes("UPP") || name.includes("CONSTABLE")) return "POLICE";
  return "EXAM";
}

function MarketTestCardSkeleton() {
  return (
    <div className="border border-slate-100 bg-white rounded-2xl overflow-hidden flex flex-col justify-between h-[255px] shadow-sm animate-pulse">
      <div className="h-10 bg-slate-100" />
      <div className="p-3 space-y-3.5 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-4.5 w-10 bg-slate-100 rounded" />
          </div>
          <div className="h-4 w-40 bg-slate-100 rounded" />
          <div className="grid grid-cols-3 gap-1 py-1 text-center">
            <div className="h-6 bg-slate-105 rounded" />
            <div className="h-6 bg-slate-105 rounded" />
            <div className="h-6 bg-slate-105 rounded" />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="p-3 bg-slate-50/20 border-t border-slate-100 flex justify-between items-center">
        <div className="flex gap-2">
          <div className="h-6 w-6 bg-slate-100 rounded" />
          <div className="h-6 w-6 bg-slate-100 rounded" />
        </div>
        <div className="h-8 w-20 bg-slate-100 rounded-lg" />
      </div>
    </div>
  );
}


export function StudentDashboardClient() {
  const { data: session } = useSession();
  
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [upcomingTests, setUpcomingTests] = useState<Test[]>([]);
  const [recentResults, setRecentResults] = useState<Result[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    availableExams: 0,
    pendingAttempts: 0,
    completedExams: 0,
    averageScore: "0%",
  });

  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeChips, setActiveChips] = useState<string[]>([]);

  const [subjects, setSubjects] = useState<Subject[]>([]);

  async function loadSubjects() {
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Failed to load subjects", err);
    }
  }

  async function fetchDashboardData() {
    try {
      const res = await fetch("/api/student/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load dashboard parameters");
      }
      const data = await res.json();
      setAvailableTests(data.availableTests || []);
      setUpcomingTests(data.upcomingTests || []);
      setRecentResults(data.recentResults || []);
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not retrieve student dashboard records";
      console.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Load all data asynchronously in the next tick to prevent cascading render warnings
    const timer = setTimeout(() => {
      fetchDashboardData();
      loadSubjects();
      
      try {
        const savedBookmarks = localStorage.getItem("rci_student_bookmarks");
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        }
      } catch (e) {
        console.error("Failed to load bookmarks", e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Toggle bookmark local state
  const handleToggleBookmark = (testId: string) => {
    setBookmarks((prev) => {
      const updated = prev.includes(testId) 
        ? prev.filter((id) => id !== testId) 
        : [...prev, testId];
      try {
        localStorage.setItem("rci_student_bookmarks", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Toggle chip filter
  const handleToggleChip = (chip: string) => {
    setActiveChips(prev => prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]);
  };

  // 1. Calculate Streak dynamically based on completion dates
  const calculateStreak = (results: Result[]) => {
    if (results.length === 0) return 0;
    const dates = results.map(r => new Date(r.completedAt).toDateString());
    const uniqueDates = Array.from(new Set(dates)).map(d => new Date(d));
    uniqueDates.sort((a, b) => b.getTime() - a.getTime()); // Descending

    let streak = 0;
    const curr = new Date();
    curr.setHours(0, 0, 0, 0);

    const hasToday = uniqueDates.some(d => d.toDateString() === curr.toDateString());
    const yesterday = new Date(curr);
    yesterday.setDate(yesterday.getDate() - 1);
    const hasYesterday = uniqueDates.some(d => d.toDateString() === yesterday.toDateString());

    if (!hasToday && !hasYesterday) return 0;

    const checkDate = hasToday ? curr : yesterday;
    while (true) {
      const match = uniqueDates.some(d => d.toDateString() === checkDate.toDateString());
      if (match) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const currentStreak = calculateStreak(recentResults);

  // 2. Average Accuracy calculation
  const completedCount = recentResults.length;
  const avgAccuracyPct = completedCount > 0
    ? Math.round(recentResults.reduce((acc, curr) => acc + curr.percentage, 0) / completedCount)
    : 0;

  // 3. Study Time estimation: sum of completed mock durations
  const calculateStudyTime = (results: Result[], available: Test[]) => {
    let totalMins = 0;
    results.forEach((res) => {
      const matchingTest = available.find(t => t.id === res.testId);
      totalMins += matchingTest ? matchingTest.duration : 45; // default 45
    });
    if (totalMins === 0) return "0h";
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };
  const studyTimeStr = calculateStudyTime(recentResults, availableTests);

  // 4. Live mock tests: available tests scheduled/active today
  const liveMockExams = availableTests.filter((t) => t.type === "MOCK_TEST");

  // 5. Subject Strength & Weakness analysis
  const analyzeSubjects = (results: Result[], allSubjects: Subject[]) => {
    const subjectMetrics: Record<string, { totalPct: number; attempts: number }> = {};
    
    // Group percentages
    results.forEach((r) => {
      if (!subjectMetrics[r.subjectName]) {
        subjectMetrics[r.subjectName] = { totalPct: 0, attempts: 0 };
      }
      subjectMetrics[r.subjectName].totalPct += r.percentage;
      subjectMetrics[r.subjectName].attempts += 1;
    });

    const analyzedList = Object.keys(subjectMetrics).map((subName) => {
      const item = subjectMetrics[subName];
      return {
        subject: subName,
        accuracy: Math.round(item.totalPct / item.attempts),
      };
    });

    // If a seeded subject has no attempts, append it with 0% to prompt practice
    allSubjects.forEach((sub) => {
      const exists = analyzedList.some(item => item.subject.toLowerCase() === sub.name.toLowerCase());
      if (!exists) {
        analyzedList.push({ subject: sub.name, accuracy: 0 });
      }
    });

    const strong = analyzedList.filter((s) => s.accuracy >= 60).sort((a,b) => b.accuracy - a.accuracy);
    const weak = analyzedList.filter((s) => s.accuracy < 60).sort((a,b) => a.accuracy - b.accuracy);

    return { strong, weak };
  };

  const { strong: strongSubjects, weak: weakSubjects } = analyzeSubjects(recentResults, subjects);

  // 6. Dynamic Leaderboard preview based on student's accuracy
  const getLeaderboard = (studentPct: number, studentName: string) => {
    const mockToppers = [
      { name: "Rajesh Kumar", accuracy: 96, isStudent: false },
      { name: "Sneha Sharma", accuracy: 90, isStudent: false },
      { name: studentName, accuracy: studentPct, isStudent: true },
      { name: "Vikrant Gupta", accuracy: 78, isStudent: false },
      { name: "Priya Patel", accuracy: 71, isStudent: false },
    ];
    // Sort descending
    mockToppers.sort((a, b) => b.accuracy - a.accuracy);
    return mockToppers.map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
  };

  const studentName = session?.user?.name || "Student Partner";
  const leaderboardPreview = getLeaderboard(avgAccuracyPct, studentName);
  const studentRankOnLeaderboard = leaderboardPreview.find((u) => u.isStudent)?.rank || 3;

  // 7. Daily Goals calculations: complete 2 mock tests today
  const getTestsCompletedToday = (results: Result[]) => {
    const todayStr = new Date().toDateString();
    return results.filter(r => new Date(r.completedAt).toDateString() === todayStr).length;
  };
  const completedToday = getTestsCompletedToday(recentResults);
  const goalTarget = 2;
  const goalProgressPct = Math.min(100, Math.round((completedToday / goalTarget) * 100));

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Detect ongoing attempt
  const ongoingAttempt = availableTests.find((t) => t.hasOngoing);

  // Total questions solved
  const totalQuestionsSolved = recentResults.reduce((sum, r) => {
    const matchTest = availableTests.find(t => t.id === r.testId);
    return sum + (matchTest?._count?.questions || 20);
  }, 0);

  // Profile completion estimation
  const profileCompletionPct = Math.min(100, 40 + (completedCount > 0 ? 20 : 0) + (currentStreak > 0 ? 15 : 0) + (avgAccuracyPct > 50 ? 15 : 0) + (bookmarks.length > 0 ? 10 : 0));

  // Achievements
  const achievements = [
    { emoji: "🏆", label: `${currentStreak} Day Streak`, achieved: currentStreak >= 1 },
    { emoji: "⭐", label: "Accuracy Above 80%", achieved: avgAccuracyPct >= 80 },
    { emoji: "🎯", label: `${totalQuestionsSolved} Questions Solved`, achieved: totalQuestionsSolved >= 10 },
    { emoji: "📚", label: `${completedCount} Tests Completed`, achieved: completedCount >= 3 },
    { emoji: "🔥", label: "First Mock Done", achieved: completedCount >= 1 },
  ];

  // Recent activity feed from results
  const recentActivity = recentResults.slice(0, 3).map(r => {
    const d = new Date(r.completedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    let timeLabel = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (diffDays === 0) timeLabel = "Today";
    else if (diffDays === 1) timeLabel = "Yesterday";
    return { ...r, timeLabel };
  });

  // Sparkline data generators
  const getSparklineData = (count: number) => {
    // Generate pseudo-deterministic sparkline from the count value
    const base = count || 1;
    return [
      Math.max(1, base - 3),
      Math.max(1, base - 1),
      Math.max(1, base + 1),
      Math.max(1, base - 2),
      base,
    ];
  };

  // Marks needed for 90th percentile (mock calculation)
  const marksForNinety = Math.max(0, 90 - avgAccuracyPct);

  // Chip filter categories
  const filterChips = [
    { id: "free", label: "Free" },
    { id: "premium", label: "Premium" },
    { id: "english", label: "English" },
    { id: "hindi", label: "Hindi" },
    { id: "ssc", label: "SSC" },
    { id: "banking", label: "Banking" },
    { id: "railway", label: "Railway" },
    { id: "latest", label: "Latest" },
    { id: "popular", label: "Popular" },
  ];

  // Filtering & Sorting
  const filteredAvailable = availableTests.filter((test) => {
    const matchesSearch = test.title.toLowerCase().includes(search.toLowerCase()) || 
                          (test.description && test.description.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = subjectFilter === "all" || test.subjectId === subjectFilter;
    const matchesType = typeFilter === "all" || test.type === typeFilter;
    
    // Difficulty filters mapping
    let matchesDiff = true;
    if (difficultyFilter !== "all") {
      matchesDiff = true;
    }

    // Chip-based filtering
    let matchesChips = true;
    if (activeChips.length > 0) {
      const titleLower = test.title.toLowerCase();
      const descLower = (test.description || "").toLowerCase();
      const combined = `${titleLower} ${descLower}`;
      
      matchesChips = activeChips.every(chip => {
        if (chip === "free") return test.visibility === "PUBLIC";
        if (chip === "premium") return test.visibility === "PRIVATE";
        if (chip === "english" || chip === "hindi") return true; // All tests default to matching
        if (chip === "ssc") return combined.includes("ssc");
        if (chip === "banking") return combined.includes("bank");
        if (chip === "railway") return combined.includes("railway") || combined.includes("rrb");
        if (chip === "latest") return true;
        if (chip === "popular") return test.completedCount > 0;
        return true;
      });
    }
    
    return matchesSearch && matchesSubject && matchesType && matchesDiff && matchesChips;
  });

  // Sort available tests
  const sortedAvailable = [...filteredAvailable].sort((a, b) => {
    if (sortBy === "newest") {
      return b.id.localeCompare(a.id); // Simple chronological ID comparison
    }
    if (sortBy === "popular") {
      return b.completedCount - a.completedCount; // Sort by number of completed attempts
    }
    if (sortBy === "highest-rated") {
      return b.totalMarks - a.totalMarks; // Highest total marks as proxy
    }
    return 0;
  });

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "PRACTICE_QUIZ": return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/40 text-[9px] font-bold rounded-lg px-2">Practice Quiz</Badge>;
      case "MOCK_TEST": return <Badge variant="outline" className="border-sky-200 text-sky-700 bg-sky-50/40 text-[9px] font-bold rounded-lg px-2">Mock Exam</Badge>;
      case "SECTIONAL_TEST": return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50/40 text-[9px] font-bold rounded-lg px-2">Sectional</Badge>;
      case "PREVIOUS_YEAR_PAPER": return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/40 text-[9px] font-bold rounded-lg px-2">PY Paper</Badge>;
      case "DAILY_QUIZ": return <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/40 text-[9px] font-bold rounded-lg px-2">Daily Quiz</Badge>;
      default: return <Badge variant="secondary" className="text-[9px] font-bold rounded-lg px-2">{type}</Badge>;
    }
  };

  const getDifficultyBadgeColor = (title: string) => {
    const l = title.toLowerCase();
    if (l.includes("hard") || l.includes("advanced") || l.includes("difficult")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (l.includes("easy") || l.includes("basic") || l.includes("foundation")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  const getDifficultyText = (title: string) => {
    const l = title.toLowerCase();
    if (l.includes("hard") || l.includes("advanced") || l.includes("difficult")) return "Advanced";
    if (l.includes("easy") || l.includes("basic") || l.includes("foundation")) return "Beginner";
    return "Intermediate";
  };

  const getDifficultyPct = (title: string) => {
    const l = title.toLowerCase();
    if (l.includes("hard") || l.includes("advanced") || l.includes("difficult")) return 85;
    if (l.includes("easy") || l.includes("basic") || l.includes("foundation")) return 30;
    return 55;
  };

  const getInstructionsSnippet = (instructions: string | null) => {
    if (!instructions) return "Read instructions thoroughly before commencing the exam attempt.";
    return instructions.length > 80 ? instructions.substring(0, 80) + "..." : instructions;
  };

  // Check if test is "new" (created within last 7 days or use ID heuristic)
  const isNewTest = (test: Test) => {
    if (test.createdAt) {
      const created = new Date(test.createdAt);
      const now = new Date();
      return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }
    return false;
  };

  // Share handler
  const handleShare = async (test: Test) => {
    const url = `${window.location.origin}/student/test/${test.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: test.title, text: `Check out this test: ${test.title}`, url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch { /* fallback */ }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1600px] w-full mx-auto px-4 md:px-8 pb-16">
        <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-14 bg-slate-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <MarketTestCardSkeleton key={i} />
              ))}
            </div>
          </div>
          <div className="h-96 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-[1600px] w-full mx-auto px-4 md:px-8 pb-16 font-sans">
      
      {/* ════════════════════════════════════════════════════════════
          1. COMPACT HERO SECTION
          ════════════════════════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-r from-[#4F46E5] via-[#5F4BF2] to-[#7C3AED] text-white p-4 sm:p-5 rounded-2xl shadow-lg overflow-hidden border border-white/10">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/8 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{getGreeting()}, {studentName} 👋</h1>
            <p className="text-indigo-100 text-xs font-medium max-w-lg">
              Practice mocks, review answers, and optimize your preparation for top rankings.
            </p>
          </div>
          
          {/* Compact chip metrics */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-white/15 backdrop-blur border border-white/20">
              🏅 Rank <strong className="text-white">#{studentRankOnLeaderboard}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-500/25 backdrop-blur border border-emerald-300/30">
              🎯 Accuracy <strong className="text-emerald-200">{avgAccuracyPct}%</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-amber-500/25 backdrop-blur border border-amber-300/30">
              <Flame className="w-3 h-3 text-amber-300 fill-amber-300" /> <strong className="text-amber-200">{currentStreak} Days</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          2. RICH METRIC CARDS — Sparklines, Trends, Progress Rings
          ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { label: "Available Tests", value: availableTests.length, trend: "+3 this week", trendUp: true, icon: GraduationCap, gradient: "from-indigo-500 to-indigo-600", bgLight: "bg-indigo-50", sparkColor: "#4F46E5", isPct: false },
          { label: "Upcoming Exams", value: upcomingTests.length, trend: "Scheduled", trendUp: true, icon: Calendar, gradient: "from-violet-500 to-purple-600", bgLight: "bg-purple-50", sparkColor: "#7C3AED", isPct: false },
          { label: "Completed Tests", value: completedCount, trend: `${completedToday} today`, trendUp: completedToday > 0, icon: BookOpen, gradient: "from-emerald-500 to-green-600", bgLight: "bg-emerald-50", sparkColor: "#10b981", isPct: false },
          { label: "Average Accuracy", value: `${avgAccuracyPct}%`, trend: avgAccuracyPct > 50 ? "Above avg" : "Keep going", trendUp: avgAccuracyPct > 50, icon: Target, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50", sparkColor: "#f59e0b", isPct: true, pctVal: avgAccuracyPct },
          { label: "Average Score", value: metrics.averageScore, trend: "Overall", trendUp: true, icon: Award, gradient: "from-pink-500 to-rose-500", bgLight: "bg-pink-50", sparkColor: "#ec4899", isPct: false },
          { label: "Study Time", value: studyTimeStr, trend: "Total practice", trendUp: true, icon: Clock, gradient: "from-sky-500 to-cyan-500", bgLight: "bg-sky-50", sparkColor: "#0ea5e9", isPct: false },
          { label: "Current Streak", value: `${currentStreak}d`, trend: currentStreak > 0 ? "Active 🔥" : "Start today", trendUp: currentStreak > 0, icon: Flame, gradient: "from-orange-500 to-red-500", bgLight: "bg-orange-50", sparkColor: "#f97316", isPct: false },
          { label: "Live Mocks", value: liveMockExams.length, trend: "Active now", trendUp: liveMockExams.length > 0, icon: Activity, gradient: "from-rose-500 to-pink-600", bgLight: "bg-rose-50", sparkColor: "#f43f5e", isPct: false },
        ].map((item, idx) => {
          const Icon = item.icon;
          const numericVal = typeof item.value === "number" ? item.value : parseInt(String(item.value)) || 0;
          return (
            <Card key={idx} className="border border-slate-100 bg-white hover:border-[#4F46E5]/30 hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] transition-all duration-250 shadow-xs rounded-2xl overflow-hidden group">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  {/* Gradient icon */}
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {/* Mini sparkline */}
                  <MiniSparkline data={getSparklineData(numericVal)} color={item.sparkColor} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">{item.label}</span>
                  <div className="flex items-end gap-2">
                    <strong className="text-xl font-black text-slate-800 leading-tight">{item.value}</strong>
                    {item.isPct && item.pctVal !== undefined && (
                      <CircularProgress pct={item.pctVal} size={22} stroke={2.5} color={item.sparkColor} bgColor="#e2e8f0" />
                    )}
                  </div>
                </div>
                {/* Trend */}
                <div className={`flex items-center gap-1 text-[10px] font-bold ${item.trendUp ? "text-emerald-600" : "text-slate-400"}`}>
                  {item.trendUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <span className="w-3 h-3 text-center">—</span>
                  )}
                  <span>{item.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════
          3. WORKSPACE 2-COLUMN LAYOUT
          ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        
        {/* LEFT COLUMN - 70% (Cols 1-7) */}
        <div className="lg:col-span-7 space-y-7">
          
          {/* CONTINUE LAST EXAM */}
          {ongoingAttempt && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-md border border-amber-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <div className="space-y-1.5 relative z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-white/20 border border-white/20 tracking-wider">
                  ⚠️ Ongoing Examination Detected
                </span>
                <h3 className="text-lg font-black tracking-tight">{ongoingAttempt.title}</h3>
                <p className="text-amber-50 text-xs">
                  Your last examination session ended abruptly or is pending. Resume your attempt to complete the test!
                </p>
                <div className="flex gap-4 text-[11px] text-amber-100 font-bold mt-2">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Max {ongoingAttempt.duration} Minutes</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Total {ongoingAttempt.totalMarks} Marks</span>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = `/student/test/${ongoingAttempt.id}`}
                className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs h-10 px-5 rounded-xl shadow-md z-10 active:scale-[0.97] transition-all whitespace-nowrap"
              >
                <Play className="mr-1.5 h-3.5 w-3.5 fill-orange-600 stroke-orange-600" /> Resume Exam Attempt
              </Button>
            </div>
          )}

          {/* ══ FILTER BAR & RECOMMENDED TESTS ══ */}
          <div className="space-y-5" id="tests-section">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#4F46E5]" /> Recommended Practice Tests
                </h2>
                <p className="text-xs text-slate-500 font-medium">Select your targeted topic mock tests below to evaluate subject comprehension.</p>
              </div>
            </div>

            {/* STICKY FILTER BAR */}
            <div className="sticky top-16 z-30 bg-slate-50/80 backdrop-blur-md border border-slate-100 p-3 rounded-2xl space-y-2.5 shadow-xs">
              <div className="flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-wrap gap-2 items-center flex-1 min-w-[280px]">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[150px] max-w-[240px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search mock exams..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#4F46E5] text-xs bg-white rounded-xl"
                    />
                  </div>

                  {/* Subject filter */}
                  <Select value={subjectFilter} onValueChange={(val) => setSubjectFilter(val || "all")}>
                    <SelectTrigger className="h-9 border-slate-200 text-xs w-[130px] bg-white rounded-xl">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-150">
                      <SelectItem value="all">All Subjects</SelectItem>
                      {subjects.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Test type filter */}
                  <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val || "all")}>
                    <SelectTrigger className="h-9 border-slate-200 text-xs w-[120px] bg-white rounded-xl">
                      <SelectValue placeholder="Exam Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-150">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="MOCK_TEST">Mock Test</SelectItem>
                      <SelectItem value="PRACTICE_QUIZ">Practice Quiz</SelectItem>
                      <SelectItem value="SECTIONAL_TEST">Sectional Test</SelectItem>
                      <SelectItem value="PREVIOUS_YEAR_PAPER">PY Paper</SelectItem>
                      <SelectItem value="DAILY_QUIZ">Daily Quiz</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Difficulty filter mock */}
                  <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val || "all")}>
                    <SelectTrigger className="h-9 border-slate-200 text-xs w-[110px] bg-white rounded-xl">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-150">
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="easy">Beginner</SelectItem>
                      <SelectItem value="medium">Intermediate</SelectItem>
                      <SelectItem value="hard">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort controls */}
                <div className="flex items-center gap-1 border border-slate-200 bg-white rounded-xl p-1 shrink-0">
                  {[
                    { id: "newest", label: "Newest" },
                    { id: "popular", label: "Popular" },
                    { id: "highest-rated", label: "Top Mark" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                        sortBy === s.id
                          ? "bg-[#4F46E5] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ══ 7. FILTER CHIPS BAR ══ */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {filterChips.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => handleToggleChip(chip.id)}
                    className={`shrink-0 text-[10px] font-bold px-3 py-1.5 rounded-full border cursor-pointer transition-all whitespace-nowrap ${
                      activeChips.includes(chip.id)
                        ? "bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#4F46E5]/40 hover:text-[#4F46E5]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
                {activeChips.length > 0 && (
                  <button
                    onClick={() => setActiveChips([])}
                    className="shrink-0 text-[10px] font-bold px-2.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 text-rose-600 cursor-pointer hover:bg-rose-100 transition-all"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* ══ 3. ENHANCED TEST CARDS GRID ══ */}
            {sortedAvailable.length === 0 ? (
              <Card className="border border-slate-100 shadow-xs bg-white rounded-3xl overflow-hidden">
                <CardContent className="h-60 flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <HelpCircle className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="text-slate-500 max-w-sm space-y-1">
                    <p className="font-bold text-slate-800 text-sm">No Mock Tests Available</p>
                    <p className="text-xs">We couldn&apos;t find any mock exams matching your parameters. Try modifying your search filter keywords.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSubjectFilter("all"); setTypeFilter("all"); setDifficultyFilter("all"); setActiveChips([]); }} className="text-xs font-bold border-slate-200 rounded-xl px-4">
                    Clear Search Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {sortedAvailable.map((test) => {
                  const isBookmarked = bookmarks.includes(test.id);
                  const testIsNew = isNewTest(test);
                  const questionsCount = test._count?.questions || 20;
                  const subjectName = test.subject?.name || "General";
                  
                  // Mock statistics if missing
                  const mockRating = 4.3 + (test.completedCount % 7) * 0.1;
                  const mockAttempts = 1500 + (test.completedCount * 12);
                  const mockRec = 88 + (test.completedCount % 5) * 2;
                  
                  // Determine difficulty
                  const difficulty = test.title.toUpperCase().includes("HARD") || test.title.toUpperCase().includes("PREMIUM") 
                    ? "HARD" 
                    : test.title.toUpperCase().includes("EASY") || test.title.toUpperCase().includes("BASIC") 
                    ? "EASY" 
                    : "MEDIUM";

                  return (
                    <Card 
                      key={test.id} 
                      className="border border-slate-150/70 bg-white hover:border-[#4F46E5] hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 shadow-sm rounded-2xl overflow-hidden flex flex-col justify-between group relative"
                    >
                      {/* Premium Header Gradient matching Subject */}
                      <div className={`relative h-20 bg-gradient-to-br ${getSubjectGradient(subjectName)} text-white p-3.5 flex flex-col justify-between shrink-0 overflow-hidden`}>
                        {/* Subtle grid lines background overlay */}
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />
                        
                        <div className="relative z-10 flex items-center justify-between w-full">
                          {/* Subject Circle Icon */}
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                            {getSubjectIcon(subjectName)}
                          </div>

                          {/* Exam Logo indicator pill */}
                          <span className="bg-black/25 text-white/95 border border-white/10 text-[7.5px] font-black rounded-md px-1.5 py-0.5 tracking-wider uppercase">
                            {getExamLogo(test.title)}
                          </span>
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

                      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          {/* Header Metadata with Dynamic Section Badges */}
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                            <span className="truncate max-w-[120px] uppercase tracking-wider">{subjectName}</span>
                            
                            <div className="flex gap-1">
                              {testIsNew && (
                                <span className="text-blue-600 bg-blue-50 border border-blue-100 text-[8px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5 text-blue-500" /> NEW
                                </span>
                              )}
                              {test.hasOngoing && (
                                <span className="text-amber-600 bg-amber-50 border border-amber-100 text-[8px] px-1.5 py-0.2 rounded font-black flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5 text-amber-500" /> RESUME
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Title - Compact 2-line height */}
                          <h4 className="font-extrabold text-slate-800 text-[13.5px] leading-snug tracking-tight group-hover:text-[#4F46E5] transition-colors line-clamp-2 h-9">
                            {test.title}
                          </h4>

                          {/* Detailed Row (Compact layout, 25-30% shorter) */}
                          <div className="grid grid-cols-3 gap-1 border-y border-slate-100 py-1.5 text-center text-[10px]">
                            <div>
                              <span className="text-[7.5px] font-bold text-slate-400 block uppercase">Questions</span>
                              <strong className="text-slate-700 block font-extrabold mt-0.2">{questionsCount} Qs</strong>
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

                        {/* Social Proof / Trust metrics block */}
                        <div className="flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-100/50 pt-2 px-0.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="font-extrabold text-slate-700 ml-0.5">{mockRating.toFixed(1)}</span>
                          </div>
                          <span className="h-2.5 w-px bg-slate-200" />
                          <span className="font-bold text-slate-600 truncate max-w-[80px]">{mockAttempts.toLocaleString()} Attempts</span>
                          <span className="h-2.5 w-px bg-slate-200" />
                          <span className="font-extrabold text-emerald-600 whitespace-nowrap">👍 {mockRec}%</span>
                        </div>

                      </div>

                      {/* Action Footer Bar (Slimmer) */}
                      <div className="px-3.5 pb-3.5 pt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 bg-slate-50/20">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleBookmark(test.id); }}
                            className="text-slate-400 hover:text-rose-500 p-1.5 hover:bg-slate-100 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
                            title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleShare(test); }}
                            className="text-slate-400 hover:text-[#4F46E5] p-1.5 hover:bg-slate-100 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
                            title="Share"
                          >
                            <Share2 className="h-3.5 w-3.5" />
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
                })}
              </div>
            )}
          </div>

          {/* ══ 4. PERFORMANCE ANALYTICS ══ */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#4F46E5]" /> Performance Analytics
                  </CardTitle>
                  <p className="text-[10px] text-slate-500 font-medium">Trace your score percentages across your latest mock exam attempts.</p>
                </div>
                {recentResults.length > 0 && (
                  <Badge className="bg-indigo-50 text-[#4F46E5] hover:bg-indigo-50 border border-indigo-100 font-bold text-[9px] rounded-lg">
                    Latest {Math.min(7, recentResults.length)} Attempts
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PerformanceChart results={recentResults} />
            </CardContent>
          </Card>

          {/* ══ 5. ASSESSMENT HISTORY & RESULTS ══ */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-slate-50 pb-4">
              <CardTitle className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Award className="w-5 h-5 text-[#4F46E5]" /> Assessment History & Results
              </CardTitle>
              <p className="text-[10px] text-slate-500 font-medium">Browse results, score margins, accuracy levels, and details for previous exam submissions.</p>
            </CardHeader>
            <CardContent className="p-0">
              {recentResults.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-5">
                  {/* Empty state illustration */}
                  <div className="relative">
                    <svg width="72" height="72" viewBox="0 0 72 72" className="opacity-80">
                      <rect x="10" y="12" width="52" height="48" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                      <line x1="18" y1="26" x2="54" y2="26" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                      <line x1="18" y1="34" x2="46" y2="34" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                      <line x1="18" y1="42" x2="50" y2="42" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="55" cy="50" r="12" fill="#4F46E5" opacity="0.15" />
                      <text x="55" y="54" textAnchor="middle" className="text-[14px] font-black fill-[#4F46E5]">?</text>
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-slate-700">No assessment history yet</p>
                    <p className="text-xs text-slate-500 max-w-xs">Complete your first mock test to see detailed results, scores, and analysis here.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => document.getElementById("tests-section")?.scrollIntoView({ behavior: "smooth" })}
                      className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold h-9 px-5 rounded-xl shadow-md shadow-indigo-500/15 active:scale-[0.97] transition-all"
                    >
                      Start First Test
                    </Button>
                    <Button
                      onClick={() => window.location.href = "/student/tests"}
                      variant="outline"
                      className="text-xs font-bold h-9 px-5 rounded-xl border-slate-200 hover:border-[#4F46E5]/30"
                    >
                      Browse Mock Tests
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="border-b border-slate-100">
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-6 py-3.5">Exam Name</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center">Score</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center">Accuracy</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5 text-center">Outcome</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3.5">Submission Date</TableHead>
                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pr-6 py-3.5 text-right">Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentResults.map((res) => (
                        <TableRow key={res.attemptId} className="border-b border-slate-100 hover:bg-slate-50/20 transition-all duration-150">
                          <TableCell className="font-semibold text-slate-800 py-3.5 pl-6 max-w-[180px] truncate">
                            {res.testName}
                          </TableCell>
                          <TableCell className="text-center font-bold text-slate-700 py-3.5">
                            {res.score} / {res.totalMarks}
                          </TableCell>
                          <TableCell className="text-center py-3.5">
                            <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                              {res.percentage}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center py-3.5">
                            {res.passed ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" /> Pass
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                                <XCircle className="h-3 w-3 text-rose-500 shrink-0" /> Fail
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-[11px] text-slate-500 py-3.5">{res.completedAt}</TableCell>
                          <TableCell className="py-3.5 pr-6 text-right">
                            <Button
                              onClick={() => window.location.href = `/student/results/${res.attemptId}`}
                              variant="outline"
                              size="sm"
                              className="h-7 text-[10px] font-bold border-slate-200 hover:bg-slate-50 hover:text-[#4F46E5] rounded-lg px-2.5 transition-all"
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT COLUMN - 30% (Cols 8-10) 
            ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3 space-y-4">

          {/* ══ 10A. STUDENT PROFILE SUMMARY ══ */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                {/* Avatar with initials */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center shadow-md shrink-0">
                  <span className="text-white text-base font-black">
                    {studentName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  <strong className="text-sm font-black text-slate-800 block truncate">{studentName}</strong>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    <Calendar className="w-3 h-3 inline mr-0.5 text-slate-400" />
                    {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Profile completion */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-500">Profile Completion</span>
                  <span className="text-[#4F46E5]">{profileCompletionPct}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletionPct}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Tests</span>
                  <strong className="text-sm font-black text-slate-800 block">{completedCount}</strong>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Rank</span>
                  <strong className="text-sm font-black text-slate-800 block">#{studentRankOnLeaderboard}</strong>
                </div>
                <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Streak</span>
                  <strong className="text-sm font-black text-slate-800 block">{currentStreak}d</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ══ DAILY GOAL WIDGET ══ (stays permanently open) */}
          <Card className="border border-slate-100 shadow-xs bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#4F46E5]" /> Today&apos;s Goal
                </span>
                <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {completedToday}/{goalTarget}
                </span>
              </div>

              <div className="space-y-1">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] rounded-full transition-all duration-300"
                    style={{ width: `${goalProgressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-400 pt-0.5">
                  <span>{goalProgressPct}%</span>
                  <span>Target: {goalTarget} tests</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {completedToday >= goalTarget 
                  ? "🎉 Amazing! Daily objectives complete!"
                  : `Solve ${goalTarget - completedToday} more test${goalTarget - completedToday > 1 ? "s" : ""} today!`}
              </p>
            </CardContent>
          </Card>

          {/* ══ 10B. RECENT ACTIVITY FEED ══ */}
          <AccordionWidget
            title="Recent Activity"
            icon={Activity}
            iconColor="text-sky-500"
            borderColor="#0ea5e9"
            badgeText={`${recentActivity.length} events`}
            defaultOpen={true}
          >
            {recentActivity.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center font-medium py-2">No recent activity.</p>
            ) : (
              <div className="space-y-2.5">
                {recentActivity.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 group/act">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.passed ? "bg-emerald-400" : "bg-rose-400"}`} />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-700 truncate">{act.testName}</span>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">{act.timeLabel}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {act.score}/{act.totalMarks} Marks · {act.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionWidget>

          {/* ══ 10C. ACHIEVEMENTS ══ */}
          <AccordionWidget
            title="Achievements"
            icon={Trophy}
            iconColor="text-amber-500"
            borderColor="#f59e0b"
            badgeText={`${achievements.filter(a => a.achieved).length}/${achievements.length}`}
            defaultOpen={true}
          >
            <div className="space-y-2">
              {achievements.map((ach, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                    ach.achieved
                      ? "bg-amber-50/50 border-amber-100"
                      : "bg-slate-50/50 border-slate-100 opacity-50"
                  }`}
                >
                  <span className="text-base">{ach.emoji}</span>
                  <span className={`text-xs font-bold ${ach.achieved ? "text-slate-700" : "text-slate-400"}`}>
                    {ach.label}
                  </span>
                  {ach.achieved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />}
                </div>
              ))}
            </div>
          </AccordionWidget>

          {/* ══ 6. ACCORDION SIDEBAR WIDGETS ══ */}

          {/* WEAK SUBJECTS */}
          <AccordionWidget
            title="Improvement Areas"
            icon={AlertCircle}
            iconColor="text-rose-500"
            borderColor="#f43f5e"
            badgeText={`${weakSubjects.length} subjects`}
            defaultOpen={false}
          >
            {weakSubjects.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center font-medium py-2">No weak subjects detected. Exceptional accuracy!</p>
            ) : (
              <div className="space-y-3">
                {weakSubjects.slice(0, 4).map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-700 block">{sub.subject}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 rounded-full" style={{ width: `${sub.accuracy}%` }} />
                        </div>
                        <span className="text-[10px] text-rose-600 font-bold">{sub.accuracy}%</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const matchingId = subjects.find(s => s.name.toLowerCase() === sub.subject.toLowerCase())?.id;
                        if (matchingId) {
                          setSubjectFilter(matchingId);
                        } else {
                          setSearch(sub.subject);
                        }
                        document.getElementById("tests-section")?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="h-6 text-[9px] font-bold bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 px-2 rounded-lg active:scale-[0.98] transition-all"
                    >
                      Practice
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </AccordionWidget>

          {/* STRONG SUBJECTS */}
          <AccordionWidget
            title="Mastered Subjects"
            icon={CheckCircle2}
            iconColor="text-emerald-500"
            borderColor="#10b981"
            badgeText={`${strongSubjects.length} subjects`}
            defaultOpen={false}
          >
            {strongSubjects.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center font-medium py-2">No strong subjects mapped yet. Attempt more mock tests.</p>
            ) : (
              <div className="space-y-3">
                {strongSubjects.slice(0, 4).map((sub, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-700 block">{sub.subject}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${sub.accuracy}%` }} />
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold">{sub.accuracy}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-yellow-400">
                      {Array.from({ length: sub.accuracy >= 85 ? 3 : sub.accuracy >= 70 ? 2 : 1 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionWidget>

          {/* LEADERBOARD */}
          <AccordionWidget
            title="Leaderboard"
            icon={PrizeIcon}
            iconColor="text-indigo-500"
            borderColor="#6366f1"
            badgeText={`#${studentRankOnLeaderboard}`}
            defaultOpen={false}
          >
            <div className="space-y-2">
              {leaderboardPreview.map((user, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center px-2.5 py-1.5 rounded-xl border transition-all ${
                    user.isStudent 
                      ? "bg-[#4F46E5]/10 border-[#4F46E5]/25 shadow-xs font-extrabold" 
                      : "bg-white border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      idx === 0 
                        ? "bg-yellow-100 text-yellow-700" 
                        : idx === 1 
                        ? "bg-slate-100 text-slate-700" 
                        : idx === 2 && !user.isStudent
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-slate-50 text-slate-500"
                    }`}>
                      {user.rank}
                    </span>
                    <span className="text-[11px] text-slate-700 font-bold truncate max-w-[110px]">
                      {user.name} {user.isStudent && " (You)"}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black ${user.isStudent ? "text-[#4F46E5]" : "text-slate-500"}`}>
                    {user.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </AccordionWidget>

          {/* UPCOMING EXAMS */}
          <AccordionWidget
            title="Upcoming Mocks"
            icon={Calendar}
            iconColor="text-indigo-500"
            borderColor="#818cf8"
            badgeText={`${upcomingTests.length} scheduled`}
            defaultOpen={false}
          >
            {upcomingTests.length === 0 ? (
              <p className="text-[10px] text-slate-500 text-center font-medium py-2">No upcoming exams scheduled.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                    <div className="space-y-0.5">
                      <strong className="text-[11px] text-slate-700 block truncate">{test.title}</strong>
                      <span className="text-[9px] font-bold text-slate-400 block">{test.formattedStartDate}</span>
                    </div>
                    <Button
                      disabled
                      className="w-full h-6 text-[9px] font-black bg-slate-100 border border-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
                    >
                      Countdown Active
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </AccordionWidget>

          {/* ══ 9. MOTIVATION BANNER — More Engaging ══ */}
          <div className="bg-gradient-to-br from-indigo-950 to-indigo-900 border border-indigo-800/50 text-indigo-100 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="space-y-3 relative z-10">
              <span className="text-[10px] font-black text-yellow-300 uppercase tracking-widest flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-yellow-300 stroke-yellow-300 animate-pulse" /> Keep Going!
              </span>
              <p className="text-sm font-bold leading-relaxed text-indigo-50">
                🔥 Only <span className="text-yellow-300 font-black">{marksForNinety}%</span> away from 90th percentile.
              </p>

              {/* Progress to milestone */}
              <div className="space-y-1">
                <div className="h-2 w-full bg-indigo-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (avgAccuracyPct / 90) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-indigo-400 font-bold">
                  <span>You: {avgAccuracyPct}%</span>
                  <span>Target: 90%</span>
                </div>
              </div>

              <span className="text-[9px] text-indigo-400 block font-bold">
                Practice: {weakSubjects[0]?.subject || "Mock Tests"}
              </span>
              <Button
                onClick={() => document.getElementById("tests-section")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold h-7 px-4 rounded-lg border border-white/20 active:scale-[0.97] transition-all"
              >
                <Zap className="mr-1 w-3 h-3" /> Practice Now
              </Button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
