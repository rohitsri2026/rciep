import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TestService } from "@/services/test.service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (err) {
        // Body parsing skipped if empty or invalid
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing Test ID parameter to duplicate" }, { status: 400 });
    }

    const service = new TestService();
    const duplicatedTest = await service.duplicateTest(id);

    return NextResponse.json({ success: true, test: duplicatedTest });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to clone test parameters" }, { status: 400 });
  }
}
