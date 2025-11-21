"use client";

import { useSession, signIn } from "next-auth/react";
import PlanningGrid, { GoldenSlot } from "@/components/PlanningGrid";
import Navbar from "@/components/Navbar";
import { LayoutGrid } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session } = useSession();
  const [goldenSlots, setGoldenSlots] = useState<GoldenSlot[]>([]); // Liste de créneaux 3H

  if (!session) {
    return (
      <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Ambient Glow */}
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#1ED760]/10 blur-[150px] rounded-full pointer-events-none"
        />
        <motion.div
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#1ED760]/5 blur-[150px] rounded-full pointer-events-none"
        />

        <div className="z-10 flex flex-col items-center gap-8">
          {/* Animated Logo Container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#1ED760] blur-2xl opacity-20 animate-pulse" />
            <div className="w-24 h-24 bg-gradient-to-br from-[#1ED760] to-[#1db954] rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(30,215,96,0.3)] border border-white/10">
              <LayoutGrid size={48} className="text-black drop-shadow-lg" />
            </div>
          </motion.div>

          {/* Text Content */}
          <div className="flex flex-col items-center gap-3 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl font-black text-white tracking-tighter"
            >
              FIVE PLANNER
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-gray-400 font-medium tracking-wide uppercase text-sm"
            >
              L'outil ultime pour vos matchs
            </motion.p>
          </div>

          {/* Login Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(30,215,96,0.4)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => signIn("discord")}
            className="group relative bg-white text-black px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              Connexion Discord
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] text-white font-sans flex flex-col overflow-hidden p-3 gap-3">

      {/* HEADER PREMIUM (Navbar) */}
      <Navbar goldenSlots={goldenSlots} />

      {/* MAIN CONTENT */}
      <main className="flex-1 min-h-0 w-full relative px-12 pt-12 pb-8 flex justify-center">
        <div className="w-full max-w-[1600px] h-full">
          {/* On passe la fonction setGoldenSlots pour mettre à jour la navbar */}
          <PlanningGrid onUpdateStats={setGoldenSlots} />
        </div>
      </main>
    </div>
  );
}