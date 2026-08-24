"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Megaphone,
  Trophy,
  History,
  Flame,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  ChevronRight,
  PartyPopper,
  Zap,
  MapPin,
  TrendingUp,
  BarChart3,
  Target,
  Swords,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import CallModal from "@/components/CallModalFinalV2";
import CelebrationOverlay from "@/components/CelebrationOverlay";
import TeamGeneratorModal from "@/components/TeamGeneratorModal";
import PlayerCardModal from "@/components/PlayerCardModal";
import { LiquidLogo } from "@/components/ui/LiquidLogo";

interface DashboardData {
  weekStart: string;
  weekUsersCount: number;
  totalCommunityUsers: number;
  weekUsers: Array<{
    id: string;
    name: string | null;
    customName: string | null;
    image: string | null;
  }>;
  bestSlots: Array<{
    date: string;
    hour: number;
    count: number;
    users: Array<{ id: string; name: string | null; image: string | null }>;
  }>;
  dailyTrend: Array<{
    day: string;
    date: string;
    count: number;
    uniqueUsers: number;
  }>;
  activeCalls: Array<any>;
  recentMatches: Array<any>;
  userStats: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    currentStreak: number;
    disposCount: number;
  } | null;
  monthMvp?: {
    id: string;
    name: string;
    image?: string;
    matches: number;
    wins: number;
    winRate: number;
    ovr: number;
  } | null;
}

/* ─── Avatar ──────────────────────────────────────────────── */
function Av({ src, name, size = 32 }: { src?: string | null; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  const init = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1.5px solid rgba(34,197,94,0.35)", background: "linear-gradient(135deg,#0a2516,#030d07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {src && !err ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setErr(true)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: size * 0.4, fontWeight: 900, color: "#22C55E" }}>{init}</span>}
    </div>
  );
}

/* ─── Card wrapper (Obsidian Dark Glass) ──────────────────── */
const card: React.CSSProperties = {
  background: "rgba(8, 10, 12, 0.95)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
  padding: "20px 22px",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [teamGeneratorOpen, setTeamGeneratorOpen] = useState(false);
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try { const r = await fetch("/api/dashboard"); if (r.ok) setData(await r.json()); } catch { } finally { setLoading(false); }
  }, []);

  useEffect(() => { session ? fetch_() : setLoading(false); }, [session, fetch_]);

  /* ─── Login screen ─────────────────────────────────────── */
  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
        <div
          style={{
            maxWidth: 460,
            width: "100%",
            padding: "36px 30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(14, 16, 20, 0.94) 30%, rgba(8, 10, 12, 0.98) 100%)",
            backdropFilter: "blur(30px) saturate(190%)",
            WebkitBackdropFilter: "blur(30px) saturate(190%)",
            borderRadius: "26px",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
          }}
        >
          {/* Header & Clean Real Logo (No Neon Glow / Halo) */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                overflow: "hidden",
                flexShrink: 0,
                marginBottom: 12,
              }}
            >
              <img
                src="/logo-five.png"
                alt="Planifive Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 12,
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.75)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                <Users size={12} color="rgba(255, 255, 255, 0.7)" />
                <span>Communauté Five</span>
              </div>

              <h1 style={{ fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: "white", margin: 0 }}>
                PLANIFIVE
              </h1>
              <p style={{ fontSize: 13, color: "rgba(255, 255, 255, 0.5)", margin: "4px 0 0", lineHeight: 1.4 }}>
                Plateforme d&apos;organisation & statistiques de Five
              </p>
            </div>
          </div>

          {/* Key Features Preview Pills (Glossy Liquid Glass, Lucide Icons, No Emojis) */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4ADE80",
                  flexShrink: 0,
                }}
              >
                <Calendar size={15} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Planning & Dispos
                </span>
                <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)" }}>
                  Votez et trouvez le meilleur créneau
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38BDF8",
                  flexShrink: 0,
                }}
              >
                <Swords size={15} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Équipes Équilibrées
                </span>
                <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)" }}>
                  Génération équitable selon les niveaux
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 14px",
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 9,
                  background: "rgba(251, 191, 36, 0.12)",
                  border: "1px solid rgba(251, 191, 36, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FBBF24",
                  flexShrink: 0,
                }}
              >
                <Trophy size={15} />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Classement & Stats
                </span>
                <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.45)" }}>
                  Win rate, bilans et séries de victoires
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {/* Discord Login Button (Apple Liquid Glass Blurple) */}
            <button
              onClick={() => signIn("discord", { callbackUrl: "/" })}
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: 16,
                background: "linear-gradient(180deg, rgba(88, 101, 242, 0.95) 0%, rgba(67, 78, 196, 0.98) 100%)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: "0 10px 25px rgba(88, 101, 242, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.45)",
                transition: "all 0.2s ease",
              }}
              className="hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg width="20" height="15" viewBox="0 0 71 55" fill="currentColor">
                <path d="M60.1 4.9C55.5 2.8 50.6 1.2 45.4.2c-.6 1.1-1.3 2.5-1.8 3.6-5.5-.8-11-.8-16.4 0-.5-1.2-1.2-2.5-1.8-3.6-5.2 1-10.1 2.6-14.7 4.7C3.3 18.8 1 32.3 2.1 45.6c6.2 4.6 12.1 7.4 17.9 9.2 1.5-2 2.8-4.2 3.9-6.5-2.1-.8-4.1-1.8-6-3 .5-.4 1-.7 1.4-1.1 11.6 5.4 24.3 5.4 35.8 0 .5.4 1 .7 1.4 1.1-1.9 1.2-3.9 2.2-6 3 1.1 2.3 2.4 4.5 3.9 6.5 5.8-1.8 11.8-4.6 17.9-9.2 1.4-15.4-2.5-28.8-10.4-40.7zM23.7 37.4c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2zm23.6 0c-3.5 0-6.4-3.2-6.4-7.2s2.8-7.2 6.4-7.2c3.6 0 6.5 3.3 6.4 7.2 0 4-2.8 7.2-6.4 7.2z" />
              </svg>
              <span>Continuer avec Discord</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Data shortcuts ───────────────────────────────────── */
  const userName = session?.user?.name || "Joueur";
  const topSlot = data?.bestSlots?.[0];
  const wr = data?.userStats?.winRate ?? 0;
  const currentStreak = data?.userStats?.currentStreak ?? 0;
  const trend = data?.dailyTrend ?? [];
  const totalDispos = trend.reduce((a, d) => a + d.count, 0);
  const maxTrend = Math.max(5, ...trend.map(d => d.count));

  /* ── SVG area-chart helpers ── */
  const W = 540, H = 160, PX = 35, PY = 20;
  const pts = trend.map((d, i) => ({
    x: PX + (i * (W - 2 * PX)) / Math.max(1, trend.length - 1),
    y: H - PY - (d.count / maxTrend) * (H - 2 * PY),
    ...d,
  }));
  const bezier = pts.reduce((s, p, i, a) => {
    if (!i) return `M ${p.x} ${p.y}`;
    const pr = a[i - 1]; const cx = (pr.x + p.x) / 2;
    return `${s} C ${cx} ${pr.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, "");
  const area = pts.length ? `${bezier} L ${pts[pts.length - 1].x} ${H - PY} L ${pts[0].x} ${H - PY} Z` : "";

  /* ── bar chart helpers ── */
  const barData = (data?.bestSlots || []).slice(0, 7);
  const maxBar = Math.max(3, ...barData.map(s => s.count));

  return (
    <div className="min-h-screen text-white font-sans flex flex-col p-3 pb-24 overflow-x-hidden">

      {/* ═══════ NAVBAR ═══════ */}
      <div className="relative z-50 w-full max-w-[1600px] mx-auto" style={{ marginBottom: "20px" }}>
        <Navbar title="Dashboard" icon={<Sparkles size={18} color="#22C55E" />} onOpenCallModal={() => setCallModalOpen(true)} />
      </div>

      {/* ═══════ MAIN DASHBOARD CONTENT ═══════ */}
      <main className="w-full max-w-[1400px] mx-auto flex flex-col" style={{ gap: "20px" }}>

        {/* ═══════ ROW 1 — 4 KPI MINI CARDS ═══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px" }}>
          {[
            { label: "Top Créneau", value: topSlot ? `${topSlot.hour}h – ${topSlot.hour + 1}h` : "—", sub: topSlot ? `${topSlot.count}/10 prêts` : "Aucun", pct: topSlot ? "+hot" : "", color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: <Flame size={20} color="#22C55E" /> },
            { label: "Joueurs Actifs", value: `${data?.weekUsersCount ?? 0}`, sub: `sur ${data?.totalCommunityUsers ?? 0} inscrits`, pct: `+${data?.weekUsersCount ?? 0}`, color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: <Users size={20} color="#22C55E" /> },
            { label: "Mon Win Rate", value: `${wr}%`, sub: `${data?.userStats?.wins ?? 0}V / ${data?.userStats?.totalMatches ?? 0}`, pct: wr >= 50 ? `+${wr}%` : `${wr}%`, color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: <Trophy size={20} color="#22C55E" /> },
            { label: "Série Victoires", value: `${currentStreak}`, sub: `${data?.userStats?.disposCount ?? 0} dispos posées`, pct: currentStreak > 0 ? `+${currentStreak} V` : "0 V", color: "#22C55E", bg: "rgba(34,197,94,0.15)", icon: <Zap size={20} color="#22C55E" /> },
          ].map((kpi, i) => (
            <div key={i} style={{ ...card, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{kpi.value}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: kpi.color }}>{kpi.pct}</span>
                </div>
              </div>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {kpi.icon}
              </div>
            </div>
          ))}
        </div>

        {/* ═══════ ROW 2 — WELCOME + SATISFACTION GAUGE + BILAN PERSONNEL ═══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "5fr 4fr 3.2fr", gap: "20px" }}>

          {/* ── Welcome Hero Card ── */}
          <div style={{ ...card, padding: 0, overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 240 }}>
            <div style={{ padding: "24px 26px", position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Bienvenue,</span>

                  {/* Month MVP Badge (Pure Clean Obsidian Glass, Zero Neon) */}
                  {data?.monthMvp && (
                    <div
                      onClick={() => setSelectedPlayerForCard(data.monthMvp!.name)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "6px 14px",
                        borderRadius: 14,
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.10)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:bg-white/[0.08] hover:border-white/20 active:scale-95"
                      title="Cliquer pour voir la Carte FUT du MVP"
                    >
                      <Crown size={14} color="#FCD34D" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        MVP : <span style={{ color: "#FCD34D" }}>{data.monthMvp.name}</span> <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>({data.monthMvp.winRate}% WR)</span>
                      </span>
                    </div>
                  )}
                </div>

                <h2 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "white" }}>{userName}</h2>
                <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, maxWidth: 320 }}>
                  Consultez les disponibilités, retrouvez vos stats et rejoignez le match de la semaine.
                </p>
              </div>

              {/* Action row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <Link href="/planning" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 15px", borderRadius: 12, background: "linear-gradient(135deg,#22C55E,#16A34A)", color: "#030905", fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)" }} className="hover:scale-105 transition-all">
                  <Calendar size={14} /><span>Planning</span><ArrowRight size={12} />
                </Link>
                <button
                  onClick={() => setSelectedPlayerForCard(session?.user?.name || "me")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 13px",
                    borderRadius: 12,
                    background: "rgba(251, 191, 36, 0.12)",
                    border: "1px solid rgba(251, 191, 36, 0.30)",
                    color: "#FBBF24",
                    fontWeight: 800,
                    fontSize: 11,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                  className="hover:bg-amber-500/20 transition-all hover:scale-105"
                >
                  <Trophy size={13} color="#FBBF24" /><span>Carte FUT</span>
                </button>
                {data?.bestSlots && data.bestSlots.some((s: any) => s.count >= 10) && (
                  <button onClick={() => setTeamGeneratorOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 12, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.28)", color: "#38BDF8", fontWeight: 800, fontSize: 11, textTransform: "uppercase", cursor: "pointer" }} className="hover:bg-[#38BDF8]/20 transition-all">
                    <Swords size={13} /><span>Équipes</span>
                  </button>
                )}
                <button onClick={() => setCallModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 12, background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.25)", color: "#38BDF8", fontWeight: 800, fontSize: 11, textTransform: "uppercase", cursor: "pointer" }} className="hover:bg-[#38BDF8]/20 transition-all">
                  <Megaphone size={13} color="#38BDF8" /><span>Appel</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Satisfaction Rate / Win Rate Semi-Circle ── */}
          <div style={{ ...card, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 240 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "white" }}>Taux de Réussite</h3>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Performance globale en match</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "12px 0 6px", position: "relative" }}>
              <svg width="190" height="105" viewBox="0 0 200 110">
                <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round" />
                <path d="M 15 100 A 85 85 0 0 1 185 100" fill="none" stroke="url(#g1)" strokeWidth="14" strokeLinecap="round" strokeDasharray="267" strokeDashoffset={267 - (267 * Math.min(100, Math.max(3, wr))) / 100} style={{ transition: "stroke-dashoffset 1.2s ease" }} />
                <defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient></defs>
              </svg>
              <div style={{ position: "absolute", top: 48, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: "white" }}>{wr}%</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.08em" }}>Win Rate</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,0.4)", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
              <span>0%</span>
              <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{data?.userStats?.wins ?? 0}V – {data?.userStats?.draws ?? 0}N – {data?.userStats?.losses ?? 0}D</span>
              <span>100%</span>
            </div>
          </div>

          {/* ── Bilan Personnel (Clean Grid & Centered Lower Gauge) ── */}
          <div style={{ ...card, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 240 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "white" }}>Bilan Personnel</h3>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Historique de vos matchs</span>
            </div>

            {/* 2 Stat Boxes Side-by-Side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "8px 0" }}>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block" }}>Matchs Joués</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "white" }}>{data?.userStats?.totalMatches ?? 0}</span>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", display: "block" }}>Défaites</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: "#EF4444" }}>{data?.userStats?.losses ?? 0}</span>
              </div>
            </div>

            {/* Centered Circular Victories Gauge in the lower area */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "4px 0" }}>
              <svg width="80" height="80" viewBox="0 0 86 86">
                <circle cx="43" cy="43" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle
                  cx="43"
                  cy="43"
                  r="34"
                  fill="none"
                  stroke="url(#g2)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="213.6"
                  strokeDashoffset={213.6 - (213.6 * Math.min(100, wr)) / 100}
                  transform="rotate(-90 43 43)"
                  style={{ transition: "stroke-dashoffset 1s ease" }}
                />
                <defs>
                  <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: "white" }}>
                  {data?.userStats?.wins ?? 0}
                </span>
                <span style={{ fontSize: 8, fontWeight: 800, color: "#22C55E", textTransform: "uppercase", letterSpacing: "0.06em" }}>Victoires</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ ROW 3 — AREA CHART + BAR CHART ═══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: "20px" }}>

          {/* ── Area wave chart — Fréquentation ── */}
          <div style={{ ...card, padding: "20px 22px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "white" }}>Vue d&apos;ensemble</h3>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>(+{totalDispos}) dispos cette semaine</span>
              </div>
            </div>

            <div style={{ width: "100%", marginTop: 6 }}>
              <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", maxHeight: 175, display: "block" }}>
                <defs>
                  <linearGradient id="ag" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.30)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0.00)" />
                  </linearGradient>
                </defs>

                {/* Horizontal guides */}
                {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                  const y = H - PY - frac * (H - 2 * PY);
                  return <line key={idx} x1={PX} y1={y} x2={W - PX} y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="4 6" />;
                })}

                {area && <path d={area} fill="url(#ag)" />}
                {bezier && <path d={bezier} fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />}

                {/* Shadow stroke for glow */}
                {bezier && <path d={bezier} fill="none" stroke="#22C55E" strokeWidth="8" strokeLinecap="round" opacity="0.15" />}

                {pts.map((p, i) => (
                  <g key={i}>
                    {p.count > 0 && <circle cx={p.x} cy={p.y} r="6" fill="rgba(34,197,94,0.15)" />}
                    <circle cx={p.x} cy={p.y} r={p.count > 0 ? 3.5 : 2} fill={p.count > 0 ? "#22C55E" : "rgba(255,255,255,0.2)"} stroke="#060e08" strokeWidth="2" />
                    <text x={p.x} y={H - 3} textAnchor="middle" fill="rgba(255,255,255,0.40)" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">{p.day}</text>
                  </g>
                ))}

                {/* Y axis labels */}
                {[0, 0.5, 1].map((frac, idx) => {
                  const val = Math.round(maxTrend * frac);
                  const y = H - PY - frac * (H - 2 * PY);
                  return <text key={idx} x={PX - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10" fontWeight="600">{val}</text>;
                })}
              </svg>
            </div>
          </div>

          {/* ── Bar chart / Créneaux populaires ── */}
          <div style={{ ...card, padding: "20px 22px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <svg width="160" height="105" viewBox="0 0 160 110" style={{ display: "block" }}>
                    {barData.map((slot, i) => {
                      const barH = Math.max(6, (slot.count / maxBar) * 80);
                      const x = 10 + i * 22;
                      return (
                        <g key={i}>
                          <rect x={x} y={100 - barH} width="14" height={barH} rx="4" fill={slot.count >= 10 ? "#22C55E" : "rgba(34,197,94,0.4)"} />
                          <text x={x + 7} y={108} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="600">
                            {slot.hour}h
                          </text>
                        </g>
                      );
                    })}
                    {/* Y scale lines */}
                    {[0, 0.5, 1].map((f, idx) => (
                      <line key={idx} x1={0} y1={100 - f * 80} x2={165} y2={100 - f * 80} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 4" />
                    ))}
                  </svg>
                </div>
              </div>

              <h3 style={{ margin: "8px 0 3px", fontSize: 15, fontWeight: 900, color: "white" }}>Créneaux Populaires</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#22C55E" }}>(+{data?.weekUsersCount ?? 0}) joueurs cette semaine</span>
            </div>

            {/* Mini legend row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              {[
                { icon: <Users size={13} />, label: "Joueurs", value: data?.weekUsersCount ?? 0 },
                { icon: <Calendar size={13} />, label: "Dispos", value: totalDispos },
                { icon: <Flame size={13} />, label: "Top Slot", value: topSlot ? `${topSlot.count}` : "0" },
                { icon: <Target size={13} />, label: "Complet", value: barData.filter(s => s.count >= 10).length },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#22C55E" }}>{item.icon}</div>
                  <div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, display: "block" }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "white" }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ ROW 4 — ROSTER TABLE + RECENT MATCHES ═══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: "20px" }}>

          {/* ── Roster Table (Projects-style) ── */}
          <div style={{ ...card, padding: "26px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "white" }}>Roster Joueurs</h3>
                <span style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  {data?.weekUsersCount ?? 0} prêts cette semaine
                </span>
              </div>
              <Link href="/leaderboard" style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#FBBF24", fontSize: 11, fontWeight: 800, textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }} className="hover:scale-105 transition-all"><Trophy size={13} /><span>Classement</span></Link>
            </div>

            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Joueur</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>Statut</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "right" }}>Action</span>
            </div>

            <div style={{ maxHeight: 250, overflowY: "auto" }}>
              {data?.weekUsers && data.weekUsers.length > 0 ? data.weekUsers.map(u => (
                <div key={u.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Av src={u.image} name={u.customName || u.name || "?"} size={34} />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "white", display: "block" }}>{u.customName || u.name}</span>
                      {u.customName && u.name && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{u.name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#22C55E", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20, background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E" }} />Dispo
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Link href="/planning" style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)", textDecoration: "none" }} className="hover:text-white transition-all">Voir planning</Link>
                  </div>
                </div>
              )) : (
                <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Aucun joueur n&apos;a posé de disponibilité</div>
              )}
            </div>
          </div>

          {/* ── Recent Matches Timeline (Orders overview-style) ── */}
          <div style={{ ...card, padding: "26px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "white" }}>Derniers Matchs</h3>
                <span style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  Historique récent
                </span>
              </div>
              <Link href="/history" style={{ padding: "6px 14px", borderRadius: 10, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", color: "#38BDF8", fontSize: 11, fontWeight: 800, textTransform: "uppercase", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }} className="hover:scale-105 transition-all"><History size={13} /><span>Historique</span></Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 280, overflowY: "auto" }}>
              {data?.recentMatches && data.recentMatches.length > 0 ? data.recentMatches.slice(0, 5).map((m, idx) => {
                const t1w = m.scoreTeam1 > m.scoreTeam2;
                const draw = m.scoreTeam1 === m.scoreTeam2;
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: idx < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    {/* Timeline dot + line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, paddingTop: 2 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: t1w ? "#22C55E" : draw ? "#F59E0B" : "#EF4444", boxShadow: `0 0 8px ${t1w ? "rgba(34,197,94,0.4)" : draw ? "rgba(245,158,11,0.4)" : "rgba(239,68,68,0.4)"}` }} />
                      {idx < 4 && <div style={{ width: 2, height: 30, background: "rgba(255,255,255,0.06)", borderRadius: 1 }} />}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "white", textTransform: "capitalize" }}>
                          {new Date(m.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        <div style={{ padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "white" }}>
                          <span style={{ color: t1w ? "#22C55E" : "white" }}>{m.scoreTeam1}</span>
                          <span style={{ color: "rgba(255,255,255,0.25)", margin: "0 4px" }}>–</span>
                          <span style={{ color: !t1w && !draw ? "#22C55E" : "white" }}>{m.scoreTeam2}</span>
                        </div>
                      </div>
                      {m.location && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><MapPin size={10} />{m.location}</span>}
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 12, fontStyle: "italic" }}>Aucun match enregistré récemment</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ═══════ FOOTER ═══════ */}
      <footer
        className="w-full max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{
          marginTop: "24px",
          padding: "18px 24px",
          background: "rgba(6, 18, 12, 0.55)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "30px", height: "30px", borderRadius: "50%", overflow: "hidden", border: "1.5px solid rgba(34,197,94,0.4)" }}>
            <img src="/logo-five.png" alt="Planifive Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <span style={{ fontSize: "15px", fontWeight: 900, color: "white", letterSpacing: "0.02em" }}>
            Planifive
          </span>
        </div>

        <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.4)", fontWeight: 500 }}>
          © {new Date().getFullYear()} Planifive • Tous droits réservés
        </span>
      </footer>

      {/* ═══════ MODALS ═══════ */}
      <CallModal isOpen={callModalOpen} onClose={() => { setCallModalOpen(false); fetch_(); }} />
      <CelebrationOverlay
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        onOpenTeamGenerator={() => setTeamGeneratorOpen(true)}
      />
      <TeamGeneratorModal isOpen={teamGeneratorOpen} onClose={() => setTeamGeneratorOpen(false)} />
      <PlayerCardModal
        isOpen={!!selectedPlayerForCard}
        onClose={() => setSelectedPlayerForCard(null)}
        userName={selectedPlayerForCard === "me" ? undefined : selectedPlayerForCard}
        userId={selectedPlayerForCard === "me" ? session?.user?.id : undefined}
      />
    </div>
  );
}