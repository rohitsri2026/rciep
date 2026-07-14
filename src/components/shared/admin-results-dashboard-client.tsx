"use client";
/* eslint-disable react-hooks/immutability, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */

import { useState, useEffect } from "react";
import { 
  Search, RefreshCw, Download, FileSpreadsheet, AlertCircle, Loader2,
  Calendar, Eye, BookOpen, User, Check, X, SlidersHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FilterSubject {
  id: string;
  name: string;
}

interface FilterCategory {
  id: string;
  name: string;
  subjectId: string;
}

interface FilterTest {
  id: string;
  title: string;
}

interface Attempt {
  id: string;
  userId: string;
  testId: string;
  score: number | null;
  status: string;
  correctCount: number | null;
  wrongCount: number | null;
  unansweredCount: number | null;
  timeTaken: number | null;
  isPassed: boolean | null;
  startedAt: string;
  completedAt: string;
  user: {
    name: string | null;
    email: string;
  };
  test: {
    id: string;
    title: string;
    totalMarks: number;
    passMarks: number;
    subject: {
      name: string;
    };
    category?: {
      name: string;
    } | null;
  };
}

export function AdminResultsDashboardClient() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [subjects, setSubjects] = useState<FilterSubject[]>([]);
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [tests, setTests] = useState<FilterTest[]>([]);

  // Filter States
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [testFilter, setTestFilter] = useState("all");
  const [passFilter, setPassFilter] = useState("all");
  const [searchVal, setSearchVal] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, categoryFilter, testFilter, passFilter]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build Query Params
      const params = new URLSearchParams();
      if (subjectFilter !== "all") params.append("subjectId", subjectFilter);
      if (categoryFilter !== "all") params.append("categoryId", categoryFilter);
      if (testFilter !== "all") params.append("testId", testFilter);
      if (passFilter !== "all") params.append("passStatus", passFilter);
      if (searchVal.trim() !== "") params.append("search", searchVal);

      const res = await fetch(`/api/admin/results?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load completed exam results");
      }
      const data = await res.json();
      setAttempts(data.attempts || []);
      setSubjects(data.subjects || []);
      setCategories(data.categories || []);
      setTests(data.tests || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load results scorecard list");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      fetchResults();
    }
  };

  const formatDuration = (secondsVal: number | null) => {
    if (secondsVal === null) return "N/A";
    const m = Math.floor(secondsVal / 60);
    const s = secondsVal % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Export filtered attempts to CSV file format
  const exportToCSV = () => {
    if (attempts.length === 0) return;

    // Header row
    const headers = [
      "Candidate Name",
      "Candidate Email",
      "Exam Paper",
      "Subject",
      "Category",
      "Marks Awarded",
      "Total Marks",
      "Correct Choices",
      "Incorrect Choices",
      "Skipped Questions",
      "Time Taken (seconds)",
      "Result Status",
      "Exam Date"
    ];

    // Data rows
    const rows = attempts.map(att => [
      att.user.name || "N/A",
      att.user.email,
      att.test.title,
      att.test.subject.name,
      att.test.category?.name || "General",
      att.score ?? 0,
      att.test.totalMarks,
      att.correctCount ?? 0,
      att.wrongCount ?? 0,
      att.unansweredCount ?? 0,
      att.timeTaken ?? 0,
      att.isPassed ? "PASSED" : "FAILED",
      new Date(att.completedAt).toLocaleDateString()
    ]);

    // Build CSV Content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Download parser trigger
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rci_portal_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter category lists based on subject filter
  const filteredCategories = categories.filter(c => 
    subjectFilter === "all" || c.subjectId === subjectFilter
  );

  return (
    <div className="space-y-6">
      {/* Search & Filters block */}
      <Card className="border-slate-100 shadow-sm bg-white rounded-xl">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <SlidersHorizontal className="h-4 w-4 text-indigo-500" /> Filter Criteria
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Subject Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
              <Select value={subjectFilter} onValueChange={(val) => {
                setSubjectFilter(val || "all");
                setCategoryFilter("all");
              }}>
                <SelectTrigger className="h-9.5 text-xs border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/30 transition-all duration-200">
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "all")}>
                <SelectTrigger className="h-9.5 text-xs border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/30 transition-all duration-200">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Categories</SelectItem>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Test Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam Paper</label>
              <Select value={testFilter} onValueChange={(val) => setTestFilter(val || "all")}>
                <SelectTrigger className="h-9.5 text-xs border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/30 transition-all duration-200">
                  <SelectValue placeholder="All Exams" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Exams</SelectItem>
                  {tests.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pass / Fail Status Filter */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <Select value={passFilter} onValueChange={(val) => setPassFilter(val || "all")}>
                <SelectTrigger className="h-9.5 text-xs border-slate-200 focus:ring-2 focus:ring-indigo-500 bg-slate-50/30 transition-all duration-200">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-150">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pass">Passed Only</SelectItem>
                  <SelectItem value="fail">Failed Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Candidate</label>
              <div className="relative">
                <Input
                  placeholder="Name or Email..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  onKeyDown={handleSearchKeyPress}
                  className="h-9.5 text-xs pl-8.5 border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-500 bg-slate-50/30 transition-all duration-200"
                />
                <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-3.5 border-t border-slate-100">
            <span className="text-xs font-medium text-slate-500">
              Found <strong className="text-slate-800 font-bold">{attempts.length} scorecards</strong>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchResults}
                className="h-8.5 text-xs font-semibold border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.98]"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-indigo-500" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={exportToCSV}
                disabled={attempts.length === 0}
                className="h-8.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-100" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Results Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-xl border border-slate-100 shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <span className="text-xs font-medium">Filtering scorecard results...</span>
        </div>
      ) : error ? (
        <Card className="border-red-100 bg-red-50/10 text-red-800 p-8 text-center rounded-xl">
          <AlertCircle className="h-7 w-7 text-red-500 mx-auto mb-2.5" />
          <h3 className="font-bold text-slate-800 text-sm">Connection Failed</h3>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
        </Card>
      ) : attempts.length === 0 ? (
        <Card className="border-slate-100 bg-white p-12 text-center rounded-xl shadow-sm">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">No Results Scorecards Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal mt-1.5">
            No completed attempts match your current filters. Adjust your filters or query criteria to search again.
          </p>
        </Card>
      ) : (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden select-none">
          <Table>
            <TableHeader className="bg-slate-50/40">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-left font-bold text-slate-500 text-[10px] uppercase pl-5 py-3 tracking-wider">Candidate</TableHead>
                <TableHead className="text-left font-bold text-slate-500 text-[10px] uppercase py-3 tracking-wider">Exam Paper</TableHead>
                <TableHead className="text-left font-bold text-slate-500 text-[10px] uppercase py-3 tracking-wider">Subject / Category</TableHead>
                <TableHead className="text-center font-bold text-slate-500 text-[10px] uppercase py-3 tracking-wider">Score</TableHead>
                <TableHead className="text-center font-bold text-slate-500 text-[10px] uppercase py-3 tracking-wider">Time Taken</TableHead>
                <TableHead className="text-center font-bold text-slate-500 text-[10px] uppercase py-3 tracking-wider">Status</TableHead>
                <TableHead className="text-center font-bold text-slate-500 text-[10px] uppercase py-3 tracking-wider">Exam Date</TableHead>
                <TableHead className="text-right font-bold text-slate-500 text-[10px] uppercase pr-5 py-3 tracking-wider">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attempts.map(att => (
                <TableRow key={att.id} className="border-b border-slate-100 hover:bg-slate-50/20 transition-all duration-200">
                  <TableCell className="pl-5 py-4">
                    <div className="font-bold text-slate-800 text-xs">{att.user.name || "N/A"}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{att.user.email}</div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-bold text-slate-800 text-xs">{att.test.title}</div>
                  </TableCell>
                  <TableCell className="py-4 text-xs text-slate-600 font-medium">
                    <div>{att.test.subject.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{att.test.category?.name || "General"}</div>
                  </TableCell>
                  <TableCell className="text-center py-4 font-bold text-xs text-indigo-650">
                    {att.score} <span className="text-[10px] text-slate-400 font-normal">/ {att.test.totalMarks}</span>
                  </TableCell>
                  <TableCell className="text-center py-4 text-xs text-slate-700 font-semibold">
                    {formatDuration(att.timeTaken)}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {att.isPassed ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">PASSED</Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-700 border border-rose-100 text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-full">FAILED</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4 text-xs text-slate-500 font-semibold">
                    {new Date(att.completedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right pr-5 py-4">
                    <a href={`/student/results/${att.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/50 rounded-lg transition-all"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> View Scorecard
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
