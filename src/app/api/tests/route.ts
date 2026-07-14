import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { TestService } from "@/services/test.service";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;
    const visibility = searchParams.get("visibility") || undefined;
    const showDeleted = searchParams.get("showDeleted") === "true";
    const sortBy = searchParams.get("sortBy") || undefined;
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const service = new TestService();
    const result = await service.getTestsFiltered({
      page,
      limit,
      search,
      subjectId,
      categoryId,
      status,
      type,
      visibility,
      showDeleted,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const service = new TestService();
    const test = await service.createTest(body);
    return NextResponse.json({ success: true, test });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create test" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) {
      return NextResponse.json({ error: "Missing Test ID parameter" }, { status: 400 });
    }

    const service = new TestService();

    if (action === "restore") {
      const test = await service.restoreTest(id);
      return NextResponse.json({ success: true, test });
    }

    const body = await req.json();
    const test = await service.updateTest(id, body);
    return NextResponse.json({ success: true, test });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update test" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing Test ID parameter" }, { status: 400 });
    }

    const service = new TestService();
    const test = await service.softDeleteTest(id);
    return NextResponse.json({ success: true, test });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete test" }, { status: 400 });
  }
}
