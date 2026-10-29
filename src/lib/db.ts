import { getCloudflareContext } from "@opennextjs/cloudflare";

// D1 binding from wrangler.jsonc. Async form so it also works during static generation.
export async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

// Shared users table across every tapt tool. Same person, same row, whichever tool they're in.
export async function accounts(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.ACCOUNTS;
}
