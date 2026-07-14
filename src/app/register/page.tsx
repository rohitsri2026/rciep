"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock, Mail, Eye, EyeOff, User, Loader2, CheckCircle, ArrowLeft, AlertCircle, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ─── Zod Schema ─────────────────────────────────────── */
const registerSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(80, { message: "Name must not exceed 80 characters" })
    .refine((val) => val.trim().length > 0, { message: "Name is required" }),
  email: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create account. Please try again.");
      }

      setSuccessMsg("Registration Successful");
      setSubmitted(true);
      
      // Wait 1.5 seconds and redirect
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMsg(message);
    }
  };

  const PASSWORD_RULES = [
    "At least 8 characters",
    "Include a number or symbol",
    "Mix uppercase and lowercase",
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans grid grid-cols-1 lg:grid-cols-2">
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
              Join Thousands of<br />
              <span className="text-yellow-300">Successful Candidates</span>
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed max-w-sm">
              Create your free account and get instant access to 800+ mock tests, 10,000+ questions, and real-time performance analytics.
            </p>
          </div>

          {/* Benefit bullets */}
          <ul className="space-y-3">
            {[
              "Free access to all mock tests",
              "Real CBT exam simulation environment",
              "Detailed performance analytics",
              "Section-wise progress tracking",
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
          <p className="text-sm text-indigo-100 italic">&ldquo;RCI Portal ne meri railway exam preparation ko completely change kar diya.&rdquo;</p>
          <div className="mt-2 text-xs font-bold text-yellow-300">— Amit Kumar, RRB NTPC 2024 Cleared</div>
        </div>
      </div>

      {/* ── Right: Register Form ──────────────────────── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
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
            <h1 className="text-2xl font-black text-slate-900">Create Your Account</h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Already registered?{" "}
              <Link href="/login" className="text-[#4F46E5] font-bold hover:underline">Sign In</Link>
            </p>
          </div>

          {/* Success State */}
          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
              <div className="h-14 w-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg">Registration Successful!</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  Your account has been created. Redirecting to the login page...
                </p>
              </div>
              <Link href="/login">
                <Button className="h-11 px-7 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl text-sm">
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-700 font-semibold mb-4">
                  <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Rohit Kumar"
                      className="pl-10 h-[52px] border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:bg-white text-sm rounded-xl transition-all"
                      disabled={isSubmitting}
                      {...register("name")}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-600 font-semibold">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-[52px] border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:bg-white text-sm rounded-xl transition-all"
                      disabled={isSubmitting}
                      {...register("email")}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-600 font-semibold">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      className="pl-10 pr-11 h-[52px] border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:bg-white text-sm rounded-xl transition-all"
                      disabled={isSubmitting}
                      {...register("password")}
                    />
                    <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" disabled={isSubmitting} onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 font-semibold">{errors.password.message}</p>}
                  {/* Password hint pills */}
                  <div className="flex gap-2 flex-wrap mt-1">
                    {PASSWORD_RULES.map((rule) => (
                      <span key={rule} className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">{rule}</span>
                    ))}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wide">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="pl-10 pr-11 h-[52px] border-slate-200 bg-slate-50 focus-visible:ring-2 focus-visible:ring-[#4F46E5] focus-visible:bg-white text-sm rounded-xl transition-all"
                      disabled={isSubmitting}
                      {...register("confirmPassword")}
                    />
                    <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" disabled={isSubmitting} onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-600 font-semibold">{errors.confirmPassword.message}</p>}
                </div>

                {/* Terms */}
                <p className="text-xs text-slate-400 leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="text-[#4F46E5] hover:underline font-semibold">Terms of Service</a>{" "}
                  and{" "}
                  <a href="#" className="text-[#4F46E5] hover:underline font-semibold">Privacy Policy</a>.
                </p>

                <Button
                  type="submit"
                  className="w-full h-[52px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl shadow-md shadow-indigo-500/15 active:scale-[0.98] transition-all text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...</>
                  ) : "Create Free Account"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
