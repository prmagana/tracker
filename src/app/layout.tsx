import type { Metadata } from "next";
import { productSans } from "@/app/fonts";
import "./globals.css";

export const metadata: Metadata = {
  // Template without %s pins every tab to "Form", child titles are ignored.
  title: { default: "Tracker", template: "Tracker" },
  description: "Tracker",
  // tapt's star, served by root so every tool shares one file.
  icons: { icon: "https://tapt.so/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${productSans.variable} h-full antialiased`}>
      {/* Font class straight on body, so it never depends on globals.css being freshly compiled. */}
      <body className={`${productSans.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
