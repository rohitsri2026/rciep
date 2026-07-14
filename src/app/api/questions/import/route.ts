import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { QuestionService } from "@/services/question.service";

export async function POST(req: Request) {
  try {
    // Restrict to ADMIN role
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No import file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const questionService = new QuestionService();
    const { importedCount } = await questionService.importFromExcel(buffer);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} questions.`,
      importedCount,
    });
  } catch (error: any) {
    console.error("Bulk import failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process import file" },
      { status: 500 }
    );
  }
}
