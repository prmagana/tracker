import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, clearCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url), 303);
  res.cookies.set(clearCookie(SESSION_COOKIE));
  return res;
}
