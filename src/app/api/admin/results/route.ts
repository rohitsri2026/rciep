import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AttemptRepository } from "@/repositories/attempt.repository";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";
import { db } from "@/lib/db";

const adminResultsQuerySchema = z.object({
  subjectId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  testId: z.string().optional().nullable(),
  passStatus: z.string().optional().nullable(),
  search: z.string().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Role-based validation checks: Admins can view all, Students are blocked
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Administrative credentials required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const validated = adminResultsQuerySchema.parse({
      subjectId: searchParams.get("subjectId"),
      categoryId: searchParams.get("categoryId"),
      testId: searchParams.get("testId"),
      passStatus: searchParams.get("passStatus"),
      search: searchParams.get("search"),
    });

    const repo = new AttemptRepository();
    const attempts = await repo.findAllCompletedAttempts({
      subjectId: validated.subjectId || undefined,
      categoryId: validated.categoryId || undefined,
      testId: validated.testId || undefined,
      passStatus: validated.passStatus || undefined,
      search: validated.search || undefined,
    });

    // Populate active parameters list for filters
    const subjects = await db.subject.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });

    const categories = await db.category.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, subjectId: true },
      orderBy: { name: "asc" },
    });

    const tests = await db.test.findMany({
      where: { isDeleted: false },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ 
      success: true, 
      attempts,
      subjects,
      categories,
      tests
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
