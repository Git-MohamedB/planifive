"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Trophy, Medal, Flame, Calendar, Sparkles, ChevronRight, Globe, Crown, Activity, Swords, Shield, Zap, History as HistoryIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import PlayerCardModal from "@/components/PlayerCardModal";
import "./leaderboard.scss";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  customName: string | null;
  isBanned?: boolean;
}

interface Match {
  id: string;
  date: string;
  scoreTeam1: number;
  scoreTeam2: number;
  team1: User[];
  team2: User[];
  team1Names?: string[];
  team2Names?: string[];
}

interface PlayerStats {
  id?: string;
  name: string;
  discordName?: string | null;
  image?: string | null;
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  streak: number;
  recentResults: Array<"W" | "L" | "D">;
  isMvp?: boolean;
}

function LeaderboardAvatar({
  src,
  name,
  size = 40,
  borderRadius = "50%",
  variant = "dark",
}: {
  src?: string | null;
  name: string;
  size?: number;
  borderRadius?: string;
  variant?: "dark" | "light";
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  // Reset error if src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isLight = variant === "light";

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius,
        overflow: "hidden",
        border: isLight ? "2px solid #CBD5E1" : "1.5px solid rgba(255, 255, 255, 0.22)",
        background: isLight
          ? "linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)"
          : "linear-gradient(135deg, #374151 0%, #1F2937 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: isLight ? "inset 0 1px 2px rgba(0,0,0,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span
          style={{
            fontSize: `${Math.max(12, Math.round(size * 0.42))}px`,
            fontWeight: 900,
            color: isLight ? "#1E293B" : "#F3F4F6",
            userSelect: "none",
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"ALL" | "MONTH" | "RECENT">("ALL");
  const [hoveredPlayer, setHoveredPlayer] = useState<PlayerStats | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number; centerY: number }>({ x: 0, y: 0, centerY: 0 });
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesRes, usersRes] = await Promise.all([
        fetch("/api/matches"),
        fetch("/api/users"),
      ]);

      if (!matchesRes.ok) throw new Error("Failed to fetch matches");
      const matches: Match[] = await matchesRes.json();

      let fetchedUsers: User[] = [];
      if (usersRes.ok) {
        fetchedUsers = await usersRes.json();
      }

      setAllMatches(matches);
      setUsers(fetchedUsers);
      calculateStats(matches, fetchedUsers, "ALL");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (matches: Match[], usersList: User[], selectedPeriod: "ALL" | "MONTH" | "RECENT") => {
    const now = new Date();
    let filteredMatches = [...matches];

    if (selectedPeriod === "MONTH") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredMatches = matches.filter((m) => new Date(m.date) >= startOfMonth);
    } else if (selectedPeriod === "RECENT") {
      filteredMatches = matches.slice(0, 8);
    }

    const playerStats: { [key: string]: PlayerStats } = {};
    const playerMatchHistory: { [key: string]: Array<"W" | "L" | "D"> } = {};

    const bannedNames = new Set(
      usersList
        .filter((u) => u.isBanned)
        .flatMap((u) => [u.name?.toLowerCase(), u.customName?.toLowerCase()])
        .filter(Boolean)
    );

    // Sort matches chronologically to calculate streaks and recent form
    const sortedMatches = [...filteredMatches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedMatches.forEach((match) => {
      const team1Won = match.scoreTeam1 > match.scoreTeam2;
      const team2Won = match.scoreTeam2 > match.scoreTeam1;
      const draw = match.scoreTeam1 === match.scoreTeam2;

      // Process Team 1
      const team1Players =
        match.team1Names && match.team1Names.length > 0
          ? match.team1Names
          : match.team1.map((u) => u.name || "Inconnu");

      team1Players.forEach((name) => {
        if (!name || !name.trim()) return;
        const cleanName = name.trim();
        const lowerName = cleanName.toLowerCase();

        let userMatch = usersList.find(
          (u) =>
            !u.isBanned &&
            ((u.customName && u.customName.toLowerCase() === lowerName) ||
              (u.name && u.name.toLowerCase() === lowerName))
        );

        if (!userMatch) {
          userMatch = usersList.find(
            (u) =>
              (u.customName && u.customName.toLowerCase() === lowerName) ||
              (u.name && u.name.toLowerCase() === lowerName)
          );
        }

        if (userMatch) {
          if (userMatch.isBanned) return;
        } else {
          if (bannedNames.has(lowerName)) return;
        }

        const playerImage = userMatch?.image || null;
        const displayName = userMatch?.customName || cleanName;
        const discordName = userMatch?.customName ? userMatch.name : null;
        const playerId = userMatch?.id;

        if (!playerStats[displayName]) {
          playerStats[displayName] = {
            id: playerId,
            name: displayName,
            discordName: discordName,
            image: playerImage,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            streak: 0,
            recentResults: [],
          };
          playerMatchHistory[displayName] = [];
        } else if (!playerStats[displayName].image && playerImage) {
          playerStats[displayName].image = playerImage;
          if (!playerStats[displayName].id && playerId) {
            playerStats[displayName].id = playerId;
          }
        }

        playerStats[displayName].matches++;
        if (team1Won) {
          playerStats[displayName].wins++;
          playerStats[displayName].streak++;
          playerMatchHistory[displayName].push("W");
        } else if (team2Won) {
          playerStats[displayName].losses++;
          playerStats[displayName].streak = 0;
          playerMatchHistory[displayName].push("L");
        } else {
          playerStats[displayName].draws++;
          playerStats[displayName].streak = 0;
          playerMatchHistory[displayName].push("D");
        }
      });

      // Process Team 2
      const team2Players =
        match.team2Names && match.team2Names.length > 0
          ? match.team2Names
          : match.team2.map((u) => u.name || "Inconnu");

      team2Players.forEach((name) => {
        if (!name || !name.trim()) return;
        const cleanName = name.trim();
        const lowerName = cleanName.toLowerCase();

        let userMatch = usersList.find(
          (u) =>
            !u.isBanned &&
            ((u.customName && u.customName.toLowerCase() === lowerName) ||
              (u.name && u.name.toLowerCase() === lowerName))
        );

        if (!userMatch) {
          userMatch = usersList.find(
            (u) =>
              (u.customName && u.customName.toLowerCase() === lowerName) ||
              (u.name && u.name.toLowerCase() === lowerName)
          );
        }

        if (userMatch) {
          if (userMatch.isBanned) return;
        } else {
          if (bannedNames.has(lowerName)) return;
        }

        const playerImage = userMatch?.image || null;
        const displayName = userMatch?.customName || cleanName;
        const discordName = userMatch?.customName ? userMatch.name : null;
        const playerId = userMatch?.id;

        if (!playerStats[displayName]) {
          playerStats[displayName] = {
            id: playerId,
            name: displayName,
            discordName: discordName,
            image: playerImage,
            matches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            streak: 0,
            recentResults: [],
          };
          playerMatchHistory[displayName] = [];
        } else if (!playerStats[displayName].image && playerImage) {
          playerStats[displayName].image = playerImage;
          if (!playerStats[displayName].id && playerId) {
            playerStats[displayName].id = playerId;
          }
        }

        playerStats[displayName].matches++;
        if (team2Won) {
          playerStats[displayName].wins++;
          playerStats[displayName].streak++;
          playerMatchHistory[displayName].push("W");
        } else if (team1Won) {
          playerStats[displayName].losses++;
          playerStats[displayName].streak = 0;
          playerMatchHistory[displayName].push("L");
        } else {
          playerStats[displayName].draws++;
          playerStats[displayName].streak = 0;
          playerMatchHistory[displayName].push("D");
        }
      });
    });

    const sortedStats = Object.values(playerStats)
      .map((stat) => {
        const history = playerMatchHistory[stat.name] || [];
        return {
          ...stat,
          winRate: stat.matches > 0 ? Math.round((stat.wins / stat.matches) * 100) : 0,
          recentResults: history.slice(-5).reverse(),
        };
      })
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      });

    if (sortedStats.length > 0) {
      sortedStats[0].isMvp = true;
    }

    setStats(sortedStats);
  };

  const handlePeriodChange = (newPeriod: "ALL" | "MONTH" | "RECENT") => {
    setPeriod(newPeriod);
    calculateStats(allMatches, users, newPeriod);
  };

  const topPlayer = stats.length > 0 ? stats[0] : null;

  return (
    <div className="min-h-screen text-white p-3 pb-24 max-w-[1600px] mx-auto relative">
      {/* NAVBAR */}
      <div className="relative z-50 w-full mb-6">
        <Navbar title="Classement & Leaderboard" icon={<Trophy size={20} color="#FFD700" />} />
      </div>

      {/* FILTER TABS - Liquid Glass Capsule */}
      <div className="flex items-center justify-center mb-8">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "rgba(10, 14, 20, 0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "20px",
            padding: "5px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
            gap: "4px",
          }}
        >
          <button
            onClick={() => handlePeriodChange("ALL")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "16px",
              background:
                period === "ALL"
                  ? "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%)"
                  : "transparent",
              border: period === "ALL" ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid transparent",
              color: period === "ALL" ? "white" : "rgba(255, 255, 255, 0.65)",
              fontWeight: 800,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            className="hover:text-white"
          >
            <Globe size={14} />
            <span>Tous les temps</span>
          </button>

          <button
            onClick={() => handlePeriodChange("MONTH")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "16px",
              background:
                period === "MONTH"
                  ? "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%)"
                  : "transparent",
              border: period === "MONTH" ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid transparent",
              color: period === "MONTH" ? "white" : "rgba(255, 255, 255, 0.65)",
              fontWeight: 800,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            className="hover:text-white"
          >
            <Calendar size={14} />
            <span>Ce Mois-ci</span>
          </button>

          <button
            onClick={() => handlePeriodChange("RECENT")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 18px",
              borderRadius: "16px",
              background:
                period === "RECENT"
                  ? "linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%)"
                  : "transparent",
              border: period === "RECENT" ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid transparent",
              color: period === "RECENT" ? "white" : "rgba(255, 255, 255, 0.65)",
              fontWeight: 800,
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            className="hover:text-white"
          >
            <HistoryIcon size={14} />
            <span>5 Derniers</span>
          </button>
        </div>
      </div>

      <div className="leaderboard-container">
        <div className="l-wrapper">
          <div className="l-grid">
            {/* MVP / TOP PLAYER CARD */}
            <div className="l-grid__item l-grid__item--sticky">
              <div
                className="c-card u-bg--light-gradient u-text--dark relative overflow-hidden"
                style={{ padding: "2rem", borderRadius: "1.5rem" }}
              >
                {/* Header: TOP PLAYER */}
                <div className="u-text--center u-mb--24">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <Medal size={36} color="#D97706" strokeWidth={2.2} />
                    <span
                      style={{
                        fontWeight: 900,
                        fontSize: "13px",
                        letterSpacing: "1.5px",
                        color: "#1E293B",
                        textTransform: "uppercase",
                        textAlign: "center",
                      }}
                    >
                      1ER DU CLASSEMENT
                    </span>
                  </div>
                </div>

                {/* Center: Avatar & Name */}
                <div className="u-text--center u-mb--24 flex flex-col items-center">
                  <div className="u-mb--16">
                    <LeaderboardAvatar
                      src={topPlayer?.image}
                      name={topPlayer?.name || "?"}
                      size={110}
                      borderRadius="22px"
                      variant="light"
                    />
                  </div>

                  <h2 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900 }}>
                    {topPlayer?.name || "Aucun joueur"}
                  </h2>
                </div>

                {/* Footer: Win Rate & Victories */}
                <div
                  className="u-display--flex u-justify--space-between u-align--center"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: "1.5rem" }}
                >
                  <div className="u-text--left">
                    <div
                      className="u-text--small"
                      style={{ fontWeight: 700, opacity: 0.6, fontSize: "0.75rem" }}
                    >
                      WIN RATE
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
                      {topPlayer?.winRate || 0}%
                    </div>
                  </div>
                  <div className="u-text--right">
                    <div
                      className="u-text--small"
                      style={{ fontWeight: 700, opacity: 0.6, fontSize: "0.75rem" }}
                    >
                      VICTOIRES
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>
                      {topPlayer?.wins || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LEADERBOARD LIST */}
            <div className="l-grid__item">
              <div className="c-card">
                <div className="c-card__header flex items-center justify-between">
                  <h3>Classement des Joueurs</h3>
                  <span className="text-xs text-white/50 font-bold">
                    {stats.length} joueur(s) répertorié(s)
                  </span>
                </div>
                <div className="c-card__body">
                  {loading ? (
                    <div className="u-text--center u-p--16">Chargement...</div>
                  ) : (
                    <ul className="c-list" id="list">
                      <li className="c-list__item" style={{ padding: "0 0 10px 0" }}>
                        <div
                          className="c-list__grid"
                          style={{
                            background: "rgba(255, 255, 255, 0.04)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            borderRadius: "14px",
                            padding: "8px 14px",
                          }}
                        >
                          <div className="u-text--left u-text--small" style={{ fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.06em" }}>Rang</div>
                          <div className="u-text--left u-text--small" style={{ fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.06em" }}>Joueur</div>
                          <div className="u-text--right u-text--small" style={{ fontWeight: 800, color: "rgba(255, 255, 255, 0.6)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.06em" }}>Win Rate</div>
                        </div>
                      </li>
                      {stats.map((player, index) => {
                        let rankClass = "c-flag";
                        let textClass = "u-text--primary";

                        if (index === 0) {
                          rankClass += " u-bg--yellow u-text--dark";
                          textClass = "u-text--yellow";
                        } else if (index === 1) {
                          rankClass += " u-bg--teal u-text--dark";
                          textClass = "u-text--teal";
                        } else if (index === 2) {
                          rankClass += " u-bg--orange u-text--dark";
                          textClass = "u-text--orange";
                        }

                        const isHovered = hoveredPlayer?.name === player.name;

                        return (
                          <li
                            className="c-list__item relative cursor-pointer"
                            key={player.name}
                            onClick={() => setSelectedPlayerForCard(player.name)}
                            title="Cliquer pour voir la Carte FUT & Profil"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setPopoverPos({
                                x: rect.right,
                                y: rect.top,
                                centerY: rect.top + rect.height / 2,
                              });
                              setHoveredPlayer(player);
                            }}
                            onMouseLeave={() => setHoveredPlayer(null)}
                          >
                            <div
                              className="c-list__grid transition-all"
                              style={{
                                borderRadius: "16px",
                                padding: "6px 12px",
                                background: isHovered ? "rgba(255, 255, 255, 0.06)" : "transparent",
                                border: isHovered ? "1px solid rgba(255, 255, 255, 0.10)" : "1px solid transparent",
                              }}
                            >
                              <div className={rankClass}>{index + 1}</div>

                              <div className="c-media">
                                <LeaderboardAvatar
                                  src={player.image}
                                  name={player.name}
                                  size={40}
                                />
                                <div className="c-media__content">
                                  <div className="c-media__title">
                                    <span className="font-bold text-white tracking-wide hover:text-white transition-colors">
                                      {player.name}
                                    </span>
                                  </div>
                                  <div className="u-text--small u-text--medium">
                                    {player.matches} Matchs ({player.wins}V - {player.draws}N -{" "}
                                    {player.losses}D)
                                  </div>
                                </div>
                              </div>

                              <div className={`u-text--right ${textClass}`}>
                                <div className="u-mt--8">
                                  <strong>{player.winRate}%</strong>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOVER PREVIEW CARD (FLOATING TO THE RIGHT OF THE HOVERED ROW) */}
      <AnimatePresence>
        {hoveredPlayer && (() => {
          const winHeight = typeof window !== "undefined" ? window.innerHeight : 800;
          const winWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
          const popoverTop = Math.min(winHeight - 270, Math.max(70, popoverPos.centerY - 50));
          const arrowTop = Math.max(16, Math.min(230, popoverPos.centerY - popoverTop));

          return (
            <motion.div
              initial={{ opacity: 0, x: -8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: `${popoverTop}px`,
                left: `${Math.min(winWidth - 320, popoverPos.x + 14)}px`,
                width: "290px",
                background: "rgba(10, 12, 16, 0.98)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                padding: "16px 18px",
                zIndex: 99999,
                pointerEvents: "none",
              }}
            >
              {/* Precision arrow pointing directly to the hovered row center */}
              <div
                style={{
                  position: "absolute",
                  left: "-6px",
                  top: `${arrowTop - 6}px`,
                  width: "12px",
                  height: "12px",
                  background: "rgba(10, 12, 16, 0.98)",
                  borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
                  transform: "rotate(45deg)",
                  zIndex: 1,
                }}
              />

              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "14px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <LeaderboardAvatar
                    src={hoveredPlayer.image}
                    name={hoveredPlayer.name}
                    size={44}
                  />

                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 900, textTransform: "uppercase", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {hoveredPlayer.name}
                    </h4>
                    {hoveredPlayer.discordName && (
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.5)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Discord: {hoveredPlayer.discordName}
                      </span>
                    )}
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "rgba(255, 255, 255, 0.55)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>
                      {hoveredPlayer.matches} match(s) disputé(s)
                    </span>
                  </div>
                </div>

                {/* Rank Pill */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    borderRadius: "8px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.10)",
                    fontSize: "11px",
                    fontWeight: 900,
                    color: "white",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={11} color="#FCD34D" />
                  <span>#{stats.findIndex((p) => p.name === hoveredPlayer.name) + 1}</span>
                </div>
              </div>

              {/* Quick Metrics 2x2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "0.06em" }}>
                    Win Rate
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 900,
                      color: "white",
                      marginTop: "2px",
                    }}
                  >
                    {hoveredPlayer.winRate}%
                  </span>
                </div>

                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: "14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <span style={{ fontSize: "9px", fontWeight: 800, textTransform: "uppercase", color: "rgba(255, 255, 255, 0.4)", letterSpacing: "0.06em" }}>
                    Bilan V / N / D
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 900, color: "white", marginTop: "4px" }}>
                    {hoveredPlayer.wins}V - {hoveredPlayer.draws}N - {hoveredPlayer.losses}D
                  </span>
                </div>
              </div>

              {/* Current Streak & Form */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 800, color: "#FBBF24" }}>
                  <Flame size={14} />
                  <span>
                    {hoveredPlayer.streak > 0
                      ? `${hoveredPlayer.streak} V d'affilée`
                      : "Série neutre"}
                  </span>
                </div>

                {/* Form pills */}
                {hoveredPlayer.recentResults && hoveredPlayer.recentResults.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {hoveredPlayer.recentResults.map((res, i) => (
                      <span
                        key={i}
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "5px",
                          fontSize: "9px",
                          fontWeight: 900,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background:
                            res === "W"
                              ? "rgba(34, 197, 94, 0.22)"
                              : res === "D"
                                ? "rgba(245, 158, 11, 0.22)"
                                : "rgba(239, 68, 68, 0.22)",
                          color:
                            res === "W"
                              ? "#4ADE80"
                              : res === "D"
                                ? "#FBBF24"
                                : "#F87171",
                          border: `1px solid ${res === "W"
                              ? "rgba(34, 197, 94, 0.45)"
                              : res === "D"
                                ? "rgba(245, 158, 11, 0.45)"
                                : "rgba(239, 68, 68, 0.45)"
                            }`,
                        }}
                      >
                        {res}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Player Profile & FUT Card Modal */}
      <PlayerCardModal
        isOpen={!!selectedPlayerForCard}
        onClose={() => setSelectedPlayerForCard(null)}
        userName={selectedPlayerForCard}
      />
    </div>
  );
}
