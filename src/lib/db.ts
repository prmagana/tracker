import { getCloudflareContext } from "@opennextjs/cloudflare";

// D1 binding from wrangler.jsonc. Async form so it also works during static generation.
export async function db(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}
