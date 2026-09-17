import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  const protectedRoutes = ["/dashboard", "/bills", "/people", "/payments", "/settings"];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  if (isProtectedRoute) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    
    try {
      await decrypt(session);
    } catch (e) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (path === "/login") {
    const session = request.cookies.get("session")?.value;
    if (session) {
      try {
        await decrypt(session);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch (e) {
        // invalid session, continue to login page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|pay).*)"],
};
