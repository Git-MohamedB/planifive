"use client";

import { useSession, signIn } from "next-auth/react";
import PlanningGrid, { SlotStats } from "@/components/PlanningGrid";
import Navbar from "@/components/Navbar";
import { useState, useCallback } from "react";
import CallModal from "@/components/CallModalFinalV2";
import { motion } from "framer-motion";
import { LiquidLogo } from "@/components/ui/LiquidLogo";
import { Sparkles } from "lucide-react";

export default function PlanningPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SlotStats>({ max1h: 0, max2h: 0, slots1h: [], slots2h: [] });

  const handleUpdateStats = useCallback((newStats: SlotStats) => {
    setStats(newStats);
  }, []);

  const [callModal, setCallModal] = useState<{ isOpen: boolean; date?: string; hour?: string }>({ isOpen: false });

  const openCallModal = useCallback((date?: string, hour?: string) => {
    setCallModal({ isOpen: true, date, hour });
  }, []);

  const closeCallModal = useCallback(() => {
    setCallModal({ ...callModal, isOpen: false });
  }, [callModal]);

  if (!session) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            background: 'rgba(8, 10, 30, 0.70)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
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
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative flex items-center justify-center"
          >
            <LiquidLogo src="/logo-five.png" width={220} height={180} scaleX={1.12} speed={0.10} />
          </motion.div>

          <div className="flex flex-col items-center gap-4 text-center">
            <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'white', margin: 0 }}>
              Planifive
            </h1>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', margin: 0 }}>
              Connecte-toi pour accéder au planning
            </p>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signIn("discord")}
              style={{
                width: '100%',
                padding: '15px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(180deg, rgba(88, 101, 242, 0.95) 0%, rgba(67, 78, 196, 0.98) 100%)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 24px rgba(88, 101, 242, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 800,
              }}
            >
              <span>Continuer avec Discord</span>
            </motion.button>

            <button
              onClick={() => signIn("demo-login", { callbackUrl: "/planning" })}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'rgba(255, 255, 255, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              className="hover:text-white hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.98]"
            >
              <Sparkles size={13} color="#22C55E" />
              <span>Accès Mode Démo</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen text-white font-sans flex flex-col overflow-hidden p-3 gap-3 relative">
      {/* HEADER PREMIUM (Navbar) */}
      <div className="relative z-50 w-full max-w-[1600px] mx-auto" style={{ marginBottom: '8px' }}>
        <Navbar
          stats={stats}
          onOpenCallModal={() => openCallModal()}
        />
      </div>

      {/* MAIN CONTENT - Planning Grid */}
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto relative flex flex-col z-10">
        <div className="w-full h-full">
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
