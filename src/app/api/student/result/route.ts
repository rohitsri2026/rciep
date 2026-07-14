import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AttemptRepository } from "@/repositories/attempt.repository";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";

const resultQuerySchema = z.object({
  attemptId: z.string().min(1, "Attempt identifier is required"),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const validated = resultQuerySchema.parse({
      attemptId: searchParams.get("attemptId"),
    });

    const repo = new AttemptRepository();
    const attempt = await repo.findAttemptWithRelations(validated.attemptId);

    if (!attempt) {
      return NextResponse.json({ error: "Attempt record not found" }, { status: 404 });
    }

    // Role-based validation checks: Students can only view their own results, Admins can view all.
    const isStudent = session.user.role === "STUDENT";
    if (isStudent && attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied. You cannot view other students' scorecard reviews." }, { status: 403 });
    }

    if (attempt.status !== "COMPLETED") {
      return NextResponse.json({ error: "Attempt is in progress. Result is not generated yet." }, { status: 400 });
    }

    return NextResponse.json(attempt);
  } catch (error: any) {
    return handleApiError(error);
  }
}
