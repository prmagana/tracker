import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Everything else requires a session.
const PUBLIC_PREFIXES = ["/login", "/api/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const authed = await isAuthed(request);

  if (!authed && !isPublic) return NextResponse.redirect(new URL("/login", request.url));
  if (authed && pathname === "/login") return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

async function isAuthed(request: NextRequest): Promise<boolean> {
  // Telegram refuses localhost redirects, so dev impersonates a user id. Never honored in production.
  if (process.env.AUTH_DEV_USER_ID && process.env.NODE_ENV !== "production") return true;
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  return value ? (await verifySession(value)) !== null : false;
}

export const config = {
  // Wallets fetch the manifest and icon unauthenticated, so they stay outside the guard.
  matcher: ["/((?!_next|favicon.svg|tonconnect-manifest.json|tonconnect-icon.png).*)"],
};
