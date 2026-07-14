import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StudentTestInstructionsClient } from "@/components/shared/student-test-instructions-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentTestPage({ params }: PageProps) {
  const resolved = await params;
  const testId = resolved.id;

  if (!testId) {
    redirect("/student/dashboard");
  }

  const session = await auth();

  return <StudentTestInstructionsClient testId={testId} user={session?.user} />;
}
