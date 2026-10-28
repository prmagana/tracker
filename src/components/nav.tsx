import Link from "next/link";
import { AccountChip } from "@/components/account-chip";
import { WalletButton } from "@/components/wallet-button";
import { currentUserId } from "@/lib/auth";
import { db } from "@/lib/db";

type UserRow = { name: string | null; picture: string | null; wallet_address: string | null };

// Top bar for signed-in pages. Quiet wordmark left; account chip then wallet button right.
export async function Nav() {
  const userId = await currentUserId();
  const user = userId
    ? await (await db())
        .prepare("SELECT name, picture, wallet_address FROM users WHERE id = ?1")
        .bind(userId)
        .first<UserRow>()
    : null;

  return (
    <nav className="sticky top-0 z-50 w-full shrink-0 border-b border-foreground/5 bg-background px-4 sm:px-6">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between">
        {/* The app's only title. Bold is the 600 file, the heaviest Product Sans weight we ship. */}
        <Link href="/" draggable={false} className="select-none text-[22px] leading-7 font-semibold">
          Tracker
        </Link>
        <div className="flex items-center gap-3.5">
          <AccountChip name={user?.name ?? "Account"} picture={user?.picture ?? null} />
          <WalletButton initialAddress={user?.wallet_address ?? null} />
        </div>
      </div>
    </nav>
  );
}
