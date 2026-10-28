import { env } from "@/lib/env";

// Messages are Telegram HTML, so any user-supplied text must go through escapeHtml first.
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Posts to the feed group via the bot. Never throws, a dead ping must not break a login.
export async function notify(html: string): Promise<void> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env("TELEGRAM_CHAT_ID"), text: html, parse_mode: "HTML" }),
    });
    if (!res.ok) console.error("telegram notify failed", res.status, await res.text());
  } catch (err) {
    console.error("telegram notify failed", err);
  }
}
