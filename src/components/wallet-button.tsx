"use client";

import { useEffect, useRef, useState } from "react";
import { toUserFriendlyAddress } from "@tonconnect/sdk";
import { saveWalletAddress } from "@/app/actions/wallet";
import { Caret } from "@/components/caret";
import { TonMark } from "@/components/provider-marks";
import { TonConnectModal } from "@/components/ton-connect-modal";
import { ensureRestored, getTonConnector, shortAddress } from "@/lib/ton-connect-client";

type Props = { initialAddress: string | null };

// Fragment's "Connect TON": primary button until paired, then the short address with a
// Disconnect menu. The saved address is the display truth; the browser pairing is for signing.
export function WalletButton({ initialAddress }: Props) {
  const [addr, setAddr] = useState<string | null>(initialAddress);
  const [modalOpen, setModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = getTonConnector();
    const unsubscribe = c.onStatusChange(
      (wallet) => {
        // A null here also fires on a cold restore, so only a real pairing writes through.
        if (!wallet) return;
        const friendly = toUserFriendlyAddress(wallet.account.address);
        setAddr(friendly);
        setModalOpen(false);
        void saveWalletAddress(friendly);
      },
      // Manifest fetch failures, rejections and the like would otherwise vanish.
      (err) => console.error("ton connect failed", err),
    );
    void ensureRestored();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const disconnect = async () => {
    setMenuOpen(false);
    setAddr(null);
    void saveWalletAddress(null);
    try {
      await getTonConnector().disconnect();
    } catch {
      // No live pairing in this browser, nothing to tear down.
    }
  };

  if (!addr) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg bg-[#248BDA] px-3.5 text-[15px] leading-[18px] font-semibold text-white transition-colors hover:bg-[#207CC2]"
        >
          <TonMark className="size-[18px]" />
          Connect TON
        </button>
        <TonConnectModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg pl-3.5 pr-3 text-[15px] leading-[18px] font-semibold transition-colors hover:transition-none ${
          menuOpen ? "bg-[#248BDA] text-white" : "bg-foreground/[0.06] hover:bg-foreground/[0.1]"
        }`}
      >
        <TonMark className="size-[18px]" />
        {shortAddress(addr)}
        <Caret open={menuOpen} />
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-40 overflow-hidden rounded-lg border border-foreground/10 bg-background py-1.5 shadow-lg shadow-black/5"
        >
          <button
            type="button"
            role="menuitem"
            onClick={disconnect}
            className="block w-full cursor-pointer whitespace-nowrap py-2 pl-3.5 pr-[60px] text-left text-sm leading-5 hover:bg-foreground/[0.06]"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
