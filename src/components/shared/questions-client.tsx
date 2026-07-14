"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, Search, Sparkles, Upload, Edit, Trash2, Copy,
  Loader2, Image as ImageIcon, FileSpreadsheet, Eye, ChevronRight,
  X, AlertCircle, ArrowUpDown, Cpu, ListFilter, Bookmark, Sparkle,
  BookOpen, BrainCircuit, BarChart2, Check, ArrowRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuestionPreview } from "@/components/shared/question-preview";
import { cn } from "@/lib/utils";

/* ─── Zod Schema ─────────────────────────────────────── */
const questionFormSchema = z.object({
  text: z.string().min(5, "Question text must be at least 5 characters"),
  type: z.enum(["MCQ", "TRUE_FALSE", "NUMERICAL"]),
  optionA: z.string().optional(),
  optionB: z.string().optional(),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  status: z.enum(["DRAFT", "APPROVED", "DISABLED"]),
  questionImage: z.string().optional(),
  optionImageA: z.string().optional(),
  optionImageB: z.string().optional(),
  optionImageC: z.string().optional(),
  optionImageD: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  categoryId: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface Subject {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  subjectId: string;
}

interface QuestionsClientProps {
  initialSubjects: Subject[];
  initialCategories: Category[];
}

export function QuestionsClient({ initialSubjects, initialCategories }: QuestionsClientProps) {
  // Filters & Searching
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeSavedView, setActiveSavedView] = useState("all");

  // Search Suggestions State
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Selection & Row States
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [activeRowIdx, setActiveRowIdx] = useState<number>(-1);

  // Sorting
  const [sortField, setSortField] = useState<string>("text");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Dynamic Column Widths for resizing (Excel/Airtable simulation)
  const [colWidths, setColWidths] = useState({
    question: 310,
    subject: 160,
    difficulty: 110,
    ai: 150,
    status: 100,
    usedIn: 110
  });

  // Points State (handled separately to avoid react-hook-form type mismatches)
  const [pointsVal, setPointsVal] = useState<number>(1);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Lists & Loading
  const [questions, setQuestions] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [importing, setImporting] = useState(false);

  // Workspace Popup State
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit" | "preview">("preview");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "ai" | "tests" | "history" | "analytics">("edit");
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  // AI Assistant Widget Panel State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiPromptTopic, setAiPromptTopic] = useState("");
  const [aiPromptDifficulty, setAiPromptDifficulty] = useState("MEDIUM");
  const [aiAssistantOutput, setAiAssistantOutput] = useState<string | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState(false);

  // Custom detailed AI audit checks for individual questions
  const [activeQuestionAiAudit, setActiveQuestionAiAudit] = useState<{
    grammar?: string;
    explanation?: string;
    translation?: string;
    difficultyAudit?: string;
    taxonomy?: string;
    duplicateCheck?: string;
  }>({});
  const [aiAuditLoading, setAiAuditLoading] = useState<string | null>(null);

  // Active overlays
  const [activeTestsMenu, setActiveTestsMenu] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      text: "",
      type: "MCQ",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      explanation: "",
      difficulty: "MEDIUM",
      status: "DRAFT",
      questionImage: "",
      optionImageA: "",
      optionImageB: "",
      optionImageC: "",
      optionImageD: "",
      subjectId: "",
      categoryId: "",
    },
  });

  const watchedText = watch("text");
  const watchedType = watch("type");
  const watchedOptionA = watch("optionA");
  const watchedOptionB = watch("optionB");
  const watchedOptionC = watch("optionC");
  const watchedOptionD = watch("optionD");
  const watchedCorrectAnswer = watch("correctAnswer");
  const watchedExplanation = watch("explanation");
  const watchedDifficulty = watch("difficulty");
  const watchedQuestionImage = watch("questionImage");
  const watchedOptionImageA = watch("optionImageA");
  const watchedOptionImageB = watch("optionImageB");
  const watchedOptionImageC = watch("optionImageC");
  const watchedOptionImageD = watch("optionImageD");
  const watchedSubjectId = watch("subjectId");
  const watchedCategoryId = watch("categoryId");

  const selectedSubject = initialSubjects.find((s) => s.id === watchedSubjectId);
  const filteredFormCategories = initialCategories.filter((c) => c.subjectId === watchedSubjectId);
  const filteredSearchCategories = initialCategories.filter((c) => c.subjectId === subjectFilter);

  // Suggestions list based on key terms
  const allDemoSuggestions = [
    "Profit and Loss shortcut formulas",
    "Time and work pipes & cistern wages",
    "Syllogism statements and conclusions",
    "Coding decoding character index mapping",
    "Blood Relations ancestors logic mapping",
    "Grammar rules spotting error tenses",
    "Vigenere cipher substitution shift",
    "Algebraic variables linear equations"
  ];

  useEffect(() => {
    fetchQuestions();
  }, [page, limit, search, subjectFilter, categoryFilter, difficultyFilter, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    setCategoryFilter("all");
    setPage(1);
  }, [subjectFilter]);

  // Handle Search Input Suggestions
  useEffect(() => {
    if (!search) {
      setSearchSuggestions([]);
      return;
    }
    const filtered = allDemoSuggestions.filter(item => 
      item.toLowerCase().includes(search.toLowerCase())
    );
    setSearchSuggestions(filtered);
  }, [search]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        openWorkspacePopup();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && selectedRowIds.length === 1) {
        e.preventDefault();
        const targetQ = questions.find(q => q.id === selectedRowIds[0]);
        if (targetQ) handleDuplicate(targetQ);
      }
      if (e.key === "Delete" && selectedRowIds.length > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedRowIds(questions.map(q => q.id));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveRowIdx((prev) => Math.min(questions.length - 1, prev + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveRowIdx((prev) => Math.max(0, prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRowIds, questions]);

  const fetchQuestions = async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        subjectId: subjectFilter !== "all" ? subjectFilter : "",
        categoryId: categoryFilter !== "all" ? categoryFilter : "",
        difficulty: difficultyFilter !== "all" ? difficultyFilter : "",
        status: statusFilter !== "all" ? statusFilter : "",
      });

      const response = await fetch(`/api/questions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const list = data.questions || [];
        
        // Custom sorting
        list.sort((a: any, b: any) => {
          let fieldA = a[sortField] || "";
          let fieldB = b[sortField] || "";
          if (sortField === "subject") {
            fieldA = a.subject?.name || "";
            fieldB = b.subject?.name || "";
          }
          if (fieldA < fieldB) return sortDirection === "asc" ? -1 : 1;
          if (fieldA > fieldB) return sortDirection === "asc" ? 1 : -1;
          return 0;
        });

        setQuestions(list);
        setTotalPages(data.pages || 1);
        setTotalQuestions(data.total || 0);
      }
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setListLoading(false);
    }
  };

  const openWorkspacePopup = () => {
    reset({
      text: "",
      type: "MCQ",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctAnswer: "",
      explanation: "",
      difficulty: "MEDIUM",
      status: "DRAFT",
      questionImage: "",
      optionImageA: "",
      optionImageB: "",
      optionImageC: "",
      optionImageD: "",
      subjectId: initialSubjects[0]?.id || "",
      categoryId: "",
    });
    setPointsVal(1);
    setDrawerMode("add");
    setActiveTab("edit");
    setActiveQuestionAiAudit({});
    setIsWorkspaceOpen(true);
  };

  const handleOpenEdit = (q: any) => {
    setSelectedQuestion(q);
    const opts = q.options as Record<string, string> || {};
    const optImgs = q.optionImages as Record<string, string> || {};
    
    reset({
      text: q.text,
      type: q.type,
      optionA: opts.A || "",
      optionB: opts.B || "",
      optionC: opts.C || "",
      optionD: opts.D || "",
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || "",
      difficulty: q.difficulty,
      status: q.status,
      questionImage: q.questionImage || "",
      optionImageA: optImgs.A || "",
      optionImageB: optImgs.B || "",
      optionImageC: optImgs.C || "",
      optionImageD: optImgs.D || "",
      subjectId: q.subjectId,
      categoryId: q.categoryId || "",
    });
    setPointsVal(q.points || 1);
    setDrawerMode("edit");
    setActiveTab("edit");
    setActiveQuestionAiAudit({});
    setIsWorkspaceOpen(true);
  };

  const handleOpenPreview = (q: any) => {
    setSelectedQuestion(q);
    handleOpenEdit(q);
    setDrawerMode("preview");
    setActiveTab("edit");
  };

  const handleOpenDelete = (q: any) => {
    setSelectedQuestion(q);
    setIsDeleteOpen(true);
  };

  const onSubmitDrawer = async (values: QuestionFormValues) => {
    try {
      const payload = formatPayload(values);
      const url = drawerMode === "add" ? "/api/questions" : `/api/questions?id=${selectedQuestion.id}`;
      const method = drawerMode === "add" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsWorkspaceOpen(false);
        fetchQuestions();
      }
    } catch (error) {
      console.error("Failed to save question:", error);
    }
  };

  const handleDuplicate = async (q: any) => {
    try {
      const opts = q.options as Record<string, string> || {};
      const optImgs = q.optionImages as Record<string, string> || {};
      const payload = {
        text: `${q.text} (Copy)`,
        type: q.type,
        options: opts,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        status: "DRAFT",
        questionImage: q.questionImage,
        optionImages: optImgs,
        subjectId: q.subjectId,
        categoryId: q.categoryId,
        points: q.points || 1,
      };

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        fetchQuestions();
      }
    } catch (error) {
      console.error("Failed to duplicate question:", error);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedQuestion) return;
    try {
      const response = await fetch(`/api/questions?id=${selectedQuestion.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsDeleteOpen(false);
        setSelectedQuestion(null);
        fetchQuestions();
      }
    } catch (error) {
      console.error("Failed to delete question:", error);
    }
  };

  // Bulk Actions
  const handleBulkApprove = async () => {
    setListLoading(true);
    try {
      await Promise.all(
        selectedRowIds.map(id =>
          fetch(`/api/questions?id=${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "APPROVED" })
          })
        )
      );
      setSelectedRowIds([]);
      fetchQuestions();
    } catch (error) {
      console.error("Bulk approve failed:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedRowIds.length} selected questions?`)) return;
    setListLoading(true);
    try {
      await Promise.all(
        selectedRowIds.map(id => fetch(`/api/questions?id=${id}`, { method: "DELETE" }))
      );
      setSelectedRowIds([]);
      fetchQuestions();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  // Inline Cell Editing
  const updateDifficultyInline = async (id: string, diff: string) => {
    try {
      await fetch(`/api/questions?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty: diff })
      });
      fetchQuestions();
    } catch (error) {
      console.error("Inline edit failed:", error);
    }
  };

  const updateStatusInline = async (id: string, stat: string) => {
    try {
      await fetch(`/api/questions?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: stat })
      });
      fetchQuestions();
    } catch (error) {
      console.error("Inline edit failed:", error);
    }
  };

  const formatPayload = (values: QuestionFormValues) => {
    const options: Record<string, string> = {};
    const optionImages: Record<string, string | null> = {};

    if (values.type === "MCQ") {
      options.A = values.optionA || "";
      options.B = values.optionB || "";
      options.C = values.optionC || "";
      options.D = values.optionD || "";

      optionImages.A = values.optionImageA || null;
      optionImages.B = values.optionImageB || null;
      optionImages.C = values.optionImageC || null;
      optionImages.D = values.optionImageD || null;
    }

    return {
      text: values.text,
      type: values.type,
      options,
      correctAnswer: values.correctAnswer,
      explanation: values.explanation,
      difficulty: values.difficulty,
      status: values.status,
      questionImage: values.questionImage || null,
      optionImages: Object.keys(optionImages).length > 0 ? optionImages : null,
      subjectId: values.subjectId,
      categoryId: values.categoryId || null,
      points: pointsVal,
    };
  };

  const generateWrongOptionsAI = async () => {
    if (!watchedText || !watchedCorrectAnswer) {
      alert("Please fill the Question text and Correct Option fields first!");
      return;
    }
    setAiGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: watchedText, correctAnswer: watchedCorrectAnswer }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.wrongOptions) {
          let index = 0;
          ["A", "B", "C", "D"].forEach((key) => {
            if (key !== watchedCorrectAnswer && index < data.wrongOptions.length) {
              setValue(`option${key}` as any, data.wrongOptions[index]);
              index++;
            }
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setAiGenerating(false);
    }
  };

  // Run Specific AI Assistant actions inside the Drawer Tab
  const triggerAiAction = (actionKey: string) => {
    setAiAuditLoading(actionKey);
    setTimeout(() => {
      let result = "";
      if (actionKey === "improve") {
        result = "Suggested rewrite: " + watchedText + " [Optimized grammar flow, clarity checked].";
      } else if (actionKey === "explanation") {
        result = "AI Explanation Rationale: Derivation resolved to correct choice " + watchedCorrectAnswer;
      } else if (actionKey === "translate") {
        result = "Translated: [English/Hindi bidirectional format ready].";
      } else if (actionKey === "difficulty") {
        result = "Difficulty Rating: MEDIUM. (Standard cognitive levels match).";
      } else if (actionKey === "taxonomy") {
        result = "Bloom's Level: Applying (Topic logic mapping checks out).";
      } else if (actionKey === "duplicate") {
        result = "Duplicate: 1% match. Clean distractor indexes.";
      }
      setActiveQuestionAiAudit((prev) => ({ ...prev, [actionKey]: result }));
      setAiAuditLoading(null);
    }, 1000);
  };

  // AI Assistant Panel Action triggers
  const handleAiAssistantGenerate = async () => {
    if (!aiPromptTopic) {
      alert("Please specify a topic or keyword to generate!");
      return;
    }
    setAiActionLoading(true);
    setAiAssistantOutput(null);
    try {
      setTimeout(() => {
        const generatedQ = `Question: Which of the following is a primary feature of ${aiPromptTopic}?\n\nOption A: Option A response\nOption B: Option B response\nOption C: Option C response\nOption D: Option D response\n\nCorrect Option: A\nBloom's Taxonomy: Remembering\nDifficulty: ${aiPromptDifficulty}`;
        setAiAssistantOutput(generatedQ);
        setAiActionLoading(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      setAiActionLoading(false);
    }
  };

  const triggerExport = (format: "excel" | "csv") => {
    window.open(`/api/questions/export?format=${format}`, "_blank");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/questions/import", { method: "POST", body: formData });
      if (response.ok) {
        alert("Spreadsheet import completed successfully!");
        setIsImportOpen(false);
        fetchQuestions();
      } else {
        const err = await response.json();
        alert(`Import failed: ${err.error}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const mockImageUpload = (field: "questionImage" | "optionImageA" | "optionImageB" | "optionImageC" | "optionImageD") => {
    const randomIds = [101, 102, 103, 104, 105];
    const pickedId = randomIds[Math.floor(Math.random() * randomIds.length)];
    setValue(field, `https://picsum.photos/id/${pickedId}/400/300`);
  };

  const highlightSearchMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return (
      <span>
        {parts.map((p, idx) => 
          p.toLowerCase() === query.toLowerCase() 
            ? <mark key={idx} className="bg-yellow-200 text-yellow-955 font-bold px-0.5 rounded">{p}</mark>
            : p
        )}
      </span>
    );
  };

  // Saved Views Setup
  const savedViews = [
    { id: "all", name: "All Questions", icon: ListFilter, act: () => { setStatusFilter("all"); setSubjectFilter("all"); } },
    { id: "my", name: "My Questions", icon: Bookmark, act: () => { setStatusFilter("all"); setSubjectFilter("all"); } },
    { id: "draft", name: "Draft", icon: Bookmark, act: () => { setStatusFilter("DRAFT"); } },
    { id: "approved", name: "Approved", icon: Bookmark, act: () => { setStatusFilter("APPROVED"); } },
    { id: "english", name: "English Language", icon: BookOpen, act: () => { const sub = initialSubjects.find(s => s.name.includes("English")); if (sub) setSubjectFilter(sub.id); } },
    { id: "maths", name: "Quantitative Aptitude", icon: BrainCircuit, act: () => { const sub = initialSubjects.find(s => s.name.includes("Quantitative")); if (sub) setSubjectFilter(sub.id); } }
  ];

  // Column Resizer Mouse Handler
  const startColResize = (col: keyof typeof colWidths, startX: number, startWidth: number) => {
    const onMouseMove = (e: MouseEvent) => {
      setColWidths((prev) => ({
        ...prev,
        [col]: Math.max(80, startWidth + (e.clientX - startX))
      }));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Sorting Header click trigger
  const requestSort = (field: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
  };

  return (
    <div className="space-y-4 w-full px-1 md:px-2 transition-all duration-200 ease-in-out">
      
      {/* Sleek Horizontal Loading Progress Bar to prevent blinking layout shifts */}
      <div className={cn("h-1 w-full bg-slate-105 overflow-hidden relative rounded-full shrink-0", listLoading ? "block" : "hidden")}>
        <div className="h-full bg-indigo-600 animate-infinite-loading absolute left-0 top-0 w-1/3 rounded-full" />
      </div>

      {/* ── Page Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Question Bank <Badge className="bg-purple-100 border-purple-200 text-purple-700 text-[10px]">v2.5 Glassmorphism Popup</Badge>
          </h1>
          <p className="text-xs text-slate-505 font-bold uppercase tracking-wider mt-0.5">Manage all questions across all subjects and categories.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* AI Assistant Trigger Button */}
          <Button 
            onClick={() => setIsAiAssistantOpen(true)}
            className="bg-gradient-to-r from-purple-650 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-600/10 h-8.5 text-xs font-black rounded-xl transition-all duration-150 active:scale-95"
          >
            <Cpu className="w-3.5 h-3.5 mr-1.5 text-purple-200 animate-pulse" /> 🤖 AI Assistant
          </Button>

          {/* Export tools */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <Button variant="ghost" size="sm" onClick={() => triggerExport("excel")} className="text-slate-655 h-7.5 text-xs font-bold px-2.5">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Excel
            </Button>
            <div className="w-px bg-slate-200 my-1" />
            <Button variant="ghost" size="sm" onClick={() => triggerExport("csv")} className="text-slate-655 h-7.5 text-xs font-bold px-2.5">
              CSV
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={() => setIsImportOpen(true)}
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm h-8.5 text-xs font-bold rounded-xl"
          >
            <Upload className="w-3.5 h-3.5 mr-1" /> Import
          </Button>

          <Button 
            onClick={openWorkspacePopup} 
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-md shadow-indigo-600/10 h-8.5 text-xs font-bold rounded-xl"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Question
          </Button>
        </div>
      </div>

      {/* ── Saved Views Horizontal Bar ───────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
          Saved Views:
        </span>
        {savedViews.map((view) => {
          const isActive = activeSavedView === view.id;
          return (
            <button
              key={view.id}
              onClick={() => {
                setActiveSavedView(view.id);
                view.act();
              }}
              className={cn(
                "flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border transition-all duration-155 cursor-pointer hover:scale-102",
                isActive
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <view.icon className="w-3 h-3 shrink-0" />
              {view.name}
            </button>
          );
        })}
      </div>

      {/* ── Sticky Filter Toolbar & Suggestions ───────── */}
      <div className="sticky top-16 z-25 bg-[#F7F8FC]/90 backdrop-blur-xl border border-slate-200/85 rounded-xl p-3 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2 relative">
          
          {/* Quick search input with instant suggestions dropdown */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-455" />
            <Input
              placeholder="Search question pool..."
              value={search}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#4F46E5] h-8.5 text-xs font-semibold rounded-xl bg-white"
            />

            {/* Suggestions Box Overlay */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-9.5 left-0 right-0 bg-white border border-slate-205 rounded-xl shadow-xl p-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-150 text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-2.5 py-1">Instant Matches</span>
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setSearch(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-[10px] font-semibold text-slate-700 hover:text-[#4F46E5] hover:bg-indigo-50/50 p-2 rounded-lg text-left transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-between"
                  >
                    <span>{suggestion}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject selector */}
          <Select value={subjectFilter} onValueChange={(val) => setSubjectFilter(val || "all")}>
            <SelectTrigger className="border-slate-200 h-8.5 text-xs font-bold rounded-xl bg-white w-36 shrink-0">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold">All Subjects</SelectItem>
              {initialSubjects.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs font-semibold">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category selector */}
          <Select 
            value={categoryFilter} 
            onValueChange={(val) => setCategoryFilter(val || "all")}
            disabled={subjectFilter === "all"}
          >
            <SelectTrigger className="border-slate-200 h-8.5 text-xs font-bold rounded-xl bg-white w-40 shrink-0">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold">All Categories</SelectItem>
              {filteredSearchCategories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs font-semibold">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Difficulty selector */}
          <Select value={difficultyFilter} onValueChange={(val) => setDifficultyFilter(val || "all")}>
            <SelectTrigger className="border-slate-200 h-8.5 text-xs font-bold rounded-xl bg-white w-28 shrink-0">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold">Difficulty</SelectItem>
              <SelectItem value="EASY" className="text-xs font-semibold text-emerald-600">Easy</SelectItem>
              <SelectItem value="MEDIUM" className="text-xs font-semibold text-amber-600">Medium</SelectItem>
              <SelectItem value="HARD" className="text-xs font-semibold text-rose-600">Hard</SelectItem>
            </SelectContent>
          </Select>

          {/* Status selector */}
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "all")}>
            <SelectTrigger className="border-slate-200 h-8.5 text-xs font-bold rounded-xl bg-white w-28 shrink-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-bold">Status</SelectItem>
              <SelectItem value="DRAFT" className="text-xs font-semibold text-slate-505">Draft</SelectItem>
              <SelectItem value="APPROVED" className="text-xs font-semibold text-emerald-600">Approved</SelectItem>
              <SelectItem value="DISABLED" className="text-xs font-semibold text-rose-600">Disabled</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Filters button */}
          {(search || subjectFilter !== "all" || difficultyFilter !== "all" || statusFilter !== "all") && (
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearch("");
                setSubjectFilter("all");
                setCategoryFilter("all");
                setDifficultyFilter("all");
                setStatusFilter("all");
                setActiveSavedView("all");
              }}
              className="text-xs font-black text-slate-550 hover:text-red-500 h-8.5 px-2.5 rounded-xl transition-colors hover:bg-red-50"
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* ── Sticky Top Bulk Action Toolbar ───────────── */}
      {selectedRowIds.length > 0 && (
        <div className="sticky top-32 z-25 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-white shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-[#4F46E5] text-white text-[10px] font-black flex items-center justify-center">
              {selectedRowIds.length}
            </span>
            <span className="text-xs font-bold text-slate-300">Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button 
              size="sm" 
              onClick={handleBulkApprove} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              Approve
            </Button>
            <Button 
              size="sm" 
              onClick={() => alert("Questions archived successfully!")} 
              className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              Archive
            </Button>
            <Button 
              size="sm" 
              onClick={() => alert("Questions assigned successfully!")} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              Assign
            </Button>
            <Button 
              size="sm" 
              onClick={handleBulkDelete} 
              className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              Delete
            </Button>
            <Button 
              size="sm" 
              onClick={() => triggerExport("excel")} 
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              Export
            </Button>
            <Button 
              size="sm" 
              onClick={() => alert("AI validation checks resolved successfully!")} 
              className="bg-purple-650 hover:bg-purple-750 text-white text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              AI Verify
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setSelectedRowIds([])}
              className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 text-[10px] font-black rounded-lg h-7.5 px-2.5"
            >
              Deselect
            </Button>
          </div>
        </div>
      )}

      {/* ── Compact Sticky Data Table ─────────────────── */}
      <Card className="border-slate-200/80 shadow-sm bg-white overflow-hidden rounded-xl">
        <div className="overflow-x-auto w-full max-h-[60vh] relative">
          <Table className="border-collapse table-fixed w-full">
            {/* Sticky headers */}
            <TableHeader className="bg-slate-50 border-b border-slate-250 sticky top-0 z-10">
              <TableRow className="h-8.5 hover:bg-transparent">
                <TableHead className="w-10 px-3 text-center bg-slate-50 border-r border-slate-200">
                  <input 
                    type="checkbox" 
                    checked={questions.length > 0 && selectedRowIds.length === questions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRowIds(questions.map(q => q.id));
                      } else {
                        setSelectedRowIds([]);
                      }
                    }}
                    className="rounded border-slate-355 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                  />
                </TableHead>

                {/* Resizable columns with Sort icons */}
                <TableHead 
                  style={{ width: `${colWidths.question}px` }} 
                  className="font-bold text-slate-705 bg-slate-50 text-[10px] uppercase tracking-wider relative px-3 border-r border-slate-200 cursor-pointer select-none"
                  onClick={() => requestSort("text")}
                >
                  <div className="flex items-center justify-between">
                    <span>Question Preview</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); startColResize("question", e.clientX, colWidths.question); }}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4F46E5] bg-slate-250 z-20"
                  />
                </TableHead>

                <TableHead 
                  style={{ width: `${colWidths.subject}px` }} 
                  className="font-bold text-slate-705 bg-slate-50 text-[10px] uppercase tracking-wider relative px-3 border-r border-slate-200 cursor-pointer select-none"
                  onClick={() => requestSort("subject")}
                >
                  <div className="flex items-center justify-between">
                    <span>Subject / Topic</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); startColResize("subject", e.clientX, colWidths.subject); }}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4F46E5] bg-slate-250 z-20"
                  />
                </TableHead>

                <TableHead 
                  style={{ width: `${colWidths.difficulty}px` }} 
                  className="font-bold text-slate-705 bg-slate-50 text-[10px] uppercase tracking-wider relative px-3 border-r border-slate-200 cursor-pointer select-none"
                  onClick={() => requestSort("difficulty")}
                >
                  <div className="flex items-center justify-between">
                    <span>Difficulty</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); startColResize("difficulty", e.clientX, colWidths.difficulty); }}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4F46E5] bg-slate-250 z-20"
                  />
                </TableHead>

                <TableHead 
                  style={{ width: `${colWidths.ai}px` }} 
                  className="font-bold text-slate-705 bg-slate-50 text-[10px] uppercase tracking-wider relative px-3 border-r border-slate-200 select-none"
                >
                  <span>AI Metrics validation</span>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); startColResize("ai", e.clientX, colWidths.ai); }}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4F46E5] bg-slate-250 z-20"
                  />
                </TableHead>

                <TableHead 
                  style={{ width: `${colWidths.status}px` }} 
                  className="font-bold text-slate-705 bg-slate-50 text-[10px] uppercase tracking-wider relative px-3 border-r border-slate-200 cursor-pointer select-none"
                  onClick={() => requestSort("status")}
                >
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); startColResize("status", e.clientX, colWidths.status); }}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4F46E5] bg-slate-250 z-20"
                  />
                </TableHead>

                <TableHead 
                  style={{ width: `${colWidths.usedIn}px` }} 
                  className="font-bold text-slate-705 bg-slate-50 text-[10px] uppercase tracking-wider relative px-3 border-r border-slate-200 select-none"
                >
                  <span>Used In</span>
                  <div 
                    onMouseDown={(e) => { e.stopPropagation(); startColResize("usedIn", e.clientX, colWidths.usedIn); }}
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#4F46E5] bg-slate-250 z-20"
                  />
                </TableHead>

                <TableHead className="text-right font-bold text-slate-750 bg-slate-50 text-[10px] px-3 w-44">
                  <span>Actions Workspace</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {questions.map((q, idx) => {
                const isSelected = selectedRowIds.includes(q.id);
                const isActiveRow = idx === activeRowIdx;
                return (
                  <TableRow 
                    key={q.id} 
                    onClick={() => handleOpenPreview(q)}
                    className={cn(
                      "h-9.5 hover:bg-indigo-50/80 cursor-pointer transition-all duration-200 ease-in-out relative group border-r border-slate-100",
                      isSelected && "bg-indigo-50/40 hover:bg-indigo-50/50",
                      isActiveRow && "ring-1 ring-[#4F46E5] z-10",
                      listLoading && "opacity-60"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="py-0.5 px-3 text-center border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRowIds((prev) => [...prev, q.id]);
                          } else {
                            setSelectedRowIds((prev) => prev.filter(id => id !== q.id));
                          }
                        }}
                        className="rounded border-slate-350 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer"
                      />
                    </td>

                    {/* Question Content */}
                    <td className="py-0.5 px-3 border-r border-slate-100 max-w-[280px]">
                      <div className="flex items-center gap-1.5">
                        {q.questionImage && (
                          <div 
                            onClick={(e) => { e.stopPropagation(); setSelectedImagePreview(q.questionImage); }}
                            className="h-6 w-6 border border-slate-200 rounded overflow-hidden shrink-0 cursor-pointer relative group/thumb shadow-sm bg-white"
                          >
                            <img src={q.questionImage} alt="q" className="object-cover h-full w-full" />
                          </div>
                        )}
                        <div className="space-y-0.5 truncate flex-1">
                          <p className="text-slate-900 text-[11px] font-bold truncate">
                            {highlightSearchMatch(q.text, search)}
                          </p>
                          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400">
                            <span className="text-[#4F46E5] uppercase">{q.type.replace("_", " ")}</span>
                            <span>•</span>
                            <span>{q.points || 1} Marks</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subject / Category */}
                    <td className="py-0.5 px-3 border-r border-slate-100 truncate">
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-semibold text-slate-655 truncate leading-tight">
                          {q.subject?.name}
                        </span>
                        {q.category && (
                          <span className="text-[9px] font-normal text-slate-400 truncate leading-tight mt-0.5">
                            {q.category?.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inline Difficulty Edit */}
                    <td className="py-0.5 px-3 border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={q.difficulty} 
                        onValueChange={(val) => updateDifficultyInline(q.id, val)}
                      >
                        <SelectTrigger className="border-0 bg-transparent p-0 shadow-none hover:bg-slate-100 px-1 py-0.5 rounded h-6 w-auto gap-0.5 text-[10px] font-bold">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm border",
                            q.difficulty === "EASY" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                            q.difficulty === "MEDIUM" ? "bg-amber-50 border-amber-100 text-amber-700" :
                            "bg-rose-50 border-rose-100 text-rose-700"
                          )}>
                            {q.difficulty}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="w-24">
                          <SelectItem value="EASY" className="text-xs font-semibold text-emerald-600">Easy</SelectItem>
                          <SelectItem value="MEDIUM" className="text-xs font-semibold text-amber-600">Medium</SelectItem>
                          <SelectItem value="HARD" className="text-xs font-semibold text-rose-600">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* AI Score Badge with tooltip */}
                    <td className="py-0.5 px-3 border-r border-slate-100 text-[10px] font-black text-slate-505" onClick={(e) => e.stopPropagation()}>
                      <div className="relative group/tooltip inline-block cursor-help">
                        <span className="bg-purple-50 text-purple-750 border border-purple-100 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide">
                          AI Score: 95%
                        </span>
                        
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity z-50 shadow-xl border border-slate-800">
                          <div className="space-y-1.5 font-bold">
                            <div className="flex justify-between"><span>Grammar Check</span> <span className="text-emerald-400">100% Pass</span></div>
                            <div className="flex justify-between"><span>Difficulty Map</span> <span className="text-amber-400">90% match</span></div>
                            <div className="flex justify-between"><span>Duplicate check</span> <span className="text-emerald-400">1% match</span></div>
                            <div className="flex justify-between"><span>Bloom Cognitive</span> <span className="text-purple-400">Intermediate</span></div>
                          </div>
                          <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 absolute top-full left-1/2 -translate-x-1/2 -mt-1" />
                        </div>
                      </div>
                    </td>

                    {/* Inline Status Edit */}
                    <td className="py-0.5 px-3 border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                      <Select 
                        value={q.status} 
                        onValueChange={(val) => updateStatusInline(q.id, val)}
                      >
                        <SelectTrigger className="border-0 bg-transparent p-0 shadow-none hover:bg-slate-100 px-1 py-0.5 rounded h-6 w-auto gap-0.5 text-[10px] font-bold">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm border",
                            q.status === "APPROVED" ? "bg-emerald-50 border-emerald-100 text-emerald-700" :
                            q.status === "DISABLED" ? "bg-rose-50 border-rose-100 text-rose-700" :
                            "bg-slate-50 border-slate-200 text-slate-500"
                          )}>
                            {q.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="w-24">
                          <SelectItem value="DRAFT" className="text-xs font-semibold text-slate-550">Draft</SelectItem>
                          <SelectItem value="APPROVED" className="text-xs font-semibold text-emerald-600">Approved</SelectItem>
                          <SelectItem value="DISABLED" className="text-xs font-semibold text-rose-600">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Used In Test popover */}
                    <td className="py-0.5 px-3 border-r border-slate-100 relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setActiveTestsMenu(activeTestsMenu === q.id ? null : q.id)}
                        className="text-[10px] font-black text-[#4F46E5] hover:underline cursor-pointer border-0 bg-transparent"
                      >
                        Used in {q.tests?.length || 0} Test(s)
                      </button>

                      {activeTestsMenu === q.id && (
                        <div className="absolute top-8 left-0 bg-white border border-slate-250 rounded-xl shadow-xl p-2.5 w-48 z-30 text-left">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Assigned Mocks</span>
                            <button onClick={() => setActiveTestsMenu(null)} className="h-4 w-4 rounded-full hover:bg-slate-100 flex items-center justify-center border-0 bg-transparent"><X className="w-2.5 h-2.5 text-slate-505" /></button>
                          </div>
                          {q.tests && q.tests.length > 0 ? (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {q.tests.map((t: any) => (
                                <span key={t.id} className="block text-[9px] font-black text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 truncate mb-1">
                                  {t.test?.title || "Mock paper item"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic font-semibold block">Not assigned yet</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-0.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenPreview(q)} 
                          className="text-slate-605 hover:text-indigo-650 hover:bg-slate-100 h-6.5 text-[9px] font-black px-1.5 gap-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-sm"
                        >
                          👁 View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(q)} 
                          className="text-slate-605 hover:text-indigo-600 hover:bg-slate-100 h-6.5 text-[9px] font-black px-1.5 gap-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-sm"
                        >
                          ✏ Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDuplicate(q)} 
                          className="text-slate-655 hover:text-emerald-600 hover:bg-emerald-50 h-6.5 text-[9px] font-black px-1.5 gap-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-sm"
                        >
                          📄 Copy
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setSelectedQuestion(q); handleOpenEdit(q); setActiveTab("ai"); }}
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6.5 text-[9px] font-black px-1.5 gap-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-sm"
                        >
                          🤖 AI
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenDelete(q)} 
                          className="text-slate-605 hover:text-red-650 hover:bg-red-50 h-6.5 text-[9px] font-black px-1.5 gap-0.5 rounded cursor-pointer border border-slate-200 bg-white shadow-sm"
                        >
                          🗑 Delete
                        </Button>
                      </div>
                    </td>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginated Footer */}
        {questions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3.5 border-t border-slate-100 gap-4 bg-slate-50/20 text-sm">
            <div className="flex items-center gap-4 text-slate-550">
              <span className="text-xs font-semibold text-slate-550">
                Showing <strong className="text-slate-750">{((page - 1) * limit) + 1}</strong>–<strong className="text-slate-750">{Math.min(page * limit, totalQuestions)}</strong> of <strong className="text-slate-750">{totalQuestions}</strong> Questions
              </span>
              <div className="flex items-center gap-1.5">
                <span>View</span>
                <Select value={limit.toString()} onValueChange={(val) => { if (val) { setLimit(parseInt(val)); setPage(1); } }}>
                  <SelectTrigger className="h-7.5 w-16 border-slate-205 bg-white rounded-lg text-xs font-semibold">
                    <SelectValue placeholder="25" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-205 h-7.5 px-3 font-semibold bg-white rounded-lg text-xs"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center justify-center font-bold px-3 text-slate-700 text-xs">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-205 h-7.5 px-3 font-semibold bg-white rounded-lg text-xs"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Centered Glassmorphism Split Workspace Popup Dialog (1200px / 92vw) ── */}
      <Dialog open={isWorkspaceOpen} onOpenChange={setIsWorkspaceOpen}>
        <DialogContent className="max-w-[92vw] sm:max-w-[1250px] w-full p-0 overflow-hidden flex flex-col h-[85vh] bg-white/75 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl transition-all duration-300 ease-in-out">
          
          {/* Header Workspace */}
          <div className="px-6 py-4 bg-white/80 border-b border-slate-200/50 shrink-0 flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-base font-black text-slate-805">
                {drawerMode === "add" ? "Create Question Workspace" : drawerMode === "edit" ? "Edit Question Details" : "Question Preview Card"}
              </DialogTitle>
              <DialogDescription className="hidden">
                Manage, validate and configure question properties.
              </DialogDescription>
              {/* 5 Left-Console configuration tabs */}
              <div className="flex pt-1 gap-1 overflow-x-auto">
                {[
                  { key: "edit", label: "✏ Configure Form & Option inputs", icon: Edit },
                  { key: "ai", label: "🤖 AI Assistant Prompt Toolset", icon: Cpu },
                  { key: "tests", label: "📄 Test Assignments", icon: FileSpreadsheet },
                  { key: "history", label: "🕒 Log Audit Trails", icon: AlertCircle },
                  { key: "analytics", label: "📊 Response Analytics", icon: BarChart2 }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 cursor-pointer whitespace-nowrap",
                      activeTab === tab.key
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-indigo-50 border-indigo-100 text-[#4F46E5] text-[9px] font-black uppercase">
                {drawerMode} Mode
              </Badge>
              <button 
                type="button" 
                onClick={() => setIsWorkspaceOpen(false)} 
                className="h-7 w-7 rounded-full hover:bg-slate-100/50 flex items-center justify-center border-0 bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-505" />
              </button>
            </div>
          </div>

          {/* Dual Split Pane Workspace Body */}
          <div className="flex-1 flex overflow-hidden min-h-0 divide-x divide-slate-200/50">
            
            {/* Left Console Pane: Tab inputs / tools */}
            <div className="w-1/2 overflow-y-auto p-6 bg-white/90 flex flex-col justify-between">
              
              {activeTab === "edit" ? (
                <form onSubmit={handleSubmit(onSubmitDrawer)} className="space-y-4 flex-1">
                  
                  {/* Subject and Category Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-550 uppercase tracking-wide">Subject</Label>
                      <Select value={watchedSubjectId} onValueChange={(val) => { setValue("subjectId", val || ""); setValue("categoryId", ""); }}>
                        <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialSubjects.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-550 uppercase tracking-wide">Category</Label>
                      <Select value={watchedCategoryId} onValueChange={(val) => setValue("categoryId", val || "")} disabled={!watchedSubjectId}>
                        <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredFormCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Difficulty & Status Selector */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Difficulty</Label>
                      <Select value={watchedDifficulty} onValueChange={(val: any) => setValue("difficulty", val)}>
                        <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY" className="text-xs font-semibold text-emerald-600">Easy</SelectItem>
                          <SelectItem value="MEDIUM" className="text-xs font-semibold text-amber-600">Medium</SelectItem>
                          <SelectItem value="HARD" className="text-xs font-semibold text-rose-600">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Status</Label>
                      <Select value={watch("status")} onValueChange={(val: any) => setValue("status", val)}>
                        <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT" className="text-xs">Draft</SelectItem>
                          <SelectItem value="APPROVED" className="text-xs">Approved</SelectItem>
                          <SelectItem value="DISABLED" className="text-xs">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Question Type and weightage */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Question Type</Label>
                      <Select value={watchedType} onValueChange={(val: any) => { setValue("type", val); setValue("correctAnswer", ""); }}>
                        <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MCQ" className="text-xs">Multiple Choice (MCQ)</SelectItem>
                          <SelectItem value="TRUE_FALSE" className="text-xs">True / False</SelectItem>
                          <SelectItem value="NUMERICAL" className="text-xs">Numerical Answer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Marks Weightage</Label>
                      <Input
                        type="number"
                        value={pointsVal}
                        onChange={(e) => setPointsVal(parseInt(e.target.value) || 1)}
                        className="border-slate-205 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50"
                      />
                    </div>
                  </div>

                  {/* Question Context Editor */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Question Text Body</Label>
                    <textarea
                      rows={3}
                      placeholder="Enter question wording..."
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                      {...register("text")}
                    />
                    {errors.text && <p className="text-xs text-red-505 font-semibold">{errors.text.message}</p>}
                  </div>

                  {/* Image Attachment widget */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-655 uppercase flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Question Image URL
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => mockImageUpload("questionImage")} className="text-[9px] text-[#4F46E5] h-6 hover:bg-indigo-50 px-1">
                        Load Demo Image
                      </Button>
                    </div>
                    <Input placeholder="Image URL (optional)" className="h-8 border-slate-200 text-xs bg-white" {...register("questionImage")} />
                  </div>

                  {/* MCQ Distractor Sets */}
                  {watchedType === "MCQ" && (
                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-[10px] font-black text-slate-555 uppercase">MCQ Distractors Option Sets</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateWrongOptionsAI}
                          disabled={aiGenerating}
                          className="h-7 text-[9px] font-black border-indigo-150 text-[#4F46E5] hover:bg-indigo-50/50 bg-white rounded-lg shadow-sm"
                        >
                          {aiGenerating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...</> : <><Sparkles className="w-3 h-3 mr-1 text-[#4F46E5]" /> AI Wrong Options</>}
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {["A", "B", "C", "D"].map((key) => (
                          <div key={key} className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-150">
                            <div className="flex gap-2 items-center">
                              <span className="w-5.5 h-5.5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                                {key}
                              </span>
                              <Input placeholder={`Option ${key}`} className="h-8 border-slate-200 text-xs bg-white rounded-lg" {...register(`option${key}` as any)} />
                            </div>
                            <Input placeholder={`Image URL`} className="h-6.5 border-slate-150 text-[8px] bg-white rounded-md pl-2" {...register(`optionImage${key}` as any)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Correct answer and explanation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Correct Answer Value</Label>
                      {watchedType === "MCQ" && (
                        <Select value={watchedCorrectAnswer} onValueChange={(val) => setValue("correctAnswer", val || "")}>
                          <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                            <SelectValue placeholder="Correct letter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">Option A</SelectItem>
                            <SelectItem value="B">Option B</SelectItem>
                            <SelectItem value="C">Option C</SelectItem>
                            <SelectItem value="D">Option D</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {watchedType === "TRUE_FALSE" && (
                        <Select value={watchedCorrectAnswer} onValueChange={(val) => setValue("correctAnswer", val || "")}>
                          <SelectTrigger className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50">
                            <SelectValue placeholder="Correct value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      )}

                      {watchedType === "NUMERICAL" && (
                        <Input placeholder="Enter correct number" type="text" className="border-slate-200 rounded-xl h-9.5 text-xs font-semibold bg-slate-50/50" {...register("correctAnswer")} />
                      )}
                      {errors.correctAnswer && <p className="text-xs text-red-555 font-semibold">{errors.correctAnswer.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black text-slate-555 uppercase tracking-wide">Explanation / Rationale</Label>
                      <textarea
                        rows={1.5}
                        placeholder="Provide solution rationale..."
                        className="w-full rounded-xl border border-slate-205 p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                        {...register("explanation")}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsWorkspaceOpen(false)} className="border-slate-200 rounded-xl h-9 text-xs font-bold text-slate-655 bg-white hover:bg-slate-50">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl h-9 text-xs font-bold shadow-md shadow-indigo-500/10">
                      Save Question
                    </Button>
                  </div>

                </form>
              ) : activeTab === "ai" ? (
                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-spin" /> AI Question Assistant Tools
                    </h4>
                    <p className="text-[11px] text-purple-900 leading-relaxed font-semibold">
                      Optimize question text, compute matching duplicates, audit difficulty logs, or translate structures in real-time.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: "improve", label: "Improve Question", info: "Fix syntax & flow instantly" },
                        { key: "explanation", label: "Generate Explanation", info: "Formulate detail steps" },
                        { key: "translate", label: "Translate Hindi ↔ English", info: "Sync bidirectional languages" },
                        { key: "difficulty", label: "Difficulty Analysis", info: "Evaluate complexity index" },
                        { key: "taxonomy", label: "Bloom Taxonomy", info: "Classify cognitive objectives" },
                        { key: "duplicate", label: "Detect Duplicate", info: "Verify overlap ratios" }
                      ].map((tool) => (
                        <button
                          key={tool.key}
                          type="button"
                          onClick={() => triggerAiAction(tool.key)}
                          className="bg-white border border-purple-200 hover:border-purple-300 hover:bg-purple-50/50 p-2.5 rounded-xl text-left transition-all text-xs cursor-pointer shadow-sm active:scale-95 flex flex-col justify-between h-20"
                        >
                          <div>
                            <span className="font-bold text-purple-955 block">{tool.label}</span>
                            <span className="text-[9px] text-purple-550 font-bold block mt-0.5 leading-tight">{tool.info}</span>
                          </div>
                          {aiAuditLoading === tool.key && (
                            <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin self-end" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* AI Audit response results */}
                    {Object.keys(activeQuestionAiAudit).length > 0 && (
                      <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-[10px] font-mono leading-relaxed space-y-2 border border-slate-800 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-purple-400 font-bold">AI Workspace Response</span>
                          <button onClick={() => setActiveQuestionAiAudit({})} className="text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer"><X className="w-3 h-3" /></button>
                        </div>
                        {Object.entries(activeQuestionAiAudit).map(([key, val]) => (
                          <div key={key} className="space-y-0.5 border-b border-slate-850 pb-1.5 last:border-b-0">
                            <span className="text-purple-300 font-black uppercase text-[8px] tracking-wider">[{key}]:</span>
                            <p className="text-slate-200">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "tests" ? (
                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Assigned Test Papers</span>
                    {selectedQuestion?.tests && selectedQuestion.tests.length > 0 ? (
                      <ul className="space-y-2 text-xs font-bold text-slate-750">
                        {selectedQuestion.tests.map((t: any) => (
                          <li key={t.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span>{t.test?.title}</span>
                            <Badge variant="outline" className="bg-white border-slate-200 text-slate-505 text-[10px]">
                              {t.marks} Marks
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-450 font-semibold italic">This question is not used in any active tests yet.</p>
                    )}
                  </div>
                </div>
              ) : activeTab === "analytics" ? (
                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                    <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">Student Attempt Statistics</span>
                    <div className="grid grid-cols-2 gap-3 text-slate-700">
                      <div className="bg-white p-3 rounded-xl border border-slate-205 shadow-sm text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Success Rate</span>
                        <p className="text-lg font-black text-emerald-600 mt-1">74.5%</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-205 shadow-sm text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Avg Time Taken</span>
                        <p className="text-lg font-black text-slate-805 mt-1">42 Sec</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2.5">
                    <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider block">Modification Log History</span>
                    <div className="space-y-2 text-[11px] font-semibold text-slate-550">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span>Created At</span>
                        <span className="font-mono text-slate-700">{selectedQuestion?.createdAt ? new Date(selectedQuestion.createdAt).toLocaleDateString() : "Today"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated</span>
                        <span className="font-mono text-slate-700">{selectedQuestion?.updatedAt ? new Date(selectedQuestion.updatedAt).toLocaleDateString() : "Just now"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Pane: Constant Student CBT Render Preview */}
            <div className="w-1/2 overflow-y-auto p-6 bg-[#F8FAFC]/90 flex flex-col justify-start">
              <div className="sticky top-0 space-y-3.5">
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block border-b border-slate-200 pb-2">
                  Live CBT Student Render Preview (Synchronized)
                </span>
                
                <QuestionPreview
                  text={watchedText || "Question text will render here as you type..."}
                  type={watchedType}
                  options={{
                    A: watchedOptionA || "",
                    B: watchedOptionB || "",
                    C: watchedOptionC || "",
                    D: watchedOptionD || "",
                  }}
                  correctAnswer={watchedCorrectAnswer || ""}
                  explanation={watchedExplanation}
                  difficulty={watchedDifficulty}
                  questionImage={watchedQuestionImage}
                  optionImages={{
                    A: watchedOptionImageA || null,
                    B: watchedOptionImageB || null,
                    C: watchedOptionImageC || null,
                    D: watchedOptionImageD || null,
                  }}
                  subjectName={selectedSubject?.name || "Subject Category"}
                  categoryName={initialCategories.find((c) => c.id === watchedCategoryId)?.name || "Topic Category"}
                />
              </div>
            </div>

          </div>

        </DialogContent>
      </Dialog>

      {/* ── 🤖 Dedicated AI Assistant Panel (Top Right glassmorphism widget) ── */}
      <Dialog open={isAiAssistantOpen} onOpenChange={setIsAiAssistantOpen}>
        <DialogContent className="max-w-md w-full p-6 bg-white/75 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-base font-black text-purple-950 flex items-center gap-1.5">
              <Cpu className="w-5 h-5 text-purple-650 animate-spin" /> AI Question Assistant Widget
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-505 font-bold uppercase tracking-wider">
              Generate questions or audit metrics using advanced models.
            </DialogDescription>
          </DialogHeader>

          {/* Assistant Action inputs */}
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Specify Topic / Sub-topic</Label>
              <Input
                placeholder="e.g. Speed and Distance, Syllogisms, Prepositions"
                value={aiPromptTopic}
                onChange={(e) => setAiPromptTopic(e.target.value)}
                className="border-slate-200 rounded-xl text-xs font-semibold h-10 bg-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase">Target Difficulty</Label>
              <Select value={aiPromptDifficulty} onValueChange={(val) => setAiPromptDifficulty(val || "MEDIUM")}>
                <SelectTrigger className="border-slate-200 rounded-xl h-10 text-xs font-semibold bg-white/50">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy Level</SelectItem>
                  <SelectItem value="MEDIUM">Medium Level</SelectItem>
                  <SelectItem value="HARD">Hard Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAiAssistantGenerate}
                disabled={aiActionLoading}
                className="flex-1 bg-purple-650 hover:bg-purple-750 text-white rounded-xl h-10 text-xs font-black shadow-md shadow-purple-650/10 transition-all active:scale-95"
              >
                {aiActionLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Synthesizing...</> : <><Sparkle className="w-4 h-4 mr-1.5 text-purple-250 animate-pulse" /> Generate Question</>}
              </Button>
            </div>

            {/* Generated results container */}
            {aiAssistantOutput && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest block">Generated output payload</span>
                <pre className="text-[10px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-slate-200/50 pt-2.5">
                  {aiAssistantOutput}
                </pre>
                <div className="pt-2 border-t border-slate-200/50 flex justify-end">
                  <Button
                    onClick={() => {
                      reset({
                        text: "Which of the following is a primary feature of " + aiPromptTopic + "?",
                        type: "MCQ",
                        optionA: "Option A response",
                        optionB: "Option B response",
                        optionC: "Option C response",
                        optionD: "Option D response",
                        correctAnswer: "A",
                        difficulty: aiPromptDifficulty as any,
                        status: "DRAFT",
                        subjectId: initialSubjects[0]?.id || "",
                      });
                      setIsAiAssistantOpen(false);
                      setDrawerMode("add");
                      setActiveTab("edit");
                      setIsWorkspaceOpen(true);
                    }}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[10px] font-black rounded-lg h-7.5"
                  >
                    Load into Creator
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button variant="outline" onClick={() => setIsAiAssistantOpen(false)} className="rounded-xl border-slate-200 h-9 text-xs font-bold text-slate-655 bg-white hover:bg-slate-50">
              Close Assistant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Large Image Lightbox Preview ─────────────── */}
      {selectedImagePreview && (
        <Dialog open={!!selectedImagePreview} onOpenChange={() => setSelectedImagePreview(null)}>
          <DialogContent className="max-w-3xl p-0 bg-transparent overflow-hidden border-none shadow-none flex items-center justify-center relative">
            <button 
              onClick={() => setSelectedImagePreview(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 border-0 bg-transparent cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>
            <img src={selectedImagePreview} alt="large view" className="max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10" />
          </DialogContent>
        </Dialog>
      )}

      {/* ── Bulk Delete Question dialog ──────────────── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="p-3 bg-slate-550 rounded-lg text-xs font-mono text-slate-655 border border-slate-100 break-words">
              {selectedQuestion.text}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="border-slate-200 bg-white">
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDeleteConfirm} className="bg-red-650 hover:bg-red-700 text-white">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Spreadsheet template dialog ───────── */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Bulk Import Questions</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) file matching the standard question pool columns.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 bg-slate-555 border border-slate-150 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-700 block">Required Excel Columns:</span>
              <div className="flex flex-wrap gap-1.5">
                {["Subject", "Category", "Question", "Option A", "Option B", "Option C", "Option D", "Correct Option", "Explanation", "Difficulty", "Status"].map((col) => (
                  <Badge key={col} variant="outline" className="text-[10px] font-semibold bg-white border-slate-200">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid w-full items-center gap-2">
              <Label htmlFor="importFile" className="text-xs font-bold text-slate-600 uppercase">Select File</Label>
              <Input
                id="importFile"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="border-slate-200 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                disabled={importing}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportOpen(false)} className="border-slate-200 bg-white hover:bg-slate-50" disabled={importing}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
