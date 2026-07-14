import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AttemptService } from "@/services/attempt.service";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";

const attemptQuerySchema = z.object({
  testId: z.string().min(1, "Test identification is required"),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const validated = attemptQuerySchema.parse({
      testId: searchParams.get("testId"),
    });

    const service = new AttemptService();
    const result = await service.getTestDetailsForStudent(session.user.id, validated.testId);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const validated = attemptQuerySchema.parse(body);

    const service = new AttemptService();
    const result = await service.startOrResumeAttempt(session.user.id, validated.testId);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}
