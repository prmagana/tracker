import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", request.url), 303);
  res.cookies.set(clearSessionCookie());
  return res;
}
