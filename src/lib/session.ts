import { env } from "@/lib/env";
import { fromBase64Url } from "@/lib/encoding";

export const SESSION_COOKIE = "session";

// Sessions are minted by tapt.so on the parent domain and shared by every tool. This side only
// verifies, with the same SESSION_SECRET root signs with. Dev impersonates via AUTH_DEV_USER_ID.
const SESSION_DOMAIN = process.env.NODE_ENV === "production" ? "tapt.so" : undefined;

const encoder = new TextEncoder();

// Web Crypto only, so this runs in the proxy and on Workers without Node APIs.
async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(env("SESSION_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

// Value shape: "<sub>.<exp>.<sig>", sig covers "<sub>.<exp>".
// Returns the Telegram user id, or null if tampered or expired.
export async function verifySession(value: string): Promise<string | null> {
  const [sub, exp, sig] = value.split(".");
  if (!sub || !exp || !sig) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  const ok = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(),
    fromBase64Url(sig),
    encoder.encode(`${sub}.${exp}`),
  );
  return ok ? sub : null;
}

// Clearing must name the domain, or the browser keeps the parent-domain cookie and you stay in.
export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    domain: SESSION_DOMAIN,
    maxAge: 0,
  };
}
