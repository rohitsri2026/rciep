import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  // Uploadthing API calls also need to bypass redirect rules
  const isApiUploadRoute = nextUrl.pathname.startsWith("/api/uploadthing");
  // Homepage "/" and "/register" are public — no auth required
  const isHomeOrLoginRoute = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/login");
  const isPublicRoute = isHomeOrLoginRoute || nextUrl.pathname === "/register";

  if (isApiAuthRoute || isApiUploadRoute) {
    return;
  }

  // If user hits "/" or any leftover "/login" URL while already logged in, redirect to dashboard
  if (isHomeOrLoginRoute) {
    if (isLoggedIn) {
      const role = req.auth?.user?.role;
      if (role === "ADMIN") {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }
      return Response.redirect(new URL("/student/dashboard", nextUrl));
    }
    return;
  }

  // Redirect unauthenticated users to dedicated login portal
  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  // RBAC checks for authenticated users
  if (isLoggedIn) {
    const role = req.auth?.user?.role;

    // Admin route protection
    if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
      return Response.redirect(new URL("/student/dashboard", nextUrl));
    }

    // Student route protection
    if (nextUrl.pathname.startsWith("/student") && role !== "STUDENT") {
      return Response.redirect(new URL("/admin/dashboard", nextUrl));
    }
  }

  return;
});

export const config = {
  // Matches all routes except api, _next/static, _next/image, and specific files like favicon.ico
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|vercel.svg).*)"],
};
