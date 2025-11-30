import type { Metadata } from "next";
import { Inter, Overpass_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const overpassMono = Overpass_Mono({ subsets: ["latin"], variable: "--font-overpass-mono" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: "Planifive",
  description: "Organise tes matchs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.className} ${overpassMono.variable} ${oswald.variable} text-white antialiased min-h-screen w-screen overflow-x-hidden`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}