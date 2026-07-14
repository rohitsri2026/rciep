import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SubjectService } from "@/services/subject.service";

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const reorders = await req.json();

    if (!Array.isArray(reorders)) {
      return NextResponse.json({ error: "Invalid payload format. Expected an array." }, { status: 400 });
    }

    const service = new SubjectService();
    await service.reorderCategories(reorders);

    return NextResponse.json({ success: true, message: "Categories reordered successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to reorder categories" }, { status: 400 });
  }
}
