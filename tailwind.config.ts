import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // La palette officielle Spotify
        background: "#121212",    // Le fond principal (Noir très légèrement gris)
        surface: "#181818",       // Les cartes / éléments de liste
        "surface-hover": "#282828", // Couleur au survol
        "surface-active": "#1a1a1a", 
        primary: "#1ED760",       // Spotify Green (Vif)
        text: "#FFFFFF",          // Blanc pur
        "text-secondary": "#B3B3B3", // Gris clair pour les infos secondaires
        border: "#282828",        // Séparateurs discrets
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // Proche de Circular (la police Spotify)
      }
    },
  },
  plugins: [],
};
export default config;