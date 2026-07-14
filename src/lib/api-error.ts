import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function handleApiError(error: any) {
  // Log the complete error stack on the server console
  console.error("API Error Captured:", error);

  if (error instanceof ZodError) {
    const combinedMsg = error.issues
      .map((err: any) => `${err.path.join(".")}: ${err.message}`)
      .join("; ");
    return NextResponse.json(
      { success: false, error: `Validation Failed - ${combinedMsg}` },
      { status: 400 }
    );
  }

  const msg = error instanceof Error ? error.message : "An unexpected server error occurred";
  const statusCode = (error as any).status || 500;

  return NextResponse.json(
    { success: false, error: msg },
    { status: statusCode }
  );
}
