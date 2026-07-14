"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, Search, Edit, Trash2, Copy, RotateCcw, Loader2, Check, AlertCircle, 
  Clock, Eye, EyeOff, ArrowUpDown, ChevronDown
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
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Form validation schema
const testFormSchema = z.object({
  title: z.string().min(3, "Test name must be at least 3 characters"),
  description: z.string().optional(),
  duration: z.number().int().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().int().min(1, "Total marks must be at least 1"),
  passMarks: z.number().int().min(1, "Passing marks must be at least 1"),
  type: z.enum(["PRACTICE_QUIZ", "MOCK_TEST", "SECTIONAL_TEST", "PREVIOUS_YEAR_PAPER", "DAILY_QUIZ"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  negativeMarking: z.number().min(0, "Penalty cannot be negative"),
  instructions: z.string().optional(),
  allowMultipleAttempts: z.boolean(),
  allowResume: z.boolean(),
  shuffleQuestions: z.boolean(),
  shuffleOptions: z.boolean(),
  showResultImmediately: z.boolean(),
  showAnswersAfterSubmission: z.boolean(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  categoryId: z.string().optional(),
});

type TestFormValues = z.infer<typeof testFormSchema>;

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface Category {
  id: string;
  name: string;
  subjectId: string;
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
  allowMultipleAttempts: boolean;
  allowResume: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  showAnswersAfterSubmission: boolean;
  startDate: string | null;
  endDate: string | null;
  isDeleted: boolean;
  subjectId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  category?: Category | null;
  _count?: {
    questions: number;
  };
}

export function TestsClient() {
  // Lists & metadata states
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTests, setTotalTests] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Filter & Sorting state
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  // Status logs
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue,
    watch,
    formState: { errors } 
  } = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: 60,
      totalMarks: 100,
      passMarks: 35,
      type: "MOCK_TEST",
      status: "DRAFT",
      visibility: "PUBLIC",
      negativeMarking: 0,
      instructions: "",
      allowMultipleAttempts: true,
      allowResume: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultImmediately: true,
      showAnswersAfterSubmission: true,
      startDate: "",
      endDate: "",
      subjectId: "",
      categoryId: "",
    }
  });

  const watchedSubjectId = watch("subjectId");

  // Fetch initial subjects and categories for listings
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
      console.error("Failed to load select parameters", err);
    }
  };

  // Fetch tests list
  const fetchTests = async () => {
    await Promise.resolve();
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        showDeleted: showDeleted.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append("search", search);
      if (subjectFilter !== "all") params.append("subjectId", subjectFilter);
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (visibilityFilter !== "all") params.append("visibility", visibilityFilter);

      const res = await fetch(`/api/tests?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load tests bank list");
      }
      const data = await res.json();
      setTests(data.tests || []);
      setTotalTests(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      showNotification("error", err?.message || "Could not retrieve tests list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, subjectFilter, categoryFilter, statusFilter, typeFilter, visibilityFilter, showDeleted, sortBy, sortOrder]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchTests();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Notification banners (toast-like)
  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Datetime input helper formatters
  const formatDatetimeForInput = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  // Open Create Dialog
  const handleOpenAdd = () => {
    reset({
      title: "",
      description: "",
      duration: 60,
      totalMarks: 100,
      passMarks: 35,
      type: "MOCK_TEST",
      status: "DRAFT",
      visibility: "PUBLIC",
      negativeMarking: 0,
      instructions: "",
      allowMultipleAttempts: true,
      allowResume: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      showResultImmediately: true,
      showAnswersAfterSubmission: true,
      startDate: "",
      endDate: "",
      subjectId: subjectFilter !== "all" ? subjectFilter : "",
      categoryId: "",
    });
    setIsAddOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (test: Test) => {
    setSelectedTest(test);
    reset({
      title: test.title,
      description: test.description || "",
      duration: test.duration,
      totalMarks: test.totalMarks,
      passMarks: test.passMarks,
      type: test.type as any,
      status: test.status as any,
      visibility: test.visibility as any,
      negativeMarking: test.negativeMarking,
      instructions: test.instructions || "",
      allowMultipleAttempts: test.allowMultipleAttempts,
      allowResume: test.allowResume,
      shuffleQuestions: test.shuffleQuestions,
      shuffleOptions: test.shuffleOptions,
      showResultImmediately: test.showResultImmediately,
      showAnswersAfterSubmission: test.showAnswersAfterSubmission,
      startDate: formatDatetimeForInput(test.startDate),
      endDate: formatDatetimeForInput(test.endDate),
      subjectId: test.subjectId,
      categoryId: test.categoryId || "",
    });
    setIsEditOpen(true);
  };

  // Sorting helper
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  // Form Submission
  const onAddSubmit = async (values: TestFormValues) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create test");
      }
      showNotification("success", `Test "${values.title}" created successfully`);
      setIsAddOpen(false);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (values: TestFormValues) => {
    if (!selectedTest) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tests?id=${selectedTest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update test");
      }
      showNotification("success", `Test "${values.title}" updated successfully`);
      setIsEditOpen(false);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick state actions (Publish, Archive, Status toggles)
  const handleQuickStatusChange = async (test: Test, nextStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    try {
      const res = await fetch(`/api/tests?id=${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }
      showNotification("success", `Test "${test.title}" set to ${nextStatus}`);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleQuickVisibilityToggle = async (test: Test) => {
    try {
      const nextVis = test.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
      const res = await fetch(`/api/tests?id=${test.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: nextVis }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Visibility toggle failed");
      }
      showNotification("success", `Test "${test.title}" set to ${nextVis}`);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Duplicate test logic
  const handleDuplicate = async (test: Test) => {
    try {
      setLoading(true);
      const res = await fetch("/api/tests/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: test.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to clone test parameters");
      }
      showNotification("success", `Duplicated test created as DRAFT: "${data.test.title}"`);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete/Restore hooks
  const handleOpenDelete = (test: Test) => {
    setSelectedTest(test);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedTest) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tests?id=${selectedTest.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete test");
      }
      showNotification("success", `Test "${selectedTest.title}" soft-deleted successfully.`);
      setIsDeleteOpen(false);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRestore = (test: Test) => {
    setSelectedTest(test);
    setIsRestoreOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedTest) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tests?id=${selectedTest.id}&action=restore`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to restore test");
      }
      showNotification("success", `Test "${selectedTest.title}" restored successfully.`);
      setIsRestoreOpen(false);
      fetchTests();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render type formatting badges helper
  const renderTypeBadge = (type: string) => {
    switch (type) {
      case "PRACTICE_QUIZ": return <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50/20">Practice Quiz</Badge>;
      case "MOCK_TEST": return <Badge variant="outline" className="border-sky-200 text-sky-700 bg-sky-50/20">Mock Test</Badge>;
      case "SECTIONAL_TEST": return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50/20">Sectional Test</Badge>;
      case "PREVIOUS_YEAR_PAPER": return <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50/20">PY Paper</Badge>;
      case "DAILY_QUIZ": return <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50/20">Daily Quiz</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Render status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200">DRAFT</Badge>;
      case "PUBLISHED": return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/50">PUBLISHED</Badge>;
      case "ARCHIVED": return <Badge className="bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100/50">ARCHIVED</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filter Categories according to form subject selection
  const filteredFormCategories = categories.filter((c) => c.subjectId === watchedSubjectId);
  // Filter Categories under the currently active search subject filter
  const filteredSearchCategories = categories.filter((c) => c.subjectId === subjectFilter);

  return (
    <div className="space-y-6">
      {/* Dynamic Alerts Banner */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 shadow-lg animate-in slide-in-from-top-4 duration-300">
            <Check className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 shadow-lg animate-in slide-in-from-top-4 duration-300">
            <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Test Builder</h1>
          <p className="text-slate-500 text-sm mt-0.5">Design exam parameters, attempt limitations, schedules, and grading overrides.</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 font-semibold"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create Test
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-150 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-200 focus-visible:ring-indigo-500 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Subject Filter */}
            <Select value={subjectFilter} onValueChange={(val) => { setSubjectFilter(val || "all"); setCategoryFilter("all"); setPage(1); }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select 
              value={categoryFilter} 
              onValueChange={(val) => { setCategoryFilter(val || "all"); setPage(1); }}
              disabled={subjectFilter === "all"}
            >
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filteredSearchCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Test Type Filter */}
            <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="All Test Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Test Types</SelectItem>
                <SelectItem value="PRACTICE_QUIZ">Practice Quiz</SelectItem>
                <SelectItem value="MOCK_TEST">Mock Test</SelectItem>
                <SelectItem value="SECTIONAL_TEST">Sectional Test</SelectItem>
                <SelectItem value="PREVIOUS_YEAR_PAPER">Previous Year Paper</SelectItem>
                <SelectItem value="DAILY_QUIZ">Daily Quiz</SelectItem>
              </SelectContent>
            </Select>

            {/* Visibility Filter */}
            <Select value={visibilityFilter} onValueChange={(val) => { setVisibilityFilter(val || "all"); setPage(1); }}>
              <SelectTrigger className="border-slate-200">
                <SelectValue placeholder="All Visibilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibilities</SelectItem>
                <SelectItem value="PUBLIC">Public</SelectItem>
                <SelectItem value="PRIVATE">Private</SelectItem>
              </SelectContent>
            </Select>

            {/* Archival toggler checkbox */}
            <div className="flex items-center gap-2 pl-2 sm:col-span-2 justify-start lg:justify-end">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => {
                    setShowDeleted(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                Show Deleted Tests
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-150 shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead onClick={() => handleSort("title")} className="cursor-pointer hover:bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">
                Test Name <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead onClick={() => handleSort("subject")} className="cursor-pointer hover:bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Subject <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</TableHead>
              <TableHead onClick={() => handleSort("duration")} className="cursor-pointer hover:bg-slate-100/50 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                Duration <ArrowUpDown className="inline ml-1 h-3 w-3" />
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Questions</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Visibility</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Created</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-semibold">Loading tests list...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-64 text-center">
                  <div className="text-slate-400 max-w-sm mx-auto">
                    <p className="font-bold text-slate-700 mb-1">No Tests Found</p>
                    <p className="text-sm">Create a new test or update your active filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id} className="border-slate-100 hover:bg-slate-50/30">
                  <TableCell className="font-semibold text-slate-800 py-4 pl-6">
                    {test.title}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: test.subject?.color || "#6366f1" }}
                      />
                      <span className="text-slate-700 text-xs font-medium">{test.subject?.name || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-650 text-xs py-4 font-medium">
                    {test.category?.name || <span className="text-slate-350">None</span>}
                  </TableCell>
                  <TableCell className="py-4">
                    {renderTypeBadge(test.type)}
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-700 py-4">
                    <span className="inline-flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-slate-400" /> {test.duration} min
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-800 text-[10px]">
                      {test._count?.questions || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {test.isDeleted ? (
                      <Badge variant="destructive">DELETED</Badge>
                    ) : (
                      renderStatusBadge(test.status)
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {test.visibility === "PUBLIC" ? (
                      <span className="text-[10px] font-semibold text-indigo-650 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-full">Public</span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-550 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">Private</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 py-4">
                    {new Date(test.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {test.isDeleted ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRestore(test)}
                          className="h-8 px-2 text-indigo-650 hover:bg-indigo-50/50"
                          title="Restore Test"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 px-2 text-slate-500 hover:bg-slate-100 rounded-md border border-transparent transition-colors hover:border-slate-200" title="Change Status">
                              <ChevronDown className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white">
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(test, "DRAFT")}>
                                Set as DRAFT
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(test, "PUBLISHED")}>
                                Publish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatusChange(test, "ARCHIVED")}>
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickVisibilityToggle(test)}
                            className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                            title={test.visibility === "PUBLIC" ? "Set Private" : "Set Public"}
                          >
                            {test.visibility === "PUBLIC" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/admin/tests/questions?testId=${test.id}`}
                            className="h-8 px-2 text-indigo-650 hover:bg-indigo-50"
                            title="Manage Questions"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(test)}
                            className="h-8 px-2 text-indigo-600 hover:bg-indigo-50"
                            title="Duplicate Test"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(test)}
                            className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                            title="Edit Test Parameters"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(test)}
                            className="h-8 px-2 text-red-500 hover:bg-red-50"
                            title="Delete Test"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Table Pagination */}
        {tests.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/20 text-sm">
            <span className="text-slate-500">Total: <strong className="text-slate-700">{totalTests}</strong> tests configured</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="h-8 border-slate-200"
              >
                Previous
              </Button>
              <span className="text-slate-650 px-2">Page {page} of {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="h-8 border-slate-200"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE TEST DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onAddSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Create Test</DialogTitle>
              <DialogDescription>Configure parameters for a new examination test builder header.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              {/* Left Column: Basic Parameters */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-slate-600 uppercase">Test Title</Label>
                  <Input id="title" placeholder="e.g. Algebra Mock Exam" className="border-slate-200" {...register("title")} />
                  {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase">Description</Label>
                  <textarea
                    id="description"
                    rows={2}
                    placeholder="Short description for students..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subjectId" className="text-xs font-bold text-slate-600 uppercase">Subject</Label>
                    <Select value={watchedSubjectId} onValueChange={(val) => { setValue("subjectId", val || ""); setValue("categoryId", ""); }}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subjectId && <p className="text-xs text-red-500 font-semibold">{errors.subjectId.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="categoryId" className="text-xs font-bold text-slate-600 uppercase">Category (Topic)</Label>
                    <Select value={watch("categoryId")} onValueChange={(val) => setValue("categoryId", val || "")} disabled={!watchedSubjectId}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFormCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="type" className="text-xs font-bold text-slate-600 uppercase">Test Type</Label>
                    <select id="type" className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white h-9.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register("type")}>
                      <option value="MOCK_TEST">Mock Test</option>
                      <option value="PRACTICE_QUIZ">Practice Quiz</option>
                      <option value="SECTIONAL_TEST">Sectional Test</option>
                      <option value="PREVIOUS_YEAR_PAPER">Previous Year Paper</option>
                      <option value="DAILY_QUIZ">Daily Quiz</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="duration" className="text-xs font-bold text-slate-600 uppercase">Duration (Minutes)</Label>
                    <Input id="duration" type="number" className="border-slate-200" {...register("duration", { valueAsNumber: true })} />
                    {errors.duration && <p className="text-xs text-red-500 font-semibold">{errors.duration.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="totalMarks" className="text-xs font-bold text-slate-600 uppercase">Total Marks</Label>
                    <Input id="totalMarks" type="number" className="border-slate-200" {...register("totalMarks", { valueAsNumber: true })} />
                    {errors.totalMarks && <p className="text-xs text-red-500 font-semibold">{errors.totalMarks.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="passMarks" className="text-xs font-bold text-slate-600 uppercase">Passing Marks</Label>
                    <Input id="passMarks" type="number" className="border-slate-200" {...register("passMarks", { valueAsNumber: true })} />
                    {errors.passMarks && <p className="text-xs text-red-500 font-semibold">{errors.passMarks.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="negativeMarking" className="text-xs font-bold text-slate-600 uppercase">Negative Mark</Label>
                    <Input id="negativeMarking" type="number" step="0.01" className="border-slate-200" {...register("negativeMarking", { valueAsNumber: true })} />
                    {errors.negativeMarking && <p className="text-xs text-red-500 font-semibold">{errors.negativeMarking.message}</p>}
                  </div>
                </div>
              </div>

              {/* Right Column: Configurations & Scheduling */}
              <div className="space-y-4 md:border-l md:border-slate-100 md:pl-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-xs font-bold text-slate-600 uppercase">Status</Label>
                    <select id="status" className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white h-9.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register("status")}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="visibility" className="text-xs font-bold text-slate-600 uppercase">Visibility</Label>
                    <select id="visibility" className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white h-9.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register("visibility")}>
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="startDate" className="text-xs font-bold text-slate-600 uppercase">Start Schedule</Label>
                    <Input id="startDate" type="datetime-local" className="border-slate-200" {...register("startDate")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="endDate" className="text-xs font-bold text-slate-600 uppercase">End Schedule</Label>
                    <Input id="endDate" type="datetime-local" className="border-slate-200" {...register("endDate")} />
                  </div>
                </div>

                <div className="space-y-2 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Configuration Flags</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("allowMultipleAttempts")} />
                      Allow Re-attempts
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("allowResume")} />
                      Allow Resume
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("shuffleQuestions")} />
                      Shuffle Questions
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("shuffleOptions")} />
                      Shuffle Options
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("showResultImmediately")} />
                      Show Results
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("showAnswersAfterSubmission")} />
                      Show Answers
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instructions" className="text-xs font-bold text-slate-600 uppercase">Instructions</Label>
                  <textarea
                    id="instructions"
                    rows={2}
                    placeholder="Instructions shown on start page..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    {...register("instructions")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="border-slate-200 text-slate-700 bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Test"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT TEST DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit(onEditSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Edit Test Configuration</DialogTitle>
              <DialogDescription>Modify parameters for this test. Uniqueness limits apply.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              {/* Left Column: Basic Parameters */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-title" className="text-xs font-bold text-slate-600 uppercase">Test Title</Label>
                  <Input id="edit-title" placeholder="e.g. Algebra Mock Exam" className="border-slate-200" {...register("title")} />
                  {errors.title && <p className="text-xs text-red-500 font-semibold">{errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-description" className="text-xs font-bold text-slate-600 uppercase">Description</Label>
                  <textarea
                    id="edit-description"
                    rows={2}
                    placeholder="Short description for students..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-subjectId" className="text-xs font-bold text-slate-600 uppercase">Subject</Label>
                    <Select value={watchedSubjectId} onValueChange={(val) => { setValue("subjectId", val || ""); setValue("categoryId", ""); }}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subjectId && <p className="text-xs text-red-500 font-semibold">{errors.subjectId.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-categoryId" className="text-xs font-bold text-slate-600 uppercase">Category (Topic)</Label>
                    <Select value={watch("categoryId")} onValueChange={(val) => setValue("categoryId", val || "")} disabled={!watchedSubjectId}>
                      <SelectTrigger className="border-slate-200">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFormCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-type" className="text-xs font-bold text-slate-600 uppercase">Test Type</Label>
                    <select id="edit-type" className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white h-9.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register("type")}>
                      <option value="MOCK_TEST">Mock Test</option>
                      <option value="PRACTICE_QUIZ">Practice Quiz</option>
                      <option value="SECTIONAL_TEST">Sectional Test</option>
                      <option value="PREVIOUS_YEAR_PAPER">Previous Year Paper</option>
                      <option value="DAILY_QUIZ">Daily Quiz</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-duration" className="text-xs font-bold text-slate-600 uppercase">Duration (Minutes)</Label>
                    <Input id="edit-duration" type="number" className="border-slate-200" {...register("duration", { valueAsNumber: true })} />
                    {errors.duration && <p className="text-xs text-red-500 font-semibold">{errors.duration.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-totalMarks" className="text-xs font-bold text-slate-600 uppercase">Total Marks</Label>
                    <Input id="edit-totalMarks" type="number" className="border-slate-200" {...register("totalMarks", { valueAsNumber: true })} />
                    {errors.totalMarks && <p className="text-xs text-red-500 font-semibold">{errors.totalMarks.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-passMarks" className="text-xs font-bold text-slate-600 uppercase">Passing Marks</Label>
                    <Input id="edit-passMarks" type="number" className="border-slate-200" {...register("passMarks", { valueAsNumber: true })} />
                    {errors.passMarks && <p className="text-xs text-red-500 font-semibold">{errors.passMarks.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-negativeMarking" className="text-xs font-bold text-slate-600 uppercase">Negative Mark</Label>
                    <Input id="edit-negativeMarking" type="number" step="0.01" className="border-slate-200" {...register("negativeMarking", { valueAsNumber: true })} />
                    {errors.negativeMarking && <p className="text-xs text-red-500 font-semibold">{errors.negativeMarking.message}</p>}
                  </div>
                </div>
              </div>

              {/* Right Column: Configurations & Scheduling */}
              <div className="space-y-4 md:border-l md:border-slate-100 md:pl-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-status" className="text-xs font-bold text-slate-600 uppercase">Status</Label>
                    <select id="edit-status" className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white h-9.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register("status")}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-visibility" className="text-xs font-bold text-slate-600 uppercase">Visibility</Label>
                    <select id="edit-visibility" className="w-full rounded-lg border border-slate-200 p-2 text-sm bg-white h-9.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register("visibility")}>
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-startDate" className="text-xs font-bold text-slate-600 uppercase">Start Schedule</Label>
                    <Input id="edit-startDate" type="datetime-local" className="border-slate-200" {...register("startDate")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edit-endDate" className="text-xs font-bold text-slate-600 uppercase">End Schedule</Label>
                    <Input id="edit-endDate" type="datetime-local" className="border-slate-200" {...register("endDate")} />
                  </div>
                </div>

                <div className="space-y-2 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Configuration Flags</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("allowMultipleAttempts")} />
                      Allow Re-attempts
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("allowResume")} />
                      Allow Resume
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("shuffleQuestions")} />
                      Shuffle Questions
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("shuffleOptions")} />
                      Shuffle Options
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("showResultImmediately")} />
                      Show Results
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input type="checkbox" className="rounded border-slate-300 text-indigo-650 h-3.5 w-3.5" {...register("showAnswersAfterSubmission")} />
                      Show Answers
                    </label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-instructions" className="text-xs font-bold text-slate-600 uppercase">Instructions</Label>
                  <textarea
                    id="edit-instructions"
                    rows={2}
                    placeholder="Instructions shown on start page..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    {...register("instructions")}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="border-slate-200 text-slate-700 bg-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SOFT DELETE CONFIRMATION */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Soft Delete Test Builder?</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to soft delete the exam test <strong>{selectedTest?.title}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              className="border-slate-200 text-slate-700 bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={submitting}
              className="bg-red-650 hover:bg-red-750 text-white font-medium"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESTORE CONFIRMATION */}
      <Dialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Restore Test</DialogTitle>
            <DialogDescription>
              This will restore the test <strong>{selectedTest?.title}</strong> to active status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsRestoreOpen(false)}
              className="border-slate-200 text-slate-700 bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmRestore}
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
