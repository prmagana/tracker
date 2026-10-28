import { createRemoteJWKSet, jwtVerify } from "jose";
import { toBase64Url } from "@/lib/encoding";

// From https://oauth.telegram.org/.well-known/openid-configuration
const ISSUER = "https://oauth.telegram.org";
const AUTH_URL = `${ISSUER}/auth`;
const TOKEN_URL = `${ISSUER}/token`;
const JWKS = createRemoteJWKSet(new URL(`${ISSUER}/.well-known/jwks.json`));

export function randomToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(digest);
}

type AuthParams = {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
  codeChallenge: string;
};

export function authUrl(p: AuthParams): string {
  const u = new URL(AUTH_URL);
  u.searchParams.set("client_id", p.clientId);
  u.searchParams.set("redirect_uri", p.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "openid profile");
  u.searchParams.set("state", p.state);
  u.searchParams.set("nonce", p.nonce);
  u.searchParams.set("code_challenge", p.codeChallenge);
  u.searchParams.set("code_challenge_method", "S256");
  return u.toString();
}

type ExchangeParams = {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
};

// Swaps the one-time code for an id_token. Basic auth per Telegram's token endpoint.
export async function exchangeCode(p: ExchangeParams): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${btoa(`${p.clientId}:${p.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: p.code,
      redirect_uri: p.redirectUri,
      client_id: p.clientId,
      code_verifier: p.codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Token response had no id_token");
  return data.id_token;
}

// jose checks signature, issuer, audience and expiry. We add the nonce check.
export async function verifyIdToken(idToken: string, clientId: string, nonce: string) {
  const { payload } = await jwtVerify(idToken, JWKS, { issuer: ISSUER, audience: clientId });
  if (payload.nonce !== nonce) throw new Error("Nonce mismatch");
  if (typeof payload.sub !== "string") throw new Error("Token had no sub");
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return { sub: payload.sub, name: str(payload.name), picture: str(payload.picture) };
}
