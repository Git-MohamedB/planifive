"use client";

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Flame, X, Swords } from "lucide-react";
import confetti from "canvas-confetti";

export const triggerFullConfetti = () => {
  // Sound effect via Web Audio API (no external file dependency)
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Major triad fanfare)
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.20, ctx.currentTime + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.36);
      });
    }
  } catch {}

  // Left Cannon
  confetti({
    particleCount: 70,
    angle: 60,
    spread: 70,
    origin: { x: 0, y: 0.8 },
    colors: ["#22C55E", "#FBBF24", "#38BDF8", "#FFFFFF", "#10B981", "#F59E0B"],
    zIndex: 100001,
  });

  // Right Cannon
  confetti({
    particleCount: 70,
    angle: 120,
    spread: 70,
    origin: { x: 1, y: 0.8 },
    colors: ["#22C55E", "#FBBF24", "#38BDF8", "#FFFFFF", "#10B981", "#F59E0B"],
    zIndex: 100001,
  });

  // Center Starburst
  setTimeout(() => {
    confetti({
      particleCount: 90,
      spread: 120,
      origin: { x: 0.5, y: 0.45 },
      colors: ["#22C55E", "#FBBF24", "#FFFFFF", "#34D399", "#FCD34D"],
      zIndex: 100001,
      scalar: 1.2,
    });
  }, 250);
};

interface CelebrationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onOpenTeamGenerator?: () => void;
}

export default function CelebrationOverlay({
  isOpen,
  onClose,
  title = "SESSION 10/10 ATTEINTE !",
  subtitle = "Le quota de 10 joueurs est réuni pour lancer le match !",
  onOpenTeamGenerator,
}: CelebrationOverlayProps) {
  const fire = useCallback(() => {
    triggerFullConfetti();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fire();
    }
  }, [isOpen, fire]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            margin: "auto",
            maxWidth: "460px",
            width: "100%",
            background: "rgba(8, 10, 12, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
            padding: "28px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            position: "relative",
          }}
        >
          {/* Single Close Button (Top Right X only) */}
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              color: "rgba(255, 255, 255, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            className="hover:text-white hover:bg-white/10"
            title="Fermer"
          >
            <X size={16} />
          </button>

          {/* Trophy Icon Box (Clean Obsidian with Emerald border, No Neon Halo) */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "18px",
              background: "rgba(34, 197, 94, 0.10)",
              border: "1.5px solid #22C55E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#22C55E",
              marginTop: "4px",
            }}
          >
            <Trophy size={32} color="#22C55E" />
          </div>

          {/* Tag & Title */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "20px",
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.30)",
                color: "#4ADE80",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <Flame size={13} color="#FBBF24" />
              <span>10 / 10 JOUEURS VALIDÉS</span>
            </div>

            <h2
              style={{
                margin: "4px 0 0 0",
                fontSize: "20px",
                fontWeight: 900,
                letterSpacing: "0.02em",
                color: "white",
                textTransform: "uppercase",
              }}
            >
              {title}
            </h2>

            <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "rgba(255, 255, 255, 0.60)", fontWeight: 500, lineHeight: 1.45, maxWidth: "360px" }}>
              {subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", marginTop: "4px" }}>
            {onOpenTeamGenerator && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTeamGenerator();
                }}
                style={{
                  width: "100%",
                  padding: "12px 18px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                  color: "#040905",
                  fontWeight: 900,
                  fontSize: "12px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 8px 24px rgba(34, 197, 94, 0.35)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
                className="hover:scale-[1.02] active:scale-[0.98]"
              >
                <Swords size={15} />
                <span>Générer les Équipes (IA)</span>
              </button>
            )}

            <button
              onClick={fire}
              style={{
                width: "100%",
                padding: "11px 16px",
                borderRadius: "12px",
                background: "rgba(251, 191, 36, 0.12)",
                border: "1px solid rgba(251, 191, 36, 0.30)",
                color: "#FBBF24",
                fontWeight: 800,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
              className="hover:bg-amber-500/20 active:scale-[0.98]"
            >
              <Sparkles size={14} />
              <span>Tirer Confettis</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
