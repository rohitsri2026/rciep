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
    const showDeleted = searchParams.get("showDeleted") === "true";

    const service = new SubjectService();
    
    // Check if filtering parameters are passed to use paginated query
    if (page || limit || search || showDeleted) {
      const result = await service.getSubjectsFiltered({ page, limit, search, showDeleted });
      return NextResponse.json(result);
    }

    // Default to listing all active subjects
    const subjects = await service.getAllSubjects();
    return NextResponse.json({ subjects });
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
    const subject = await service.createSubject(body);
    return NextResponse.json({ success: true, subject });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create subject" }, { status: 400 });
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
      return NextResponse.json({ error: "Missing Subject ID" }, { status: 400 });
    }

    const service = new SubjectService();

    if (action === "restore") {
      const subject = await service.restoreSubject(id);
      return NextResponse.json({ success: true, subject });
    }

    const body = await req.json();
    const subject = await service.updateSubject(id, body);
    return NextResponse.json({ success: true, subject });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update subject" }, { status: 400 });
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
      return NextResponse.json({ error: "Missing Subject ID" }, { status: 400 });
    }

    const service = new SubjectService();
    const subject = await service.softDeleteSubject(id);
    return NextResponse.json({ success: true, subject });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete subject" }, { status: 400 });
  }
}
