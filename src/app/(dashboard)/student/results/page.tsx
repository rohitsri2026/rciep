import { StudentDashboardClient } from "@/components/shared/student-dashboard-client";

export default function StudentResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Exam Results</h1>
        <p className="text-slate-500 text-sm">Review your historical test performance, passing metrics, and subject breakdowns.</p>
      </div>
      <StudentDashboardClient />
    </div>
  );
}
