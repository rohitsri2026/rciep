import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { QuestionService } from "@/services/question.service";
import { Difficulty, QuestionStatus, QuestionType } from "@prisma/client";

// GET - Paginated, filtered questions search
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const subjectId = searchParams.get("subjectId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const difficulty = (searchParams.get("difficulty") || undefined) as Difficulty | undefined;
    const status = (searchParams.get("status") || undefined) as QuestionStatus | undefined;

    const questionService = new QuestionService();
    const result = await questionService.getQuestionsFiltered({
      page,
      limit,
      search,
      subjectId,
      categoryId,
      difficulty,
      status,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to load questions list" },
      { status: 500 }
    );
  }
}

// POST - Create a new question
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const questionService = new QuestionService();
    const newQuestion = await questionService.createQuestion(body);

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create question record" },
      { status: 400 }
    );
  }
}

// PUT - Update a question by ID
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing question ID parameter" }, { status: 400 });
    }

    const body = await req.json();
    const questionService = new QuestionService();
    const updatedQuestion = await questionService.updateQuestion(id, body);

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update question record" },
      { status: 400 }
    );
  }
}

// DELETE - Remove a question by ID
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing question ID parameter" }, { status: 400 });
    }

    const questionService = new QuestionService();
    await questionService.deleteQuestion(id);

    return NextResponse.json({ success: true, message: "Question deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete question record" },
      { status: 400 }
    );
  }
}
