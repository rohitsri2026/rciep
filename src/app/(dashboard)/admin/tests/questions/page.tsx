import { redirect } from "next/navigation";
import { TestQuestionsClient } from "@/components/shared/test-questions-client";

interface SearchParams {
  testId?: string;
}

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminTestQuestionsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const testId = resolvedParams.testId;

  if (!testId) {
    redirect("/admin/tests");
  }

  return <TestQuestionsClient testId={testId} />;
}
