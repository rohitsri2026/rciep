import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { handleApiError } from "@/lib/api-error";
import { Role } from "@prisma/client";
import { z } from "zod";

const registerServerSchema = z.object({
  name: z.string()
    .min(3, { message: "Name must be at least 3 characters" })
    .max(80, { message: "Name must not exceed 80 characters" })
    .refine((val) => val.trim().length > 0, { message: "Name is required" }),
  email: z.string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Server validation and sanitization using strict schema
    const parsedData = registerServerSchema.parse(body);

    const userService = new UserService();

    // Prevent role injection by hardcoding STUDENT role and passing only sanitized fields
    const newUser = await userService.registerUser({
      name: parsedData.name.trim(),
      email: parsedData.email.trim().toLowerCase(),
      password: parsedData.password,
      role: Role.STUDENT,
    });

    return NextResponse.json({
      success: true,
      message: "Registration Successful",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      }
    }, { status: 201 });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}
