import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-6 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md text-center space-y-6 relative z-10">
        <div className="bg-slate-900/60 border border-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Page Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The page you are looking for does not exist, has been moved, or you might not have access to view it.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
