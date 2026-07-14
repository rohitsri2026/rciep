"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock, Mail, Eye, EyeOff, ShieldAlert, Loader2, CheckCircle, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ─── Zod Schema ─────────────────────────────────────── */
const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  rememberMe: z.boolean().optional(),
});
type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.refresh();
        router.push(callbackUrl);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans grid grid-cols-1 lg:grid-cols-2">
      {/* ── Left: Brand & Info Panel ─────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white p-14 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-sm border border-white/30">
            RCI
          </div>
          <span className="font-extrabold text-lg tracking-tight">Exam Portal</span>
        </Link>

        {/* Center copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-black leading-tight">
              Access Your<br />
              <span className="text-yellow-300">Exam Workspace</span>
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
              Log in to access your mock tests, view real-time statistics, review solutions, and track your rank leaderboard.
            </p>
          </div>

          {/* Benefit bullets */}
          <ul className="space-y-3">
            {[
              "Practice with 800+ detailed mock tests",
              "Real Computer Based Test (CBT) interface",
              "Instant score calculation & answer key",
              "Sectional time-limit simulation indicators",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-indigo-100 font-medium">
                <CheckCircle className="w-4 h-4 text-yellow-300 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
          <p className="text-sm text-indigo-100 italic">&ldquo;RCI Portal ke mock questions se bank exams me confidence bohot badh gaya.&rdquo;</p>
          <div className="mt-2 text-xs font-bold text-yellow-300">— Priya Verma, SBI PO 2024 Cleared</div>
        </div>
      </div>

      {/* ── Right: Login Form ────────────────────────── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-white">
        {/* Mobile back link */}
        <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors mb-8 lg:hidden">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="max-w-md w-full mx-auto space-y-7">
          {/* Header */}
          <div>
            <Link href="/" className="hidden lg:flex items-center gap-2 mb-8 text-slate-500 hover:text-[#4F46E5] transition-colors text-sm font-bold">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <h1 className="text-2xl font-black text-slate-900">Welcome Back 👋</h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#4F46E5] font-bold hover:underline">Register Free</Link>
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold mb-4">
              <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-[52px] border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:bg-white text-sm rounded-xl transition-all"
                  disabled={isLoading}
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs text-red-600 font-semibold">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</Label>
                <a href="#" className="text-xs text-[#4F46E5] hover:text-[#4338CA] font-bold transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-11 h-[52px] border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:bg-white text-sm rounded-xl transition-all"
                  disabled={isLoading}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 font-semibold">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#4F46E5] focus:ring-[#4F46E5] cursor-pointer accent-[#4F46E5]"
                {...register("rememberMe")}
              />
              <Label htmlFor="rememberMe" className="text-sm text-slate-600 font-medium cursor-pointer select-none">
                Remember me for 30 days
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl shadow-md shadow-indigo-500/15 active:scale-[0.98] transition-all text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
              ) : "Sign In to Dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F46E5]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
