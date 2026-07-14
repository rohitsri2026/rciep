import { db } from "@/lib/db";
import { QuestionsClient } from "@/components/shared/questions-client";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  // Fetch subjects and categories server-side for filters and form dropdowns
  const [subjects, categories] = await Promise.all([
    db.subject.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      select: {
        id: true,
        name: true,
        subjectId: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <QuestionsClient
      initialSubjects={subjects}
      initialCategories={categories}
    />
  );
}
