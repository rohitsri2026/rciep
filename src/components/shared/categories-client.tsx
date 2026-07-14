"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Plus, Search, Edit, Trash2, RotateCcw, Loader2, Check, AlertCircle, 
  Tag, Layers, ArrowUpDown, GripVertical, CheckCircle2, Eye, EyeOff
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

// Zod form validation
const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  displayOrder: z.number().int(),
  subjectId: z.string().min(1, "Subject is required"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  status: string;
  displayOrder: number;
  isDeleted: boolean;
  subjectId: string;
  createdAt: string;
  updatedAt: string;
  subject?: Subject;
  _count?: {
    questions: number;
  };
}

export function CategoriesClient() {
  // Lists & pagination state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCategories, setTotalCategories] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);

  // Reorder dragging state
  const [reorderList, setReorderList] = useState<Category[]>([]);
  const [reorderSubjectId, setReorderSubjectId] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Feedback notifications
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
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      displayOrder: 0,
      subjectId: "",
    }
  });

  const watchedSubjectId = watch("subjectId");

  // Toast alert notifier
  const showNotification = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Fetch initial active subjects for dropdowns
  const fetchSubjects = async () => {
    await Promise.resolve();
    try {
      const res = await fetch("/api/subjects");
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error("Failed to load subjects for dropdown", err);
    }
  };

  // Fetch categories with queries
  const fetchCategories = async () => {
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
      if (subjectFilter !== "all") {
        params.append("subjectId", subjectFilter);
      }

      const res = await fetch(`/api/categories?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load categories list");
      }
      const data = await res.json();
      setCategories(data.categories || []);
      setTotalCategories(data.total || 0);
      setTotalPages(data.pages || 1);
    } catch (err: any) {
      showNotification("error", err?.message || "Could not retrieve categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, subjectFilter, showDeleted]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCategories();
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Dialog actions
  const handleOpenAdd = () => {
    reset({
      name: "",
      description: "",
      status: "ACTIVE",
      displayOrder: 0,
      subjectId: subjectFilter !== "all" ? subjectFilter : "",
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setSelectedCategory(cat);
    reset({
      name: cat.name,
      description: cat.description || "",
      status: cat.status as "ACTIVE" | "INACTIVE",
      displayOrder: cat.displayOrder,
      subjectId: cat.subjectId,
    });
    setIsEditOpen(true);
  };

  const onAddSubmit = async (values: CategoryFormValues) => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }
      showNotification("success", `Category "${values.name}" created successfully`);
      setIsAddOpen(false);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onEditSubmit = async (values: CategoryFormValues) => {
    if (!selectedCategory) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/categories?id=${selectedCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }
      showNotification("success", `Category "${values.name}" updated successfully`);
      setIsEditOpen(false);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    try {
      const nextStatus = cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch(`/api/categories?id=${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cat.name,
          subjectId: cat.subjectId,
          status: nextStatus,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Status toggle failed");
      }
      showNotification("success", `Category "${cat.name}" status updated to ${nextStatus}`);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleOpenDelete = (cat: Category) => {
    setSelectedCategory(cat);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/categories?id=${selectedCategory.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete category");
      }
      showNotification("success", `Category "${selectedCategory.name}" soft-deleted successfully.`);
      setIsDeleteOpen(false);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRestore = (cat: Category) => {
    setSelectedCategory(cat);
    setIsRestoreOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedCategory) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/categories?id=${selectedCategory.id}&action=restore`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to restore category");
      }
      showNotification("success", `Category "${selectedCategory.name}" restored successfully.`);
      setIsRestoreOpen(false);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // REORDER DIALOG CONTROLS
  const handleOpenReorder = async () => {
    // Select the current filter if it's a subject, or default to the first subject
    const initialId = subjectFilter !== "all" ? subjectFilter : (subjects[0]?.id || "");
    setReorderSubjectId(initialId);
    if (initialId) {
      loadReorderCategories(initialId);
    }
    setIsReorderOpen(true);
  };

  const loadReorderCategories = async (subId: string) => {
    try {
      const res = await fetch(`/api/categories?subjectId=${subId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        setReorderList(data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories for reordering", err);
    }
  };

  // Drag & Drop event handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...reorderList];
    const draggedItem = list[draggedIndex];
    
    // Remove dragged item from old index
    list.splice(draggedIndex, 1);
    // Insert at new index
    list.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setReorderList(list);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveReorder = async () => {
    try {
      setSubmitting(true);
      // Map new sequence orders
      const payload = reorderList.map((item, idx) => ({
        id: item.id,
        displayOrder: idx + 1,
      }));

      const res = await fetch("/api/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save category sequence");
      }

      showNotification("success", "Category display sequence saved successfully.");
      setIsReorderOpen(false);
      fetchCategories();
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Categories Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage subject topics, display sequencing, and review question counts.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button 
            variant="outline"
            onClick={handleOpenReorder}
            className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
          >
            <ArrowUpDown className="mr-1.5 h-4 w-4 text-slate-500" /> Sort Topics
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add Category
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-150 shadow-sm bg-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-200 focus-visible:ring-indigo-500 placeholder:text-slate-400 text-sm"
              />
            </div>

            {/* Subject Select filter */}
            <Select value={subjectFilter} onValueChange={(val) => { setSubjectFilter(val || "all"); setPage(1); }}>
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

            {/* Archival toggler checkbox */}
            <div className="flex items-center gap-2 pl-2 sm:col-span-2 justify-start sm:justify-end">
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
                Show Deleted Categories
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card className="border-slate-150 shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100">
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Name</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subject</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Questions</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Order</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Created</TableHead>
              <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-sm font-semibold">Loading categories list...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="text-slate-400 max-w-sm mx-auto">
                    <p className="font-bold text-slate-700 mb-1">No categories found</p>
                    <p className="text-sm">Create a new category topic or verify your subject filter selection.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="border-slate-100 hover:bg-slate-50/30">
                  <TableCell className="font-medium text-slate-800 py-4 pl-6">
                    {cat.name}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: cat.subject?.color || "#6366f1" }}
                      />
                      <span className="text-slate-700 text-xs font-semibold">{cat.subject?.name || "Unassigned"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs py-4 max-w-xs truncate">
                    {cat.description || <span className="text-slate-350">No description</span>}
                  </TableCell>
                  <TableCell className="text-center font-semibold text-slate-700 py-4">
                    {cat._count?.questions || 0}
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <Badge className="bg-slate-50 text-slate-650 hover:bg-slate-100/50 text-[10px] px-2 py-0.5 border border-slate-150">
                      Seq {cat.displayOrder}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    {cat.isDeleted ? (
                      <Badge variant="destructive">DELETED</Badge>
                    ) : cat.status === "ACTIVE" ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/50">ACTIVE</Badge>
                    ) : (
                      <Badge className="bg-slate-550/10 text-slate-500 border border-slate-200">INACTIVE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 py-4">
                    {new Date(cat.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="text-right py-4 pr-6">
                    <div className="flex items-center justify-end gap-1.5">
                      {cat.isDeleted ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenRestore(cat)}
                          className="h-8 px-2 text-indigo-650 hover:bg-indigo-50/50"
                          title="Restore Category"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(cat)}
                            className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                            title={cat.status === "ACTIVE" ? "Disable" : "Enable"}
                          >
                            {cat.status === "ACTIVE" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(cat)}
                            className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                            title="Edit Category"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(cat)}
                            className="h-8 px-2 text-red-500 hover:bg-red-50"
                            title="Delete Category"
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
        {categories.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/20 text-sm">
            <span className="text-slate-500">Total: <strong className="text-slate-700">{totalCategories}</strong> categories</span>
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

      {/* CREATE CATEGORY DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSubmit(onAddSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Create Category</DialogTitle>
              <DialogDescription>Add a new sub-topic category topic. Uniqueness is enforced within a Subject.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="subjectId" className="text-xs font-bold text-slate-600 uppercase">Parent Subject</Label>
                <Select value={watchedSubjectId} onValueChange={(val) => setValue("subjectId", val || "")}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select Parent Subject" />
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
                <Label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase">Category Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Antonyms"
                  className="border-slate-200"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-slate-600 uppercase">Description</Label>
                <textarea
                  id="description"
                  rows={2}
                  placeholder="Category topic scope..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="displayOrder" className="text-xs font-bold text-slate-600 uppercase">Sequence Order</Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    placeholder="0"
                    className="border-slate-200"
                    {...register("displayOrder", { valueAsNumber: true })}
                  />
                  {errors.displayOrder && <p className="text-xs text-red-500 font-semibold">{errors.displayOrder.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="status" className="text-xs font-bold text-slate-600 uppercase">Status</Label>
                  <select
                    id="status"
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white h-9.5"
                    {...register("status")}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT CATEGORY DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSubmit(onEditSubmit)}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">Edit Category</DialogTitle>
              <DialogDescription>Modify parameters for this topic category.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-subjectId" className="text-xs font-bold text-slate-600 uppercase">Parent Subject</Label>
                <Select value={watchedSubjectId} onValueChange={(val) => setValue("subjectId", val || "")}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue placeholder="Select Parent Subject" />
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
                <Label htmlFor="edit-name" className="text-xs font-bold text-slate-600 uppercase">Category Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g. Antonyms"
                  className="border-slate-200"
                  {...register("name")}
                />
                {errors.name && <p className="text-xs text-red-500 font-semibold">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-description" className="text-xs font-bold text-slate-600 uppercase">Description</Label>
                <textarea
                  id="edit-description"
                  rows={2}
                  placeholder="Category topic scope..."
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-displayOrder" className="text-xs font-bold text-slate-600 uppercase">Sequence Order</Label>
                  <Input
                    id="edit-displayOrder"
                    type="number"
                    placeholder="0"
                    className="border-slate-200"
                    {...register("displayOrder", { valueAsNumber: true })}
                  />
                  {errors.displayOrder && <p className="text-xs text-red-500 font-semibold">{errors.displayOrder.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-status" className="text-xs font-bold text-slate-600 uppercase">Status</Label>
                  <select
                    id="edit-status"
                    className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white h-9.5"
                    {...register("status")}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
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
            <DialogTitle className="text-slate-800">Soft Delete Category?</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to archive the category <strong>{selectedCategory?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
            <DialogTitle className="text-slate-800">Restore Category</DialogTitle>
            <DialogDescription>
              This will restore the category topic <strong>{selectedCategory?.name}</strong> to the active list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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

      {/* REORDER CATEGORIES (DRAG AND DROP) */}
      <Dialog open={isReorderOpen} onOpenChange={setIsReorderOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-1.5">
              <ArrowUpDown className="h-5 w-5 text-indigo-500" /> Sort Topics sequence
            </DialogTitle>
            <DialogDescription>
              Select a Subject, then drag and drop topics visually to rearrange their presentation order.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Subject Selector inside Dialog */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase">Subject</Label>
              <Select 
                value={reorderSubjectId} 
                onValueChange={(val) => {
                  setReorderSubjectId(val || "");
                  if (val) loadReorderCategories(val);
                }}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select parent Subject to view topics" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Draggable items list */}
            {reorderSubjectId && (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                <Label className="text-xs font-bold text-slate-600 uppercase block mb-1">Topics Sequence</Label>
                {reorderList.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                    No active categories found under this subject.
                  </div>
                ) : (
                  reorderList.map((item, index) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 bg-white border rounded-lg flex items-center gap-3 cursor-grab active:cursor-grabbing transition-all select-none ${
                        draggedIndex === index 
                          ? "border-indigo-500 bg-indigo-50/20 shadow-md scale-[0.98] opacity-70" 
                          : "border-slate-200 hover:border-slate-350 hover:bg-slate-50/50"
                      }`}
                    >
                      <GripVertical className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                      <span className="text-slate-800 text-xs font-medium flex-1">{item.name}</span>
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px]">
                        Order #{index + 1}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReorderOpen(false)}
              className="border-slate-200 text-slate-700 bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveReorder}
              disabled={submitting || !reorderSubjectId || reorderList.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Sequence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
