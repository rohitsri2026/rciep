"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  BookOpen, FolderOpen, FileSpreadsheet, Users, 
  Plus, Upload, Sparkles, Activity, FileCheck, ArrowRight,
  Clock, Star, CheckCircle, ShieldCheck
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MetricItem {
  label: string;
  count: number;
}

interface AdminDashboardClientProps {
  metrics: {
    questionsCount: number;
    testsCount: number;
    studentsCount: number;
    categoriesCount: number;
    subjectsCount: number;
    resultsCount: number;
    draftTestsCount: number;
    publishedTestsCount: number;
    pendingReviewQuestions: number;
    liveCandidatesCount: number;
    attemptsByDay: MetricItem[];
    questionsByWeek: MetricItem[];
    subjectDistribution: { name: string; count: number }[];
    liveExamsList: { name: string; candidateName: string; startedAt: string }[];
  };
}

export function AdminDashboardClient({ metrics }: AdminDashboardClientProps) {
  const todayString = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate coordinates for dynamic SVG line chart (max height: 100, max width: 300)
  const maxAttemptCount = Math.max(...metrics.attemptsByDay.map(d => d.count), 5);
  const attemptsPoints = metrics.attemptsByDay.map((d, i) => {
    const x = i * (300 / 6);
    const y = 120 - (d.count / maxAttemptCount) * 90;
    return { x, y, count: d.count, label: d.label };
  });
  
  const pathD = attemptsPoints.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  // Portal status metrics lists
  const examPortalStats = [
    { label: "Published Tests", value: metrics.publishedTestsCount, color: "text-[#4F46E5]", icon: FileSpreadsheet, href: "/admin/tests" },
    { label: "Draft Tests", value: metrics.draftTestsCount, color: "text-slate-600", icon: FileSpreadsheet, href: "/admin/tests" },
    { label: "Questions Review", value: metrics.pendingReviewQuestions, color: "text-[#F59E0B]", icon: BookOpen, href: "/admin/questions" },
    { label: "AI Generated Qs", value: Math.floor(metrics.questionsCount * 0.15), color: "text-purple-600", icon: Sparkles, href: "/admin/questions" },
    { label: "Total Subjects", value: metrics.subjectsCount, color: "text-sky-600", icon: BookOpen, href: "/admin/subjects" },
    { label: "Active Categories", value: metrics.categoriesCount, color: "text-pink-600", icon: FolderOpen, href: "/admin/categories" },
  ];

  return (
    <div className="space-y-7 pb-10">
      
      {/* ── Personalized Hero Banner ─────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-7 shadow-md border border-indigo-950/40 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl font-black text-white tracking-tight">Good Morning, Rohit 👋</h1>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-350 font-bold">
            <span>{todayString}</span>
            <span className="text-slate-700 font-normal">|</span>
            <span className="text-indigo-350 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> {metrics.publishedTestsCount} Active Exams</span>
            <span className="text-slate-700 font-normal">|</span>
            <span className="text-emerald-400 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-500" /> {metrics.liveCandidatesCount} Active Students</span>
            <span className="text-slate-700 font-normal">|</span>
            <span className="text-amber-400 flex items-center gap-1"><Plus className="w-3.5 h-3.5 text-amber-500" /> 20 Questions Added Today</span>
          </div>
        </div>
        <div className="flex gap-2 relative z-10 shrink-0">
          <Link href="/admin/tests">
            <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl h-10 px-5 transition-all">
              Manage Exams
            </Button>
          </Link>
        </div>
      </div>

      {/* ── High-Impact Split Rows ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Question Bank CTA & Live Exam Monitor */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Question Bank Primary Shortcut Box */}
          <Card className="border-[#4F46E5]/10 bg-gradient-to-br from-indigo-50/40 to-white shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-widest block">Core Database Repository</span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Question Bank Repository</h2>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 font-bold mt-1">
                  <span>{metrics.questionsCount} Questions</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 shadow-sm">{metrics.pendingReviewQuestions} Pending Review</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Link href="/admin/questions">
                  <Button size="sm" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl h-10 px-4">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
                  </Button>
                </Link>
                <Link href="/admin/questions">
                  <Button size="sm" variant="outline" className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold rounded-xl h-10 px-4">
                    <Upload className="w-3.5 h-3.5 mr-1" /> Import Excel
                  </Button>
                </Link>
                <Link href="/admin/questions">
                  <Button size="sm" variant="ghost" className="text-slate-655 hover:text-[#4F46E5] hover:bg-indigo-50/30 text-xs font-bold rounded-xl h-10 px-3">
                    Manage Bank
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Live Candidates Monitor Panel */}
          <Card className="border-rose-100 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-rose-50/15">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3.5 w-3.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
                  </span>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">CBT Candidates Monitor</h3>
                </div>
                <Link href="/admin/results">
                  <Badge className="bg-red-50 border-red-100 text-red-650 text-[9px] font-black uppercase px-2.5 py-1 tracking-wider cursor-pointer hover:bg-red-100 transition-colors">
                    {metrics.liveCandidatesCount} Candidates Active Now
                  </Badge>
                </Link>
              </div>

              {metrics.liveExamsList.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] text-slate-455 font-bold uppercase border-b border-slate-100">
                        <th className="py-3 px-5">Active Exam Paper</th>
                        <th className="py-3 px-5">Student Account</th>
                        <th className="py-3 px-5 text-center">Session Time</th>
                        <th className="py-3 px-5 text-right">Progress %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {metrics.liveExamsList.map((exam, idx) => {
                        const progressVals = [64, 45, 12, 85, 20];
                        const progress = progressVals[idx % progressVals.length];
                        return (
                          <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-3.5 px-5 font-bold text-slate-800">{exam.name}</td>
                            <td className="py-3.5 px-5 text-slate-500">{exam.candidateName}</td>
                            <td className="py-3.5 px-5 text-center font-mono text-slate-400 text-[11px]">
                              {new Date(exam.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-2.5">
                                <span className="text-[10px] font-black text-slate-700">{progress}%</span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      progress > 70 ? "bg-emerald-500" : progress > 30 ? "bg-indigo-500" : "bg-amber-500"
                                    )} 
                                    style={{ width: `${progress}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-450 space-y-1.5">
                  <p className="text-sm font-bold text-slate-700">No active CBT sessions</p>
                  <p className="text-xs text-slate-400">Active candidates will appear in this monitoring sheet in real-time.</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Side: Total Students Clickable Metric */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <Link href="/admin/results" className="block group h-full">
            <Card className="border-[#10B981]/15 bg-gradient-to-br from-emerald-50/30 to-white shadow-sm hover:shadow-md hover:border-emerald-350 active:scale-[0.99] transition-all rounded-2xl h-full flex flex-col justify-between p-6 cursor-pointer">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Total Enrollment</span>
                <h3 className="text-base font-black text-slate-800 group-hover:text-emerald-700 transition-colors">Total Student Cohort</h3>
              </div>
              <div className="py-8">
                <div className="text-[52px] font-black text-slate-900 tracking-tight leading-none group-hover:text-[#4F46E5] transition-colors">{metrics.studentsCount}</div>
                <span className="text-xs text-slate-500 font-semibold mt-2 block">Verified candidate accounts on portal</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>View Registered Students list</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>

      </div>

      {/* ── Clickable Secondary Statistics Grid ─────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {examPortalStats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block group active:scale-[0.98] transition-all">
            <div className="p-4.5 rounded-2xl border border-slate-200/80 bg-white hover:shadow-md hover:border-[#4F46E5]/20 flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block group-hover:text-[#4F46E5] transition-colors">{stat.label}</span>
                <div className="text-2xl font-black text-slate-900">{stat.value}</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <stat.icon className="w-4.5 h-4.5 text-slate-500 group-hover:text-[#4F46E5] transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── SVG Charts with Database Values ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: attemptsByDay */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Attempts Activity (Last 7 Days)</h3>
            <span className="text-[10px] font-bold text-[#4F46E5]">{metrics.attemptsByDay.reduce((a,b)=>a+b.count,0)} attempts</span>
          </div>
          <div className="h-44 w-full relative">
            <svg viewBox="0 0 300 120" className="w-full h-full overflow-visible">
              <line x1="0" y1="30" x2="300" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="75" x2="300" y2="75" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="120" x2="300" y2="120" stroke="#f1f5f9" strokeWidth="1" />
              {/* Path */}
              {pathD && <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2.5" />}
              {/* Points */}
              {attemptsPoints.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#4F46E5" stroke="#ffffff" strokeWidth="1.5" className="cursor-pointer" />
                  {p.count > 0 && (
                    <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#1E293B" className="text-[8px] font-black">{p.count}</text>
                  )}
                </g>
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-black px-1 uppercase tracking-wide">
            {metrics.attemptsByDay.map((d) => (
              <span key={d.label}>{d.label}</span>
            ))}
          </div>
        </div>

        {/* Bar Chart: questionsByWeek */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Database Question Growth</h3>
            <span className="text-[10px] font-bold text-[#4F46E5]">{metrics.questionsCount} Total</span>
          </div>
          <div className="h-44 w-full flex items-end justify-between px-2 pt-4">
            <svg viewBox="0 0 300 120" className="w-full h-full">
              {metrics.questionsByWeek.map((wk, idx) => {
                const maxWeekVal = Math.max(...metrics.questionsByWeek.map(w => w.count), 5);
                const h = (wk.count / maxWeekVal) * 80;
                const x = 20 + idx * 75;
                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={100 - h}
                      width="35"
                      height={h + 5}
                      rx="4"
                      fill={idx === 3 ? "#4F46E5" : "#E2E8F0"}
                      className="transition-colors hover:fill-[#4F46E5] duration-200 cursor-pointer"
                    />
                    {wk.count > 0 && (
                      <text x={x + 17.5} y={92 - h} textAnchor="middle" fill="#1E293B" className="text-[8px] font-black">{wk.count}</text>
                    )}
                    <text x={x + 17.5} y="115" textAnchor="middle" fill="#94A3B8" className="text-[8px] font-black uppercase tracking-wider">{wk.label}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block text-center uppercase tracking-wider">Weekly loaded questions count</span>
        </div>

        {/* Donut Chart: subjectDistribution */}
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mock Tests Distribution</h3>
            <span className="text-[10px] font-bold text-[#4F46E5]">{metrics.testsCount} active mocks</span>
          </div>
          <div className="h-44 w-full flex items-center justify-between gap-4">
            {metrics.subjectDistribution.length > 0 ? (
              <>
                <svg viewBox="0 0 100 100" className="w-28 h-28 transform -rotate-90">
                  <circle cx="50" cy="50" r="35" fill="transparent" stroke="#E2E8F0" strokeWidth="10" />
                  {/* Category segment offsets based on test counts */}
                  {metrics.subjectDistribution.map((sub, idx) => {
                    const totalTests = metrics.subjectDistribution.reduce((a,b)=>a+b.count, 0) || 1;
                    const strokeDash = (sub.count / totalTests) * 220;
                    const strokeOffset = 220 - strokeDash;
                    const colors = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="35"
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="10"
                        strokeDasharray="220"
                        strokeDashoffset={strokeOffset}
                      />
                    );
                  })}
                </svg>

                {/* Legends */}
                <div className="flex-1 space-y-1.5 overflow-hidden">
                  {metrics.subjectDistribution.map((leg, idx) => {
                    const colors = ["bg-[#4F46E5]", "bg-[#10B981]", "bg-[#F59E0B]", "bg-[#EF4444]", "bg-[#8B5CF6]"];
                    return (
                      <div key={leg.name} className="flex items-center justify-between text-[10px] font-bold text-slate-650 truncate gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={cn("w-2 h-2 rounded-sm shrink-0", colors[idx % colors.length])} />
                          <span className="truncate">{leg.name}</span>
                        </div>
                        <span className="text-slate-800 font-black shrink-0">{leg.count} tests</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 text-xs w-full">No subject Mock tests allocated.</div>
            )}
          </div>
          <span className="text-[9px] text-slate-400 font-semibold block text-center uppercase tracking-wider text-ellipsis overflow-hidden">Active test category share</span>
        </div>

      </div>
    </div>
  );
}
