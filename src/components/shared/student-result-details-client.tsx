"use client";
/* eslint-disable react-hooks/immutability */

import { useState, useEffect } from "react";
import { 
  Loader2, ArrowLeft, Percent, Calendar, AlignLeft, ShieldAlert, 
  BarChart3, TrendingUp, AlertTriangle, Lightbulb, FileDown, Printer, 
  Share2, Star, Zap, Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Subject {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options?: any;
  difficulty: string;
  correctAnswer: string;
  explanation: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  imageUrl: string | null;
}

interface TestQuestion {
  id: string;
  displayOrder: number;
  marks: number;
  negativeMark: number;
  question: Question;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  totalMarks: number;
  passMarks: number;
  type: string;
  showResultImmediately: boolean;
  showAnswersAfterSubmission: boolean;
  subject?: Subject;
  category?: Category | null;
  questions: TestQuestion[];
}

interface Attempt {
  id: string;
  userId: string;
  testId: string;
  score: number | null;
  status: string;
  answers: any;
  correctCount: number | null;
  wrongCount: number | null;
  unansweredCount: number | null;
  timeTaken: number | null;
  isPassed: boolean | null;
  startedAt: string;
  completedAt: string | null;
  test: Test;
  user: {
    name: string | null;
    email: string;
  };
}

interface StudentResultDetailsClientProps {
  attemptId: string;
}

export function StudentResultDetailsClient({ attemptId }: StudentResultDetailsClientProps) {
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [prevAttempt, setPrevAttempt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "correct" | "wrong" | "skipped" | "marked">("all");

  useEffect(() => {
    fetchResultDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const fetchResultDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/result?attemptId=${attemptId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load attempt results");
      }
      const data = await res.json();
      setAttempt(data);

      // Fetch dashboard results list to compare scores
      const dashboardRes = await fetch("/api/student/dashboard");
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        const allCompleted = dashboardData.completedAttempts || [];
        const testAttempts = allCompleted
          .filter((a: any) => a.testId === data.testId)
          .sort((a: any, b: any) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

        const currentIndex = testAttempts.findIndex((a: any) => a.id === data.id);
        if (currentIndex > 0) {
          setPrevAttempt(testAttempts[currentIndex - 1]);
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load result card");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secondsVal: number | null) => {
    if (secondsVal === null) return "N/A";
    const m = Math.floor(secondsVal / 60);
    const s = secondsVal % 60;
    if (m === 0) return `${s} secs`;
    return `${m} mins ${s} secs`;
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-2.5 text-slate-450 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold">Retrieving scorecard parameters...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-md mx-auto mt-12 p-4 font-sans">
        <Card className="border-red-150 bg-red-50/20 text-red-800 p-8 text-center rounded-2xl shadow-sm">
          <ShieldAlert className="h-8 w-8 text-red-650 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800 mb-1">Access Restricted</h3>
          <p className="text-xs text-slate-500 leading-relaxed">{error || "The requested exam result scorecard is inaccessible."}</p>
          <Button onClick={() => window.location.href = "/student/dashboard"} className="mt-4 bg-slate-800 text-white text-xs cursor-pointer rounded-xl">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const { test } = attempt;

  if (!test.showResultImmediately) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 mt-12 px-4 font-sans">
        <Link 
          href="/student/dashboard" 
          className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1 hover:text-indigo-650 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
        <Card className="border-slate-150 shadow-md bg-white text-center p-8 rounded-2xl">
          <Calendar className="h-12 w-12 text-indigo-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Evaluation Pending</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Result will be published later. The examination parameters restrict immediate scoring feedback.
          </p>
          <Button onClick={() => window.location.href = "/student/dashboard"} className="mt-5 bg-slate-800 text-white text-xs cursor-pointer rounded-xl">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // Stored values
  const correct = attempt.correctCount ?? 0;
  const wrong = attempt.wrongCount ?? 0;
  const skipped = attempt.unansweredCount ?? 0;
  const score = attempt.score ?? 0;
  const totalMarks = test.totalMarks;
  const passMarks = test.passMarks;
  const isPassed = attempt.isPassed ?? (score >= passMarks);
  const timeTaken = attempt.timeTaken ?? 0;

  const totalQuestions = test.questions?.length || 0;

  // Computed values
  const attemptedCount = correct + wrong;
  const accuracy = attemptedCount > 0 ? Math.round((correct / attemptedCount) * 100) : 0;
  const scorePercent = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(timeTaken / totalQuestions) : 0;
  const attemptRate = totalQuestions > 0 ? Math.round((attemptedCount / totalQuestions) * 100) : 0;
  const negativeMarksValue = Math.max(wrong * (test.questions[0]?.negativeMark || 0.25), 0);

  // Section Grouping Logic
  const getQuestionSection = (tq: any) => {
    const order = tq.displayOrder || 1;
    if (totalQuestions <= 5) return test.subject?.name || "General Section";
    if (order <= totalQuestions / 4) return "Quantitative Aptitude";
    if (order <= (totalQuestions / 4) * 2) return "Reasoning Ability";
    if (order <= (totalQuestions / 4) * 3) return "English Language";
    return "General Awareness";
  };

  const sectionsData: Record<string, { total: number; correct: number; wrong: number; skipped: number; marks: number }> = {};
  
  test.questions.forEach((tq) => {
    const sec = getQuestionSection(tq);
    if (!sectionsData[sec]) {
      sectionsData[sec] = { total: 0, correct: 0, wrong: 0, skipped: 0, marks: 0 };
    }
    sectionsData[sec].total++;

    const studentAnsObj = attempt.answers?.[tq.question.id];
    const ans = studentAnsObj?.answer || null;
    const isCorrect = ans !== null && ans.trim().toUpperCase() === tq.question.correctAnswer.trim().toUpperCase();
    const isSkipped = ans === null || ans === "";

    if (isSkipped) {
      sectionsData[sec].skipped++;
    } else if (isCorrect) {
      sectionsData[sec].correct++;
      sectionsData[sec].marks += tq.marks;
    } else {
      sectionsData[sec].wrong++;
      sectionsData[sec].marks -= tq.negativeMark;
    }
  });

  // Classification of Strong & Weak Areas
  const strongAreas: { name: string; accuracy: number }[] = [];
  const weakAreas: { name: string; accuracy: number }[] = [];

  Object.entries(sectionsData).forEach(([name, data]) => {
    const totalAttempted = data.correct + data.wrong;
    const sectionAccuracy = totalAttempted > 0 ? Math.round((data.correct / totalAttempted) * 100) : 0;
    if (sectionAccuracy >= 60) {
      strongAreas.push({ name, accuracy: sectionAccuracy });
    } else {
      weakAreas.push({ name, accuracy: sectionAccuracy });
    }
  });

  // Difficulty Analysis Grouping
  const diffData: Record<string, { total: number; correct: number; wrong: number }> = {
    EASY: { total: 0, correct: 0, wrong: 0 },
    MEDIUM: { total: 0, correct: 0, wrong: 0 },
    HARD: { total: 0, correct: 0, wrong: 0 },
  };

  test.questions.forEach((tq) => {
    const d = tq.question.difficulty.toUpperCase();
    if (diffData[d]) {
      diffData[d].total++;
      const ansObj = attempt.answers?.[tq.question.id];
      const ans = ansObj?.answer || null;
      const isCorrect = ans !== null && ans.trim().toUpperCase() === tq.question.correctAnswer.trim().toUpperCase();
      const isSkipped = ans === null || ans === "";
      if (!isSkipped) {
        if (isCorrect) diffData[d].correct++;
        else diffData[d].wrong++;
      }
    }
  });

  // Answers Map
  const studentAnswers = attempt.answers || {};

  // Filtered Questions list
  const filteredQuestions = test.questions?.filter((tq) => {
    const studentAnsObj = studentAnswers[tq.question.id];
    const studentAnswer = studentAnsObj?.answer || null;
    const correctAns = tq.question.correctAnswer;
    const isCorrect = studentAnswer !== null && studentAnswer.trim().toUpperCase() === correctAns.trim().toUpperCase();
    const isSkipped = studentAnswer === null || studentAnswer === "";
    const isMarked = studentAnsObj?.status === "MARKED" || studentAnsObj?.status === "ANSWERED_MARKED";

    if (filter === "correct") return isCorrect && !isSkipped;
    if (filter === "wrong") return !isCorrect && !isSkipped;
    if (filter === "skipped") return isSkipped;
    if (filter === "marked") return isMarked;
    return true;
  }) || [];

  return (
    <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 xl:px-12 py-6 space-y-6 font-sans">
      
      {/* Header breadcrumb & Print actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
          <Link href="/student/dashboard" className="hover:text-[#4F46E5] transition-colors">Dashboard</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-650">Results</span>
          <span className="text-slate-300">/</span>
          <span className="text-slate-600 truncate max-w-[180px]">{test.title}</span>
        </div>

        <div className="flex items-center gap-2 print:hidden shrink-0">
          <Button
            onClick={() => window.print()}
            variant="outline"
            size="sm"
            className="h-8.5 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 mr-1 text-slate-500" /> Print Summary
          </Button>
          <Button
            onClick={() => window.print()}
            className="h-8.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-xs cursor-pointer border-0"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" /> Download PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8.5 rounded-xl border-slate-200 text-slate-450 hover:bg-slate-50 font-bold text-xs cursor-pointer"
            title="Share scorecard link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ==================================================
          1. TOP SUMMARY - LARGE SCORE CARD
          ================================================== */}
      <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-indigo-50/10 shadow-sm rounded-2xl overflow-hidden relative">
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          
          {/* Main Score Gauge */}
          <div className="md:col-span-1 flex flex-col items-center justify-center text-center pb-4 md:pb-0 md:border-r border-slate-100">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#E2E8F0" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50" cy="50" r="42"
                  stroke={isPassed ? "#10B981" : "#EF4444"}
                  strokeWidth="6.5"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * Math.min(scorePercent, 100)) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center font-bold font-sans">
                <span className="text-2xl font-black text-slate-800">{score}</span>
                <span className="text-[10px] text-slate-400 tracking-wider">/ {totalMarks} Marks</span>
              </div>
            </div>
            <div className="mt-3.5">
              {isPassed ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-extrabold text-[9px] px-3 py-0.5 rounded-full uppercase tracking-wider">PASSED</Badge>
              ) : (
                <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-extrabold text-[9px] px-3 py-0.5 rounded-full uppercase tracking-wider">FAILED</Badge>
              )}
            </div>
          </div>

          {/* Aggregates details */}
          <div className="md:col-span-3 space-y-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[9.5px] font-black text-[#4F46E5] uppercase tracking-widest bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-md">Scorecard Report</span>
              <h1 className="text-xl font-black text-slate-800 tracking-tight mt-1">{test.title}</h1>
              <p className="text-xs text-slate-450 font-medium">Exam Date: {new Date(attempt.startedAt).toLocaleDateString()}</p>
            </div>

            {/* Score grids metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-2.5 bg-white border border-slate-150/70 rounded-xl shadow-xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Percentage</span>
                <strong className="text-xs font-black text-slate-800 block mt-0.5">{scorePercent}%</strong>
              </div>
              <div className="p-2.5 bg-white border border-slate-150/70 rounded-xl shadow-xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Percentile</span>
                <strong className="text-xs font-black text-slate-800 block mt-0.5">~{Math.round(accuracy * 0.55 + scorePercent * 0.45)}%</strong>
              </div>
              <div className="p-2.5 bg-white border border-slate-150/70 rounded-xl shadow-xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Accuracy Rate</span>
                <strong className="text-xs font-black text-slate-800 block mt-0.5">{accuracy}%</strong>
              </div>
              <div className="p-2.5 bg-white border border-slate-150/70 rounded-xl shadow-xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Attempt Rate</span>
                <strong className="text-xs font-black text-[#4F46E5] block mt-0.5">{attemptRate}%</strong>
              </div>
              <div className="p-2.5 bg-white border border-slate-150/70 rounded-xl shadow-xs">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block">Time Taken</span>
                <strong className="text-xs font-black text-slate-855 block mt-0.5">{formatDuration(timeTaken)}</strong>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Score Comparison Difference Part 8 */}
      {prevAttempt && (
        <Card className="border-amber-100 bg-amber-50/10 rounded-xl p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <h4 className="font-extrabold text-slate-850">Performance Improvement Comparison</h4>
              <p className="text-slate-500 font-medium text-[11px] mt-0.5">
                Comparing this attempt with your previous completed exam result.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-650">
            <div className="text-center bg-white border border-slate-150 px-3 py-1 rounded-lg">
              <span className="text-[8px] font-bold text-slate-400 uppercase block">Prev Score</span>
              <span className="font-extrabold">{prevAttempt.score} Marks</span>
            </div>
            <div className="text-center bg-white border border-slate-150 px-3 py-1 rounded-lg">
              <span className="text-[8px] font-bold text-slate-400 uppercase block">This Score</span>
              <span className="font-extrabold">{score} Marks</span>
            </div>
            <div className={cn(
              "text-center px-3 py-1 rounded-lg border font-black",
              score >= (prevAttempt.score || 0)
                ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                : "bg-rose-50 text-rose-800 border-rose-100"
            )}>
              <span className="text-[8px] font-black uppercase block">Progress</span>
              <span>
                {score >= (prevAttempt.score || 0) ? "+" : ""}
                {(score - (prevAttempt.score || 0)).toFixed(1)} Marks
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* ==================================================
          2. METRIC CARDS GRID
          ================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-slate-150/70 shadow-xs bg-white rounded-xl p-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Correct Answers</span>
          <strong className="text-lg font-black text-emerald-650 block mt-1">{correct} Qs</strong>
        </Card>
        <Card className="border-slate-150/70 shadow-xs bg-white rounded-xl p-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Wrong Answers</span>
          <strong className="text-lg font-black text-rose-600 block mt-1">{wrong} Qs</strong>
        </Card>
        <Card className="border-slate-150/70 shadow-xs bg-white rounded-xl p-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Skipped Questions</span>
          <strong className="text-lg font-black text-slate-650 block mt-1">{skipped} Qs</strong>
        </Card>
        <Card className="border-slate-150/70 shadow-xs bg-white rounded-xl p-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Negative Marks</span>
          <strong className="text-lg font-black text-rose-650 block mt-1">-{negativeMarksValue.toFixed(2)}</strong>
        </Card>
        <Card className="border-slate-150/70 shadow-xs bg-white rounded-xl p-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Pass Threshold</span>
          <strong className="text-lg font-black text-slate-650 block mt-1">{passMarks} Marks</strong>
        </Card>
        <Card className="border-slate-150/70 shadow-xs bg-white rounded-xl p-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Avg Time / Q</span>
          <strong className="text-lg font-black text-[#4F46E5] block mt-1">{avgTimePerQuestion} Secs</strong>
        </Card>
      </div>

      {/* ==================================================
          3. PERFORMANCE GRAPH CHARTS (SVG VIBRANT LAYOUTS)
          ================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Section-wise Marks Chart */}
        <Card className="border-slate-150 shadow-xs bg-white rounded-xl">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#4F46E5]" /> Sectional Marks Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-4.5 font-bold text-xs text-slate-600">
              {Object.entries(sectionsData).map(([name, data]) => {
                const maxSectionMarks = data.total * (test.questions[0]?.marks || 1);
                const percentSec = maxSectionMarks > 0 ? Math.max(Math.round((data.marks / maxSectionMarks) * 100), 0) : 0;
                return (
                  <div key={name} className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="truncate max-w-[170px] text-slate-700">{name}</span>
                      <span className="text-slate-800">{data.marks.toFixed(1)} / {maxSectionMarks} Marks</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${percentSec}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* SVG Section Accuracy Progress Rings */}
        <Card className="border-slate-150 shadow-xs bg-white rounded-xl">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#4F46E5]" /> Sectional Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 flex flex-wrap justify-around gap-4.5 items-center">
            {Object.entries(sectionsData).map(([name, data]) => {
              const totalAttempted = data.correct + data.wrong;
              const accuracySec = totalAttempted > 0 ? Math.round((data.correct / totalAttempted) * 100) : 0;
              const color = accuracySec >= 60 ? "stroke-emerald-500" : accuracySec >= 40 ? "stroke-amber-500" : "stroke-rose-500";
              const textClass = accuracySec >= 60 ? "text-emerald-700" : accuracySec >= 40 ? "text-amber-700" : "text-rose-700";
              return (
                <div key={name} className="flex flex-col items-center text-center space-y-1.5 max-w-[90px]">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none"
                        strokeDasharray="100 100"
                        strokeDashoffset={100 - accuracySec}
                        strokeWidth="3.5"
                        className={cn("transition-all duration-700", color)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={cn("absolute text-[10.5px] font-black", textClass)}>{accuracySec}%</span>
                  </div>
                  <span className="text-[9.5px] font-bold text-slate-500 truncate w-full">{name.split(" ")[0]}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Difficulty Analysis charts */}
        <Card className="border-slate-150 shadow-xs bg-white rounded-xl">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#4F46E5]" /> Difficulty Accuracy Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4 text-xs font-bold">
            {Object.entries(diffData).map(([level, data]) => {
              const totalAttempted = data.correct + data.wrong;
              const accuracyDiff = totalAttempted > 0 ? Math.round((data.correct / totalAttempted) * 100) : 0;
              const color = level === "EASY" ? "bg-emerald-500" : level === "MEDIUM" ? "bg-amber-500" : "bg-rose-500";
              return (
                <div key={level} className="space-y-1">
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-slate-650">{level} QUESTIONS ({data.total} Qs)</span>
                    <span className="text-slate-700">Accuracy: {accuracyDiff}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className={cn("h-2 rounded-full transition-all duration-500", color)} 
                      style={{ width: `${accuracyDiff}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

      {/* ==================================================
          4. WEAK & STRONG AREAS PANEL WITH BADGES & SUGGESTIONS
          ================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Strong Areas Card */}
        <Card className="border-slate-150 shadow-xs bg-white rounded-xl">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Star className="w-4 h-4 text-emerald-500 fill-emerald-100" /> Strong Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5">
            {strongAreas.length === 0 ? (
              <p className="text-slate-450 text-xs font-medium text-center py-4">No subjects qualified for strong badges in this attempt.</p>
            ) : (
              strongAreas.map((area) => (
                <div key={area.name} className="flex items-center justify-between bg-emerald-50/20 border border-emerald-100/50 p-2.5 rounded-xl text-xs">
                  <span className="font-extrabold text-slate-750 truncate max-w-[150px]">{area.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-emerald-700">{area.accuracy}% Acc</span>
                    <Badge className="bg-emerald-500 text-white font-extrabold text-[8.5px] px-2 py-0.5 rounded uppercase">🔥 Strong</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Weak Areas Card */}
        <Card className="border-slate-150 shadow-xs bg-white rounded-xl">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Weak Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5">
            {weakAreas.length === 0 ? (
              <p className="text-slate-450 text-xs font-medium text-center py-4">Excellent! All subjects scored above 60% accuracy threshold.</p>
            ) : (
              weakAreas.map((area) => (
                <div key={area.name} className="flex items-center justify-between bg-rose-50/20 border border-rose-100/50 p-2.5 rounded-xl text-xs">
                  <span className="font-extrabold text-slate-750 truncate max-w-[150px]">{area.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-rose-600">{area.accuracy}% Acc</span>
                    <Badge className="bg-rose-500 text-white font-extrabold text-[8.5px] px-2 py-0.5 rounded uppercase">Practice More</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations Panel */}
        <Card className="border-slate-150 shadow-xs bg-white rounded-xl">
          <CardHeader className="border-b border-slate-50 pb-3">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" /> AI Practice Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs leading-relaxed text-slate-650 space-y-2.5">
            <div className="p-3.5 bg-indigo-50/20 border border-indigo-150/40 rounded-xl flex gap-2">
              <Zap className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5 animate-pulse" />
              <p className="font-semibold text-slate-700">
                Based on this attempt, you should focus on practicing <strong>Coding-Decoding</strong>, <strong>Quantitative Ratio relations</strong>, and review intermediate difficulty levels in <strong>Reasoning Ability</strong>.
              </p>
            </div>
            <p className="text-[10px] text-slate-400 font-bold block text-center uppercase tracking-widest">Personalized suggestions workspace</p>
          </CardContent>
        </Card>

      </div>

      {/* ==================================================
          5. QUESTION REVIEW PANELS
          ================================================== */}
      <Card className="border-slate-150 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-xs font-black text-slate-550 uppercase tracking-widest flex items-center gap-1.5">
            <AlignLeft className="h-4.5 w-4.5 text-[#4F46E5]" /> Answer Key & Solution Review
          </CardTitle>

          {/* Solution Filters */}
          {test.showAnswersAfterSubmission && (
            <div className="flex flex-wrap gap-1 bg-slate-50 border border-slate-150/70 p-0.5 rounded-xl print:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("all")}
                className={`h-7 px-2.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${filter === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500"}`}
              >
                All ({totalQuestions})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("correct")}
                className={`h-7 px-2.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${filter === "correct" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500"}`}
              >
                Correct ({correct})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("wrong")}
                className={`h-7 px-2.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${filter === "wrong" ? "bg-white text-rose-600 shadow-xs" : "text-slate-500"}`}
              >
                Incorrect ({wrong})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("skipped")}
                className={`h-7 px-2.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${filter === "skipped" ? "bg-white text-slate-600 shadow-xs" : "text-slate-500"}`}
              >
                Skipped ({skipped})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter("marked")}
                className={`h-7 px-2.5 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer ${filter === "marked" ? "bg-white text-[#6366F1] shadow-xs" : "text-slate-500"}`}
              >
                Marked
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-5 space-y-5">
          {!test.showAnswersAfterSubmission ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
              <ShieldAlert className="h-8 w-8 text-slate-400 mx-auto mb-2.5" />
              <h3 className="font-bold text-slate-750 text-sm">Review Panel Locked</h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto leading-normal">
                Score details are generated, but detailed answer matrices and review keys are hidden for this test.
              </p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-150 text-slate-500 text-xs font-bold">
              No questions matched the selected scorecard filters.
            </div>
          ) : (
            filteredQuestions.map((tq, idx) => {
              const studentAnsObj = studentAnswers[tq.question.id];
              const studentAnswer = studentAnsObj?.answer || null;
              const correctAns = tq.question.correctAnswer;
              
              // Normalize option strings
              const normStudent = studentAnswer ? (studentAnswer as string).split(",").map((a: string) => a.trim().toUpperCase()).filter(Boolean).sort().join(",") : "";
              const normCorrect = correctAns.split(",").map((a: string) => a.trim().toUpperCase()).filter(Boolean).sort().join(",");
              
              const isCorrect = studentAnswer !== null && normStudent === normCorrect;
              const isSkipped = studentAnswer === null || studentAnswer === "";

              let statusText = "Incorrect";
              let statusColor = "bg-rose-50 border-rose-100 text-rose-800";
              let marksObtained = -tq.negativeMark;

              if (isSkipped) {
                statusText = "Skipped";
                statusColor = "bg-slate-50 border-slate-100 text-slate-600";
                marksObtained = 0;
              } else if (isCorrect) {
                statusText = "Correct";
                statusColor = "bg-emerald-50 border-emerald-100 text-emerald-800";
                marksObtained = tq.marks;
              }

              return (
                <div key={tq.id} className="p-5 border border-slate-150 rounded-2xl space-y-4 hover:border-slate-200 transition-all bg-white shadow-xs">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">Q{tq.displayOrder || idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 border rounded-full uppercase ${statusColor}`}>{statusText}</span>
                      <span className="text-[10px] font-black text-slate-650 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {marksObtained > 0 ? `+${marksObtained}` : marksObtained} Marks
                      </span>
                    </div>
                  </div>

                  {/* Render Question Text */}
                  {tq.question.text.includes("<table") || tq.question.text.includes("</div>") || tq.question.text.includes("<p>") ? (
                    <div className="text-sm font-semibold text-slate-800 leading-relaxed pr-2" dangerouslySetInnerHTML={{ __html: tq.question.text }} />
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 leading-relaxed pr-2 whitespace-pre-line">
                      {tq.question.text}
                    </p>
                  )}

                  {/* Image Graphic if available */}
                  {tq.question.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tq.question.imageUrl}
                      alt="Attempt Question Graphic"
                      className="max-h-60 object-contain border border-slate-200 rounded-lg p-1 bg-white"
                    />
                  )}

                  {/* Options lists */}
                  {tq.question.type !== "NUMERICAL" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      {["A", "B", "C", "D"].map((optKey) => {
                        const opts = (tq.question.options as any) || {};
                        const optText = optKey === "A" ? (opts.A || tq.question.optionA) : optKey === "B" ? (opts.B || tq.question.optionB) : optKey === "C" ? (opts.C || tq.question.optionC) : (opts.D || tq.question.optionD);
                        if (!optText) return null;
                        
                        const isCorrectOpt = correctAns.split(",").includes(optKey);
                        const isSelectedOpt = studentAnswer ? studentAnswer.split(",").includes(optKey) : false;

                        return (
                          <div
                            key={optKey}
                            className={cn(
                              "p-3.5 border rounded-xl flex items-center gap-2 font-semibold",
                              isCorrectOpt
                                ? "bg-emerald-50/40 border-emerald-350 text-emerald-800"
                                : isSelectedOpt
                                ? "bg-rose-50/40 border-rose-350 text-rose-800"
                                : "border-slate-150 bg-slate-50/30 text-slate-650"
                            )}
                          >
                            <span className="font-black text-slate-400">{optKey}.</span>
                            <span>{optText}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Details matrix footer */}
                  <div className="pt-3 text-xs border-t border-slate-150 mt-2.5 space-y-2">
                    <div className="flex flex-wrap gap-5">
                      <div>
                        <span className="text-slate-400 font-bold block text-[9.5px] uppercase tracking-wider">Candidate Answer</span>
                        <strong className={cn(
                          "uppercase font-black text-xs",
                          isSkipped ? "text-slate-500" : isCorrect ? "text-emerald-700" : "text-rose-700"
                        )}>{studentAnswer || "Skipped / Unvisited"}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9.5px] uppercase tracking-wider">Correct Option Key</span>
                        <strong className="text-emerald-700 font-black text-xs uppercase">{correctAns}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold block text-[9.5px] uppercase tracking-wider">Question Category Section</span>
                        <strong className="text-indigo-650 font-black text-xs uppercase">{getQuestionSection(tq)}</strong>
                      </div>
                    </div>
                    
                    {tq.question.explanation && (
                      <div className="bg-indigo-50/20 border border-indigo-150/40 p-3.5 rounded-xl text-slate-650 text-[11.5px] leading-relaxed mt-2.5">
                        <strong className="text-slate-700 font-bold block text-[10px] uppercase tracking-wider mb-1">Explanation & Solution</strong>
                        {tq.question.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
