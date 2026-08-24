import type { Metadata } from "next";
import { Inter, Overpass_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { BackgroundShader } from "@/components/ui/BackgroundShader";

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
        <Providers>
          {/* ✨ Fond WebGL universel — ShaderGradient partagé */}
          <BackgroundShader />

          {/* Couche d'estompage glass subtile pour un contraste de verre dépoli parfait */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.20) 0%, rgba(0, 0, 0, 0.50) 40%, rgba(6, 8, 10, 0.90) 75%, #06080a 100%)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />

          <div className="relative z-10 w-full min-h-screen">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}