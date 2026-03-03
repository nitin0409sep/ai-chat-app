import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-me"
);

const protectedPaths = ["/chat", "/api/chat"];
const authPages = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      // Token invalid or expired
    }
  }

  // Redirect unauthenticated users away from protected paths
  if (protectedPaths.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (authPages.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    const chatUrl = new URL("/chat", req.url);
    return NextResponse.redirect(chatUrl);
  }

  // Redirect root to /chat or /login
  if (pathname === "/") {
    const target = isAuthenticated ? "/chat" : "/login";
    return NextResponse.redirect(new URL(target, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
