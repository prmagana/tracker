"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TelegramMark } from "@/components/provider-marks";

// Lucide's arrow-right, inlined to avoid a dependency for one icon.
function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

const spring = { type: "spring", stiffness: 600, damping: 28 } as const;

// Rest: plane on the left. Hover: plane pops out, arrow pops in on the right.
export function TelegramButton({ href }: { href: string }) {
  const [hovered, setHovered] = useState(false);

  return (
    // layout on the anchor and text makes the width change and text shift ride the same spring
    // as the icons, instead of snapping the moment an icon pops out of flow.
    <motion.a
      href={href}
      layout
      transition={spring}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      // No hover scale: the icon slide carries the motion and the text stays pixel-sharp.
      whileTap={{ scale: 0.96 }}
      // relative: popLayout pops exiting icons out as absolute, so they must anchor to the button, not the page.
      className="relative flex h-10 cursor-pointer select-none items-center justify-center rounded-md bg-[#2AABEE] px-6 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2AABEE]"
    >
      <AnimatePresence mode="popLayout">
        {!hovered && (
          <motion.span
            key="plane"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={spring}
            className="mr-2.5 flex shrink-0 items-center"
          >
            <TelegramMark className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>

      <motion.span layout="position" transition={spring} className="text-[13px] leading-[18px] font-semibold">
        Continue with Telegram
      </motion.span>

      <AnimatePresence mode="popLayout">
        {hovered && (
          <motion.span
            key="arrow"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={spring}
            className="ml-2.5 flex shrink-0 items-center"
          >
            <ArrowRight className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.a>
  );
}
