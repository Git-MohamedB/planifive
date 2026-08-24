"use client";

import React, { createContext, useContext } from "react";

interface ThemeContextType {
  accentColor: string;
  setAccentColor: (color: string) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  accentColor: "#22C55E",
  setAccentColor: async () => {},
  isLoading: false,
});

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider
      value={{
        accentColor: "#22C55E",
        setAccentColor: async () => {},
        isLoading: false,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColor() {
  return useContext(ThemeContext);
}
