import { redirect } from "next/navigation";
import { ExamEngineClient } from "@/components/shared/exam-engine-client";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function StudentExamIdPage({ params }: PageProps) {
  const resolved = await params;
  const attemptId = resolved.attemptId;

  if (!attemptId) {
    redirect("/student/dashboard");
  }

  return <ExamEngineClient attemptId={attemptId} />;
}
