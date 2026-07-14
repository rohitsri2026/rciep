import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TestQuestionService } from "@/services/test-question.service";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");

    if (!testId) {
      return NextResponse.json({ error: "Missing parameter: testId" }, { status: 400 });
    }

    const service = new TestQuestionService();
    const assigned = await service.getAssignedQuestions(testId);
    return NextResponse.json({ success: true, assigned });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 550 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { testId, questionIds } = body;

    const service = new TestQuestionService();
    const result = await service.assignQuestionsToTest(testId, questionIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to assign questions" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const testId = searchParams.get("testId");
    const questionIdParam = searchParams.get("questionIds");

    let questionIds: string[] = [];
    if (questionIdParam) {
      questionIds = questionIdParam.split(",");
    } else {
      try {
        const body = await req.json();
        questionIds = body.questionIds || [];
      } catch (err) {
        // Body reading skipped
      }
    }

    if (!testId || !questionIds || questionIds.length === 0) {
      return NextResponse.json({ error: "Missing required parameters: testId or questionIds" }, { status: 400 });
    }

    const service = new TestQuestionService();
    const result = await service.removeQuestionsFromTest(testId, questionIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to remove questions" }, { status: 400 });
  }
}
