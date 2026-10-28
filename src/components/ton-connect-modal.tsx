"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import QRCode from "qrcode";
import { isWalletInfoCurrentlyInjected, isWalletInfoRemote, type WalletInfo } from "@tonconnect/sdk";
import { Diamond } from "@/components/diamond/diamond";
import { TelegramMark } from "@/components/provider-marks";
import {
  ensureRestored,
  getAllBridges,
  getCuratedWallets,
  getTonConnector,
  hasDesktopApp,
  hasExtension,
  isMobile,
  walletInstallUrl,
  walletLabel,
} from "@/lib/ton-connect-client";

type Props = { open: boolean; onClose: () => void };

// A wallet screen is one of three pathways. Mobile (the QR) is the default; the
// footer buttons switch to the others, same as the stock TON Connect modal.
type Pathway = "mobile" | "extension" | "desktop";

// Fragment's connect modal, trimmed: a generic QR any TON wallet can scan,
// a short row of curated wallets, and a per-wallet screen behind each tile.
export function TonConnectModal({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [universalQr, setUniversalQr] = useState<string | null>(null);
  const [picked, setPicked] = useState<WalletInfo | null>(null);
  const [pickedLink, setPickedLink] = useState<string | null>(null);
  const [pickedQr, setPickedQr] = useState<string | null>(null);
  const [pathway, setPathway] = useState<Pathway>("mobile");
  // Last connect failure from the SDK, shown in the subtitle slot until the next attempt.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    return getTonConnector().onStatusChange(
      () => setError(null),
      (err) => setError(err.message || "Connection failed"),
    );
  }, [open]);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal needs document, mount guard avoids hydration mismatch
  useEffect(() => setMounted(true), []);

  // Opening: load the curated wallets and mint one universal link for the generic QR.
  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const [list, bridges] = await Promise.all([getCuratedWallets(), getAllBridges(), ensureRestored()]);
      if (!alive) return;
      setWallets(list);
      const link = getTonConnector().connect(bridges);
      if (typeof link === "string") setUniversalQr(await toSvg(link, "H"));
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  const back = () => {
    setPicked(null);
    setPickedLink(null);
    setPickedQr(null);
    setPathway("mobile");
  };

  // Closing always lands back on the main screen next time.
  const close = () => {
    back();
    onClose();
  };

  // Escape closes. Back first if a wallet is picked.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (picked) back();
      else close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  const pick = async (w: WalletInfo) => {
    if (!isWalletInfoRemote(w)) return;
    setError(null);
    await ensureRestored();
    const link = getTonConnector().connect({ universalLink: w.universalLink, bridgeUrl: w.bridgeUrl });
    if (typeof link !== "string") return;
    // Phones go straight into the app. Desktop lands on the wallet screen.
    if (isMobile()) {
      window.location.assign(link);
      return;
    }
    setPicked(w);
    setPickedLink(link);
    setPathway("mobile");
    // Highest correction so the centered logo can cover modules without hurting scans.
    setPickedQr(await toSvg(link, "H"));
  };

  // Extension pathway: connect through the injected bridge if it's there.
  const goExtension = (w: WalletInfo) => {
    setPathway("extension");
    if (isWalletInfoCurrentlyInjected(w)) getTonConnector().connect({ jsBridgeKey: w.jsBridgeKey });
  };

  // Desktop pathway: hand the universal link to the OS so the desktop app picks it up.
  const goDesktop = () => {
    setPathway("desktop");
    if (pickedLink) window.open(pickedLink, "_blank", "noopener,noreferrer");
  };

  if (!mounted || !open) return null;

  const label = picked ? walletLabel(picked) : "";
  const subtitle = !picked
    ? "Scan with your mobile wallet"
    : pathway === "mobile"
      ? `Scan the QR code below with your phone's or ${label}'s camera`
      : "";

  return createPortal(
    <div
      onClick={close}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[416px] overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl shadow-black/40"
      >
        {/* Header: back on the left when a wallet is picked, close on the right, centered copy. */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          {picked && (
            <RoundButton label="back" onClick={back} className="left-5 top-5">
              <ChevronLeft aria-hidden size={18} strokeWidth={2.2} />
            </RoundButton>
          )}
          <RoundButton label="close" onClick={close} className="right-5 top-5">
            <Cross className="size-3.5" />
          </RoundButton>
          <h2 className="text-xl font-semibold">{picked ? label : "Connect your TON wallet"}</h2>
          {/* Reserved for two lines so the wallet screen's longer hint never grows the panel. */}
          <p className={`mt-1 min-h-11 text-[15px] leading-[22px] ${error ? "text-red-500" : "text-foreground/50"}`}>
            {error ?? subtitle}
          </p>
        </div>

        <div className="px-6 pb-6">
          {/* The square: a QR on the mobile pathway, a message state on the others. Same box either way. */}
          {!picked || pathway === "mobile" ? (
            <QrCard svg={picked ? pickedQr : universalQr}>
              {picked ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote registry icon
                <img src={picked.imageUrl} alt="" draggable={false} className="block size-[68px] rounded-xl" />
              ) : (
                // The 3D diamond, sized like the stock modal's 75/256 scaled to our code.
                // Fallback is our own Telegram tile, drawn like the wallet icons beside it.
                <Diamond
                  size={96}
                  hoverScale={2.75}
                  fallback={
                    <span className="flex size-[68px] items-center justify-center rounded-xl bg-[#2AABEE]">
                      <TelegramMark className="h-[34px] w-auto -translate-x-0.5 text-white" />
                    </span>
                  }
                />
              )}
            </QrCard>
          ) : (
            <Square>
              {pathway === "extension" ? (
                isWalletInfoCurrentlyInjected(picked) ? (
                  <Message text={`Continue in the ${label} extension…`} />
                ) : (
                  <Message text={`Seems you don't have the ${label} browser extension installed`}>
                    <LinkButton href={walletInstallUrl(picked)}>Get {label}</LinkButton>
                  </Message>
                )
              ) : (
                <Message text={`Continue in ${label} on desktop…`}>
                  <ActionButton onClick={goDesktop}>Retry</ActionButton>
                  <LinkButton href={walletInstallUrl(picked)}>Get {label}</LinkButton>
                </Message>
              )}
            </Square>
          )}

          {/* Fixed-height footer: tiles on the main screen, pathway switches on a wallet screen. */}
          <div className="flex h-[120px] flex-col items-center justify-end">
            {picked ? (
              <div className="flex gap-2 pb-5">
                {pathway !== "mobile" && (
                  <ActionButton onClick={() => setPathway("mobile")} icon={<PhoneGlyph />}>
                    Mobile
                  </ActionButton>
                )}
                {pathway !== "extension" && hasExtension(picked) && (
                  <ActionButton onClick={() => goExtension(picked)} icon={<GlobeGlyph />}>
                    Browser Extension
                  </ActionButton>
                )}
                {pathway !== "desktop" && hasDesktopApp(picked) && (
                  <ActionButton onClick={goDesktop} icon={<LaptopGlyph />}>
                    Desktop
                  </ActionButton>
                )}
              </div>
            ) : (
              <>
                <p className="text-[15px] leading-[22px] text-foreground/50">Available wallets</p>
                <div className="mt-4 flex justify-center gap-6">
                  {wallets.map((w) => (
                    <WalletTile key={w.appName} wallet={w} onPick={() => pick(w)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const tileSpring = { type: "spring", stiffness: 600, damping: 28 } as const;

// The icon is drawn at its hover size (62px) and rests scaled down to 60px, so the hover
// state lands on native pixels and stays crisp. Only the icon moves, the label stays put.
const ICON_REST = 60 / 62;

function WalletTile({ wallet, onPick }: { wallet: WalletInfo; onPick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onPick}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      className="group flex w-[72px] cursor-pointer select-none flex-col items-center gap-2"
    >
      <motion.span
        variants={{ rest: { scale: ICON_REST }, hover: { scale: 1 }, tap: { scale: 0.93 } }}
        transition={tileSpring}
        className="block size-[62px]"
      >
        {/* Registry-supplied brand icon, not a placeholder. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- remote registry icon */}
        <img
          src={wallet.imageUrl}
          alt=""
          draggable={false}
          className="block size-[62px] rounded-2xl shadow-md shadow-black/10 transition-shadow duration-150 group-hover:shadow-lg group-hover:shadow-black/15"
        />
      </motion.span>
      <span className="text-[13px] font-semibold leading-tight text-foreground/70 transition-colors duration-150 group-hover:text-foreground">
        {walletLabel(wallet)}
      </span>
    </motion.button>
  );
}

// Fixed square so every state occupies the same footprint.
function Square({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex aspect-square w-full max-w-[368px] flex-col items-center justify-center">
      {children}
    </div>
  );
}

// White card so the QR scans on any theme. Empty state keeps the height while the link mints.
// The center mark sits on a white backdrop, same proportion as the stock modal's 60/256.
function QrCard({ svg, children }: { svg: string | null; children: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[368px] rounded-2xl bg-white p-6">
      {svg && <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />}
      {svg && (
        <div className="absolute left-1/2 top-1/2 flex size-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

function Message({ text, children }: { text: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 text-center">
      <p className="text-[15px] leading-[22px] text-foreground/50">{text}</p>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

const pill =
  "flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg px-4 text-[13px] leading-[18px] font-semibold";

function ActionButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={`${pill} bg-foreground/[0.06] hover:bg-foreground/[0.1]`}>
      {icon}
      {children}
    </button>
  );
}

// External link in the Telegram blue, with the outward arrow like the stock modal.
function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${pill} bg-[#248BDA]/15 text-[#248BDA] hover:bg-[#248BDA]/25`}
    >
      {children}
      <ExternalGlyph />
    </a>
  );
}

function RoundButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute flex size-8 cursor-pointer items-center justify-center rounded-full bg-foreground/[0.06] hover:bg-foreground/[0.1] ${className}`}
    >
      {children}
    </button>
  );
}

async function toSvg(link: string, errorCorrectionLevel: "M" | "H" = "M"): Promise<string> {
  return QRCode.toString(link, { type: "svg", margin: 0, errorCorrectionLevel });
}

// Small stroked glyphs for the pathway buttons. Hand-drawn, no icon library.
const glyph = "size-4 shrink-0";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function PhoneGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={glyph} {...stroke}>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 18h2" />
    </svg>
  );
}

function LaptopGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={glyph} {...stroke}>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M2 19h20" />
    </svg>
  );
}

function GlobeGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={glyph} {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function ExternalGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={glyph} {...stroke}>
      <path d="M14 5h5v5M19 5l-8 8M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" />
    </svg>
  );
}


function Cross({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...stroke} strokeWidth={2.4}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
