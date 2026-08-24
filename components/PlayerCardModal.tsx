"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trophy,
  Crown,
  ShieldCheck,
  Swords,
  Star,
  Target,
  Zap,
  Users,
  Flame,
  Share2,
  CheckCircle2,
  Lock,
  Loader2,
  Sliders,
  Check,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userName?: string | null;
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    customName?: string;
    image?: string;
    accentColor?: string;
    technique?: number;
    cardio?: number;
    overall: number;
  };
  isOwnProfile: boolean;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    maxWinStreak: number;
    currentWinStreak: number;
    favoriteDay: string;
    favoriteHour: string;
  };
  fut: {
    ovr: number;
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  };
  ratingsCount?: number;
  isCommunityRated?: boolean;
  myRating?: {
    pac: number;
    sho: number;
    pas: number;
    dri: number;
    def: number;
    phy: number;
  } | null;
  synergy: { name: string; image?: string; matches: number; wins: number; winRate: number } | null;
  nemesis: { name: string; image?: string; matches: number; losses: number; lossRate: number } | null;
  badges: Array<{
    id: string;
    name: string;
    desc: string;
    icon: string;
    color: string;
    unlocked: boolean;
    progress: number;
    max: number;
  }>;
  matchHistory: Array<{
    id: string;
    date: string;
    location?: string;
    myScore: number;
    opponentScore: number;
    result: "WIN" | "LOSS" | "DRAW";
  }>;
}

export default function PlayerCardModal({
  isOpen,
  onClose,
  userId,
  userName,
}: PlayerCardModalProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"card" | "rate" | "synergy" | "badges" | "history">("card");
  const [copied, setCopied] = useState(false);

  // Rating Sliders State
  const [ratePAC, setRatePAC] = useState(75);
  const [rateSHO, setRateSHO] = useState(75);
  const [ratePAS, setRatePAS] = useState(75);
  const [rateDRI, setRateDRI] = useState(75);
  const [rateDEF, setRateDEF] = useState(75);
  const [ratePHY, setRatePHY] = useState(75);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setRatingError(null);
    const target = userId || userName || "me";

    fetch(`/api/profile/${encodeURIComponent(target)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((d: ProfileData) => {
        setData(d);
        if (d.myRating) {
          setRatePAC(d.myRating.pac);
          setRateSHO(d.myRating.sho);
          setRatePAS(d.myRating.pas);
          setRateDRI(d.myRating.dri);
          setRateDEF(d.myRating.def);
          setRatePHY(d.myRating.phy);
        } else if (d.fut) {
          setRatePAC(d.fut.pac);
          setRateSHO(d.fut.sho);
          setRatePAS(d.fut.pas);
          setRateDRI(d.fut.dri);
          setRateDEF(d.fut.def);
          setRatePHY(d.fut.phy);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching player profile:", err);
        setLoading(false);
      });
  }, [isOpen, userId, userName]);

  if (!isOpen) return null;

  const displayName = data?.user.customName || data?.user.name || userName || "Joueur";
  const ovr = data?.fut?.ovr || 85;
  const isSelf = data?.isOwnProfile;
  const previewOvr = Math.round(
    ratePAC * 0.15 + rateSHO * 0.25 + ratePAS * 0.15 + rateDRI * 0.2 + rateDEF * 0.1 + ratePHY * 0.15
  );

  const getBadgeIcon = (iconName: string, size = 18) => {
    switch (iconName) {
      case "crown":
        return <Crown size={size} />;
      case "shield-check":
        return <ShieldCheck size={size} />;
      case "swords":
        return <Swords size={size} />;
      case "star":
        return <Star size={size} />;
      case "target":
        return <Target size={size} />;
      case "zap":
        return <Zap size={size} />;
      case "trophy":
      default:
        return <Trophy size={size} />;
    }
  };

  const copyStatsToClipboard = () => {
    if (!data) return;
    const text = `🏆 CARTE PLANIFIVE — ${displayName.toUpperCase()} (OVR: ${data.fut.ovr})
⭐ Win Rate: ${data.stats.winRate}% (${data.stats.wins}V - ${data.stats.losses}D)
⚡ PAC: ${data.fut.pac} | SHO: ${data.fut.sho} | PAS: ${data.fut.pas}
🎯 DRI: ${data.fut.dri} | DEF: ${data.fut.def} | PHY: ${data.fut.phy}
🤝 Meilleur Duo: ${data.synergy ? `${data.synergy.name} (${data.synergy.winRate}% WR)` : "Aucun"}
😈 Némésis: ${data.nemesis ? `${data.nemesis.name} (${data.nemesis.lossRate}% défaites)` : "Aucun"}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const submitRating = async () => {
    if (isSelf) return;
    setSubmittingRating(true);
    setRatingError(null);
    try {
      const target = userId || userName || data?.user.id || "me";
      const res = await fetch(`/api/profile/${encodeURIComponent(target)}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pac: ratePAC,
          sho: rateSHO,
          pas: ratePAS,
          dri: rateDRI,
          def: rateDEF,
          phy: ratePHY,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        if (data) {
          setData({
            ...data,
            fut: resData.fut,
            ratingsCount: resData.ratingsCount,
            isCommunityRated: true,
            myRating: resData.myRating,
          });
        }
        setRatingSuccess(true);
        setTimeout(() => {
          setRatingSuccess(false);
          setTab("card");
        }, 1200);
      } else {
        setRatingError(resData.error || "Erreur lors de l'enregistrement de la note");
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setRatingError("Erreur de connexion au serveur");
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.78)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 9999999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "680px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(14, 16, 20, 0.95) 25%, rgba(8, 10, 12, 0.98) 100%)",
            backdropFilter: "blur(32px) saturate(190%)",
            WebkitBackdropFilter: "blur(32px) saturate(190%)",
            borderRadius: "26px",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
            padding: "28px",
            position: "relative",
          }}
        >
          {/* Header Bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FCD34D",
                }}
              >
                <Trophy size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em", color: "white" }}>
                  Profil Joueur & Carte FUT
                </h3>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>
                  {displayName} • Note Moyenne des Joueurs
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
              }}
            >
              <X size={16} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "12px" }}>
              <Loader2 className="animate-spin text-white/50" size={32} />
              <span style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600 }}>
                Génération de la Carte FUT & Moyennes...
              </span>
            </div>
          ) : !data ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255, 255, 255, 0.5)" }}>
              Impossible de charger le profil.
            </div>
          ) : (
            <>
              {/* Navigation Tabs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${data.isOwnProfile ? 4 : 5}, 1fr)`,
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.03)",
                  padding: "4px",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  marginBottom: "20px",
                }}
              >
                {[
                  { id: "card", label: "Carte", icon: Trophy, show: true },
                  { id: "rate", label: "Noter", icon: Sliders, show: !data.isOwnProfile },
                  { id: "synergy", label: "Duo / Rival", icon: Users, show: true },
                  { id: "badges", label: "Succès", icon: Crown, show: true },
                  { id: "history", label: "Matchs", icon: Flame, show: true },
                ]
                  .filter((t) => t.show)
                  .map((t) => {
                    const Icon = t.icon;
                    const isActive = tab === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id as any)}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "10px",
                          background: isActive ? "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%)" : "transparent",
                          border: isActive ? "1px solid rgba(255, 255, 255, 0.18)" : "none",
                          color: isActive ? "white" : "rgba(255, 255, 255, 0.5)",
                          fontSize: "11px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon size={13} color={isActive ? "#FCD34D" : "rgba(255, 255, 255, 0.5)"} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
              </div>

              {/* ═════════ TAB 1: CARTE FUT ═════════ */}
              {tab === "card" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                  {/* Community Rating Pill */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "rgba(255, 255, 255, 0.7)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <Users size={12} color="#FCD34D" />
                    <span>
                      {data.ratingsCount && data.ratingsCount > 0
                        ? `Moyenne Communautaire (${data.ratingsCount} avis)`
                        : "Note Initiale (Aucun avis enregistré)"}
                    </span>
                  </div>

                  {/* The Official FUT Card */}
                  <div
                    style={{
                      width: "300px",
                      borderRadius: "24px",
                      background: "linear-gradient(165deg, rgba(255, 255, 255, 0.08) 0%, rgba(16, 18, 22, 0.98) 35%, rgba(6, 8, 10, 1) 100%)",
                      border: "1.5px solid rgba(255, 255, 255, 0.14)",
                      boxShadow: "0 20px 50px rgba(0, 0, 0, 0.85), inset 0 1.5px 1px rgba(255, 255, 255, 0.25)",
                      padding: "24px 20px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Top Notch Shield / Rating */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: "38px", fontWeight: 900, lineHeight: 0.9, color: ovr >= 85 ? "#FCD34D" : "white", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                          {ovr}
                        </span>
                        <span style={{ fontSize: "12px", fontWeight: 900, color: "rgba(255, 255, 255, 0.7)", letterSpacing: "0.08em", marginTop: "4px" }}>
                          FIV
                        </span>
                        <img
                          src="/logo-five.png"
                          alt="Logo"
                          style={{ width: "18px", height: "18px", borderRadius: "50%", marginTop: "6px", opacity: 0.85 }}
                        />
                      </div>

                      {/* Avatar with Circular Border */}
                      <div
                        style={{
                          width: "100px",
                          height: "100px",
                          borderRadius: "50%",
                          border: "2px solid rgba(255, 255, 255, 0.18)",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                          overflow: "hidden",
                          background: "#111",
                        }}
                      >
                        {data.user.image ? (
                          <img
                            src={data.user.image}
                            alt={displayName}
                            referrerPolicy="no-referrer"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e293b", color: "white", fontSize: "32px", fontWeight: 900 }}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Player Name */}
                    <div style={{ textAlign: "center", margin: "10px 0 14px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px" }}>
                      <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "white" }}>
                        {displayName}
                      </h2>
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.6)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {data.stats.wins} Victoires • {data.stats.winRate}% Win Rate
                      </span>
                    </div>

                    {/* 6 FUT Attributes Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", padding: "0 6px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{data.fut.pac}</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>PAC</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{data.fut.dri}</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>DRI</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{data.fut.sho}</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>SHO</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{data.fut.def}</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>DEF</span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{data.fut.pas}</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>PAS</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "16px", fontWeight: 900, color: "white" }}>{data.fut.phy}</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>PHY</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                    {!data.isOwnProfile && (
                      <button
                        onClick={() => setTab("rate")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "10px 16px",
                          borderRadius: "14px",
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        className="hover:scale-105"
                      >
                        <Sliders size={14} />
                        <span>{data.myRating ? "Modifier ma note" : "Noter ce joueur"}</span>
                      </button>
                    )}

                    <button
                      onClick={copyStatsToClipboard}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        borderRadius: "14px",
                        background: copied ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        border: copied ? "1px solid rgba(255, 255, 255, 0.35)" : "1px solid rgba(255, 255, 255, 0.10)",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:scale-105"
                    >
                      {copied ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
                      <span>{copied ? "Copié !" : "Partager"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ═════════ TAB 2: NOTER CE JOUEUR (SLIDERS INTERACTIFS) ═════════ */}
              {tab === "rate" && !data.isOwnProfile && (
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                  {ratingError && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        color: "#F87171",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      {ratingError}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "14px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.07)" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "white", textTransform: "uppercase" }}>
                        Attribution des notes à {displayName}
                      </h4>
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)" }}>
                        Chaque vote met à jour la moyenne de sa carte FUT
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{ fontSize: "22px", fontWeight: 900, color: "#FCD34D", lineHeight: 1 }}>
                        {previewOvr}
                      </span>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "rgba(255, 255, 255, 0.5)", textTransform: "uppercase" }}>
                        Note Globale
                      </span>
                    </div>
                  </div>

                  {/* 6 Attribute Sliders */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {[
                      { label: "PAC (Vitesse & Rythme)", val: ratePAC, set: setRatePAC, color: "#38BDF8" },
                      { label: "DRI (Technique & Dribble)", val: rateDRI, set: setRateDRI, color: "#E2E8F0" },
                      { label: "SHO (Frappe & Finition)", val: rateSHO, set: setRateSHO, color: "#EF4444" },
                      { label: "DEF (Défense & Solidité)", val: rateDEF, set: setRateDEF, color: "#A855F7" },
                      { label: "PAS (Passe & Vision)", val: ratePAS, set: setRatePAS, color: "#FBBF24" },
                      { label: "PHY (Cardio & Physique)", val: ratePHY, set: setRatePHY, color: "#FB923C" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        style={{
                          padding: "12px 14px",
                          borderRadius: "14px",
                          background: "rgba(0, 0, 0, 0.35)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "11px", fontWeight: 800, color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase" }}>
                            {s.label}
                          </span>
                          <span style={{ fontSize: "14px", fontWeight: 900, color: s.color }}>
                            {s.val}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="99"
                          value={s.val}
                          onChange={(e) => s.set(Number(e.target.value))}
                          style={{
                            width: "100%",
                            accentColor: s.color,
                            cursor: "pointer",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={submitRating}
                    disabled={submittingRating}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "16px",
                      background: ratingSuccess
                        ? "rgba(255, 255, 255, 0.15)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.05) 100%)",
                      color: "white",
                      border: "1px solid rgba(255, 255, 255, 0.20)",
                      fontSize: "13px",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.6)",
                      transition: "all 0.2s ease",
                    }}
                    className="hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {ratingSuccess ? (
                      <>
                        <Check size={18} />
                        <span>Notes Enregistrées & Moyenne Mise à Jour !</span>
                      </>
                    ) : submittingRating ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Calcul en cours...</span>
                      </>
                    ) : (
                      <>
                        <UserCheck size={18} />
                        <span>Enregistrer Ma Note pour {displayName}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ═════════ TAB 3: SYNERGIES & NÉMÉSIS ═════════ */}
              {tab === "synergy" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Synergy Duo Card */}
                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: "18px",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "2px solid rgba(255, 255, 255, 0.15)",
                          background: "#111",
                          flexShrink: 0,
                        }}
                      >
                        {data.synergy?.image ? (
                          <img src={data.synergy.image} alt={data.synergy.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1e293b", color: "white", fontWeight: 900 }}>
                            {data.synergy?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={14} color="#FCD34D" />
                          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#FCD34D" }}>
                            Meilleur Duo / Synergie
                          </span>
                        </div>
                        <h4 style={{ margin: "2px 0 0 0", fontSize: "15px", fontWeight: 900, color: "white", textTransform: "uppercase" }}>
                          {data.synergy?.name || "Aucun duo régulier"}
                        </h4>
                        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                          {data.synergy ? `${data.synergy.matches} match(s) ensemble • ${data.synergy.wins} victoires` : "Jouez plus de matchs en équipe"}
                        </span>
                      </div>
                    </div>

                    {data.synergy && (
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.06)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "white",
                          textAlign: "right",
                        }}
                      >
                        {data.synergy.winRate}% WR
                      </div>
                    )}
                  </div>

                  {/* Nemesis Card */}
                  <div
                    style={{
                      padding: "16px 18px",
                      borderRadius: "18px",
                      background: "rgba(239, 68, 68, 0.06)",
                      border: "1px solid rgba(239, 68, 68, 0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          overflow: "hidden",
                          border: "2px solid rgba(239, 68, 68, 0.4)",
                          background: "#111",
                          flexShrink: 0,
                        }}
                      >
                        {data.nemesis?.image ? (
                          <img src={data.nemesis.image} alt={data.nemesis.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#991b1b", color: "white", fontWeight: 900 }}>
                            {data.nemesis?.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Swords size={14} color="#EF4444" />
                          <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#EF4444" }}>
                            Bête Noire / Némésis
                          </span>
                        </div>
                        <h4 style={{ margin: "2px 0 0 0", fontSize: "15px", fontWeight: 900, color: "white", textTransform: "uppercase" }}>
                          {data.nemesis?.name || "Aucune bête noire"}
                        </h4>
                        <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                          {data.nemesis ? `${data.nemesis.matches} affrontements • ${data.nemesis.losses} défaites` : "Pas de rival attitré"}
                        </span>
                      </div>
                    </div>

                    {data.nemesis && (
                      <div
                        style={{
                          padding: "6px 12px",
                          borderRadius: "10px",
                          background: "rgba(239, 68, 68, 0.15)",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "#EF4444",
                          textAlign: "right",
                        }}
                      >
                        {data.nemesis.lossRate}% Défaites
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═════════ TAB 4: SUCCÈS & TROPHÉES ═════════ */}
              {tab === "badges" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {data.badges.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "16px",
                        background: b.unlocked ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.015)",
                        border: b.unlocked ? `1px solid ${b.color}40` : "1px solid rgba(255, 255, 255, 0.05)",
                        opacity: b.unlocked ? 1 : 0.55,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "12px",
                            background: b.unlocked ? `${b.color}20` : "rgba(255, 255, 255, 0.04)",
                            border: b.unlocked ? `1px solid ${b.color}60` : "1px solid rgba(255, 255, 255, 0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: b.unlocked ? b.color : "rgba(255, 255, 255, 0.3)",
                            flexShrink: 0,
                          }}
                        >
                          {getBadgeIcon(b.icon)}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "13px", fontWeight: 800, color: "white", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {b.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)" }}>
                            {b.desc}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {b.unlocked ? (
                          <div
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              background: "rgba(34, 197, 94, 0.15)",
                              border: "1px solid rgba(34, 197, 94, 0.35)",
                              color: "#4ADE80",
                              fontSize: "11px",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Débloqué</span>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              background: "rgba(255, 255, 255, 0.04)",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              color: "rgba(255, 255, 255, 0.4)",
                              fontSize: "11px",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <Lock size={12} />
                            <span>{b.progress}/{b.max}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ═════════ TAB 5: HISTORIQUE DES MATCHS ═════════ */}
              {tab === "history" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.matchHistory.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255, 255, 255, 0.4)", fontSize: "12px", fontStyle: "italic" }}>
                      Aucun match enregistré pour ce joueur.
                    </div>
                  ) : (
                    data.matchHistory.map((m) => {
                      const isWin = m.result === "WIN";
                      const isDraw = m.result === "DRAW";
                      return (
                        <div
                          key={m.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: "14px",
                            background: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                width: "24px",
                                height: "24px",
                                borderRadius: "7px",
                                fontSize: "11px",
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isWin ? "rgba(34, 197, 94, 0.2)" : isDraw ? "rgba(251, 191, 36, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                color: isWin ? "#4ADE80" : isDraw ? "#FBBF24" : "#EF4444",
                                border: isWin ? "1px solid rgba(34, 197, 94, 0.4)" : isDraw ? "1px solid rgba(251, 191, 36, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                              }}
                            >
                              {isWin ? "V" : isDraw ? "N" : "D"}
                            </span>
                            <div>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "white" }}>
                                {new Date(m.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                              </span>
                              {m.location && (
                                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.4)", marginLeft: "8px" }}>
                                  • {m.location}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ fontSize: "14px", fontWeight: 900, color: isWin ? "#4ADE80" : isDraw ? "#FBBF24" : "#EF4444" }}>
                            {m.myScore} - {m.opponentScore}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
