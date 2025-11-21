import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Five Planner",
  description: "Organise tes matchs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // AJOUT DE suppressHydrationWarning ICI
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#121212] text-white antialiased h-screen w-screen overflow-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}