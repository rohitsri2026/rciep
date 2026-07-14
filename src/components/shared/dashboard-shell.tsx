"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Plus, Database, FileSpreadsheet, BookOpen, Tags, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "ADMIN" | "STUDENT";
  };
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  // Floating Action menu list
  const fabItems = [
    { label: "Add Question", href: "/admin/questions", icon: Database, color: "bg-indigo-650 hover:bg-indigo-700" },
    { label: "Create Test", href: "/admin/tests", icon: FileSpreadsheet, color: "bg-violet-650 hover:bg-violet-700" },
    { label: "Add Subject", href: "/admin/subjects", icon: BookOpen, color: "bg-sky-650 hover:bg-sky-700" },
    { label: "Add Category", href: "/admin/categories", icon: Tags, color: "bg-amber-650 hover:bg-amber-700" },
  ];

  // Command Menu Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setFabOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative select-none">
      {/* Desktop Sidebar (visible md+) */}
      <Sidebar 
        role={user.role} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="hidden md:flex" 
      />

      {/* Mobile Drawer (visible under md) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 bg-slate-900 border-r-slate-800 w-[230px]">
          <Sidebar role={user.role} onCloseMobile={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Content wrapper - widescreen container layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Navbar */}
        <Navbar user={user} onMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Dynamic child content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7.5 bg-[#F7F8FC]">
          <div className="w-full mx-auto space-y-7">
            {children}
          </div>
        </main>

        {/* ── Floating Quick Create Action Menu (Bottom Right FAB) ── */}
        {user.role === "ADMIN" && (
          <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
            {/* Speed-dial child buttons */}
            {fabOpen && (
              <div className="flex flex-col items-end gap-2.5 mb-1.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                {fabItems.map((item) => (
                  <Link key={item.label} href={item.href} onClick={() => setFabOpen(false)}>
                    <div className="flex items-center gap-2 group cursor-pointer">
                      <span className="text-[10px] font-bold px-2.5 py-1.5 rounded bg-slate-900 text-white shadow shadow-slate-950/25 block">
                        {item.label}
                      </span>
                      <div className={cn("h-9.5 w-9.5 rounded-full flex items-center justify-center text-white shadow-lg", item.color)}>
                        <item.icon className="w-4.5 h-4.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Main FAB Trigger */}
            <Button
              onClick={() => setFabOpen(!fabOpen)}
              className={cn(
                "h-12.5 w-12.5 rounded-full bg-[#4F46E5] hover:bg-[#4338CA] text-white flex items-center justify-center shadow-xl hover:shadow-indigo-500/20 transition-all cursor-pointer border-0 active:scale-95",
                fabOpen && "bg-slate-900 hover:bg-slate-800"
              )}
            >
              {fabOpen ? <X className="w-5 h-5" /> : <Plus className="w-5.5 h-5.5" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
