"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Target, Users, Clock, Star, ArrowRight,
  ChevronRight, Trophy, Zap, Search, ShieldCheck, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── Static Data ────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Home", href: "#" },
  { label: "Mock Tests", href: "#mock-tests" },
  { label: "Practice", href: "#categories" },
  { label: "Results", href: "#reviews" },
];

const EXAM_TAGS = [
  { label: "SSC CGL", color: "bg-indigo-50 text-indigo-700 border-indigo-100", dot: "bg-indigo-500" },
  { label: "Bank PO", color: "bg-sky-50 text-sky-700 border-sky-100", dot: "bg-sky-500" },
  { label: "Railway NTPC", color: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-500" },
  { label: "UP Police", color: "bg-rose-50 text-rose-700 border-rose-100", dot: "bg-rose-500" },
  { label: "UPSSSC PET", color: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
];

const STATS = [
  { label: "Practice Questions", value: "10,000+", icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-100", border: "border-indigo-100" },
  { label: "Mock Tests Available", value: "800+", icon: Target, color: "text-violet-600", bg: "bg-violet-50 border-violet-100", border: "border-violet-100" },
  { label: "Enrolled Students", value: "5,000+", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100", border: "border-emerald-100" },
];

const MOCK_TESTS = [
  {
    title: "SSC CGL Full Mock Test - 12",
    category: "SSC CGL",
    duration: "60 Min",
    questions: 100,
    marks: 200,
    difficulty: "Medium",
    attempts: "2.4k",
    rating: 4.8,
    lastUpdated: "Updated 2 days ago",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100",
    diffColor: "text-amber-700 bg-amber-50 border-amber-100",
  },
  {
    title: "SBI PO Quantitative Aptitude",
    category: "Banking",
    duration: "45 Min",
    questions: 35,
    marks: 35,
    difficulty: "Hard",
    attempts: "1.8k",
    rating: 4.9,
    lastUpdated: "Updated 1 day ago",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-100",
    diffColor: "text-rose-750 bg-rose-50 border-rose-100",
  },
  {
    title: "RRB NTPC CBT-1 Past Paper",
    category: "Railway",
    duration: "90 Min",
    questions: 100,
    marks: 100,
    difficulty: "Easy",
    attempts: "3.1k",
    rating: 4.7,
    lastUpdated: "Updated 1 week ago",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-100",
    diffColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    title: "UP Police Constable Mock - 05",
    category: "UP Police",
    duration: "120 Min",
    questions: 150,
    marks: 300,
    difficulty: "Medium",
    attempts: "980",
    rating: 4.6,
    lastUpdated: "Updated 3 days ago",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-100",
    diffColor: "text-amber-700 bg-amber-50 border-amber-100",
  },
];

const POPULAR_CATEGORIES = [
  { name: "English Language", icon: "📖", tests: 120, hoverColor: "hover:border-indigo-400 group-hover:text-indigo-600", bgLight: "bg-indigo-50/50" },
  { name: "Quantitative Aptitude", icon: "📐", tests: 95, hoverColor: "hover:border-violet-400 group-hover:text-violet-600", bgLight: "bg-violet-50/50" },
  { name: "Logical Reasoning", icon: "🧩", tests: 110, hoverColor: "hover:border-sky-400 group-hover:text-sky-600", bgLight: "bg-sky-50/50" },
  { name: "General Knowledge", icon: "🌍", tests: 80, hoverColor: "hover:border-emerald-400 group-hover:text-emerald-600", bgLight: "bg-emerald-50/50" },
  { name: "Computer Awareness", icon: "💻", tests: 60, hoverColor: "hover:border-rose-400 group-hover:text-rose-600", bgLight: "bg-rose-50/50" },
];

const REVIEWS = [
  { name: "Rohit Sharma", exam: "SSC CGL 2024 Cleared", text: "RCI Portal ke mock tests ne mujhe real exam jaisa environment diya. Analytics aur answer keys bohot helpful thhi.", rating: 5, initials: "RS" },
  { name: "Priya Verma", exam: "SBI PO 2024 Cleared", text: "Section-wise practice sets are mind-blowing. Performance metric graphs pinpointed my errors.", rating: 5, initials: "PV" },
  { name: "Amit Kumar", exam: "RRB NTPC 2024 Cleared", text: "Best platform for government mock papers. Timer controls and auto-submits are perfectly synchronous.", rating: 5, initials: "AK" },
];

/* ─── CBT Simulation Mockup ────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full h-[360px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <div className="flex items-center gap-1 text-[10px] text-rose-400 font-black">
          <Clock className="w-3 h-3 animate-pulse" />
          <span className="tabular-nums">44:32</span>
        </div>
        <div className="text-[10px] text-slate-400 font-bold">RCI Mock CBT Console</div>
      </div>

      {/* Workspace Area */}
      <div className="flex h-[calc(100%-38px)]">
        {/* Left Sheet */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden flex flex-col justify-between">
          <div className="space-y-3">
            <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
              <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider block mb-1">Section 1: General English</span>
              <p className="text-[11px] text-slate-200 leading-relaxed font-semibold">
                Choose the word most similar in meaning to <strong className="text-amber-400 font-black">&quot;PRAGMATIC&quot;</strong>:
              </p>
            </div>

            {/* Options list */}
            <div className="space-y-2">
              {[
                { key: "A", val: "Idealistic", sel: false },
                { key: "B", val: "Practical", sel: true },
                { key: "C", val: "Vague", sel: false },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl border text-[10px] font-bold transition-all",
                    opt.sel
                      ? "bg-indigo-950/40 border-indigo-500 text-indigo-200"
                      : "bg-slate-950/20 border-slate-800 text-slate-400"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center font-black text-[9px]",
                    opt.sel ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"
                  )}>
                    {opt.key}
                  </span>
                  <span>{opt.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-slate-800 rounded-lg text-[9px] text-slate-400 font-black flex items-center justify-center">Prev</div>
            <div className="flex-1 h-8 bg-[#4F46E5] rounded-lg text-[9px] text-white font-black flex items-center justify-center">Save & Next</div>
          </div>
        </div>

        {/* Right Palette */}
        <div className="w-24 bg-slate-950 border-l border-slate-800 p-2 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block text-center">Navigator</span>
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-6 w-6 rounded-md text-[8px] font-black flex items-center justify-center",
                    i < 4 ? "bg-emerald-600 text-white" : i === 4 ? "bg-indigo-600 text-white ring-1 ring-indigo-400" : "bg-slate-800 text-slate-450"
                  )}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          <div className="h-7 bg-rose-600 rounded-lg text-[9px] text-white font-black flex items-center justify-center cursor-pointer">
            Submit Test
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState("Home");
  const [currentSlide, setCurrentSlide] = useState(0);

  // Testimonial Carousel Auto-run
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % REVIEWS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans antialiased">
      {/* ── Sticky Navbar ────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-155 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/30">
              RCI
            </div>
            <span className="font-extrabold text-slate-800 text-base tracking-tight">Exam Portal</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 relative">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setActiveNav(link.label)}
                className={cn(
                  "relative px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                  activeNav === link.label ? "text-[#4F46E5]" : "text-slate-655 hover:text-[#4F46E5] hover:bg-slate-50"
                )}
              >
                {link.label}
                {activeNav === link.label && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#4F46E5] rounded-full transition-all" />
                )}
              </a>
            ))}
          </div>

          {/* Search bar mockup & CTA */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden lg:flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search tests..." className="bg-transparent border-none text-xs outline-none w-36 text-slate-700 font-semibold" disabled />
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/login">
                <Button variant="ghost" className="h-9 px-4 text-sm font-extrabold text-slate-600 hover:text-[#4F46E5] hover:bg-slate-50 rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="h-9 px-5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-sm font-extrabold rounded-xl shadow-md shadow-indigo-500/20 active:scale-[0.97] transition-all">
                  Register Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Balanced & Clean) ─────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Heading & CTAs */}
        <div className="lg:col-span-6 space-y-8">
          <div className="flex flex-wrap gap-2">
            {EXAM_TAGS.map((tag) => (
              <span key={tag.label} className={cn("inline-flex items-center gap-1.5 text-[11px] font-black px-3.5 py-1 rounded-full border shadow-sm", tag.color)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", tag.dot)} />
                {tag.label}
              </span>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 w-fit">
              <div className="flex text-amber-400">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
              </div>
              <span className="text-[11px] font-extrabold text-amber-800">Trusted by 5,000+ Students</span>
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
            </div>

            <h1 className="text-4xl sm:text-[48px] font-black text-slate-900 leading-[1.08] tracking-tight">
              Prepare Smarter.<br />
              <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                Achieve Higher.
              </span>
            </h1>
            <p className="text-slate-500 text-[15px] leading-relaxed max-w-md">
              Simulate actual mock exams under simulated exam limits. Get real-time sectional timers, and comprehensive score analytics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3.5">
            <Link href="/login">
              <Button className="h-12 px-8 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold rounded-xl shadow-lg shadow-indigo-500/25 text-sm active:scale-[0.97] transition-all flex items-center gap-1.5">
                Start Practice Free <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#mock-tests">
              <Button variant="outline" className="h-12 px-8 border-slate-200 text-slate-700 font-extrabold rounded-xl hover:bg-slate-50 hover:border-slate-350 text-sm active:scale-[0.97] transition-all">
                Browse Tests
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-bold">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure platform</span>
            <span>•</span>
            <span>Official CBT pattern</span>
            <span>•</span>
            <span>Detailed answers</span>
          </div>
        </div>

        {/* Right Column: CBT Mockup Preview */}
        <div className="lg:col-span-6 sticky top-24">
          <div className="relative p-2.5 bg-white border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-200/80">
            <DashboardMockup />
            {/* Live indicator float */}
            <div className="absolute top-6 right-6 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1.5 rounded-full shadow-md shadow-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE PREVIEW
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Row ────────────────────────────────── */}
      <section className="bg-white border-y border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STATS.map((stat) => (
            <div key={stat.label} className={cn("flex items-center gap-5 p-6 rounded-2xl border shadow-sm cursor-default hover:shadow-md transition-shadow bg-slate-50/50", stat.border)}>
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 bg-[#4F46E5] shadow-md shadow-indigo-500/10">
                <stat.icon className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</div>
                <div className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wide">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Latest Mock Tests (Richer cards) ─────────── */}
      <section id="mock-tests" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest">Featured</span>
            <h2 className="text-2xl font-black text-slate-905 mt-1">Latest Mock Tests</h2>
            <p className="text-sm text-slate-500 mt-1">Attempt our most popular exam simulations</p>
          </div>
          <Link href="/login" className="text-sm font-extrabold text-[#4F46E5] hover:underline flex items-center gap-1 mb-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_TESTS.map((test) => (
            <div
              key={test.title}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Badge className={cn("text-[9px] font-black uppercase tracking-wider border-0 shadow-sm", test.badgeColor)}>
                    {test.category}
                  </Badge>
                  <span className="text-[9px] text-slate-400 font-bold">{test.lastUpdated}</span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm leading-snug mb-3 group-hover:text-[#4F46E5] transition-colors line-clamp-2">
                  {test.title}
                </h3>

                {/* Performance metadata */}
                <div className="flex items-center gap-2 mb-3.5">
                  <div className="flex text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < Math.floor(test.rating) ? "fill-current" : "text-slate-200 fill-slate-200")} />
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-slate-400">{test.rating} ({test.attempts} attempts)</span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={cn("text-[9px] font-black px-2.5 py-0.5 rounded-full border shadow-sm", test.diffColor)}>
                    {test.difficulty}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400">Sectional Cutoff</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3.5 text-[10px] text-slate-450 font-bold mb-4 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {test.duration}</span>
                  <span>{test.questions} Questions</span>
                  <span>{test.marks} Marks</span>
                </div>
                <Link href="/login">
                  <Button size="sm" className="w-full h-10 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] hover:from-[#4338CA] hover:to-[#4F46E5] text-white text-xs font-bold rounded-xl shadow-sm active:scale-[0.98] transition-all">
                    Attempt Test
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Popular Categories (Enhanced Hover) ──────── */}
      <section id="categories" className="bg-white border-y border-slate-100 py-16 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest">Topics</span>
            <h2 className="text-2xl font-black text-slate-905 mt-1">Popular Categories</h2>
            <p className="text-sm text-slate-500 mt-1">Practice by subject to target your weak areas</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                href="/login"
                className={cn(
                  "group bg-slate-50/50 border-2 border-slate-100 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-200 cursor-pointer block"
                )}
              >
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110 duration-200", cat.bgLight)}>
                  {cat.icon}
                </div>
                <div className="font-extrabold text-sm text-slate-800 group-hover:text-[#4F46E5] transition-colors">{cat.name}</div>
                <div className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> {cat.tests} Topic Tests
                </div>
                <div className="mt-4 flex items-center gap-1 text-[10px] text-[#4F46E5] font-black opacity-0 group-hover:opacity-100 transition-opacity">
                  Practice Now <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial Carousel ─────────────────────── */}
      <section id="reviews" className="max-w-7xl mx-auto px-6 py-16 scroll-mt-16">
        <div className="mb-10 text-center max-w-xl mx-auto space-y-2">
          <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest">Testimonials</span>
          <h2 className="text-3xl font-black text-slate-900">What Our Students Say</h2>
          <p className="text-sm text-slate-500">Real feedback from candidates who achieved success via RCI</p>
        </div>

        {/* Carousel Container */}
        <div className="max-w-3xl mx-auto relative bg-white border border-slate-200/60 rounded-3xl shadow-xl p-8 sm:p-12 min-h-[220px] flex flex-col justify-between overflow-hidden">
          <span className="absolute -top-6 -left-6 text-[150px] font-serif text-slate-100 pointer-events-none select-none leading-none">&ldquo;</span>
          <div className="relative z-10 transition-all duration-300">
            <p className="text-slate-650 text-base sm:text-lg leading-relaxed italic mb-8">
              &ldquo;{REVIEWS[currentSlide].text}&rdquo;
            </p>
            <div className="flex items-center gap-4 pt-5 border-t border-slate-100">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-sm font-black shadow-md shadow-indigo-500/20">
                {REVIEWS[currentSlide].initials}
              </div>
              <div>
                <div className="font-extrabold text-slate-800 text-sm">{REVIEWS[currentSlide].name}</div>
                <div className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mt-0.5">{REVIEWS[currentSlide].exam}</div>
              </div>
            </div>
          </div>

          {/* Nav Controls */}
          <div className="flex gap-2 justify-end mt-6">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % REVIEWS.length)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-1.5 mt-2">
            {REVIEWS.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentSlide ? "bg-[#4F46E5] w-4" : "bg-slate-200 w-1.5"
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Premium Footer ───────────────────────────── */}
      <footer className="bg-slate-950 text-slate-400 py-16 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white font-black text-sm">
                  RCI
                </div>
                <span className="font-extrabold text-slate-200 text-base">RCI Exam Portal</span>
              </div>
              <p className="text-sm leading-relaxed">
                India&apos;s leading platform for simulated CBT government mock examinations.
              </p>
              {/* Socials */}
              <div className="flex items-center gap-2.5">
                {[
                  { label: "Twitter", d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                  { label: "YouTube", d: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
                  { label: "LinkedIn", d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0h.003z" },
                ].map((s) => (
                  <a key={s.label} href="#" aria-label={s.label} className="h-8.5 w-8.5 rounded-lg bg-slate-900 hover:bg-[#4F46E5] flex items-center justify-center transition-all group border border-slate-900 hover:border-indigo-500/20">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-slate-500 group-hover:fill-white transition-colors" xmlns="http://www.w3.org/2000/svg">
                      <path d={s.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Exam Links */}
            <div>
              <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest mb-4">Exam Prep</h4>
              <ul className="space-y-2 text-sm">
                {["SSC CGL Prep", "SBI PO Series", "RRB NTPC CBT", "UP Police constable", "UPSSSC PET Paper"].map(e => (
                  <li key={e}><Link href="/login" className="hover:text-white transition-colors">{e}</Link></li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-widest mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                {["Mock Exams", "Subject Practice", "Past Papers", "Leaderboard Rankings", "Student Reviews"].map(r => (
                  <li key={r}><a href="#" className="hover:text-white transition-colors">{r}</a></li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-extrabold text-[#F7F8FC] uppercase tracking-widest mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {["About Portal", "Privacy Policy", "Terms of Service", "Help Desk Contact", "Exam Guidelines"].map(c => (
                  <li key={c}><a href="#" className="hover:text-white transition-colors">{c}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <span>© {new Date().getFullYear()} RCI Examination System. All rights reserved.</span>
            <span>Made with ❤️ for Indian Civil Aspirants</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
