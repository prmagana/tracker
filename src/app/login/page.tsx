import { TelegramButton } from "@/components/telegram-button";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-7">
        <div className="text-center">
          <h1 className="text-[22px] font-semibold leading-tight tracking-tight">Tracker</h1>
          <p className="text-[22px] leading-tight text-foreground/40">Sign in to continue</p>
        </div>

        <TelegramButton href="/api/auth/login" />
      </div>
    </main>
  );
}
