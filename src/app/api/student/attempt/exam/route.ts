import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ExamEngineService } from "@/services/exam-engine.service";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";

const getExamSchema = z.object({
  attemptId: z.string().min(1, "Attempt identifier is required"),
});

const postAnswerSchema = z.object({
  attemptId: z.string().min(1, "Attempt identifier is required"),
  questionId: z.string().min(1, "Question identifier is required"),
  answer: z.string().nullable(),
  status: z.enum(["ANSWERED", "MARKED", "ANSWERED_MARKED", "NOT_ANSWERED", "NOT_VISITED"]),
});

const putSubmitSchema = z.object({
  attemptId: z.string().min(1, "Attempt identifier is required"),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const validated = getExamSchema.parse({
      attemptId: searchParams.get("attemptId"),
    });

    const service = new ExamEngineService();
    const result = await service.getExamState(validated.attemptId, session.user.id);
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
    const validated = postAnswerSchema.parse(body);

    const service = new ExamEngineService();
    const result = await service.saveAnswer(
      validated.attemptId,
      session.user.id,
      validated.questionId,
      validated.answer,
      validated.status
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const validated = putSubmitSchema.parse(body);

    const service = new ExamEngineService();
    const result = await service.submitExamAttempt(validated.attemptId, session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}
