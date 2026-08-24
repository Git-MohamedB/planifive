"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { CustomThemeProvider } from "@/components/CustomThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <CustomThemeProvider>
          {children}
        </CustomThemeProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}