'use client';

/**
 * ScreenGlass.tsx
 * Overlay "liquid glass" plein écran — sans backdrop-filter (incompatible WebGL canvas).
 *
 * Simule les propriétés visuelles du verre directement en CSS :
 *  - Grain/texture frosted (SVG feTurbulence comme pseudo-texture)
 *  - Rim lighting animé sur les 4 bords (edgeIntensity + rimIntensity du repo liquid-glass)
 *  - Reflet spéculaire diagonal animé (cornerBoost)
 *  - Tint semi-transparent (tintOpacity)
 *  - Vignette de profondeur
 */

export function ScreenGlass() {
  return (
    <>
      {/* ── DÉFINITIONS SVG ── */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none' }}>
        <defs>
          <filter id="sg-grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed="8" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
            <feBlend in="SourceGraphic" in2="gray" mode="soft-light" result="blended" />
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      {/* ── 1. TINT DE BASE ── semi-transparent, laisse les couleurs du shader passer */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 120% 80% at 50% -10%,  rgba(80, 110, 255, 0.18) 0%, transparent 60%),
            radial-gradient(ellipse 80% 120% at -10% 50%,  rgba(60,  90, 210, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 80% 120% at 110% 50%,  rgba(60,  90, 210, 0.12) 0%, transparent 60%),
            radial-gradient(ellipse 120% 60% at 50% 110%,  rgba(40,  70, 180, 0.14) 0%, transparent 60%),
            linear-gradient(160deg, rgba(12, 16, 48, 0.38) 0%, rgba(6, 9, 32, 0.52) 100%)
          `,
          mixBlendMode: 'normal',
        }}
      />

      {/* ── 2. GRAIN DE SURFACE FROSTED ── texture de verre dépoli */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          opacity: 0.055,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '300px 300px',
        }}
      />

      {/* ── 3. RIM LIGHTING HAUT ── bord supérieur lumineux (rimIntensity top) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '200px',
          zIndex: 3,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(140, 170, 255, 0.14) 0%, transparent 100%)',
          animation: 'glassRimPulse 6s ease-in-out infinite',
        }}
      />

      {/* ── 4. RIM LIGHTING BAS ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          height: '180px',
          zIndex: 3,
          pointerEvents: 'none',
          background: 'linear-gradient(0deg, rgba(100, 130, 240, 0.10) 0%, transparent 100%)',
          animation: 'glassRimPulse 6s ease-in-out infinite 3s',
        }}
      />

      {/* ── 5. RIM LIGHTING GAUCHE ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: '220px',
          zIndex: 3,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, rgba(120, 150, 255, 0.10) 0%, transparent 100%)',
        }}
      />

      {/* ── 6. RIM LIGHTING DROITE ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '220px',
          zIndex: 3,
          pointerEvents: 'none',
          background: 'linear-gradient(270deg, rgba(120, 150, 255, 0.10) 0%, transparent 100%)',
        }}
      />

      {/* ── 7. REFLET SPÉCULAIRE DIAGONAL ── shimmer animé (cornerBoost) */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
          background: `
            linear-gradient(
              128deg,
              rgba(255, 255, 255, 0.07) 0%,
              rgba(255, 255, 255, 0.03) 25%,
              transparent 50%,
              rgba(255, 255, 255, 0.01) 75%,
              transparent 100%
            )
          `,
          animation: 'glassShimmer 8s ease-in-out infinite',
        }}
      />

      {/* ── 8. LIGNE DE RÉFRACTION HAUTE ── filet lumineux au sommet de l'écran */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: '10%', right: '10%',
          height: '1px',
          zIndex: 5,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(200, 220, 255, 0.45), transparent)',
        }}
      />

      {/* ── CSS ANIMATIONS ── */}
      <style>{`
        @keyframes glassRimPulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1.0; }
        }
        @keyframes glassShimmer {
          0%   { opacity: 0.5; transform: translateX(-3%) translateY(-3%); }
          50%  { opacity: 1.0; transform: translateX(3%)  translateY(3%);  }
          100% { opacity: 0.5; transform: translateX(-3%) translateY(-3%); }
        }
      `}</style>
    </>
  );
}
