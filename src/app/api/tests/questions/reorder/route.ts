import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TestQuestionService } from "@/services/test-question.service";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { testId, questionIds } = body;

    const service = new TestQuestionService();
    const result = await service.reorderQuestionsInTest(testId, questionIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update display sequence" }, { status: 400 });
  }
}
