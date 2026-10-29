import { TelegramButton } from "@/components/telegram-button";

// Root runs the Telegram flow for every tool and sends people back here afterwards.
const LOGIN_URL = `https://tapt.so/api/auth/login?return=${encodeURIComponent("https://track.tapt.so/")}`;

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-7">
        <div className="text-center">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Tracker</h1>
          <p className="text-[22px] leading-tight text-foreground/40">Sign in to continue</p>
        </div>

        <TelegramButton href={LOGIN_URL} />
      </div>
    </main>
  );
}
