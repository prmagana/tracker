import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { oidcCookie } from "@/lib/session";
import { authUrl, pkceChallenge, randomToken } from "@/lib/telegram-oidc";

export async function GET(request: NextRequest) {
  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken();

  const url = authUrl({
    clientId: env("TELEGRAM_CLIENT_ID"),
    redirectUri: `${request.nextUrl.origin}/api/auth/callback`,
    state,
    nonce,
    codeChallenge: await pkceChallenge(verifier),
  });

  // Park the one-time values in a short-lived cookie for the callback to check against.
  const res = NextResponse.redirect(url);
  res.cookies.set(oidcCookie(JSON.stringify({ state, nonce, verifier })));
  return res;
}
