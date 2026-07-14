import { redirect } from "next/navigation";
import { ExamEngineClient } from "@/components/shared/exam-engine-client";

interface SearchParams {
  attemptId?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function StudentExamPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const attemptId = resolved.attemptId;

  if (!attemptId) {
    redirect("/student/dashboard");
  }

  return <ExamEngineClient attemptId={attemptId} />;
}
