import TonConnect, { isWalletInfoRemote, type WalletInfo } from "@tonconnect/sdk";

// Root's manifest, shared by every tool: the wallet sees one app, tapt at tapt.so, wherever you connect from.
const MANIFEST_URL = "https://tapt.so/tonconnect-manifest.json";

// Curated routes by registry app_name, in display order. Everything else goes through the generic QR.
export const WALLET_APP_NAMES = ["gramwallet", "tonkeeper"] as const;

// Display names where the registry's are too long. Falls back to the registry name.
const WALLET_LABELS: Record<string, string> = { gramwallet: "Gram" };

export const walletLabel = (w: WalletInfo) => WALLET_LABELS[w.appName] ?? w.name;

// Where "Get <wallet>" sends people. Falls back to the registry's about page.
const WALLET_INSTALL_URLS: Record<string, string> = {
  gramwallet: "https://gramwallet.io/?utm_source=tc",
  tonkeeper: "https://keeperwallet.com/",
};

export const walletInstallUrl = (w: WalletInfo) => WALLET_INSTALL_URLS[w.appName] ?? w.aboutUrl;

// Pathways a wallet offers besides scanning. Read off the registry's platform list.
export const hasExtension = (w: WalletInfo) =>
  w.platforms.some((p) => p === "chrome" || p === "firefox" || p === "safari");
export const hasDesktopApp = (w: WalletInfo) =>
  w.platforms.some((p) => p === "macos" || p === "windows" || p === "linux");

// One connector per browser tab, kept on globalThis so a hot reload of this module reuses it
// instead of minting a second one that listens to nothing.
type TonGlobal = { connector?: TonConnect; restored?: Promise<void> };
const g = globalThis as typeof globalThis & { __trackerTon?: TonGlobal };
const state: TonGlobal = (g.__trackerTon ??= {});

export function getTonConnector(): TonConnect {
  if (!state.connector) {
    state.connector = new TonConnect({ manifestUrl: MANIFEST_URL });
  }
  return state.connector;
}

// restoreConnection must settle before any connect(), or its cleanup can tear down the new session.
export function ensureRestored(): Promise<void> {
  return (state.restored ??= getTonConnector()
    .restoreConnection()
    .then(
      () => undefined,
      () => undefined,
    ));
}

// Every distinct bridge in the registry. The generic QR listens on all of them, since any
// wallet can scan it and each replies on its own bridge (Telegram's wallet uses Telegram's).
export async function getAllBridges(): Promise<{ bridgeUrl: string }[]> {
  const all = await getTonConnector().getWallets();
  const urls = new Set(all.filter(isWalletInfoRemote).map((w) => w.bridgeUrl));
  return [...urls].map((bridgeUrl) => ({ bridgeUrl }));
}

// Registry entries for the curated wallets: live universal links, bridges and icons.
export async function getCuratedWallets(): Promise<WalletInfo[]> {
  const all = await getTonConnector().getWallets();
  return WALLET_APP_NAMES.map((n) => all.find((w) => w.appName === n)).filter(
    (w): w is WalletInfo => w !== undefined,
  );
}

// UQBC…PFT8, Fragment's truncation.
export const shortAddress = (addr: string) => `${addr.slice(0, 4)}…${addr.slice(-4)}`;

// Phones deep-link into the wallet app; everything else gets a QR.
export const isMobile = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
