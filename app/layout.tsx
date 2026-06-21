import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  title: "IsItSafe — Check a suspicious link before you click",
  description:
    "Paste a link and get a clear safe-or-unsafe verdict, a risk score, a screenshot, and a plain-language explanation in seconds."
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-white font-sans text-slate-700 antialiased">{children}</body>
    </html>
  );
}
