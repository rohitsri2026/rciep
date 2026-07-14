import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Page Header skeleton */}
      <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-slate-200 animate-pulse rounded-2xl border border-slate-100" />
        <div className="h-32 bg-slate-200 animate-pulse rounded-2xl border border-slate-100" />
        <div className="h-32 bg-slate-200 animate-pulse rounded-2xl border border-slate-100" />
      </div>

      {/* Large content table skeleton */}
      <div className="h-80 bg-slate-200 animate-pulse rounded-2xl border border-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading workspace data...</span>
        </div>
      </div>
    </div>
  );
}
