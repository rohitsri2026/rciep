"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
      <div className="bg-red-50 text-red-500 w-16 h-16 rounded-full flex items-center justify-center">
        <AlertCircle className="w-8 h-8" />
      </div>
      
      <div className="space-y-2 max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Something went wrong!</h2>
        <p className="text-slate-500 text-sm">
          An error occurred while fetching dashboard component data.
        </p>
        {error.message && (
          <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-left text-xs font-mono text-red-600 border border-slate-200 overflow-x-auto">
            {error.message}
          </pre>
        )}
      </div>

      <div className="flex gap-4 justify-center">
        <Button
          onClick={() => reset()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}
