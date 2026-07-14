"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Tags, 
  FileSpreadsheet, 
  Database, 
  GraduationCap, 
  History,
  HelpCircle,
  Users,
  Settings,
  TrendingUp,
  Activity,
  FileCheck2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "ADMIN" | "STUDENT";
  className?: string;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ role, className, onCloseMobile, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/tests", label: "Browse Tests", icon: GraduationCap },
    { href: "/student/results", label: "My Results", icon: History },
  ];

  interface SidebarLink {
    href: string;
    label: string;
    icon: any;
    badge?: string;
    disabled?: boolean;
    isAnchor?: boolean;
  }

  // Grouped Admin Links for the new clean Information Architecture
  const adminGroups: { title: string; items: SidebarLink[] }[] = [
    {
      title: "General",
      items: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "Question Management",
      items: [
        { href: "/admin/questions", label: "Question Bank", icon: Database },
        { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
        { href: "/admin/categories", label: "Categories", icon: Tags }
      ]
    },
    {
      title: "Exam Management",
      items: [
        { href: "/admin/tests", label: "Mock Tests", icon: FileSpreadsheet },
        { href: "/admin/dashboard#live-exams", label: "Live Exams", icon: Activity, isAnchor: true },
        { href: "/admin/results", label: "Results", icon: FileCheck2 }
      ]
    },
    {
      title: "User Management",
      items: [
        { href: "#", label: "Students", icon: Users, badge: "148", disabled: true },
        { href: "#", label: "Admins", icon: Users, badge: "2", disabled: true }
      ]
    },
    {
      title: "Reports & Analytics",
      items: [
        { href: "#", label: "Analytics", icon: TrendingUp, badge: "Live", disabled: true }
      ]
    },
    {
      title: "Settings",
      items: [
        { href: "#", label: "Settings", icon: Settings, badge: "v1.2", disabled: true }
      ]
    }
  ];

  return (
    <aside className={cn(
      "flex flex-col h-full bg-slate-950 border-r border-slate-900 text-slate-400 shrink-0 transition-all duration-300 relative",
      isCollapsed ? "w-[70px]" : "w-[230px]",
      className
    )}>
      {/* Brand logo header with collapse toggler */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-900 bg-slate-950/60">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="bg-indigo-600/15 text-indigo-400 w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm tracking-wider ring-1 ring-indigo-500/30 shrink-0">
            RC
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-200">
              <h1 className="font-bold text-slate-200 leading-none text-sm tracking-tight">RCI Portal</h1>
              <span className="text-[9px] text-indigo-400/90 font-bold uppercase tracking-wider mt-0.5 block">
                {role} Control
              </span>
            </div>
          )}
        </div>
        {onToggleCollapse && (
          <button 
            onClick={onToggleCollapse} 
            className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-900 transition-colors hidden md:block shrink-0 border-0 bg-transparent cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Nav links list */}
      <div className="flex-1 py-4 space-y-4 overflow-y-auto px-3">
        {role === "ADMIN" ? (
          adminGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block animate-in fade-in duration-200">
                  {group.title}
                </h3>
              )}
              <div className="space-y-0.5">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  const isActive = !link.disabled && (pathname === link.href || pathname.startsWith(link.href + "/"));

                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      onClick={link.disabled ? (e) => e.preventDefault() : onCloseMobile}
                      className={cn(
                        "flex items-center py-2 text-xs font-semibold rounded-lg transition-all duration-150 group relative",
                        isCollapsed ? "justify-center px-2" : "justify-between px-3",
                        link.disabled 
                          ? "opacity-50 cursor-not-allowed text-slate-650" 
                          : isActive 
                          ? "text-[#4F46E5] bg-indigo-500/5 font-bold border-l-2 border-[#4F46E5] pl-2.5 rounded-l-none" 
                          : "hover:bg-slate-900/60 hover:text-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-[#4F46E5]" : "text-slate-500 group-hover:text-slate-355"
                        )} />
                        {!isCollapsed && <span className="animate-in fade-in duration-200">{link.label}</span>}
                      </div>
                      {!isCollapsed && link.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-550 border border-slate-800 animate-in fade-in duration-200">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                Student Panel
              </h3>
            )}
            <div className="space-y-0.5">
              {studentLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center py-2 text-xs font-semibold rounded-lg transition-all duration-150 group relative",
                      isCollapsed ? "justify-center px-2" : "px-3 gap-2.5",
                      isActive 
                        ? "text-[#4F46E5] bg-indigo-500/5 font-bold border-l-2 border-[#4F46E5] pl-2.5 rounded-l-none" 
                        : "hover:bg-slate-900/60 hover:text-slate-200"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive ? "text-[#4F46E5]" : "text-slate-500 group-hover:text-slate-355"
                    )} />
                    {!isCollapsed && <span className="animate-in fade-in duration-200">{link.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer support details */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/10 text-xs shrink-0">
        <div className="flex items-center gap-2 text-slate-500 hover:text-slate-400 cursor-pointer transition-colors duration-150 justify-center">
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="animate-in fade-in duration-200">Documentation & Help</span>}
        </div>
      </div>
    </aside>
  );
}
