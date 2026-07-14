"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Menu, LogOut, User, Bell, Search, Sun, Moon, Globe, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: "ADMIN" | "STUDENT";
  };
  onMenuToggle: () => void;
}

export function Navbar({ user, onMenuToggle }: NavbarProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [lang, setLang] = useState("EN");

  const userInitials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user.email
    ? user.email[0].toUpperCase()
    : "U";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  };

  return (
    <header className="h-16 border-b border-slate-100 bg-white/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left side: mobile toggle & breadcrumb navigation */}
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-slate-600 hover:bg-slate-100" 
          onClick={onMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Breadcrumb Navigation */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500">
          <span className="text-slate-400">Admin</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800">Dashboard</span>
        </div>

        <div className="hidden lg:block h-4 w-px bg-slate-200 mx-2" />

        {/* Server & Login Status */}
        <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-md">
            <span>Last login: 10 mins ago</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Server:</span>
            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
              Operational
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </div>
        </div>
      </div>

      {/* Right side: search, dark mode, language, notifications, profile */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        {user.role === "ADMIN" && (
          <div className="relative hidden md:block w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-455" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-xs font-semibold rounded-xl outline-none focus:ring-1 focus:ring-[#4F46E5] text-slate-800 transition-all placeholder:text-slate-400 h-8"
              disabled
            />
          </div>
        )}

        {/* Dark Mode Selector Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-500 hover:bg-slate-100 rounded-xl h-9 w-9"
          onClick={toggleTheme}
        >
          {theme === "light" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </Button>

        {/* Language Selector Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="h-9 px-2 flex items-center gap-1 outline-none hover:bg-slate-100 rounded-xl text-slate-655 cursor-pointer text-xs font-bold border-0 bg-transparent">
            <Globe className="w-4 h-4" />
            <span>{lang}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-24" align="end">
            <DropdownMenuItem onClick={() => setLang("EN")} className="text-xs font-bold cursor-pointer">English (EN)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLang("HI")} className="text-xs font-bold cursor-pointer">Hindi (HI)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 relative rounded-xl h-9 w-9">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </Button>

        <div className="h-6 w-px bg-slate-200" />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none group cursor-pointer bg-transparent border-0 p-0">
            <Avatar className="w-9 h-9 border border-slate-200 transition group-hover:border-slate-300">
              <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
              <AvatarFallback className="bg-indigo-600 text-white text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-none">{user.name || "User Account"}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{user.email}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-2.5 py-2 flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none text-slate-800">{user.name || "User"}</p>
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {user.role}
                </Badge>
              </div>
              <p className="text-xs leading-none text-slate-400">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-slate-600 focus:bg-slate-50 focus:text-slate-900 cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
