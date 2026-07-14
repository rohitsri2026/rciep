"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, Search, Edit, Trash2, RotateCcw, Loader2, Check, AlertCircle, 
  Tag, Layers, HelpCircle, Eye, EyeOff, LayoutGrid
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

// Form validation schema
const subjectFormSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

interface Subject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  icon: string | null;
  color: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  categories?: any[];
  _count?: {
    questions: number;
  };
}

export function SubjectsClient() {
  // Lists & pagination state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Filter states
  const [search, setSearch] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);

  // Dialog control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Notification banners (toast-like)
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // React Hook Form
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      icon: "Tag",
      color: "#6366f1",
    }
  });

  // Toast notifier helper
  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Fetch subjects helper
  const fetchSubjects = async () => {
    // Defer loading state to prevent synchronous effect cascade renders
    await Promise.resolve();
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        showDeleted: showDeleted.toString(),
      });
      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`/api/subjects?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load subjects list");
      }
      const data = await res.json();
      setSubjects(data.subjects || []);
      setTotalSubjects(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      showNotification("error", err?.message || "Could not connect to database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubjects();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, showDeleted]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSubjects();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Open Create Dialog
  const handleOpenAdd = () => {
    reset({
      name: "",
      description: "",
      status: "ACTIVE",
      icon: "Tag",
      color: "#6366f1",
    });
    setIsAddOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    reset({
      name: subject.name,
      description: subject.description || "",
      status: subject.status as "ACTIVE" | "INACTIVE",
      icon: subject.icon || "Tag",
      color: subject.color || "#6366f1",
    });
    setIsEditOpen(true);
  };

  // Form submits
  const onAddSubmit = async (values: SubjectFormValues) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create subject");
      }
      showNotification("success", `Subject "${values.name}" created successfully`);
      setIsAddOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (values: SubjectFormValues) => {
    if (!selectedSubject) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/subjects?id=${selectedSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update subject");
      }
      showNotification("success", `Subject "${values.name}" updated successfully`);
      setIsEditOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle quick status (Enable/Disable)
  const handleToggleStatus = async (subject: Subject) => {
    try {
      const nextStatus = subject.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/subjects?id=${subject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subject.name,
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }
      showNotification("success", `Subject "${subject.name}" set to ${nextStatus}`);
      fetchSubjects();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // Open Soft Delete Confirmation
  const handleOpenDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedSubject) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/subjects?id=${selectedSubject.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete subject");
      }
      showNotification("success", `Subject "${selectedSubject.name}" soft-deleted successfully.`);
      setIsDeleteOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Restore Confirmation
  const handleOpenRestore = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsRestoreOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedSubject) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/subjects?id=${selectedSubject.id}&action=restore`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to restore subject");
      }
      showNotification("success", `Subject "${selectedSubject.name}" restored successfully.`);
      setIsRestoreOpen(false);
      fetchSubjects();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Render icons mapping helper
  const renderSubjectIcon = (iconName: string | null, color: string | null) => {
    const iconStyle = { color: color || "#6366f1" };
    switch (iconName) {
      case "Layers": return <Layers className="h-4 w-4" style={iconStyle} />;
      case "HelpCircle": return <HelpCircle className="h-4 w-4" style={iconStyle} />;
      case "LayoutGrid": return <LayoutGrid className="h-4 w-4" style={iconStyle} />;
      default: return <Tag className="h-4 w-4" style={iconStyle} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Alert Banner (Toast-like) */}
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Subjects Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure exam subjects, select visual tags, and audit categories.</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Subject
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-150 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-200 focus-visible:ring-indigo-500 placeholder:text-slate-400 text-sm"
              />
            </div>

            <div className="flex items-center gap-6 self-end md:self-auto">
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
                Show Deleted & Archived
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
              <TableHead className="w-10"></TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Name</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Categories</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Questions</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Created Date</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-semibold">Loading subjects list...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="text-slate-400 max-w-sm mx-auto">
                    <p className="font-bold text-slate-700 mb-1">No subjects found</p>
                    <p className="text-sm">Try modifying your filters, search queries, or add a new subject.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((sub) => (
                <TableRow key={sub.id} className="border-slate-100 hover:bg-slate-50/30">
                  <TableCell className="pl-6 py-4">
                    <div 
                      className="p-2 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${sub.color || "#6366f1"}15` }}
                    >
                      {renderSubjectIcon(sub.icon, sub.color)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 py-4">
                    {sub.name}
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs py-4 max-w-xs truncate">
                    {sub.description || <span className="text-slate-300">No description provided</span>}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700 py-4">
                    {sub.categories?.length || 0}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700 py-4">
                    {sub._count?.questions || 0}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {sub.isDeleted ? (
                      <Badge variant="destructive">DELETED</Badge>
                    ) : sub.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/50">ACTIVE</Badge>
                    ) : (
                      <Badge className="bg-slate-550/10 text-slate-500 border border-slate-200">INACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 py-4">
                    {new Date(sub.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {sub.isDeleted ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRestore(sub)}
                          className="h-8 px-2 text-indigo-650 hover:bg-indigo-50/50"
                          title="Restore Subject"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(sub)}
                            className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                            title={sub.status === "ACTIVE" ? "Disable" : "Enable"}
                          >
                            {sub.status === "ACTIVE" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(sub)}
                            className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                            title="Edit Subject"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(sub)}
                            className="h-8 px-2 text-red-500 hover:bg-red-50"
                            title="Delete Subject"
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

        {/* Pagination Controls */}
        {subjects.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/20 text-sm">
            <span className="text-slate-500">Total: <strong className="text-slate-700">{totalSubjects}</strong> subjects</span>
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

      {/* ADD SUBJECT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSubmit(onAddSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Create Subject</DialogTitle>
              <DialogDescription>Add a new exam category header. Names must be unique.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase">Subject Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Mathematics"
                  className="border-slate-200"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase">Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  placeholder="Subject details..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="icon" className="text-xs font-bold text-slate-600 uppercase">Visual Icon</Label>
                  <select
                    id="icon"
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white h-9.5"
                    {...register("icon")}
                  >
                    <option value="Tag">Tag / Bookmark</option>
                    <option value="Layers">Layers / Book</option>
                    <option value="HelpCircle">Help Circle</option>
                    <option value="LayoutGrid">Grid Outline</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="color" className="text-xs font-bold text-slate-600 uppercase">Theme Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="color"
                      type="color"
                      className="w-12 h-9 p-0.5 border-slate-200 cursor-pointer"
                      {...register("color")}
                    />
                    <span className="text-xs text-slate-400 font-mono">Palette Color</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold text-slate-600 uppercase">Initial Status</Label>
                <select
                  id="status"
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white h-9.5"
                  {...register("status")}
                >
                  <option value="ACTIVE">Active (Visible)</option>
                  <option value="INACTIVE">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT SUBJECT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSubmit(onEditSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Edit Subject</DialogTitle>
              <DialogDescription>Modify parameters for this subject. Uniqueness is checked.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-bold text-slate-600 uppercase">Subject Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g. Mathematics"
                  className="border-slate-200"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs font-bold text-slate-600 uppercase">Description</Label>
                <textarea
                  id="edit-description"
                  rows={3}
                  placeholder="Subject details..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-icon" className="text-xs font-bold text-slate-600 uppercase">Visual Icon</Label>
                  <select
                    id="edit-icon"
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white h-9.5"
                    {...register("icon")}
                  >
                    <option value="Tag">Tag / Bookmark</option>
                    <option value="Layers">Layers / Book</option>
                    <option value="HelpCircle">Help Circle</option>
                    <option value="LayoutGrid">Grid Outline</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-color" className="text-xs font-bold text-slate-600 uppercase">Theme Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="edit-color"
                      type="color"
                      className="w-12 h-9 p-0.5 border-slate-200 cursor-pointer"
                      {...register("color")}
                    />
                    <span className="text-xs text-slate-400 font-mono">Palette Color</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-status" className="text-xs font-bold text-slate-600 uppercase">Status</Label>
                <select
                  id="edit-status"
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white h-9.5"
                  {...register("status")}
                >
                  <option value="ACTIVE">Active (Visible)</option>
                  <option value="INACTIVE">Inactive (Disabled)</option>
                </select>
              </div>
            </div>

            <DialogFooter>
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
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
            <DialogTitle className="text-slate-800">Soft Delete Subject?</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to archive <strong>{selectedSubject?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-900 text-xs font-medium rounded-lg space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertCircle className="h-4 w-4" /> Cascade Warning
            </p>
            <p>Soft-deleting this subject will automatically soft-delete all category topics nested under it. This action can be undone by restoring the subject.</p>
          </div>
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
              className="bg-red-650 hover:bg-red-750 text-white font-medium shadow-md shadow-red-500/10"
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
            <DialogTitle className="text-slate-800">Restore Subject</DialogTitle>
            <DialogDescription>
              This will restore <strong>{selectedSubject?.name}</strong> and all nested Category topics.
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
