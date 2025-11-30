"use client";

import { useSession, signIn } from "next-auth/react";
import PlanningGrid, { GoldenSlot } from "@/components/PlanningGrid";
import Navbar from "@/components/Navbar";
import { LayoutGrid } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import CallModal from "@/components/CallModalFinalV2";
import { motion } from "framer-motion";

export default function Home() {
  // Force rebuild
  const { data: session } = useSession();
  const [stats, setStats] = useState<{ golden: GoldenSlot[], potential: GoldenSlot[] }>({ golden: [], potential: [] });
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    // Générer les particules uniquement côté client pour éviter les erreurs d'hydratation
    const newParticles = [...Array(40)].map(() => ({
      width: Math.random() * 2 + 1 + 'px',
      height: Math.random() * 2 + 1 + 'px',
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 10
    }));
    setParticles(newParticles);
  }, []);

  const handleUpdateStats = useCallback((golden: GoldenSlot[], potential: GoldenSlot[]) => {
    setStats({ golden, potential });
  }, []);

  const [callModal, setCallModal] = useState<{ isOpen: boolean; date?: string; hour?: string }>({ isOpen: false });

  const openCallModal = useCallback((date?: string, hour?: string) => {
    setCallModal({ isOpen: true, date, hour });
  }, []);

  const closeCallModal = useCallback(() => {
    setCallModal({ ...callModal, isOpen: false });
  }, [callModal]);

  if (!session) {
    // ... (Login screen code omitted for brevity, it remains unchanged)
    return (
      <div
        style={{
          background: '#020204',
          height: '100vh',
          width: '100vw',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Animated Grid Background - Tech/Premium Feel */}
        <div
          style={{
            position: 'absolute',
            inset: '-100%',
            background: `
              linear-gradient(transparent 0%, rgba(88, 101, 242, 0.08) 50%, transparent 100%),
              linear-gradient(90deg, transparent 0%, rgba(88, 101, 242, 0.08) 50%, transparent 100%)
            `,
            backgroundSize: '100px 100px',
            transform: 'perspective(500px) rotateX(60deg)',
            animation: 'gridMove 20s linear infinite',
            opacity: 0.6,
            pointerEvents: 'none'
          }}
        />
        <style jsx>{`
          @keyframes gridMove {
            0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
            100% { transform: perspective(500px) rotateX(60deg) translateY(100px); }
          }
        `}</style>

        {/* Subtle Floating Particles - Clean & Minimal */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {particles.map((p, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: p.width,
                height: p.height,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.3)',
                left: p.left,
                top: p.top,
              }}
              animate={{
                y: [0, -100],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                ease: "linear",
                delay: p.delay
              }}
            />
          ))}
        </div>

        {/* Spotlight Effect from Top - Slightly Stronger Blue */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(88, 101, 242, 0.20) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none'
          }}
        />

        {/* Central Glass Card */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: '24px',
            padding: '60px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '40px',
            maxWidth: '500px',
            width: '90%'
          }}
        >
          {/* Inner Glow for Card */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 40%)',
              borderRadius: '24px',
              pointerEvents: 'none'
            }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div
              style={{
                position: 'absolute',
                inset: '-20px',
                background: 'radial-gradient(circle, rgba(88, 101, 242, 0.3) 0%, transparent 70%)',
                filter: 'blur(20px)',
                zIndex: -1
              }}
            />
            <img
              src="/logo-five.png"
              alt="Planifive Logo"
              style={{ width: '100px', height: '100px', borderRadius: '50%', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))', objectFit: 'cover' }}
            />
          </motion.div>

          {/* Text Content */}
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              Planifive
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.05em'
            }}>
              THIS IS WHERE IT STARTED
            </p>
          </div>

          {/* Discord Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn("discord")}
            style={{
              width: '100%',
              padding: '18px',
              borderRadius: '20px',
              background: '#5865F2',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 12px rgba(88, 101, 242, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)',
              pointerEvents: 'none'
            }} />

            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="white">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
            </svg>

            <span style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 700,
              letterSpacing: '0.02em'
            }}>
              Connexion Discord
            </span>
          </motion.button>

          {/* Security Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: 0.5
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '12px', color: 'white' }}>Sécurisé via Discord</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] text-white font-sans flex flex-col overflow-hidden p-3 gap-3">

      {/* HEADER PREMIUM (Navbar) */}
      <Navbar
        goldenSlots={stats.golden}
        potentialSlots={stats.potential}
        onOpenCallModal={() => openCallModal()}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-0 w-full relative px-12 pt-12 pb-8 flex justify-center">
        <div className="w-full max-w-[1600px] h-full">
          {/* On passe la fonction setGoldenSlots pour mettre à jour la navbar */}
          <PlanningGrid
            onUpdateStats={handleUpdateStats}
            onOpenCallModal={openCallModal}
          />
        </div>
      </main>

      <CallModal
        isOpen={callModal.isOpen}
        onClose={closeCallModal}
        initialDate={callModal.date}
        initialHour={callModal.hour}
      />
    </div>
  );
}