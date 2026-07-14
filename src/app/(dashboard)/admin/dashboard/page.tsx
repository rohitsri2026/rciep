import { db } from "@/lib/db";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. Fetch real aggregates
  const [
    questionsCount,
    testsCount,
    studentsCount,
    categoriesCount,
    subjectsCount,
    resultsCount,
    draftTestsCount,
    publishedTestsCount,
    pendingReviewQuestions,
    liveCandidatesCount,
  ] = await Promise.all([
    db.question.count(),
    db.test.count({ where: { isDeleted: false } }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.category.count({ where: { isDeleted: false } }),
    db.subject.count({ where: { isDeleted: false } }),
    db.attempt.count({ where: { status: "COMPLETED" } }),
    db.test.count({ where: { status: "DRAFT", isDeleted: false } }),
    db.test.count({ where: { status: "PUBLISHED", isDeleted: false } }),
    db.question.count({ where: { status: "DRAFT" } }),
    db.attempt.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  // 2. Fetch attempts in the last 7 days
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d;
  }).reverse();

  const attemptsByDay = await Promise.all(
    last7Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await db.attempt.count({
        where: {
          startedAt: {
            gte: date,
            lt: nextDay
          }
        }
      });
      return {
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        count: count || 0
      };
    })
  );

  // 3. Fetch questions added in the last 4 weeks
  const last4Weeks = Array.from({ length: 4 }).map((_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (i + 1) * 7);
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    return { start, end, label: `Wk ${4 - i}` };
  }).reverse();

  const questionsByWeek = await Promise.all(
    last4Weeks.map(async (wk) => {
      const count = await db.question.count({
        where: {
          createdAt: {
            gte: wk.start,
            lte: wk.end
          }
        }
      });
      return {
        label: wk.label,
        count: count || 0
      };
    })
  );

  // 4. Fetch subject mock distributions
  const rawSubjects = await db.subject.findMany({
    where: { isDeleted: false },
    select: {
      name: true,
      _count: {
        select: { tests: true }
      }
    },
    take: 5
  });

  const subjectDistribution = rawSubjects.map((s) => ({
    name: s.name,
    count: s._count.tests || 0
  }));

  // 5. Fetch live candidates metadata list
  const activeAttempts = await db.attempt.findMany({
    where: { status: "IN_PROGRESS" },
    include: {
      test: { select: { title: true } },
      user: { select: { name: true, email: true } }
    },
    orderBy: { startedAt: "desc" },
    take: 5
  });

  const liveExamsList = activeAttempts.map((att) => ({
    name: att.test.title,
    candidateName: att.user.name || att.user.email,
    startedAt: att.startedAt.toISOString()
  }));

  return (
    <AdminDashboardClient 
      metrics={{
        questionsCount,
        testsCount,
        studentsCount,
        categoriesCount,
        subjectsCount,
        resultsCount,
        draftTestsCount,
        publishedTestsCount,
        pendingReviewQuestions,
        liveCandidatesCount,
        attemptsByDay,
        questionsByWeek,
        subjectDistribution,
        liveExamsList
      }}
    />
  );
}
