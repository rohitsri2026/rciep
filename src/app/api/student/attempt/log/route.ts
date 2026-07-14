import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ExamEngineService } from "@/services/exam-engine.service";
import { handleApiError } from "@/lib/api-error";
import { z } from "zod";

const logCheatSchema = z.object({
  attemptId: z.string().min(1, "Attempt identifier is required"),
  eventType: z.string().min(1, "Event log type is required"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const validated = logCheatSchema.parse(body);

    const service = new ExamEngineService();
    const result = await service.logCheatingEvent(validated.attemptId, session.user.id, validated.eventType);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleApiError(error);
  }
}
