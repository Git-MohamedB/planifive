'use client';

/**
 * BackgroundShader.tsx
 * Fond ShaderGradient — paramètres copiés depuis shadergradient.co/customize.
 * Type: waterPlane — orange/sable/lavande animé.
 *
 * Props retirées (internes à l'éditeur shadergradient.co, pas dans l'API du renderer) :
 *   axesHelper, destination, embedMode, format, frameRate, gizmoHelper
 *
 * pixelDensity et fov sont des props de ShaderGradientCanvas (pas de ShaderGradient).
 */

import dynamic from 'next/dynamic';

const ShaderGradientCanvas = dynamic(
  () => import('@shadergradient/react').then((m) => m.ShaderGradientCanvas),
  { ssr: false }
);

const ShaderGradient = dynamic(
  () => import('@shadergradient/react').then((m) => m.ShaderGradient),
  { ssr: false }
);

export function BackgroundShader() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        // Fond de secours pendant le chargement WebGL
        background: '#06070f',
      }}
    >
      <ShaderGradientCanvas
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        pixelDensity={1}
        fov={45}
      >
        <ShaderGradient
          animate="on"
          brightness={1.05}
          cAzimuthAngle={180}
          cDistance={3.0}
          cPolarAngle={85}
          cameraZoom={1}
          color1="#004d1a"
          color2="#00802b"
          color3="#10b981"
          envPreset="city"
          grain="off"
          lightType="3d"
          positionX={0}
          positionY={0}
          positionZ={0}
          range="disabled"
          rangeEnd={40}
          rangeStart={0}
          reflection={0.1}
          rotationX={0}
          rotationY={0}
          rotationZ={0}
          shader="defaults"
          type="waterPlane"
          uAmplitude={1}
          uDensity={1.2}
          uFrequency={5.5}
          uSpeed={0.35}
          uStrength={3.5}
          uTime={0}
          wireframe={false}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
