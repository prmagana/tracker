"use client";

// React wrapper for the ported TON Connect UI diamond. Apache-2.0, see ./LICENSE.
import { useEffect, useRef, useState } from "react";
import still from "./diamond.webp";
import { getIsDiamond3dDegraded } from "./performance";
import { attachDiamond, getIsDiamondDrawn, STILL_FADE_DURATION } from "./renderer";

type Props = {
  size: number;
  /** How much the diamond grows under the pointer or a finger. */
  hoverScale?: number;
  /** Shown centered in the box instead of the model when 3D can't run. */
  fallback: React.ReactNode;
  className?: string;
};

const DEFAULT_HOVER_SCALE = 1.7;

// A 3D model that turns and can be dragged. Its still image covers the first frame's load, and
// the fallback image replaces it entirely where the model can't run or motion is reduced.
export function Diamond({ size, hoverScale = DEFAULT_HOVER_SCALE, fallback, className }: Props) {
  // Client-only component (mounted inside a portal), so window is safe in the initializers.
  const [is3d, setIs3d] = useState(canAnimate);
  // Only the first diamond on the page waits for the model; later ones show it at once.
  const [cover, setCover] = useState<"shown" | "fading" | "gone">(() =>
    getIsDiamondDrawn() ? "gone" : "shown",
  );
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!is3d || !slot.current) return;
    let coverTimeout: ReturnType<typeof setTimeout> | undefined;

    attachDiamond(
      slot.current,
      { size, hoverScale },
      {
        onFirstFrame: () => {
          setCover("fading");
          coverTimeout = setTimeout(() => setCover("gone"), STILL_FADE_DURATION * 1000);
        },
        onError: () => setIs3d(false),
      },
    );

    return () => clearTimeout(coverTimeout);
  }, [is3d, size, hoverScale]);

  return (
    <div className={`relative shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      {is3d ? (
        <>
          <div ref={slot} className="size-full" />
          {cover !== "gone" && (
            // The model is opaque under it, so the diamond never dims while it fades.
            // eslint-disable-next-line @next/next/no-img-element -- plain still over a canvas
            <img
              src={still.src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 size-full"
              style={{
                opacity: cover === "fading" ? 0 : 1,
                transition: `opacity ${STILL_FADE_DURATION}s linear`,
              }}
            />
          )}
        </>
      ) : (
        <div className="flex size-full items-center justify-center">{fallback}</div>
      )}
    </div>
  );
}

function canAnimate(): boolean {
  if (typeof window === "undefined") return false;
  const prefersReducedMotion = !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return !getIsDiamond3dDegraded() && !prefersReducedMotion;
}
