import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { OIDC_COOKIE, clearCookie, createSession, sessionCookie } from "@/lib/session";
import { escapeHtml, notify } from "@/lib/telegram-notify";
import { exchangeCode, verifyIdToken } from "@/lib/telegram-oidc";

type Pending = { state: string; nonce: string; verifier: string };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const raw = request.cookies.get(OIDC_COOKIE)?.value;
  const toLogin = () => NextResponse.redirect(new URL("/login", request.url));

  if (!code || !state || !raw) return toLogin();
  let pending: Pending;
  try {
    pending = JSON.parse(raw);
  } catch {
    return toLogin();
  }
  if (pending.state !== state) return toLogin();

  const clientId = env("TELEGRAM_CLIENT_ID");
  let sub: string;
  let name: string | null;
  let picture: string | null;
  try {
    const idToken = await exchangeCode({
      code,
      codeVerifier: pending.verifier,
      redirectUri: `${request.nextUrl.origin}/api/auth/callback`,
      clientId,
      clientSecret: env("TELEGRAM_CLIENT_SECRET"),
    });
    ({ sub, name, picture } = await verifyIdToken(idToken, clientId, pending.nonce));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return new NextResponse(message, { status: 400 });
  }

  // Anyone with Telegram can sign in. First login creates the row, later ones refresh it.
  // is_new falls out of the upsert: only a fresh insert has created_at equal to last_login_at.
  const now = new Date().toISOString();
  const row = await (await db())
    .prepare(
      `INSERT INTO users (id, name, picture, created_at, last_login_at) VALUES (?1, ?2, ?3, ?4, ?4)
       ON CONFLICT(id) DO UPDATE SET name = excluded.name, picture = excluded.picture, last_login_at = excluded.last_login_at
       RETURNING (created_at = last_login_at) AS is_new`,
    )
    .bind(sub, name, picture, now)
    .first<{ is_new: number }>();

  if (row?.is_new) {
    // Off the request path so a slow Telegram API never delays the redirect.
    const { ctx } = await getCloudflareContext({ async: true });
    ctx.waitUntil(notify(`<b>New Account</b>\n${escapeHtml(name ?? "unnamed")} · ${sub}`));
  }

  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(sessionCookie(await createSession(sub)));
  res.cookies.set(clearCookie(OIDC_COOKIE));
  return res;
}
