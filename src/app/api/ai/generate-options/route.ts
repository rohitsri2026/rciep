import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    // Basic route protection
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { questionText, correctAnswer } = body;

    if (!questionText || !correctAnswer) {
      return NextResponse.json(
        { error: "Missing questionText or correctAnswer fields" },
        { status: 400 }
      );
    }

    // Mock wrong options based on the correct answer
    // In the future, this will be resolved via the Google Gemini API
    const wrongOptions = [
      `${correctAnswer} - Alternative Variant A`,
      `${correctAnswer} - Alternative Variant B`,
      `${correctAnswer} - Alternative Variant C`,
    ];

    // Artificial delay to simulate network AI latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json({
      success: true,
      wrongOptions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
