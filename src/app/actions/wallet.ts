"use server";

import { currentUserId } from "@/lib/auth";
import { accounts } from "@/lib/db";

// User-friendly TON addresses are 48 chars of base64url.
const ADDRESS = /^[A-Za-z0-9_-]{48}$/;

// Null clears it on disconnect.
export async function saveWalletAddress(address: string | null): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  if (address !== null && !ADDRESS.test(address)) return;

  await (await accounts())
    .prepare("UPDATE users SET wallet_address = ?1 WHERE id = ?2")
    .bind(address, userId)
    .run();
}
