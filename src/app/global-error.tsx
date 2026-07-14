"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical root app crash:", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="h-full flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
        <div className="max-w-md text-center space-y-6">
          <div className="bg-red-600/20 text-red-400 border border-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            !
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">Critical Error</h1>
            <p className="text-slate-400 text-sm">
              A fatal system error crashed the application root. Please reload or try recovery.
            </p>
            {error.message && (
              <pre className="mt-4 p-3 bg-slate-900 rounded-lg text-left text-xs font-mono text-red-400 border border-slate-800 overflow-x-auto">
                {error.message}
              </pre>
            )}
          </div>
          <Button
            onClick={() => reset()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
          >
            Attempt Recovery
          </Button>
        </div>
      </body>
    </html>
  );
}
