import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ExamEngineService } from "@/services/exam-engine.service";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";

const heartbeatSchema = z.object({
  attemptId: z.string().min(1, "Attempt identifier is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const validated = heartbeatSchema.parse(body);

    const service = new ExamEngineService();
    const state = await service.getExamState(validated.attemptId, session.user.id);
    
    return NextResponse.json({
      success: true,
      status: state.status,
      remainingSeconds: state.remainingSeconds,
    });
  } catch (error: any) {
    return handleApiError(error);
  }
}
