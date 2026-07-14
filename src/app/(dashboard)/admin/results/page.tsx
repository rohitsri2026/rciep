import { AdminResultsDashboardClient } from "@/components/shared/admin-results-dashboard-client";

export default function AdminResultsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Results Console</h1>
        <p className="text-slate-500 text-sm">Review student exam scorecards, filter performance listings, and export metrics to CSV.</p>
      </div>
      <AdminResultsDashboardClient />
    </div>
  );
}
