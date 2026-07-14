import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AttemptService } from "@/services/attempt.service";
import { handleApiError } from "@/lib/api-error";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const service = new AttemptService();
    const data = await service.getStudentDashboardData(session.user.id);
    return NextResponse.json(data);
  } catch (error: any) {
    return handleApiError(error);
  }
}
