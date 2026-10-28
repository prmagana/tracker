import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Who is signed in, for pages and actions. Kept out of session.ts so the proxy never imports next/headers.
export async function currentUserId(): Promise<string | null> {
  // Dev impersonation: AUTH_DEV_USER_ID stands in for a real login. Ignored in production.
  const dev = process.env.AUTH_DEV_USER_ID;
  if (dev && process.env.NODE_ENV !== "production") return dev;

  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value ? verifySession(value) : null;
}
