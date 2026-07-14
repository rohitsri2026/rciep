import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { SubjectService } from "@/services/subject.service";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const search = searchParams.get("search") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;
    const showDeleted = searchParams.get("showDeleted") === "true";

    const service = new SubjectService();

    if (page || limit || search || subjectId || showDeleted) {
      const result = await service.getCategoriesFiltered({
        page,
        limit,
        search,
        subjectId,
        showDeleted,
      });
      return NextResponse.json(result);
    }

    const categories = await service.getAllCategories();
    return NextResponse.json({ categories });
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
    const service = new SubjectService();
    const category = await service.createCategory(body);
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create category" }, { status: 400 });
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
      return NextResponse.json({ error: "Missing Category ID" }, { status: 400 });
    }

    const service = new SubjectService();

    if (action === "restore") {
      const category = await service.restoreCategory(id);
      return NextResponse.json({ success: true, category });
    }

    const body = await req.json();
    const category = await service.updateCategory(id, body);
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update category" }, { status: 400 });
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
      return NextResponse.json({ error: "Missing Category ID" }, { status: 400 });
    }

    const service = new SubjectService();
    const category = await service.softDeleteCategory(id);
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete category" }, { status: 400 });
  }
}
