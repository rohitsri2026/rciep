"use client";
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useState, useEffect } from "react";
import { 
  ArrowLeft, Search, Loader2, AlertCircle, Trash2, Plus, 
  Eye, GripVertical, X, CheckCircle,
  AlertTriangle, Copy, Save,
  BookOpen, Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subjectId: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options?: any;
  difficulty: string;
  status: string;
  correctAnswer: string;
  explanation: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  subjectId: string;
  categoryId: string | null;
  createdAt: string;
  category?: Category | null;
  _count?: {
    tests: number;
  };
}

interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
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
  status: string;
  visibility: string;
  negativeMarking: number;
  instructions: string | null;
  subjectId: string;
  categoryId?: string | null;
  allowMultipleAttempts: boolean;
  allowResume: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  showAnswersAfterSubmission: boolean;
  startDate: string | null;
  endDate: string | null;
}

interface TestQuestionsClientProps {
  testId: string;
}

interface TestSection {
  name: string;
  timeLimit: number; // in minutes
  marks: number;
  questionCount: number;
}

export function TestQuestionsClient({ testId }: TestQuestionsClientProps) {
  // Tabs V2
  const [activeTab, setActiveTab] = useState<"details" | "sections" | "questions" | "schedule" | "preview" | "publish">("details");

  // Page states
  const [test, setTest] = useState<Test | null>(null);
  const [assignedQuestions, setAssignedQuestions] = useState<TestQuestion[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(true);

  // Form states (buffered locally for editing details)
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("MOCK_TEST");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formTotalMarks, setFormTotalMarks] = useState(100);
  const [formPassMarks, setFormPassMarks] = useState(35);
  const [formNegMarking, setFormNegMarking] = useState(0.25);
  const [formInstructions, setFormInstructions] = useState("");
  const [formVisibility, setFormVisibility] = useState("PUBLIC");
  
  // Scheduling state
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formAttempts, setFormAttempts] = useState(true); // true = multiple, false = single

  // Section Builder state
  const [sections, setSections] = useState<TestSection[]>([]);
  const [newSecName, setNewSecName] = useState("");
  const [newSecTime, setNewSecTime] = useState(15);
  const [newSecMarks, setNewSecMarks] = useState(25);
  const [newSecCount, setNewSecCount] = useState(5);

  // Question Bank Selector states
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filter parameters
  const [bankSearch, setBankSearch] = useState("");
  const [bankSubject, setBankSubject] = useState("all");
  const [bankCategory, setBankCategory] = useState("all");
  const [bankDifficulty, setBankDifficulty] = useState("all");
  const [bankType, setBankType] = useState("all");
  const [bankPage, setBankPage] = useState(1);
  const [bankTotalPages, setBankTotalPages] = useState(1);
  const bankLimit = 8;

  // Selections
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([]);

  // Modals & Panels
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Preview CBT Simulator state
  const [cbtActiveIdx, setCbtActiveIdx] = useState(0);
  const [cbtSelectedAnswers, setCbtSelectedAnswers] = useState<Record<string, string>>({});
  const [cbtCalcOpen, setCbtCalcOpen] = useState(false);
  const [cbtCalcInput, setCbtCalcInput] = useState("");

  // Notifiers
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initial Loaders
  useEffect(() => {
    fetchTestDetails();
    fetchAssignedQuestions();
    loadDependencies();
  }, [testId]);

  // Keyboard Shortcuts Mappings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveTestDetails();
      } else if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setActiveTab("preview");
      } else if (e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        setActiveTab("questions");
        setIsSelectorOpen(true);
      } else if (e.altKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        setActiveTab("publish");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [test, formTitle, formDesc, formType, formSubjectId, formCategoryId, formDuration, formTotalMarks, formPassMarks, formNegMarking, formInstructions, formVisibility, formStartDate, formEndDate, formAttempts, sections]);

  // Load Bank dependencies
  const loadDependencies = async () => {
    try {
      const [resSub, resCat] = await Promise.all([
        fetch("/api/subjects"),
        fetch("/api/categories")
      ]);
      if (resSub.ok) {
        const dataSub = await resSub.json();
        setSubjects(dataSub.subjects || []);
      }
      if (resCat.ok) {
        const dataCat = await resCat.json();
        setCategories(dataCat.categories || []);
      }
    } catch (err) {
      console.error("Failed to load filter metadata", err);
    }
  };

  const fetchTestDetails = async () => {
    try {
      const res = await fetch(`/api/tests`);
      if (res.ok) {
        const data = await res.json();
        const found = data.tests?.find((t: Test) => t.id === testId);
        if (found) {
          setTest(found);
          setFormTitle(found.title);
          setFormType(found.type);
          setFormSubjectId(found.subjectId);
          setFormCategoryId(found.categoryId || "");
          setFormDuration(found.duration);
          setFormTotalMarks(found.totalMarks);
          setFormPassMarks(found.passMarks);
          setFormNegMarking(found.negativeMarking);
          setFormInstructions(found.instructions || "");
          setFormVisibility(found.visibility);
          setFormStartDate(found.startDate ? found.startDate.substring(0, 16) : "");
          setFormEndDate(found.endDate ? found.endDate.substring(0, 16) : "");
          setFormAttempts(found.allowMultipleAttempts);

          // Parse metadata JSON envelope in description for custom sections
          try {
            if (found.description && found.description.startsWith("{")) {
              const parsed = JSON.parse(found.description);
              setFormDesc(parsed.description || "");
              setSections(parsed.sections || []);
            } else {
              setFormDesc(found.description || "");
              setSections([
                { name: "Reasoning Ability", timeLimit: 15, marks: 25, questionCount: 5 },
                { name: "Quantitative Aptitude", timeLimit: 15, marks: 25, questionCount: 5 },
                { name: "English Language", timeLimit: 15, marks: 25, questionCount: 5 },
                { name: "General Awareness", timeLimit: 15, marks: 25, questionCount: 5 }
              ]);
            }
          } catch {
            setFormDesc(found.description || "");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load test details", err);
    }
  };

  const fetchAssignedQuestions = async () => {
    try {
      setLoadingAssigned(true);
      const res = await fetch(`/api/tests/questions?testId=${testId}`);
      if (!res.ok) {
        throw new Error("Failed to load assigned questions");
      }
      const data = await res.json();
      setAssignedQuestions(data.assigned || []);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load assigned questions");
    } finally {
      setLoadingAssigned(false);
    }
  };

  const fetchBankQuestions = async () => {
    try {
      setLoadingBank(true);
      const params = new URLSearchParams({
        page: bankPage.toString(),
        limit: bankLimit.toString(),
      });

      if (bankSearch) params.append("search", bankSearch);
      if (bankSubject !== "all") params.append("subjectId", bankSubject);
      if (bankCategory !== "all") params.append("categoryId", bankCategory);
      if (bankDifficulty !== "all") params.append("difficulty", bankDifficulty);

      const res = await fetch(`/api/questions?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to search question bank");
      }
      const data = await res.json();
      
      let questionsList = data.questions || [];
      if (bankType !== "all") {
        questionsList = questionsList.filter((q: Question) => q.type === bankType);
      }

      setAllQuestions(questionsList);
      setBankTotalPages(data.totalPages || 1);
    } catch (err: any) {
      showNotification("error", err.message || "Failed to load question bank");
    } finally {
      setLoadingBank(false);
    }
  };

  // Trigger search on filter/page modification
  useEffect(() => {
    if (isSelectorOpen) {
      fetchBankQuestions();
    }
  }, [isSelectorOpen, bankPage, bankSubject, bankCategory, bankDifficulty, bankType]);

  // Debounced search input trigger
  useEffect(() => {
    if (!isSelectorOpen) return;
    const timer = setTimeout(() => {
      setBankPage(1);
      fetchBankQuestions();
    }, 450);
    return () => clearTimeout(timer);
  }, [bankSearch]);

  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // SAVE TEST DETAILS API
  const handleSaveTestDetails = async () => {
    try {
      setSubmitting(true);
      // Package custom sections & description into description JSON envelope
      const descriptionWrapper = JSON.stringify({
        description: formDesc,
        sections: sections
      });

      const payload = {
        title: formTitle,
        description: descriptionWrapper,
        type: formType,
        subjectId: formSubjectId,
        categoryId: formCategoryId || null,
        duration: formDuration,
        totalMarks: formTotalMarks,
        passMarks: formPassMarks,
        negativeMarking: formNegMarking,
        instructions: formInstructions,
        visibility: formVisibility,
        startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
        endDate: formEndDate ? new Date(formEndDate).toISOString() : null,
        allowMultipleAttempts: formAttempts
      };

      const res = await fetch(`/api/tests?id=${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update test parameters");
      }

      showNotification("success", "Test parameters updated successfully");
      fetchTestDetails();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ADD SELECTED QUESTIONS
  const handleAddSelectedQuestions = async () => {
    if (selectedBankIds.length === 0) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/tests/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          questionIds: selectedBankIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign questions");
      }
      showNotification("success", `Assigned ${selectedBankIds.length} questions to test`);
      setSelectedBankIds([]);
      setIsSelectorOpen(false);
      fetchAssignedQuestions();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // BULK REMOVE QUESTIONS
  const handleBulkRemoveQuestions = async () => {
    if (selectedAssignedIds.length === 0) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tests/questions?testId=${testId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: selectedAssignedIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove questions");
      }
      showNotification("success", `Removed ${selectedAssignedIds.length} questions`);
      setSelectedAssignedIds([]);
      fetchAssignedQuestions();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // INDIVIDUAL REMOVE
  const handleRemoveSingle = async (qId: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tests/questions?testId=${testId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: [qId],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove question");
      }
      showNotification("success", "Question removed successfully");
      fetchAssignedQuestions();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // OVERRIDE MARKS
  const handleOverrideSave = async (questionId: string, currentMarks: number, currentNeg: number, nextVal: number, field: "marks" | "negativeMark") => {
    if (field === "marks" && currentMarks === nextVal) return;
    if (field === "negativeMark" && currentNeg === nextVal) return;

    if (nextVal < 0) {
      showNotification("error", "Values cannot be negative");
      return;
    }

    try {
      const payload = {
        testId,
        questionId,
        marks: field === "marks" ? nextVal : currentMarks,
        negativeMark: field === "negativeMark" ? nextVal : currentNeg,
      };

      const res = await fetch("/api/tests/questions/override", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save overrides");
      }

      showNotification("success", "Overrides updated successfully");
      fetchAssignedQuestions();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // DRAG & DROP sequence ordering
  const handleDragStart = (idx: number) => {
    setDraggedIndex(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === idx) return;

    const newList = [...assignedQuestions];
    const draggedItem = newList[draggedIndex];
    newList.splice(draggedIndex, 1);
    newList.splice(idx, 0, draggedItem);

    setDraggedIndex(idx);
    setAssignedQuestions(newList);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      const sequenceIds = assignedQuestions.map(q => q.questionId);
      const res = await fetch("/api/tests/questions/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testId,
          questionIds: sequenceIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to persist new sequence");
      }
      showNotification("success", "Sequence order updated successfully");
      fetchAssignedQuestions();
    } catch (err: any) {
      showNotification("error", err.message);
      fetchAssignedQuestions();
    }
  };

  // DUPLICATE TEST
  const handleDuplicateTest = async () => {
    if (!test) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/tests/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: test.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to duplicate test");
      }
      showNotification("success", "Test duplicated successfully as Draft");
      window.location.href = `/admin/tests/questions?testId=${data.test.id}`;
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // STATUS UPDATE
  const handleStatusUpdate = async (nextStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tests?id=${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to switch status");
      }
      showNotification("success", `Test status changed to ${nextStatus}`);
      fetchTestDetails();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // SECTION BUILDER METHODS
  const handleAddSection = () => {
    if (!newSecName.trim()) return;
    setSections([...sections, {
      name: newSecName.trim(),
      timeLimit: newSecTime,
      marks: newSecMarks,
      questionCount: newSecCount
    }]);
    setNewSecName("");
  };

  const handleRemoveSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  // VALIDATION CHECKS
  const totalQuestionMarks = assignedQuestions.reduce((acc, q) => acc + q.marks, 0);
  const totalSectionTime = sections.reduce((acc, s) => acc + s.timeLimit, 0);
  const duplicateQuestionsCount = assignedQuestions.filter(
    (q, idx, self) => self.findIndex(x => x.questionId === q.questionId) !== idx
  ).length;

  const validations = {
    emptyAssigned: assignedQuestions.length === 0,
    duplicateQuestions: duplicateQuestionsCount > 0,
    marksMismatch: totalQuestionMarks !== formTotalMarks,
    durationMismatch: sections.length > 0 && totalSectionTime !== formDuration,
  };

  const filteredCategories = categories.filter(c => c.subjectId === formSubjectId);

  return (
    <div className="h-screen flex flex-col justify-between bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* Toast notifications alerts */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-[999] p-3.5 rounded-xl shadow-lg border border-emerald-500/20 bg-slate-950 text-emerald-400 max-w-sm flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-250">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />
          <span className="text-xs font-bold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-[999] p-3.5 rounded-xl shadow-lg border border-rose-500/20 bg-slate-950 text-rose-455 max-w-sm flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-250">
          <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
          <span className="text-xs font-bold">{errorMsg}</span>
        </div>
      )}

      {/* TOP CMS HEADER BAR */}
      <header className="h-14 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.location.href = "/admin/tests"}
            variant="ghost"
            size="sm"
            className="h-8.5 rounded-xl hover:bg-slate-800 text-slate-400 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> CMS Dashboard
          </Button>
          <span className="text-slate-700">|</span>
          <div className="space-y-0.5">
            <h2 className="text-xs font-black text-slate-150 uppercase tracking-widest truncate max-w-[250px]">{test?.title || "Test Builder"}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CMS v2 Enterprise Workspace</p>
          </div>
        </div>

        {/* Shortcuts Hints indicator */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] font-bold text-slate-500">
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md"><kbd>Alt + S</kbd> Save Details</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md"><kbd>Alt + P</kbd> Preview Mock</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md"><kbd>Alt + Q</kbd> Question Bank</span>
          <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md"><kbd>Alt + V</kbd> Validation</span>
        </div>
      </header>

      {/* MAIN TWO PANEL WORKSPACE */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT COMPONENT SIDEBAR SECTIONS */}
        <aside className="w-[240px] bg-slate-955/40 border-r border-slate-800 shrink-0 flex flex-col justify-between p-4.5 gap-2 select-none z-10">
          <div className="space-y-1">
            <span className="text-[9.5px] font-black text-slate-655 uppercase tracking-widest block mb-3 px-2">Workspace Controls</span>
            
            {[
              { id: "details", label: "Test Details", count: null },
              { id: "sections", label: "Section Builder", count: sections.length },
              { id: "questions", label: "Question Palette", count: assignedQuestions.length },
              { id: "schedule", label: "Live Scheduling", count: null },
              { id: "preview", label: "CBT Preview Simulator", count: null },
              { id: "publish", label: "Validation & Publish", count: Object.values(validations).filter(Boolean).length ? "!" : null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full h-10 px-3 flex items-center justify-between text-xs font-bold rounded-xl cursor-pointer border-0 transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-[#4F46E5] text-white shadow-md shadow-indigo-650/20" 
                    : "text-slate-400 hover:bg-slate-850/60 hover:text-slate-200"
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <Badge className={cn(
                    "font-bold text-[9px] px-1.5 py-0.2 rounded-full",
                    tab.id === "publish" && tab.count === "!" 
                      ? "bg-amber-600 text-white animate-pulse" 
                      : "bg-slate-800 text-slate-350"
                  )}>{tab.count}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Statistics status summary block */}
          <div className="p-3.5 bg-slate-955 border border-slate-850 rounded-xl space-y-2 text-[10.5px]">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Active Questions:</span>
              <strong className="text-slate-300 font-extrabold">{assignedQuestions.length} Qs</strong>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Marks Weighted:</span>
              <strong className="text-slate-300 font-extrabold">{totalQuestionMarks} / {formTotalMarks}</strong>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-500">Test Status:</span>
              <strong className="text-slate-300 font-extrabold uppercase">{test?.status || "DRAFT"}</strong>
            </div>
          </div>
        </aside>

        {/* RIGHT WORKSPACE DISPLAY SECTION */}
        <main className="flex-1 bg-slate-900/60 overflow-y-auto p-6 relative min-w-0">
          
          {/* ==================================================
              SECTION 1: TEST DETAILS
              ================================================== */}
          {activeTab === "details" && (
            <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-[#4F46E5] tracking-widest">Test Details Configuration</h3>
                <p className="text-xs text-slate-455">Set metadata, subject classifications, and default scoring details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Exam Test Name</Label>
                  <Input 
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="border-slate-800 focus:ring-[#4F46E5] bg-slate-950 text-slate-200" 
                    placeholder="Enter exam paper title"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Exam Category Type</Label>
                  <Select value={formType} onValueChange={(val) => setFormType(val || "")}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200">
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                      <SelectItem value="PRACTICE_QUIZ">Practice Quiz</SelectItem>
                      <SelectItem value="MOCK_TEST">Full Mock Test</SelectItem>
                      <SelectItem value="SECTIONAL_TEST">Sectional Quiz</SelectItem>
                      <SelectItem value="PREVIOUS_YEAR_PAPER">Previous Year Paper</SelectItem>
                      <SelectItem value="DAILY_QUIZ">Daily Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Subject Classification</Label>
                  <Select value={formSubjectId} onValueChange={(val) => { setFormSubjectId(val || ""); setFormCategoryId(""); }}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Category Tag</Label>
                  <Select value={formCategoryId} onValueChange={(val) => setFormCategoryId(val || "")}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200">
                      <SelectValue placeholder="Choose category tag..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                      <SelectItem value="none">No specific category</SelectItem>
                      {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Duration (in Minutes)</Label>
                  <Input 
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value) || 0)}
                    className="border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Total Marks Target</Label>
                  <Input 
                    type="number"
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(parseInt(e.target.value) || 0)}
                    className="border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Passing Marks Threshold</Label>
                  <Input 
                    type="number"
                    value={formPassMarks}
                    onChange={(e) => setFormPassMarks(parseInt(e.target.value) || 0)}
                    className="border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Negative Marking Penalty</Label>
                  <Input 
                    type="number"
                    step="0.05"
                    value={formNegMarking}
                    onChange={(e) => setFormNegMarking(parseFloat(e.target.value) || 0)}
                    className="border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Short Description</Label>
                  <textarea 
                    value={formDesc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormDesc(e.target.value)}
                    className="flex min-h-[60px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4F46E5]"
                    placeholder="Provide overview details..."
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Exam Instructions Summary</Label>
                  <textarea 
                    value={formInstructions}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormInstructions(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4F46E5]"
                    placeholder="Enter instructions displayed to student before exam cockpit launches..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              SECTION 2: QUESTION ASSIGNMENT & PALETTE
              ================================================== */}
          {activeTab === "questions" && (
            <div className="space-y-5 animate-in fade-in duration-200 h-full flex flex-col">
              <div className="flex justify-between items-center shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-black uppercase text-[#4F46E5] tracking-widest">Question Assignment V2</h3>
                  <p className="text-xs text-slate-455">Override weights, drag rows to reorder, or search questions repository.</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedAssignedIds.length > 0 && (
                    <Button 
                      onClick={handleBulkRemoveQuestions} 
                      className="bg-rose-900 hover:bg-rose-955 text-rose-200 text-xs cursor-pointer border-0 rounded-xl h-9"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Selected ({selectedAssignedIds.length})
                    </Button>
                  )}
                  <Button 
                    onClick={() => setIsSelectorOpen(true)} 
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold cursor-pointer border-0 rounded-xl h-9"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Browse Question Bank
                  </Button>
                </div>
              </div>

              {/* Assigned List Grid Table */}
              <div className="flex-1 bg-slate-950/60 border border-slate-850 rounded-2xl overflow-y-auto min-h-0">
                <Table className="text-xs text-slate-350">
                  <TableHeader className="bg-slate-950/90 sticky top-0 border-b border-slate-800">
                    <TableRow className="border-slate-800 hover:bg-slate-950">
                      <TableHead className="w-10">
                        <input 
                          type="checkbox"
                          checked={assignedQuestions.length > 0 && selectedAssignedIds.length === assignedQuestions.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignedIds(assignedQuestions.map(q => q.questionId));
                            } else {
                              setSelectedAssignedIds([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-12 text-slate-400 font-bold uppercase">Order</TableHead>
                      <TableHead className="text-slate-400 font-bold uppercase">Question Statement</TableHead>
                      <TableHead className="w-32 text-slate-400 font-bold uppercase text-center">Marks Override</TableHead>
                      <TableHead className="w-32 text-slate-400 font-bold uppercase text-center">Penalty Override</TableHead>
                      <TableHead className="w-24 text-slate-400 font-bold uppercase text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingAssigned ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-8">
                          <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5] mx-auto mb-2" />
                          <span>Checking assigned indexes...</span>
                        </TableCell>
                      </TableRow>
                    ) : assignedQuestions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-8 text-slate-505 font-medium">
                          No questions assigned. Click &quot;Browse Question Bank&quot; to assign questions.
                        </TableCell>
                      </TableRow>
                    ) : (
                      assignedQuestions.map((tq, idx) => (
                        <TableRow 
                          key={tq.id} 
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className="border-slate-850 hover:bg-slate-900/50 cursor-grab active:cursor-grabbing transition-colors"
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedAssignedIds.includes(tq.questionId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAssignedIds([...selectedAssignedIds, tq.questionId]);
                                } else {
                                  setSelectedAssignedIds(selectedAssignedIds.filter(id => id !== tq.questionId));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-slate-605"><GripVertical className="w-4 h-4 cursor-row-resize" /></TableCell>
                          <TableCell className="font-bold text-slate-500">Q{idx + 1}</TableCell>
                          <TableCell className="max-w-[400px] truncate font-medium text-slate-200">
                            {tq.question.text}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Input 
                              type="number"
                              defaultValue={tq.marks}
                              onBlur={(e) => handleOverrideSave(tq.questionId, tq.marks, tq.negativeMark, parseFloat(e.target.value) || 0, "marks")}
                              className="w-20 mx-auto text-center border-slate-800 bg-slate-950 text-slate-200 h-8.5 rounded-lg"
                            />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Input 
                              type="number"
                              step="0.05"
                              defaultValue={tq.negativeMark}
                              onBlur={(e) => handleOverrideSave(tq.questionId, tq.marks, tq.negativeMark, parseFloat(e.target.value) || 0, "negativeMark")}
                              className="w-20 mx-auto text-center border-slate-800 bg-slate-950 text-slate-200 h-8.5 rounded-lg"
                            />
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()} className="text-center space-x-1.5">
                            <Button 
                              onClick={() => setPreviewQuestion(tq.question)} 
                              variant="ghost" 
                              size="sm" 
                              className="h-8.5 w-8.5 p-0 hover:bg-slate-800 rounded-lg cursor-pointer"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4 text-indigo-400" />
                            </Button>
                            <Button 
                              onClick={() => handleRemoveSingle(tq.questionId)} 
                              variant="ghost" 
                              size="sm" 
                              className="h-8.5 w-8.5 p-0 hover:bg-rose-955 rounded-lg cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ==================================================
              SECTION 3: SECTION BUILDER
              ================================================== */}
          {activeTab === "sections" && (
            <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-[#4F46E5] tracking-widest">Section Builder Config</h3>
                <p className="text-xs text-slate-455">Define sectional divisions, sectional timers, and target scores.</p>
              </div>

              {/* Form to add custom sections */}
              <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold text-xs uppercase">Section Title</Label>
                  <Input 
                    value={newSecName}
                    onChange={(e) => setNewSecName(e.target.value)}
                    placeholder="E.g., Logical Reasoning" 
                    className="border-slate-800 bg-slate-905 text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 col-span-2">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold text-xs uppercase">Time (mins)</Label>
                    <Input 
                      type="number" 
                      value={newSecTime}
                      onChange={(e) => setNewSecTime(parseInt(e.target.value) || 1)}
                      className="border-slate-800 bg-slate-905 text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold text-xs uppercase">Target Qs</Label>
                    <Input 
                      type="number"
                      value={newSecCount}
                      onChange={(e) => setNewSecCount(parseInt(e.target.value) || 1)}
                      className="border-slate-800 bg-slate-905 text-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 font-bold text-xs uppercase">Marks</Label>
                    <Input 
                      type="number"
                      value={newSecMarks}
                      onChange={(e) => setNewSecMarks(parseInt(e.target.value) || 1)}
                      className="border-slate-800 bg-slate-905 text-slate-200"
                    />
                  </div>
                </div>
                <div>
                  <Button 
                    onClick={handleAddSection} 
                    className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl h-9.5 border-0 cursor-pointer"
                  >
                    Add Section
                  </Button>
                </div>
              </div>

              {/* Sections list overview */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Configured Sections ({sections.length})</span>
                {sections.length === 0 ? (
                  <div className="p-6 text-center bg-slate-955/40 border border-slate-850 rounded-xl text-slate-500 text-xs">
                    No custom sections defined. Using a single dynamic section.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sections.map((sec, idx) => (
                      <Card key={idx} className="border-slate-800 bg-slate-955 rounded-xl overflow-hidden shadow-sm">
                        <CardContent className="p-4 flex justify-between items-center text-xs text-slate-400 font-semibold gap-3">
                          <div className="space-y-1">
                            <h4 className="font-black text-slate-200 text-sm">{sec.name}</h4>
                            <div className="flex gap-4">
                              <span>Time: <strong>{sec.timeLimit}m</strong></span>
                              <span>Target: <strong>{sec.questionCount} Qs</strong></span>
                              <span>Weight: <strong>{sec.marks} Marks</strong></span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleRemoveSection(idx)} 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-rose-955 rounded-lg cursor-pointer"
                          >
                            <Trash className="w-4 h-4 text-rose-500" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              SECTION 4: SCHEDULING & ATTRIBUTES
              ================================================== */}
          {activeTab === "schedule" && (
            <div className="max-w-2xl space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-[#4F46E5] tracking-widest">Scheduling & Live Settings</h3>
                <p className="text-xs text-slate-455">Control execution window parameters and duplicate protection settings.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold uppercase block">Publish Start Date</Label>
                  <Input 
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-400 font-bold uppercase block">Expiry End Date</Label>
                  <Input 
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="border-slate-800 bg-slate-950 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5 bg-slate-950 p-4 border border-slate-850 rounded-2xl flex items-center justify-between col-span-2">
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-200 uppercase tracking-wide">Candidate Attempt Limit</span>
                    <p className="text-[10px] text-slate-500 font-medium">Toggle if candidates can practice this exam multiple times.</p>
                  </div>
                  <input 
                    type="checkbox"
                    checked={formAttempts}
                    onChange={(e) => setFormAttempts(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>

                <div className="space-y-1.5 bg-slate-950 p-4 border border-slate-850 rounded-2xl flex items-center justify-between col-span-2">
                  <div className="space-y-0.5">
                    <span className="font-black text-slate-200 uppercase tracking-wide">Test Visibility Status</span>
                    <p className="text-[10px] text-slate-500 font-medium">Control whether this quiz shows up in public list views.</p>
                  </div>
                  <Select value={formVisibility} onValueChange={(val) => setFormVisibility(val || "")}>
                    <SelectTrigger className="border-slate-800 bg-slate-900 text-slate-200 w-36 h-9 rounded-xl">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                      <SelectItem value="PUBLIC">Public list</SelectItem>
                      <SelectItem value="PRIVATE">Private link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              SECTION 5: LIVE SIMULATED PREVIEW
              ================================================== */}
          {activeTab === "preview" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-[#4F46E5] tracking-widest">CBT Exam Preview Simulator</h3>
                <p className="text-xs text-slate-455">Simulated live cockpit dashboard layout previewing user-facing controls.</p>
              </div>

              {assignedQuestions.length === 0 ? (
                <div className="p-12 text-center bg-slate-955 border border-slate-855 rounded-2xl text-slate-500 text-xs">
                  No questions assigned. Please assign questions to launch preview simulator.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-955 shadow-2xl flex flex-col h-[520px] text-xs font-sans">
                  
                  {/* Mock CBT Top Header */}
                  <header className="h-10 bg-indigo-950/80 px-4 flex items-center justify-between border-b border-indigo-900 shrink-0 text-[11px] text-white">
                    <span className="font-bold truncate max-w-[200px]">{formTitle || "Mock Test Title"}</span>
                    <div className="flex items-center gap-4">
                      <span>Time Remaining: <strong>{formDuration}:00</strong></span>
                      <Button onClick={() => setCbtCalcOpen(true)} className="h-6.5 bg-slate-850 text-white rounded text-[10px] py-1 cursor-pointer">Calculator</Button>
                    </div>
                  </header>

                  <div className="flex-1 flex overflow-hidden min-h-0">
                    
                    {/* Mock Question Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-[#4F46E5]">Question No. {cbtActiveIdx + 1}</span>
                        <span className="text-[10px] text-slate-500 font-bold">Marks: +{assignedQuestions[cbtActiveIdx]?.marks} | -{assignedQuestions[cbtActiveIdx]?.negativeMark}</span>
                      </div>

                      <p className="text-slate-200 font-semibold leading-relaxed">
                        {assignedQuestions[cbtActiveIdx]?.question.text}
                      </p>

                      {/* Options rendering */}
                      {assignedQuestions[cbtActiveIdx]?.question.type !== "NUMERICAL" ? (
                        <div className="space-y-2 pt-2">
                          {["A", "B", "C", "D"].map((optKey) => {
                            const qOpts = (assignedQuestions[cbtActiveIdx]?.question?.options as any) || {};
                            const optText = optKey === "A" 
                              ? (qOpts.A || assignedQuestions[cbtActiveIdx]?.question.optionA) 
                              : optKey === "B" 
                              ? (qOpts.B || assignedQuestions[cbtActiveIdx]?.question.optionB) 
                              : optKey === "C" 
                              ? (qOpts.C || assignedQuestions[cbtActiveIdx]?.question.optionC) 
                              : (qOpts.D || assignedQuestions[cbtActiveIdx]?.question.optionD);

                            if (!optText) return null;
                            const isSelected = cbtSelectedAnswers[assignedQuestions[cbtActiveIdx]?.questionId] === optKey;

                            return (
                              <label
                                key={optKey}
                                onClick={() => setCbtSelectedAnswers({
                                  ...cbtSelectedAnswers,
                                  [assignedQuestions[cbtActiveIdx]?.questionId]: optKey
                                })}
                                className={cn(
                                  "p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all",
                                  isSelected 
                                    ? "bg-indigo-950/40 border-[#4F46E5] text-indigo-400" 
                                    : "bg-slate-950 border-slate-800 text-slate-350 hover:bg-slate-850"
                                )}
                              >
                                <span className="font-bold text-slate-500">{optKey}.</span>
                                <span>{optText}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <Input 
                          placeholder="Type numerical answer..."
                          className="border-slate-800 bg-slate-950 text-slate-200 max-w-xs text-xs h-8.5 rounded-lg"
                        />
                      )}
                    </div>

                    {/* Mock Question Palette */}
                    <div className="w-[180px] bg-slate-950 border-l border-slate-855 p-3 shrink-0 overflow-y-auto space-y-3">
                      <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1.5">Palette Map</span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {assignedQuestions.map((q, idx) => {
                          const isAnswered = !!cbtSelectedAnswers[q.questionId];
                          const isActive = cbtActiveIdx === idx;
                          return (
                            <button
                              key={q.id}
                              onClick={() => setCbtActiveIdx(idx)}
                              className={cn(
                                "w-7 h-7 font-black rounded-lg cursor-pointer transition-all border-0 text-[10px] text-center",
                                isActive 
                                  ? "bg-[#4F46E5] text-white ring-2 ring-indigo-400" 
                                  : isAnswered 
                                  ? "bg-emerald-600 text-white" 
                                  : "bg-slate-800 text-slate-400 hover:bg-slate-750"
                              )}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  {/* Mock CBT Action Bar */}
                  <footer className="h-10 bg-slate-950 border-t border-slate-855 px-4 flex items-center justify-between shrink-0">
                    <Button 
                      onClick={() => setCbtSelectedAnswers({
                        ...cbtSelectedAnswers,
                        [assignedQuestions[cbtActiveIdx]?.questionId]: ""
                      })}
                      className="bg-slate-800 hover:bg-slate-750 text-white rounded text-[10px] py-1 cursor-pointer"
                    >
                      Clear Response
                    </Button>
                    <div className="space-x-1.5">
                      <Button 
                        disabled={cbtActiveIdx === 0}
                        onClick={() => setCbtActiveIdx(prev => prev - 1)}
                        className="bg-slate-800 hover:bg-slate-750 text-white rounded text-[10px] py-1 cursor-pointer"
                      >
                        Prev
                      </Button>
                      <Button 
                        disabled={cbtActiveIdx === assignedQuestions.length - 1}
                        onClick={() => setCbtActiveIdx(prev => prev + 1)}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-[10px] py-1 cursor-pointer"
                      >
                        Save & Next
                      </Button>
                    </div>
                  </footer>

                </div>
              )}
            </div>
          )}

          {/* ==================================================
              SECTION 6 & 7: VALIDATION, PUBLISH & STATUS
              ================================================== */}
          {activeTab === "publish" && (
            <div className="max-w-3xl space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-[#4F46E5] tracking-widest">Validation & Live Publishing</h3>
                <p className="text-xs text-slate-455">Review scorecard integrity logs before publishing paper online.</p>
              </div>

              {/* Validation Cards checklist */}
              <div className="space-y-3.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Structural Integrity Checks</span>
                
                <div className="space-y-2.5">
                  <div className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between text-xs",
                    validations.emptyAssigned 
                      ? "bg-rose-950/20 border-rose-500/20 text-rose-400" 
                      : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  )}>
                    <div className="space-y-0.5">
                      <strong className="font-extrabold block">Assigned Questions Check</strong>
                      <span className="text-[10px] text-slate-500">{assignedQuestions.length} questions currently assigned.</span>
                    </div>
                    {validations.emptyAssigned ? <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>

                  <div className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between text-xs",
                    validations.duplicateQuestions 
                      ? "bg-rose-950/20 border-rose-500/20 text-rose-400" 
                      : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  )}>
                    <div className="space-y-0.5">
                      <strong className="font-extrabold block">Duplicate Entries Warning</strong>
                      <span className="text-[10px] text-slate-500">{duplicateQuestionsCount} duplicates identified.</span>
                    </div>
                    {validations.duplicateQuestions ? <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>

                  <div className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between text-xs",
                    validations.marksMismatch 
                      ? "bg-amber-950/20 border-amber-500/20 text-amber-400" 
                      : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  )}>
                    <div className="space-y-0.5">
                      <strong className="font-extrabold block">Total Marks Matching</strong>
                      <span className="text-[10px] text-slate-550">Marks target is {formTotalMarks}, assigned questions sum is {totalQuestionMarks}.</span>
                    </div>
                    {validations.marksMismatch ? <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>

                  <div className={cn(
                    "p-3.5 rounded-xl border flex items-center justify-between text-xs",
                    validations.durationMismatch 
                      ? "bg-amber-950/20 border-amber-500/20 text-amber-400" 
                      : "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                  )}>
                    <div className="space-y-0.5">
                      <strong className="font-extrabold block">Section Timers Matching</strong>
                      <span className="text-[10px] text-slate-550">Exam duration limit {formDuration}m, sectional sums {totalSectionTime}m.</span>
                    </div>
                    {validations.durationMismatch ? <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" /> : <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                  </div>
                </div>
              </div>

              {/* Status Action Cards */}
              <div className="p-5 bg-slate-950 border border-slate-850 rounded-2xl space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-850 pb-2">Publish Control Settings</span>
                
                <div className="flex flex-wrap gap-2.5">
                  <Button 
                    onClick={() => handleStatusUpdate("DRAFT")}
                    disabled={test?.status === "DRAFT" || submitting}
                    className="bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl h-9.5 cursor-pointer border-0"
                  >
                    Revert to Draft
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate("PUBLISHED")}
                    disabled={test?.status === "PUBLISHED" || submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-9.5 cursor-pointer border-0"
                  >
                    Publish Online
                  </Button>
                  <Button 
                    onClick={() => handleStatusUpdate("ARCHIVED")}
                    disabled={test?.status === "ARCHIVED" || submitting}
                    className="bg-rose-900 hover:bg-rose-955 text-rose-200 text-xs font-bold rounded-xl h-9.5 cursor-pointer border-0"
                  >
                    Archive Exam
                  </Button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================================================
          STICKY BOTTOM ACTION CONTROL BAR
          ================================================== */}
      <footer className="h-16 bg-slate-950 border-t border-slate-800 px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3.5 text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-[#4F46E5]" /> {assignedQuestions.length} Questions</span>
          <span>•</span>
          <span>Marks: <strong className="text-slate-200 font-extrabold">{totalQuestionMarks} / {formTotalMarks}</strong></span>
          <span>•</span>
          <span>Status: <Badge variant="outline" className="border-indigo-800 text-indigo-400 bg-indigo-950/40 font-bold uppercase">{test?.status || "DRAFT"}</Badge></span>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleDuplicateTest} 
            variant="outline"
            disabled={submitting}
            className="h-9.5 rounded-xl border-slate-800 text-slate-355 hover:bg-slate-850 text-xs font-bold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 mr-1 text-slate-455" /> Duplicate
          </Button>
          <Button 
            onClick={handleSaveTestDetails} 
            disabled={submitting}
            className="h-9.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-extrabold cursor-pointer border-0 px-4.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save Parameters (Alt+S)
          </Button>
        </div>
      </footer>

      {/* QUESTION SELECTOR DIALOG BANK PANEL */}
      <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
        <DialogContent className="max-w-5xl bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-800 pb-3 flex flex-row justify-between items-center">
            <div>
              <DialogTitle className="text-slate-155 font-black text-sm uppercase tracking-wide">System Question Bank Repository</DialogTitle>
              <DialogDescription className="text-slate-500 text-[10.5px] mt-0.5">Browse available items and add them to this mock exam paper.</DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsSelectorOpen(false)} className="h-8 w-8 p-0 hover:bg-slate-800 rounded-full cursor-pointer">
              <X className="h-4.5 w-4.5 text-slate-550" />
            </Button>
          </DialogHeader>

          {/* Filters blocks */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 text-xs">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-550" />
              <Input 
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search statements..."
                className="pl-8 border-slate-800 bg-slate-955 text-slate-200 h-8.5 rounded-lg"
              />
            </div>

            <Select value={bankSubject} onValueChange={(val) => setBankSubject(val || "")}>
              <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200 h-8.5 rounded-lg">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={bankCategory} onValueChange={(val) => setBankCategory(val || "")}>
              <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200 h-8.5 rounded-lg">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={bankDifficulty} onValueChange={(val) => setBankDifficulty(val || "")}>
              <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200 h-8.5 rounded-lg">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>

            <Select value={bankType} onValueChange={(val) => setBankType(val || "")}>
              <SelectTrigger className="border-slate-800 bg-slate-950 text-slate-200 h-8.5 rounded-lg">
                <SelectValue placeholder="Question Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-955 border-slate-800 text-slate-200">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="MCQ">Multiple Choice</SelectItem>
                <SelectItem value="NUMERICAL">Numerical input</SelectItem>
                <SelectItem value="TRUE_FALSE">True / False</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question List Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden mt-4 min-h-[250px] bg-slate-950/40">
            <Table className="text-xs text-slate-400">
              <TableHeader className="bg-slate-950">
                <TableRow className="border-slate-800 hover:bg-slate-950">
                  <TableHead className="w-10">
                    <input 
                      type="checkbox"
                      checked={allQuestions.length > 0 && selectedBankIds.length === allQuestions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBankIds(allQuestions.map(q => q.id));
                        } else {
                          setSelectedBankIds([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase">Question text</TableHead>
                  <TableHead className="w-24 text-slate-400 font-bold uppercase">Difficulty</TableHead>
                  <TableHead className="w-24 text-slate-400 font-bold uppercase">Type</TableHead>
                  <TableHead className="w-20 text-slate-400 font-bold uppercase text-center">Correct</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBank ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8">
                      <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5] mx-auto mb-1" />
                      <span>Loading question repository...</span>
                    </TableCell>
                  </TableRow>
                ) : allQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-slate-505 font-medium">
                      No matching questions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allQuestions.map((q) => {
                    const isAssigned = assignedQuestions.some(x => x.questionId === q.id);
                    return (
                      <TableRow key={q.id} className="border-slate-850 hover:bg-slate-900/40">
                        <TableCell>
                          <input 
                            type="checkbox"
                            disabled={isAssigned}
                            checked={selectedBankIds.includes(q.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBankIds([...selectedBankIds, q.id]);
                              } else {
                                setSelectedBankIds(selectedBankIds.filter(id => id !== q.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="max-w-[400px] truncate text-slate-200">
                          {q.text}
                          {isAssigned && <Badge variant="outline" className="border-indigo-900/60 text-indigo-400 bg-indigo-950/20 text-[8px] font-bold py-0 ml-2 rounded uppercase">Already Assigned</Badge>}
                        </TableCell>
                        <TableCell className="uppercase">{q.difficulty}</TableCell>
                        <TableCell className="uppercase">{q.type}</TableCell>
                        <TableCell className="text-center uppercase font-bold text-emerald-500">{q.correctAnswer}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter className="border-t border-slate-800 pt-3 mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              <Button 
                disabled={bankPage === 1}
                onClick={() => setBankPage(prev => Math.max(prev - 1, 1))}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs h-8.5 rounded-lg cursor-pointer border-0"
              >
                Previous
              </Button>
              <Button 
                disabled={bankPage >= bankTotalPages}
                onClick={() => setBankPage(prev => Math.min(prev + 1, bankTotalPages))}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs h-8.5 rounded-lg cursor-pointer border-0"
              >
                Next
              </Button>
            </div>
            <div className="space-x-1.5">
              <Button 
                variant="outline"
                onClick={() => setIsSelectorOpen(false)}
                className="border-slate-800 text-slate-455 hover:bg-slate-855 text-xs h-8.5 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddSelectedQuestions}
                disabled={selectedBankIds.length === 0}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold h-8.5 rounded-lg cursor-pointer border-0"
              >
                Assign Selected Questions ({selectedBankIds.length})
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK PREVIEW SIDEBAR MODAL PANEL */}
      <Dialog open={!!previewQuestion} onOpenChange={() => setPreviewQuestion(null)}>
        <DialogContent className="max-w-md bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl">
          <DialogHeader className="border-b border-slate-800 pb-3 flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-slate-150 font-black text-sm uppercase">Quick Question Preview</DialogTitle>
              <DialogDescription className="text-slate-500 text-[10px] mt-0.5">Detailed solution parameters verification.</DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPreviewQuestion(null)} className="h-8 w-8 p-0 hover:bg-slate-800 rounded-full cursor-pointer">
              <X className="h-4.5 w-4.5 text-slate-550" />
            </Button>
          </DialogHeader>

          {previewQuestion && (
            <div className="space-y-4 pt-3 text-xs leading-relaxed text-slate-300">
              <div className="space-y-1">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest">Question Text</span>
                <p className="font-semibold text-slate-200">{previewQuestion.text}</p>
              </div>

              {previewQuestion.type !== "NUMERICAL" && (() => {
                const qOpts = (previewQuestion.options as any) || {};
                const optionA = qOpts.A || previewQuestion.optionA || "";
                const optionB = qOpts.B || previewQuestion.optionB || "";
                const optionC = qOpts.C || previewQuestion.optionC || "";
                const optionD = qOpts.D || previewQuestion.optionD || "";
                
                return (
                  <div className="space-y-1.5">
                    <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block mb-1">Option Items</span>
                    <div className="grid grid-cols-2 gap-2">
                      {optionA && (
                        <div className="p-2 border border-slate-800 rounded bg-slate-950 text-slate-400">
                          <strong className="text-slate-505 mr-1 font-bold">A.</strong>{optionA}
                        </div>
                      )}
                      {optionB && (
                        <div className="p-2 border border-slate-800 rounded bg-slate-950 text-slate-400">
                          <strong className="text-slate-505 mr-1 font-bold">B.</strong>{optionB}
                        </div>
                      )}
                      {optionC && (
                        <div className="p-2 border border-slate-800 rounded bg-slate-950 text-slate-400">
                          <strong className="text-slate-505 mr-1 font-bold">C.</strong>{optionC}
                        </div>
                      )}
                      {optionD && (
                        <div className="p-2 border border-slate-800 rounded bg-slate-950 text-slate-400">
                          <strong className="text-slate-505 mr-1 font-bold">D.</strong>{optionD}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-4">
                <div>
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">Answer Key</span>
                  <strong className="text-emerald-500 font-extrabold uppercase">{previewQuestion.correctAnswer}</strong>
                </div>
                <div>
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">Difficulty</span>
                  <strong className="text-slate-200 font-extrabold uppercase">{previewQuestion.difficulty}</strong>
                </div>
                <div>
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block">Type</span>
                  <strong className="text-slate-200 font-extrabold uppercase">{previewQuestion.type}</strong>
                </div>
              </div>

              {previewQuestion.explanation && (
                <div className="bg-indigo-950/20 border border-indigo-900/60 p-3 rounded-lg text-slate-400">
                  <strong className="text-slate-355 font-bold block text-[10px] uppercase mb-0.5">Solution Guide</strong>
                  {previewQuestion.explanation}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CBT SIMULATOR CALCULATOR MODAL */}
      <Dialog open={cbtCalcOpen} onOpenChange={setCbtCalcOpen}>
        <DialogContent className="max-w-xs bg-slate-955 border border-slate-855 p-4 rounded-2xl text-slate-300 font-mono">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-bold text-slate-450 uppercase">Sim Calculator</span>
            <Button variant="ghost" size="sm" onClick={() => setCbtCalcOpen(false)} className="h-6 w-6 p-0 hover:bg-slate-800 rounded-full cursor-pointer">
              <X className="h-4 w-4 text-slate-550" />
            </Button>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-2.5 rounded text-right text-sm text-emerald-400 h-10 truncate font-bold mb-3.5">
            {cbtCalcInput || "0"}
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            {["C", "/", "*", "-", "7", "8", "9", "+", "4", "5", "6", "=", "1", "2", "3", "0"].map(btn => (
              <button
                key={btn}
                onClick={() => {
                  if (btn === "C") setCbtCalcInput("");
                  else if (btn === "=") {
                    try {
                      const sanitized = cbtCalcInput.replace(/[^0-9+\-*/.]/g, "");
                      const tokens = sanitized.match(/(\d+\.?\d*)|([+\-*/])/g);
                      if (tokens) {
                        let result = parseFloat(tokens[0]);
                        for (let i = 1; i < tokens.length; i += 2) {
                          const op = tokens[i];
                          const val = parseFloat(tokens[i+1]);
                          if (op === "+") result += val;
                          if (op === "-") result -= val;
                          if (op === "*") result *= val;
                          if (op === "/") result /= val;
                        }
                        setCbtCalcInput(String(result));
                      } else {
                        setCbtCalcInput("0");
                      }
                    } catch {
                      setCbtCalcInput("Error");
                    }
                  } else {
                    setCbtCalcInput(prev => prev + btn);
                  }
                }}
                className="h-8.5 rounded bg-slate-800 text-slate-200 hover:bg-slate-750 cursor-pointer border-0"
              >
                {btn}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
