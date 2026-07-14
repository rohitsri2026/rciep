import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { QuestionRepository } from "@/repositories/question.repository";
import { QuestionService } from "@/services/question.service";

export async function GET(req: Request) {
  try {
    // Auth guard
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "excel"; // "excel" | "csv"

    const questionRepo = new QuestionRepository();
    const questions = await questionRepo.findAll(); // Export all questions in the bank

    const questionService = new QuestionService();

    if (format === "csv") {
      const csvContent = await questionService.exportToCSV(questions);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="question-bank.csv"',
        },
      });
    }

    // Default to Excel
    const excelBuffer = await questionService.exportToExcel(questions);
    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="question-bank.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Bulk export failed:", error);
    return new NextResponse(error?.message || "Failed to generate export file", {
      status: 500,
    });
  }
}
