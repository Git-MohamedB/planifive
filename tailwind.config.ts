import type { Config } from "tailwindcss";

// Force rebuild timestamp: 123456

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // La palette officielle Spotify étendue
        background: "#121212",    // Le fond principal (Noir très légèrement gris)
        surface: "#181818",       // Les cartes / éléments de liste
        "surface-hover": "#282828", // Couleur au survol
        "surface-active": "#1a1a1a",
        "surface-elevated": "#1f1f1f", // Surface légèrement plus claire pour les éléments surélevés
        primary: "#1ED760",       // Spotify Green (Vif)
        "primary-hover": "#1db954", // Green plus foncé au hover
        "primary-active": "#169c46", // Green encore plus foncé à l'activation
        secondary: "#333333",     // Gris pour les boutons secondaires
        "secondary-hover": "#404040", // Gris plus clair au hover
        accent: "#ff6b35",        // Accent color pour les actions importantes
        danger: "#ff4757",        // Rouge pour les actions dangereuses
        "danger-hover": "#ff3742", // Rouge plus foncé
        warning: "#ffa726",       // Orange pour les avertissements
        success: "#4caf50",       // Vert pour les succès
        text: "#FFFFFF",          // Blanc pur
        "text-secondary": "#B3B3B3", // Gris clair pour les infos secondaires
        "text-muted": "#808080",   // Gris plus foncé pour le texte moins important
        border: "#282828",        // Séparateurs discrets
        "border-hover": "#404040", // Bordures au hover
        "glass-bg": "rgba(255, 255, 255, 0.1)", // Fond en verre
        "glass-border": "rgba(255, 255, 255, 0.2)", // Bordure en verre
      },
      borderRadius: {
        '4xl': '32px',
        '5xl': '40px',
        '6xl': '48px',
        '7xl': '64px',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(30, 215, 96, 0.3)',
        'glow-primary-hover': '0 0 30px rgba(30, 215, 96, 0.4)',
        'glow-danger': '0 0 20px rgba(255, 71, 87, 0.3)',
        'glow-warning': '0 0 20px rgba(255, 167, 38, 0.3)',
        'elevated': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'elevated-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounce-subtle 1s ease-in-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'dash': 'dash 1s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(30, 215, 96, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(30, 215, 96, 0.5)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'dash': {
          'to': { strokeDashoffset: '-50' },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // Proche de Circular (la police Spotify)
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};
export default config;