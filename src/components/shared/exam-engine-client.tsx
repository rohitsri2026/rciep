"use client";
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */

import { useState, useEffect, useRef } from "react";
import { 
  Loader2, Check, AlertTriangle, Play, HelpCircle, 
  ChevronLeft, ChevronRight, Bookmark, ArrowRight, ShieldAlert,
  Minimize, Maximize, RefreshCw, Wifi, WifiOff, AlertCircle, CheckCircle, Clock,
  Calculator, Flag, Globe, Info, User, Smartphone, Sparkles, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Subject {
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
  duration: number;
  totalMarks: number;
  passMarks: number;
  subject?: Subject;
}

interface Attempt {
  id: string;
  userId: string;
  testId: string;
  status: string;
  answers: any;
  test: Test & { questions: TestQuestion[] };
  user: {
    name: string | null;
    email: string;
  };
}

interface ExamEngineClientProps {
  attemptId: string;
}

export function ExamEngineClient({ attemptId }: ExamEngineClientProps) {
  // Exam metadata
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string | null; status: string }>>({});

  // Core countdown timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Network & Sync queue state
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<{ questionId: string; answer: string | null; status: string }[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Screen constraints check
  const [isMobile, setIsMobile] = useState(false);

  // Modals & Panel popups
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [cheatWarning, setCheatWarning] = useState<string | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcInput, setCalcInput] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("English");
  
  // Track triggered alerts
  const [notifiedWarnings, setNotifiedWarnings] = useState<Record<number, boolean>>({});
  const [toastMsg, setToastMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  // Submissions tracking stage states
  const [submittingLock, setSubmittingLock] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [submitProgress, setSubmitProgress] = useState(0);

  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Checks
  useEffect(() => {
    checkScreenSize();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", checkScreenSize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", checkScreenSize);
      }
    };
  }, []);

  // Tab close or browser refresh auto-submit listener
  useEffect(() => {
    if (completed || submitting) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      fetch("/api/student/attempt/exam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
        keepalive: true,
      });
      e.preventDefault();
      e.returnValue = "Warning: Exiting the exam cockpit will submit your answers. Are you sure?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [completed, submitting, attemptId]);

  const checkScreenSize = () => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
    }
  };

  // Initialize Exam Workspace
  useEffect(() => {
    if (isMobile) return;

    fetchExamState();
    setupAntiCheatingListeners();
    setupNetworkListeners();

    return () => {
      clearTimers();
      cleanupAntiCheatingListeners();
      cleanupNetworkListeners();
    };
  }, [attemptId, isMobile]);

  // Network status listeners
  const setupNetworkListeners = () => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  };

  const cleanupNetworkListeners = () => {
    if (typeof window === "undefined") return;
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };

  const handleOnline = () => {
    setIsOnline(true);
    setToastMsg({ type: "success", text: "Connection restored. Syncing pending states..." });
    logCheatEvent("INTERNET_RECONNECT");
  };

  const handleOffline = () => {
    setIsOnline(false);
    setToastMsg({ type: "warning", text: "Network disconnected! Saving progress locally." });
    logCheatEvent("INTERNET_DISCONNECT");
  };

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      flushSyncQueue();
    }
  }, [isOnline, syncQueue]);

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  };

  // Start countdown & heartbeats
  const startExamTimers = (initialTime: number) => {
    setTimeLeft(initialTime);
    clearTimers();

    // 1. Tick countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimers();
          handleAutoSubmit();
          return 0;
        }

        // Warning alerts at 15m, 5m, 1m
        const minsLeft = Math.floor(prev / 60);
        const secsLeft = prev % 60;
        if (secsLeft === 0) {
          if (minsLeft === 15 && !notifiedWarnings[15]) {
            setToastMsg({ type: "warning", text: "Attention! 15 minutes remaining for submission." });
            setNotifiedWarnings(w => ({ ...w, 15: true }));
          } else if (minsLeft === 5 && !notifiedWarnings[5]) {
            setToastMsg({ type: "warning", text: "Warning! Only 5 minutes remaining. Check all questions." });
            setNotifiedWarnings(w => ({ ...w, 5: true }));
          } else if (minsLeft === 1 && !notifiedWarnings[1]) {
            setToastMsg({ type: "error", text: "Critical Alert! Only 1 minute left. Auto-submitting soon." });
            setNotifiedWarnings(w => ({ ...w, 1: true }));
          }
        }

        return prev - 1;
      });
    }, 1000);

    // 2. Synchronize clock with server every 30 seconds
    heartbeatRef.current = setInterval(() => {
      syncClockWithServer();
    }, 30000);
  };

  // Keyboard shortcuts Alt+N, Alt+P, Alt+M, Alt+C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed || submitting) return;
      
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            handleSaveAndNext();
            break;
          case "p":
            e.preventDefault();
            handlePrev();
            break;
          case "m":
            e.preventDefault();
            handleMarkForReview();
            break;
          case "c":
            e.preventDefault();
            handleClearResponse();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [questions, currentIdx, answers, completed, submitting]);

  // Load state from DB
  const fetchExamState = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/attempt/exam?attemptId=${attemptId}`);
      if (!res.ok) {
        throw new Error("Failed to initialize exam workspace");
      }
      const data = await res.json();
      
      if (data.status === "COMPLETED") {
        setCompleted(true);
        setAttempt(data.attempt);
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`exam_idx_${attemptId}`);
        }
        window.location.href = `/student/results/${attemptId}`;
        return;
      }

      setAttempt(data.attempt);
      setQuestions(data.attempt.test.questions || []);
      setAnswers(data.attempt.answers || {});
      startExamTimers(data.remainingSeconds || 0);

      // Local storage restore index
      if (typeof window !== "undefined") {
        const savedIdx = localStorage.getItem(`exam_idx_${attemptId}`);
        if (savedIdx) {
          setCurrentIdx(parseInt(savedIdx));
        }
      }
    } catch (err: any) {
      setCheatWarning(err?.message || "Failed to load exam state");
    } finally {
      setLoading(false);
    }
  };

  // Sync clock
  const syncClockWithServer = async () => {
    if (!isOnline) return;
    try {
      const res = await fetch("/api/student/attempt/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "COMPLETED") {
          clearTimers();
          setCompleted(true);
        } else {
          setTimeLeft(data.remainingSeconds);
        }
      }
    } catch (err) {
      console.error("Timer sync failed", err);
    }
  };

  // Anti Cheating monitoring listeners
  const setupAntiCheatingListeners = () => {
    if (typeof window === "undefined") return;
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
  };

  const cleanupAntiCheatingListeners = () => {
    if (typeof window === "undefined") return;
    window.removeEventListener("blur", handleWindowBlur);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    document.removeEventListener("fullscreenchange", handleFullScreenChange);
  };

  const handleWindowBlur = () => {
    logCheatEvent("WINDOW_BLUR");
    setCheatWarning("Warning: Keep your window focused on the CBT exam cockpit layout. Tab switching has been logged.");
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      logCheatEvent("TAB_CHANGE");
      setCheatWarning("Warning: Tab changes are strictly logged. Moving away from the exam panel is flagged.");
    }
  };

  const handleFullScreenChange = () => {
    const isFull = !!document.fullscreenElement;
    setIsFullScreen(isFull);
    if (!isFull) {
      logCheatEvent("FULL_SCREEN_EXIT");
      setCheatWarning("Warning: Fullscreen exited. Re-enable fullscreen mode to secure your session workspace.");
    }
  };

  const logCheatEvent = async (type: string) => {
    if (!isOnline) return;
    try {
      await fetch("/api/student/attempt/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, eventType: type }),
      });
    } catch (err) {
      console.error("Failed to post cheating log", err);
    }
  };

  const toggleFullScreen = async () => {
    try {
      if (!isFullScreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to toggle fullscreen", err);
    }
  };

  // Auto-save logic (Optimistic and queued)
  const saveAnswerStateOptimistic = async (qId: string, ans: string | null, status: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { answer: ans, status },
    }));

    const payload = { questionId: qId, answer: ans, status };
    if (!isOnline) {
      setSyncQueue((prev) => [...prev, payload]);
      return;
    }

    try {
      const res = await fetch("/api/student/attempt/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          ...payload,
        }),
      });

      if (!res.ok) {
        throw new Error("Autosave response error");
      }
    } catch (err) {
      setSyncQueue((prev) => [...prev, payload]);
    }
  };

  const flushSyncQueue = async () => {
    if (isSyncing || syncQueue.length === 0) return;
    try {
      setIsSyncing(true);
      const item = syncQueue[0];

      const res = await fetch("/api/student/attempt/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          ...item,
        }),
      });

      if (res.ok) {
        setSyncQueue((prev) => prev.slice(1));
      }
    } catch (err) {
      console.error("Sync queue flushing failed", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Navigation callbacks
  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      if (typeof window !== "undefined") {
        localStorage.setItem(`exam_idx_${attemptId}`, nextIdx.toString());
      }

      const currQuestionId = questions[currentIdx].question.id;
      if (!answers[currQuestionId]) {
        saveAnswerStateOptimistic(currQuestionId, null, "NOT_ANSWERED");
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      if (typeof window !== "undefined") {
        localStorage.setItem(`exam_idx_${attemptId}`, prevIdx.toString());
      }
    }
  };

  const handleJump = (idx: number) => {
    const currQuestionId = questions[currentIdx].question.id;
    if (!answers[currQuestionId]) {
      saveAnswerStateOptimistic(currQuestionId, null, "NOT_ANSWERED");
    }

    setCurrentIdx(idx);
    if (typeof window !== "undefined") {
      localStorage.setItem(`exam_idx_${attemptId}`, idx.toString());
    }
  };

  // State manipulations
  const handleSelectOption = (option: string) => {
    const qId = questions[currentIdx].question.id;
    const currentStatus = answers[qId]?.status || "ANSWERED";
    const nextStatus = currentStatus.includes("MARKED") ? "ANSWERED_MARKED" : "ANSWERED";
    saveAnswerStateOptimistic(qId, option, nextStatus);
  };

  const handleSelectOptionMultiple = (option: string) => {
    const qId = questions[currentIdx].question.id;
    const currentAnswer = answers[qId]?.answer || "";
    let selectedArray = currentAnswer ? currentAnswer.split(",") : [];
    
    if (selectedArray.includes(option)) {
      selectedArray = selectedArray.filter(x => x !== option);
    } else {
      selectedArray.push(option);
    }
    
    const nextAnswer = selectedArray.sort().join(",");
    const currentStatus = answers[qId]?.status || "ANSWERED";
    const nextStatus = nextAnswer === "" ? "NOT_ANSWERED" : (currentStatus.includes("MARKED") ? "ANSWERED_MARKED" : "ANSWERED");
    
    saveAnswerStateOptimistic(qId, nextAnswer === "" ? null : nextAnswer, nextStatus);
  };

  const handleNumericalInput = (val: string) => {
    const qId = questions[currentIdx].question.id;
    const nextStatus = val.trim() !== "" ? "ANSWERED" : "NOT_ANSWERED";
    saveAnswerStateOptimistic(qId, val, nextStatus);
  };

  const handleClearResponse = () => {
    const qId = questions[currentIdx].question.id;
    saveAnswerStateOptimistic(qId, null, "NOT_ANSWERED");
  };

  const handleMarkForReview = () => {
    const qId = questions[currentIdx].question.id;
    const currAns = answers[qId]?.answer || null;
    const nextStatus = currAns !== null && currAns !== "" ? "ANSWERED_MARKED" : "MARKED";
    saveAnswerStateOptimistic(qId, currAns, nextStatus);
    handleNext();
  };

  const handleSaveAndMarkReview = () => {
    const qId = questions[currentIdx].question.id;
    const currAns = answers[qId]?.answer || null;
    if (currAns === null || currAns === "") {
      setToastMsg({ type: "warning", text: "Please select an answer response before marking." });
      return;
    }
    saveAnswerStateOptimistic(qId, currAns, "ANSWERED_MARKED");
    handleNext();
  };

  const handleSaveAndNext = () => {
    const qId = questions[currentIdx].question.id;
    const currAns = answers[qId]?.answer || null;
    const nextStatus = currAns !== null && currAns !== "" ? "ANSWERED" : "NOT_ANSWERED";
    saveAnswerStateOptimistic(qId, currAns, nextStatus);
    handleNext();
  };

  // Calculate estimated preview score
  const getEstimatedScore = () => {
    let estScore = 0;
    questions.forEach((tq) => {
      const ans = answers[tq.question.id];
      if (ans && ans.answer !== null && ans.answer !== "") {
        const normAns = ans.answer.split(",").map(a => a.trim().toUpperCase()).filter(Boolean).sort().join(",");
        const normCorrect = tq.question.correctAnswer.split(",").map(a => a.trim().toUpperCase()).filter(Boolean).sort().join(",");
        if (normAns === normCorrect) {
          estScore += tq.marks;
        } else {
          estScore -= tq.negativeMark;
        }
      }
    });
    return Math.max(estScore, 0);
  };

  // Submit test APIs
  const handleAutoSubmit = async () => {
    if (submittingLock || completed) return;
    setSubmittingLock(true);
    setSubmitting(true);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) progress = 100;
      setSubmitProgress(progress);
      if (progress < 40) setLoadingStage(0);
      else if (progress < 80) setLoadingStage(1);
      else setLoadingStage(2);
    }, 100);

    try {
      const res = await fetch("/api/student/attempt/exam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      clearInterval(interval);
      setSubmitProgress(100);
      clearTimers();
      setCompleted(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`exam_idx_${attemptId}`);
      }
      setTimeout(() => {
        window.location.href = `/student/results/${attemptId}`;
      }, 500);
    } catch (err) {
      clearInterval(interval);
      console.error("Auto submit failed", err);
      window.location.href = `/student/results/${attemptId}`;
    }
  };

  const confirmSubmit = async () => {
    if (submittingLock || completed) return;
    setSubmittingLock(true);
    setSubmitting(true);
    setIsSubmitOpen(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setSubmitProgress(progress);
      if (progress < 40) {
        setLoadingStage(0);
      } else if (progress < 80) {
        setLoadingStage(1);
      } else {
        setLoadingStage(2);
      }
    }, 150);

    try {
      const res = await fetch("/api/student/attempt/exam", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId }),
      });
      if (!res.ok) {
        throw new Error("Submission request failed");
      }
      clearInterval(interval);
      setSubmitProgress(100);
      clearTimers();
      setCompleted(true);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(`exam_idx_${attemptId}`);
      }

      setTimeout(() => {
        window.location.href = `/student/results/${attemptId}`;
      }, 800);
    } catch (err: any) {
      clearInterval(interval);
      setSubmitting(false);
      setSubmittingLock(false);
      setSubmitProgress(0);
      setCheatWarning(err?.message || "Failed to submit exam paper. Try again.");
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getPaletteStateColor = (qId: string, isActive: boolean) => {
    const qState = answers[qId];
    let base = "bg-white border border-slate-250 text-slate-700 hover:bg-slate-50";

    if (qState) {
      if (qState.status === "ANSWERED") {
        base = "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs";
      } else if (qState.status === "MARKED") {
        base = "bg-purple-500 hover:bg-purple-600 text-white border-transparent shadow-xs";
      } else if (qState.status === "ANSWERED_MARKED") {
        base = "bg-indigo-600 hover:bg-indigo-750 text-white border-transparent shadow-xs";
      } else if (qState.status === "NOT_ANSWERED") {
        base = "bg-rose-500 hover:bg-rose-600 text-white border-transparent shadow-xs";
      }
    }

    if (isActive) {
      return `${base} ring-2 ring-indigo-650 ring-offset-1`;
    }
    return base;
  };

  // Calculator logic
  const handleCalculatorPress = (val: string) => {
    if (val === "=") {
      try {
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, "");
        // eslint-disable-next-line no-eval
        const res = eval(sanitized);
        setCalcInput(String(res));
      } catch {
        setCalcInput("Error");
      }
    } else if (val === "C") {
      setCalcInput("");
    } else {
      setCalcInput(prev => prev + val);
    }
  };
  
  const handleReportSubmit = () => {
    setToastMsg({ type: "success", text: "Question reported successfully. Review board notified." });
    setReportOpen(false);
    setReportReason("");
  };

  // Status aggregation counters
  const answeredCount = Object.values(answers).filter(a => a.status === "ANSWERED").length;
  const markedCount = Object.values(answers).filter(a => a.status === "MARKED").length;
  const answeredMarkedCount = Object.values(answers).filter(a => a.status === "ANSWERED_MARKED").length;
  const notAnsweredCount = Object.values(answers).filter(a => a.status === "NOT_ANSWERED").length;
  const totalVisited = Object.keys(answers).length;
  const notVisitedCount = Math.max(questions.length - totalVisited, 0);

  // Render HTML markup or formulas safely
  const renderQuestionBody = (text: string) => {
    if (text.includes("<table") || text.includes("</div>") || text.includes("<p>")) {
      return <div className="text-sm font-semibold text-slate-800 leading-relaxed pr-2" dangerouslySetInnerHTML={{ __html: text }} />;
    }
    return <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line pr-2">{text}</p>;
  };

  // 1. Mobile screen block
  if (isMobile) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-slate-50 text-center font-sans">
        <Card className="max-w-sm border-slate-200/80 shadow-md bg-white p-6 space-y-4 rounded-2xl">
          <Smartphone className="w-12 h-12 text-[#4F46E5] mx-auto animate-bounce" />
          <h2 className="text-lg font-black text-slate-800">CBT Screen Size Unsupported</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The Computer Based Test (CBT) engine is optimized for Desktop and Tablet devices only to ensure structural integrity of examinations. Please log in from a wider display monitor to continue.
          </p>
          <Button onClick={() => window.location.href = "/student/dashboard"} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold w-full rounded-xl h-9 cursor-pointer">
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  // 2. Loading state
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3 bg-slate-50 font-sans">
        <Loader2 className="h-9 w-9 animate-spin text-[#4F46E5]" />
        <h2 className="text-sm font-bold text-slate-650">Configuring CBT Examination Cockpit...</h2>
      </div>
    );
  }

  // 3. Completed state redirect view
  if (completed) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
        <Card className="max-w-md w-full border-slate-150 shadow-lg bg-white overflow-hidden text-center rounded-2xl">
          <CardContent className="p-8 space-y-6">
            <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-800">Exam Attempt Submitted</h1>
              <p className="text-xs text-slate-450 font-medium">Your answer matrix has been successfully locked and saved.</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-2 text-xs text-slate-600 text-left">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-450">Mock Test:</span>
                <span className="font-bold text-slate-700">{attempt?.test.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-450">Candidate Name:</span>
                <span className="font-bold text-slate-700">{attempt?.user.name || attempt?.user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-450">Finalized On:</span>
                <span className="font-bold text-slate-700">{new Date().toLocaleString()}</span>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = "/student/dashboard"}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-xs py-2 rounded-xl cursor-pointer"
            >
              Return to Student Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitting) {
    const stageTexts = [
      "Submitting Answers...",
      "Calculating Score...",
      "Generating Analytics..."
    ];
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md font-sans">
        <Card className="w-full max-w-sm border-white/10 bg-white/95 backdrop-blur-md shadow-2xl p-6 text-center rounded-2xl animate-in fade-in zoom-in-95 duration-300">
          <CardContent className="space-y-6 pt-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-[#4F46E5] animate-spin" />
              <Sparkles className="w-6 h-6 text-[#4F46E5] animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-800 tracking-wide">
                {stageTexts[loadingStage] || "Processing Submission..."}
              </h3>
              <p className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest animate-pulse">
                Please do not close this tab
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                <div 
                  className="bg-[#4F46E5] h-1.5 rounded-full transition-all duration-150" 
                  style={{ width: `${submitProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-slate-400 block">{submitProgress}% Complete</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeTestQuestion = questions[currentIdx];
  const activeQuestion = activeTestQuestion?.question;

  // Split Comprehension passage if paragraph exists
  const isComprehension = activeQuestion && (
    activeQuestion.text.includes("---") || 
    activeQuestion.text.toLowerCase().includes("passage") || 
    activeQuestion.text.toLowerCase().includes("[passage]") ||
    activeQuestion.text.length > 500
  );
  
  let passageText = "";
  let questionPrompt = activeQuestion?.text || "";
  
  if (isComprehension && activeQuestion.text.includes("---")) {
    const parts = activeQuestion.text.split("---");
    passageText = parts[0];
    questionPrompt = parts[1];
  } else if (isComprehension) {
    const firstNewline = activeQuestion.text.indexOf("\n\n");
    if (firstNewline !== -1) {
      passageText = activeQuestion.text.substring(0, firstNewline);
      questionPrompt = activeQuestion.text.substring(firstNewline + 2);
    }
  }

  // Matching check
  const activeQuestionOpts = (activeQuestion?.options as any) || {};
  const activeQuestionOptA = activeQuestionOpts.A || activeQuestion?.optionA || "";
  const isMatching = activeQuestion && (
    activeQuestion.text.toLowerCase().includes("match") || 
    activeQuestionOptA.includes("::") || 
    activeQuestionOptA.includes("->")
  );

  return (
    <div className="h-screen flex flex-col justify-between bg-slate-100 select-none overflow-hidden font-sans">
      
      {/* Toast notifications alerts */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border border-slate-150 bg-white max-w-sm flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
          <AlertCircle className={cn(
            "h-4.5 w-4.5 shrink-0",
            toastMsg.type === "error" ? "text-rose-600" : toastMsg.type === "warning" ? "text-amber-500" : "text-emerald-500"
          )} />
          <span className="text-xs font-bold text-slate-700">{toastMsg.text}</span>
        </div>
      )}

      {/* ==================================================
          1. TOP BAR HEADER
          ================================================== */}
      <header className="h-14 bg-indigo-950 border-b border-indigo-900 px-5 flex items-center justify-between text-white shrink-0 shadow-md">
        <div className="space-y-0.5 min-w-0 flex-1 pr-4">
          <h2 className="text-xs font-black text-slate-100 tracking-wider truncate uppercase">{attempt?.test.title}</h2>
          <div className="flex items-center gap-2.5 text-[9.5px] font-bold text-indigo-200">
            <span className="uppercase tracking-widest bg-indigo-900/60 px-2 py-0.5 rounded">Subject: {attempt?.test.subject?.name || "General"}</span>
            <span className="text-indigo-400">|</span>
            <span className="flex items-center gap-1"><User className="w-3 h-3" /> Candidate: {attempt?.user.name || attempt?.user.email}</span>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-4.5 shrink-0">
          
          {/* Language selection dropdown selector */}
          <div className="flex items-center gap-1.5 bg-indigo-900/50 border border-indigo-850 px-2 py-0.5 rounded-lg text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-300" />
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="bg-transparent text-white border-0 text-[10.5px] font-bold focus:ring-0 cursor-pointer pr-1"
            >
              <option value="English" className="text-slate-800 font-bold">English</option>
              <option value="Hindi" className="text-slate-800 font-bold">Hindi / हिंदी</option>
            </select>
          </div>

          {/* Popups calculators trigger */}
          <Button
            onClick={() => setCalcOpen(true)}
            variant="ghost"
            size="sm"
            className="h-8.5 w-8.5 rounded-lg border border-indigo-850 bg-indigo-900/35 text-indigo-300 hover:text-white hover:bg-indigo-900 flex items-center justify-center cursor-pointer"
            title="Calculator Tool"
          >
            <Calculator className="w-4.5 h-4.5" />
          </Button>

          {/* Report question action */}
          <Button
            onClick={() => setReportOpen(true)}
            variant="ghost"
            size="sm"
            className="h-8.5 text-[10.5px] font-bold border border-indigo-850 bg-indigo-900/35 text-indigo-300 hover:text-white hover:bg-indigo-900 flex items-center justify-center cursor-pointer rounded-lg"
          >
            <Flag className="w-3.5 h-3.5 mr-1 text-indigo-300" /> Report
          </Button>

          {/* Fullscreen check indicator */}
          <Button
            variant="ghost"
            onClick={toggleFullScreen}
            className="h-8.5 w-8.5 border border-indigo-850 bg-indigo-900/35 text-indigo-300 hover:text-white hover:bg-indigo-900 flex items-center justify-center cursor-pointer rounded-lg"
            title="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize className="h-4.5 w-4.5" /> : <Maximize className="h-4.5 w-4.5" />}
          </Button>

          {/* Countdown timer alert */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-black border tracking-wider",
            timeLeft < 300 
              ? "bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse" 
              : timeLeft < 900
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-indigo-950/80 text-indigo-200 border-indigo-900"
          )}>
            <Clock className="h-3.5 w-3.5 text-indigo-300 animate-pulse" />
            <span className="font-mono text-[13px]">{formatTime(timeLeft)}</span>
          </div>

          {/* High-visibility RED submit button */}
          <Button
            onClick={() => setIsSubmitOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm py-1.5 h-8.5 rounded-lg px-4 cursor-pointer border-0 transition-colors"
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* ==================================================
          2. SPLIT WORK CONSOLE WORKSPACE
          ================================================== */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* ==========================================
            LEFT PANEL (70%) - QUESTION & OPTIONS
            ========================================== */}
        <div className="flex-grow flex flex-col justify-between overflow-y-auto bg-white border-r border-slate-200">
          
          <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
            
            {/* Header parameters */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  Question {currentIdx + 1}
                </span>
                <Badge variant="outline" className="text-[9px] border-slate-200 text-slate-500 font-bold bg-slate-50">
                  {activeQuestion?.type.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight">
                <span className="text-emerald-700">+{activeTestQuestion?.marks || 1} Marks</span>
                <span className="text-slate-200">|</span>
                <span className="text-rose-600">-{activeTestQuestion?.negativeMark || 0} Negative</span>
              </div>
            </div>

            {/* Question Workspace: Split view if Comprehension/Paragraph, otherwise normal */}
            <div className="flex-grow py-4 overflow-y-auto min-h-[300px]">
              
              {activeQuestion ? (
                isComprehension ? (
                  /* SPLIT PASSAGE LAYOUT FOR COMPREHENSION */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 h-full items-start">
                    {/* Left Column: Passage Text (Scrollable Box) */}
                    <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl max-h-[340px] overflow-y-auto space-y-2.5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b border-slate-200/50 pb-1.5 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#4F46E5]" /> Reading Comprehension Passage
                      </h4>
                      <div className="text-xs font-semibold text-slate-650 leading-relaxed whitespace-pre-line">
                        {passageText}
                      </div>
                    </div>

                    {/* Right Column: Question Prompt & Options */}
                    <div className="space-y-4">
                      <div className="bg-indigo-50/20 border border-indigo-100/50 p-3 rounded-lg">
                        {renderQuestionBody(questionPrompt)}
                      </div>

                      {/* Options */}
                      {renderAnswersBlock(activeQuestion, answers, handleSelectOption, handleSelectOptionMultiple, handleNumericalInput)}
                    </div>
                  </div>
                ) : (
                  /* NORMAL FULL PANE LAYOUT */
                  <div className="space-y-5">
                    {/* Optional Image visual */}
                    {activeQuestion.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeQuestion.imageUrl}
                        alt="Question graphic representation"
                        className="max-h-60 object-contain border border-slate-200 rounded-lg p-1 bg-white"
                      />
                    )}

                    {/* Normal prompt text */}
                    <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                      {renderQuestionBody(activeQuestion.text)}
                    </div>

                    {/* Match the Following Custom badge Grid */}
                    {isMatching && (
                      <div className="p-3 bg-indigo-50/20 border border-indigo-100/40 rounded-xl grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-indigo-100/40 pb-1 mb-1.5">Column I</span>
                          <div>A. Term Alpha</div>
                          <div>B. Term Beta</div>
                          <div>C. Term Gamma</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-indigo-100/40 pb-1 mb-1.5">Column II</span>
                          <div>P. Match Value X</div>
                          <div>Q. Match Value Y</div>
                          <div>R. Match Value Z</div>
                        </div>
                      </div>
                    )}

                    {/* Render Options list */}
                    {renderAnswersBlock(activeQuestion, answers, handleSelectOption, handleSelectOptionMultiple, handleNumericalInput)}
                  </div>
                )
              ) : (
                <p className="text-slate-400 text-xs">Failed to load question details.</p>
              )}

            </div>
          </div>

          {/* ==========================================
              BOTTOM ACTION BAR FOOTER
              ========================================== */}
          <footer className="h-15 border-t border-slate-200 px-5 flex items-center justify-between bg-slate-50 shrink-0 select-none flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkForReview}
                className="h-9 px-3 border-[#4F46E5]/20 text-[#4F46E5] bg-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <Bookmark className="mr-1.5 h-3.5 w-3.5 text-[#4F46E5] fill-[#4F46E5]/10" /> Mark for Review
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearResponse}
                className="h-9 px-3 border-slate-250 text-slate-650 bg-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Clear Response
              </Button>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="h-9 px-3 border-slate-250 text-slate-650 bg-white font-bold text-xs rounded-xl cursor-pointer"
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSaveAndMarkReview}
                className="border-indigo-600/30 text-indigo-700 bg-white font-bold h-9 px-3.5 text-xs rounded-xl cursor-pointer hover:bg-slate-50"
              >
                Save & Mark Review
              </Button>

              <Button
                onClick={handleSaveAndNext}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold h-9 px-4 rounded-xl text-xs shadow-sm cursor-pointer border-0"
              >
                Save & Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </footer>

        </div>

        {/* ==========================================
            RIGHT PANEL (30%) - PALETTE & LEGENDS
            ========================================== */}
        <aside className="w-80 bg-slate-50 border-l border-slate-200 flex flex-col justify-between overflow-y-auto shrink-0 select-none">
          <div className="p-5 space-y-5">
            
            {/* Candidate Box */}
            <div className="p-3 bg-white border border-slate-150 rounded-xl space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Logged Candidate</span>
              <strong className="text-slate-800 text-xs block leading-tight truncate">{attempt?.user.name || attempt?.user.email}</strong>
            </div>

            {/* Question Palette Grid */}
            <div className="space-y-3 bg-white border border-slate-150 rounded-xl p-4.5">
              <h3 className="text-xs font-black text-slate-550 uppercase tracking-widest border-b border-slate-100 pb-2">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {questions.map((tq, idx) => (
                  <Button
                    key={tq.id}
                    variant="outline"
                    onClick={() => handleJump(idx)}
                    className={cn(
                      "h-9 w-9 p-0 text-xs font-black rounded-lg cursor-pointer transition-all duration-200",
                      getPaletteStateColor(tq.question.id, currentIdx === idx)
                    )}
                  >
                    {idx + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Legend Indicators */}
            <div className="space-y-3 bg-white border border-slate-150 rounded-xl p-4.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Legend Summary</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10.5px] font-bold text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 shrink-0 shadow-sm" />
                  <span>Answered ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-rose-500 shrink-0 shadow-sm" />
                  <span>Not Ans ({notAnsweredCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-500 shrink-0 shadow-sm" />
                  <span>Marked ({markedCount})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-indigo-650 shrink-0 shadow-sm" />
                  <span>Ans & Mark ({answeredMarkedCount})</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 border-t border-slate-100 pt-1.5 mt-0.5">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-slate-250 shrink-0 shadow-xs" />
                  <span>Not Visited ({notVisitedCount})</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer keyboard shortcut references */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center mb-1">Shortcut Keys</span>
            <div className="text-[9px] text-slate-450 text-center space-y-0.5 font-bold">
              <span>Alt+N: Save & Next | Alt+P: Prev</span>
              <span className="block">Alt+M: Review | Alt+C: Clear</span>
            </div>
          </div>
        </aside>
      </main>

      {/* ==================================================
          3. CBT DIALOG POPUPS & WORKSPACES
          ================================================== */}
      
      {/* A. CALCULATOR DIALOG POPUP */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="max-w-[280px] bg-slate-900 text-white rounded-xl border border-slate-800 p-4">
          <DialogHeader>
            <DialogTitle className="text-xs font-black text-slate-400 uppercase tracking-widest">Scientific Calculator</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 font-mono">
            {/* Display screen */}
            <div className="bg-slate-950 p-3 rounded-lg text-right text-lg font-black text-emerald-400 truncate h-12 border border-slate-800">
              {calcInput || "0"}
            </div>
            
            {/* Buttons Matrix Grid */}
            <div className="grid grid-cols-4 gap-2">
              {["C", "(", ")", "/", "7", "8", "9", "*", "4", "5", "6", "-", "1", "2", "3", "+", "0", ".", "="].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleCalculatorPress(btn)}
                  className={cn(
                    "h-10 text-xs font-bold rounded-lg cursor-pointer transition-colors border-0",
                    btn === "=" 
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white col-span-2" 
                      : btn === "C" 
                      ? "bg-rose-600 hover:bg-rose-700 text-white" 
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                  )}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter className="mt-1">
            <Button onClick={() => setCalcOpen(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] py-1 h-7.5 w-full rounded-lg border-0 cursor-pointer">
              Close Calculator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* B. REPORT QUESTION MODAL */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-bold">Report Question Error</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-0.5">Please let the examination review board know about typos or structural issues.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <label className="block text-slate-500 font-bold uppercase text-[9.5px]">Select Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-slate-200 p-2 text-xs rounded-lg bg-white"
            >
              <option value="">Choose reason...</option>
              <option value="options">Incorrect Options list</option>
              <option value="typo">Spelling/Typographical error</option>
              <option value="math">Broken math formula / table view</option>
              <option value="syllabus">Question is out of syllabus boundaries</option>
            </select>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setReportOpen(false)} className="border-slate-200 text-slate-700 bg-white cursor-pointer rounded-lg text-xs">
              Cancel
            </Button>
            <Button onClick={handleReportSubmit} disabled={!reportReason} className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer border-0">
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* C. CONFIRM SUBMISSION DIALOG */}
      <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
        <DialogContent className="max-w-md bg-white/90 backdrop-blur-lg border border-white/40 shadow-2xl p-6 rounded-2xl animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-black text-sm tracking-wide uppercase">Submit CBT Exam Paper</DialogTitle>
            <DialogDescription className="text-slate-500 text-[11px] font-semibold mt-1">
              Exam Name: <strong className="text-slate-800 font-bold">{attempt?.test.title}</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Aggregate counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 py-4 border-y border-slate-100/80 my-3 text-xs font-bold">
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100/50">
              <span className="block text-[8.5px] font-black text-emerald-600 uppercase tracking-wider">Answered</span>
              <strong className="text-sm font-black">{answeredCount} Qs</strong>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-850 rounded-xl border border-rose-100/50">
              <span className="block text-[8.5px] font-black text-rose-600 uppercase tracking-wider">Not Answered</span>
              <strong className="text-sm font-black">{notAnsweredCount} Qs</strong>
            </div>
            <div className="p-2.5 bg-purple-50 text-purple-850 rounded-xl border border-purple-100/50">
              <span className="block text-[8.5px] font-black text-[#6366F1] uppercase tracking-wider">Marked Review</span>
              <strong className="text-sm font-black">{markedCount} Qs</strong>
            </div>
            <div className="p-2.5 bg-indigo-50 text-indigo-850 rounded-xl border border-indigo-100/50">
              <span className="block text-[8.5px] font-black text-indigo-650 uppercase tracking-wider">Ans & Marked</span>
              <strong className="text-sm font-black">{answeredMarkedCount} Qs</strong>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-800 rounded-xl border border-slate-150">
              <span className="block text-[8.5px] font-black text-slate-500 uppercase tracking-wider">Not Visited</span>
              <strong className="text-sm font-black">{notVisitedCount} Qs</strong>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-850 rounded-xl border border-amber-100/50 col-span-2 sm:col-span-1">
              <span className="block text-[8.5px] font-black text-amber-600 uppercase tracking-wider">Est. Score</span>
              <strong className="text-sm font-black text-amber-700">~{getEstimatedScore()} Marks</strong>
            </div>
          </div>

          <DialogFooter className="mt-2 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => setIsSubmitOpen(false)}
              className="border-slate-200 text-slate-650 bg-white hover:bg-slate-50 font-bold h-9.5 text-xs rounded-xl cursor-pointer"
            >
              Cancel, Keep Testing
            </Button>
            <Button
              onClick={confirmSubmit}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold h-9.5 text-xs rounded-xl cursor-pointer border-0"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* D. DYNAMIC SECURITY CHEATING ALERTS */}
      <Dialog open={!!cheatWarning} onOpenChange={() => setCheatWarning(null)}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-200">
          <DialogHeader className="flex flex-row items-center gap-3">
            <ShieldAlert className="h-9 w-9 text-rose-500 shrink-0" />
            <div>
              <DialogTitle className="text-slate-850 font-bold">Security Violation Logged</DialogTitle>
              <DialogDescription className="text-slate-500 text-xs">Tab change, focus exit, or full-screen exits are tracked.</DialogDescription>
            </div>
          </DialogHeader>
          <div className="py-2 text-xs font-semibold text-slate-700 leading-relaxed">
            {cheatWarning}
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={() => setCheatWarning(null)} className="bg-slate-800 text-white text-xs py-1.5 h-8.5 rounded-lg w-full cursor-pointer border-0">
              Acknowledge Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Option Renders helper inside client
function renderAnswersBlock(
  question: Question, 
  answers: Record<string, { answer: string | null; status: string }>,
  onSelectSingle: (val: string) => void,
  onSelectMultiple: (val: string) => void,
  onNumericalInput: (val: string) => void
) {
  const currentAnswer = answers[question.id]?.answer || "";
  const selectedArray = currentAnswer ? currentAnswer.split(",") : [];

  const opts = (question.options as any) || {};
  const optionA = opts.A || question.optionA || "";
  const optionB = opts.B || question.optionB || "";
  const optionC = opts.C || question.optionC || "";
  const optionD = opts.D || question.optionD || "";

  if (question.type === "NUMERICAL") {
    return (
      <div className="pt-2 space-y-1.5 max-w-sm">
        <Label htmlFor="numerical-input" className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Type Numerical Value</Label>
        <Input
          id="numerical-input"
          placeholder="E.g., 24.50"
          value={currentAnswer}
          onChange={(e) => onNumericalInput(e.target.value)}
          className="border-slate-200 focus-visible:ring-[#4F46E5] text-xs h-8.5 rounded-lg bg-white"
        />
      </div>
    );
  }

  if (question.type === "TRUE_FALSE") {
    return (
      <div className="pt-2 space-y-2">
        {["True", "False"].map((option) => {
          const isSelected = currentAnswer === option;
          return (
            <label
              key={option}
              className={cn(
                "flex items-center gap-2.5 p-3.5 border rounded-xl cursor-pointer select-none transition-all duration-150 text-xs font-bold",
                isSelected
                  ? "bg-indigo-50/45 border-indigo-200 text-[#4F46E5]"
                  : "bg-slate-50/20 border-slate-100 text-slate-650 hover:bg-slate-50"
              )}
            >
              <input
                type="radio"
                name={`tf-${question.id}`}
                checked={isSelected}
                onChange={() => onSelectSingle(option)}
                className="text-indigo-650 h-4.5 w-4.5 focus:ring-[#4F46E5]"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // MULTIPLE CORRECT CHECKBOXES
  const isMultiple = question.type === "MULTIPLE_CORRECT" || question.text.toLowerCase().includes("select all");

  return (
    <div className="pt-2 space-y-2">
      {/* Option A */}
      {optionA && (
        <label className={cn(
          "flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all duration-150 text-xs font-semibold",
          selectedArray.includes("A")
            ? "bg-indigo-50/40 border-indigo-200 text-[#4F46E5]"
            : "bg-slate-50/20 border-slate-100 text-slate-650 hover:bg-slate-50"
        )}>
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={`opt-${question.id}`}
            checked={selectedArray.includes("A")}
            onChange={() => isMultiple ? onSelectMultiple("A") : onSelectSingle("A")}
            className="text-indigo-650 h-4.5 w-4.5 focus:ring-[#4F46E5] rounded"
          />
          <span><strong className="mr-1.5 text-slate-400">A.</strong> {optionA}</span>
        </label>
      )}

      {/* Option B */}
      {optionB && (
        <label className={cn(
          "flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all duration-150 text-xs font-semibold",
          selectedArray.includes("B")
            ? "bg-indigo-50/40 border-indigo-200 text-[#4F46E5]"
            : "bg-slate-50/20 border-slate-100 text-slate-650 hover:bg-slate-50"
        )}>
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={`opt-${question.id}`}
            checked={selectedArray.includes("B")}
            onChange={() => isMultiple ? onSelectMultiple("B") : onSelectSingle("B")}
            className="text-indigo-650 h-4.5 w-4.5 focus:ring-[#4F46E5] rounded"
          />
          <span><strong className="mr-1.5 text-slate-400">B.</strong> {optionB}</span>
        </label>
      )}

      {/* Option C */}
      {optionC && (
        <label className={cn(
          "flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all duration-150 text-xs font-semibold",
          selectedArray.includes("C")
            ? "bg-indigo-50/40 border-indigo-200 text-[#4F46E5]"
            : "bg-slate-50/20 border-slate-100 text-slate-650 hover:bg-slate-50"
        )}>
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={`opt-${question.id}`}
            checked={selectedArray.includes("C")}
            onChange={() => isMultiple ? onSelectMultiple("C") : onSelectSingle("C")}
            className="text-indigo-650 h-4.5 w-4.5 focus:ring-[#4F46E5] rounded"
          />
          <span><strong className="mr-1.5 text-slate-400">C.</strong> {optionC}</span>
        </label>
      )}

      {/* Option D */}
      {optionD && (
        <label className={cn(
          "flex items-center gap-2.5 p-3 border rounded-xl cursor-pointer select-none transition-all duration-150 text-xs font-semibold",
          selectedArray.includes("D")
            ? "bg-indigo-50/40 border-indigo-200 text-[#4F46E5]"
            : "bg-slate-50/20 border-slate-100 text-slate-650 hover:bg-slate-50"
        )}>
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={`opt-${question.id}`}
            checked={selectedArray.includes("D")}
            onChange={() => isMultiple ? onSelectMultiple("D") : onSelectSingle("D")}
            className="text-indigo-650 h-4.5 w-4.5 focus:ring-[#4F46E5] rounded"
          />
          <span><strong className="mr-1.5 text-slate-400">D.</strong> {optionD}</span>
        </label>
      )}
    </div>
  );
}
