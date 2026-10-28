"use client";

import { useEffect, useRef, useState } from "react";
import { Caret } from "@/components/caret";

type Props = { name: string; picture: string | null };

// Fragment's header dropdown: caret on the chip, chip goes Telegram blue while open,
// panel hangs off the right edge 6px below with 14px/20px rows. One row for now.
export function AccountChip({ name, picture }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Click-away and Escape both close. Listeners only exist while open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 cursor-pointer select-none items-center gap-[9px] rounded-lg pl-1.5 pr-3 text-[15px] leading-[18px] font-semibold transition-colors hover:transition-none ${
          open ? "bg-[#248BDA] text-white" : "bg-foreground/[0.06] hover:bg-foreground/[0.1]"
        }`}
      >
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground/10">
          {picture && (
            // eslint-disable-next-line @next/next/no-img-element -- remote Telegram CDN, no optimizer config
            <img src={picture} alt={name} draggable={false} className="size-full object-cover" />
          )}
        </span>
        <span className="max-w-40 truncate">{name}</span>
        <Caret open={open} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-40 overflow-hidden rounded-lg border border-foreground/10 bg-background py-1.5 shadow-lg shadow-black/5"
        >
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="block w-full cursor-pointer whitespace-nowrap py-2 pl-3.5 pr-[60px] text-left text-sm leading-5 hover:bg-foreground/[0.06]"
            >
              Log Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
