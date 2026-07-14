"use client";
/* eslint-disable react-hooks/immutability */

import { useState, useEffect } from "react";
import { 
  Clock, AlertTriangle, Play, Loader2, ArrowRight, Check,
  ChevronRight, Award, CheckCircle, ShieldAlert, Monitor, Keyboard,
  User, Info, FileText
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  negativeMarking: number;
  instructions: string | null;
  allowMultipleAttempts: boolean;
  allowResume: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  showAnswersAfterSubmission: boolean;
  startDate: string | null;
  endDate: string | null;
  subject?: Subject;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    questions: number;
  };
}

interface StudentTestInstructionsClientProps {
  testId: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
}

export function StudentTestInstructionsClient({ testId, user }: StudentTestInstructionsClientProps) {
  const [test, setTest] = useState<Test | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [canStart, setCanStart] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [agreedInstructions, setAgreedInstructions] = useState(false);
  const [agreedUnfair, setAgreedUnfair] = useState(false);
  const [starting, setStarting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchEligibility();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  const fetchEligibility = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/attempt?testId=${testId}`);
      if (!res.ok) {
        throw new Error("Failed to load test parameters");
      }
      const data = await res.json();
      setTest(data.test);
      setActiveAttemptId(data.activeAttemptId);
      setCompletedCount(data.completedCount);
      setCanStart(data.canStart);
      setEligibilityError(data.eligibilityError);
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message || "Failed to load exam details" });
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!agreedInstructions || !agreedUnfair) return;
    if (!canStart && !activeAttemptId) return;

    try {
      setStarting(true);
      const res = await fetch("/api/student/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to initiate attempt");
      }

      setToastMsg({
        type: "success",
        text: activeAttemptId ? "Resuming ongoing attempt..." : "Attempt initiated successfully"
      });

      // Redirect to dynamic CBT exam engine path
      setTimeout(() => {
        window.location.href = `/student/exam/${data.attemptId}`;
      }, 1000);
    } catch (err: any) {
      setToastMsg({ type: "error", text: err.message });
      setStarting(false);
    }
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "PRACTICE_QUIZ": return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/20 text-[10px] font-black rounded-md">Practice Quiz</Badge>;
      case "MOCK_TEST": return <Badge variant="outline" className="border-sky-200 text-sky-700 bg-sky-50/20 text-[10px] font-black rounded-md">Mock Test</Badge>;
      case "SECTIONAL_TEST": return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50/20 text-[10px] font-black rounded-md">Sectional Test</Badge>;
      case "PREVIOUS_YEAR_PAPER": return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/20 text-[10px] font-black rounded-md">PY Paper</Badge>;
      case "DAILY_QUIZ": return <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/20 text-[10px] font-black rounded-md">Daily Quiz</Badge>;
      default: return <Badge variant="secondary" className="text-[10px] font-black rounded-md">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 xl:px-12 py-10 space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="h-6 w-96 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-[220px] bg-slate-200 rounded-xl" />
            <div className="h-[300px] bg-slate-200 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-[260px] bg-slate-200 rounded-xl" />
            <div className="h-[180px] bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <Card className="border-red-150 bg-red-50/20 text-red-800 p-8 text-center max-w-md mx-auto mt-12 rounded-xl">
        <AlertTriangle className="h-8 w-8 text-red-650 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 mb-1">Exam Not Found</h3>
        <p className="text-xs">The requested examination does not exist or has been deleted.</p>
        <Button onClick={() => window.location.href = "/student/dashboard"} className="mt-4 bg-slate-800 text-white cursor-pointer rounded-xl">
          Back to Dashboard
        </Button>
      </Card>
    );
  }

  // Calculate difficulty & language dynamically
  const difficulty = test.title.toLowerCase().includes("hard") || test.title.toLowerCase().includes("advanced") ? "HARD" : test.title.toLowerCase().includes("easy") || test.title.toLowerCase().includes("basic") ? "EASY" : "MEDIUM";
  const language = test.title.toLowerCase().includes("hindi") ? "Hindi" : "English";

  // Student variables
  const studentName = user?.name || "Student Candidate";
  const studentEmail = user?.email || "student@rciportal.com";
  const rollNumber = user?.id ? `RCI-ST-${user.id.slice(-8).toUpperCase()}` : "RCI-ST-GUEST";

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 xl:px-12 py-6 space-y-6 font-sans">
      
      {/* Toast banners */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border border-slate-150 bg-white max-w-sm flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
          {toastMsg.type === "success" ? (
            <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
          )}
          <span className="text-xs font-semibold text-slate-700">{toastMsg.text}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
        <Link href="/student/dashboard" className="hover:text-[#4F46E5] transition-colors">Dashboard</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/student/tests" className="hover:text-[#4F46E5] transition-colors">Browse Tests</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-650 truncate max-w-[240px]">{test.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ==========================================
            LEFT COLUMN (70%) - INSTRUCTIONS & DETAILS
            ========================================== */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Large Exam Details Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {renderTypeBadge(test.type)}
                    <Badge variant="secondary" className={`text-[9.5px] font-black rounded-md ${
                      difficulty === "HARD" ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      difficulty === "EASY" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                      "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}>
                      {difficulty}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-snug">{test.title}</h2>
                  <p className="text-xs text-slate-450 font-medium">
                    Please read the instructions on this dashboard before initiating the mock exam engine.
                  </p>
                </div>
              </div>

              {/* Grid representation of the 14 attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exam Name</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{test.title}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{test.subject?.name || "General"}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{test.category?.name || "General"}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Exam Type</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{test.type.replace(/_/g, " ")}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Difficulty</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{difficulty}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Language</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{language}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                  <strong className="text-[#4F46E5] block font-black mt-0.5">{test.duration} Minutes</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Questions</span>
                  <strong className="text-[#4F46E5] block font-black mt-0.5">{test._count?.questions || 20} Qs</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Maximum Marks</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5">{test.totalMarks} Marks</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Negative Marking</span>
                  <strong className="text-rose-600 block font-extrabold mt-0.5">-{test.negativeMarking} Marks</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Passing Marks</span>
                  <strong className="text-emerald-600 block font-extrabold mt-0.5">{test.passMarks} Marks</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attempts Allowed</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{test.allowMultipleAttempts ? "Multiple attempts" : "Single attempt"}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Created By</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5">RCI Exam Board</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150/70 col-span-1 sm:col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Last Updated</span>
                  <strong className="text-slate-700 block font-extrabold mt-0.5 truncate">{new Date(test.updatedAt).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Important Instructions */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#4F46E5]" /> Important CBT Instructions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">1</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>Read every question carefully</strong> and verify statements before committing to your option response.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">2</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>The countdown timer cannot be paused</strong>. Closing the window or disconnecting does not pause your timer.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">3</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>Do not refresh the browser</strong> or hit the back button. It may result in instant session termination.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">4</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>Auto-save system is active</strong>. Selected choices are backed up on server nodes instantly upon navigation.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">5</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>Network interruption recovery</strong> is enabled. In case of disconnection, re-login will resume questions.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">6</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>The test automatically submits</strong> on behalf of the candidate the second the allotted timer expires.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">7</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      <strong>Fullscreen window mode is recommended</strong>. Toggling tabs or browsers may flag suspicious logs.
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center font-bold text-[10px]">8</span>
                    <p className="text-slate-650 leading-relaxed pt-0.5">
                      Ensure a stable broadband / mobile network to prevent loss of visual dynamic graphs or images.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 3: Keyboard Shortcuts */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-5 space-y-3.5">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-[#4F46E5]" /> CBT Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-lg">
                  <kbd className="px-2 py-0.5 rounded bg-white border border-slate-250 shadow-xs text-[10px] font-bold text-slate-800 font-mono">Alt+N</kbd>
                  <span className="text-[11px] font-bold text-slate-600">Save & Next</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-lg">
                  <kbd className="px-2 py-0.5 rounded bg-white border border-slate-250 shadow-xs text-[10px] font-bold text-slate-800 font-mono">Alt+P</kbd>
                  <span className="text-[11px] font-bold text-slate-600">Previous</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-lg">
                  <kbd className="px-2 py-0.5 rounded bg-white border border-slate-250 shadow-xs text-[10px] font-bold text-slate-800 font-mono">Alt+M</kbd>
                  <span className="text-[11px] font-bold text-slate-600">Mark Review</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-2.5 rounded-lg">
                  <kbd className="px-2 py-0.5 rounded bg-white border border-slate-250 shadow-xs text-[10px] font-bold text-slate-800 font-mono">Alt+C</kbd>
                  <span className="text-[11px] font-bold text-slate-600">Clear Answer</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 4: Question Palette Legend */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-5 space-y-3.5">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#4F46E5]" /> Question Palette Legend
              </h3>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 py-1.5 px-2.5 rounded-lg">
                  <span className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm">2</span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 py-1.5 px-2.5 rounded-lg">
                  <span className="w-6 h-6 rounded-md bg-rose-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm">4</span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 py-1.5 px-2.5 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm">7</span>
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 py-1.5 px-2.5 rounded-lg">
                  <div className="relative w-6 h-6">
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-black shadow-sm">9</span>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-[6px] text-white font-extrabold">✓</span>
                  </div>
                  <span>Answered & Marked</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 py-1.5 px-2.5 rounded-lg">
                  <span className="w-6 h-6 rounded-md bg-slate-150 text-slate-600 flex items-center justify-center text-[10px] font-black shadow-sm">1</span>
                  <span>Not Visited</span>
                </div>
              </div>
            </div>
          </Card>

        </div>

        {/* ==========================================
            RIGHT SIDEBAR (30%) - STATUS & VALIDATIONS
            ========================================== */}
        <div className="space-y-6 lg:sticky lg:top-4">
          
          {/* Card A: Candidate Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-4 space-y-3.5">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#4F46E5]" /> Candidate Identity
              </h3>
              
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-150 p-3.5 rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-indigo-50 border-2 border-indigo-200/50 flex items-center justify-center text-[#4F46E5] font-black text-xl shadow-xs overflow-hidden shrink-0">
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={studentName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{studentName.split(" ").map(n => n[0]).join("").toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h4 className="text-xs font-black text-slate-800 truncate">{studentName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold truncate">{studentEmail}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[8px] bg-indigo-50 text-[#4F46E5] border border-indigo-100 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                      Roll: {rollNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card B: Exam Summary Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-4 space-y-3">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Award className="w-4 h-4 text-[#4F46E5]" /> Exam Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-450 font-semibold">Total Questions</span>
                  <span className="font-extrabold text-slate-700">{test._count?.questions || 20} Qs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-450 font-semibold">Maximum Marks</span>
                  <span className="font-extrabold text-slate-700">{test.totalMarks} Marks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-455 font-semibold">Exam Duration</span>
                  <span className="font-extrabold text-slate-700">{test.duration} Minutes</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-455 font-semibold">Negative marking</span>
                  <span className="font-extrabold text-rose-600">-{test.negativeMarking} Marks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-455 font-semibold">Passing Marks</span>
                  <span className="font-extrabold text-emerald-600">{test.passMarks} Marks</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-455 font-semibold">Question Language</span>
                  <span className="font-extrabold text-slate-700">{language}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-455 font-semibold">Completed Attempts</span>
                  <span className="font-extrabold text-slate-700">{completedCount} Attempts</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-455 font-semibold">Difficulty Level</span>
                  <span className="font-extrabold text-slate-700">{difficulty}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card C: System Compatibility Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-4 space-y-3.5">
              <div className="space-y-2.5 text-xs text-slate-650 bg-emerald-50/20 border border-emerald-100/60 p-3.5 rounded-xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Monitor className="w-3.5 h-3.5 text-emerald-600" /> System Compatibility Check
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50 shrink-0" />
                    <span>Chrome / Firefox</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50 shrink-0" />
                    <span>Stable Internet</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50 shrink-0" />
                    <span>Resolution 1366+</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50 shrink-0" />
                    <span>Cookies Enabled</span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 border-t border-emerald-100/30 pt-1.5 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-50 shrink-0" />
                    <span>Popup Blocker Disabled</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card D: Declaration Card */}
          <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
            <div className="p-4 space-y-4">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> Self Declaration
              </h3>

              {/* Eligibility errors banner */}
              {eligibilityError && !activeAttemptId ? (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>{eligibilityError}</span>
                </div>
              ) : activeAttemptId ? (
                /* Resume Attempt Notice banner */
                <div className="p-3 bg-amber-50 border border-amber-150 text-amber-800 text-[11px] font-semibold rounded-xl flex items-center gap-2">
                  <Clock className="h-4.5 w-4.5 text-amber-600 shrink-0 animate-pulse" />
                  <span>You have an unfinished attempt. Ticking checkboxes resumes it.</span>
                </div>
              ) : null}

              {/* Declaration Checkboxes */}
              <div className="space-y-3 text-xs pt-1">
                <label className="flex items-start gap-2.5 font-semibold text-slate-600 cursor-pointer select-none leading-relaxed">
                  <input
                    type="checkbox"
                    checked={agreedInstructions}
                    onChange={(e) => setAgreedInstructions(e.target.checked)}
                    className="rounded border-slate-350 text-indigo-600 h-4 w-4 mt-0.5 shrink-0 cursor-pointer"
                  />
                  <span>I have read all guidelines, negative markings rules, and exam timing details.</span>
                </label>

                <label className="flex items-start gap-2.5 font-semibold text-slate-600 cursor-pointer select-none leading-relaxed">
                  <input
                    type="checkbox"
                    checked={agreedUnfair}
                    onChange={(e) => setAgreedUnfair(e.target.checked)}
                    className="rounded border-slate-350 text-indigo-600 h-4 w-4 mt-0.5 shrink-0 cursor-pointer"
                  />
                  <span>I agree not to use unfair means, calculators, or browse other tabs during CBT.</span>
                </label>
              </div>

              {/* Bottom Actions inside Declaration Card */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {activeAttemptId ? (
                  <Button
                    onClick={handleStartExam}
                    disabled={!agreedInstructions || !agreedUnfair || starting}
                    className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold h-10 shadow-sm text-xs rounded-xl cursor-pointer transition-all"
                  >
                    {starting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Play className="mr-1.5 h-3.5 w-3.5 fill-white" /> Resume Mock Test <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartExam}
                    disabled={!canStart || !agreedInstructions || !agreedUnfair || starting}
                    className="w-full bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-slate-100 disabled:text-slate-400 text-white font-extrabold h-10 shadow-sm text-xs rounded-xl cursor-pointer transition-all"
                  >
                    {starting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Start Real Mock Test <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => window.location.href = "/student/tests"}
                  className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 font-bold h-9 text-xs rounded-xl cursor-pointer"
                >
                  Back to Browse Tests
                </Button>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
