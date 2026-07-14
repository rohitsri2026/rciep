import { redirect } from "next/navigation";
import { StudentResultDetailsClient } from "@/components/shared/student-result-details-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentResultPage({ params }: PageProps) {
  const resolved = await params;
  const attemptId = resolved.id;

  if (!attemptId) {
    redirect("/student/dashboard");
  }

  return <StudentResultDetailsClient attemptId={attemptId} />;
}
