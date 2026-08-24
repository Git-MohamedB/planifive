"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Shuffle, X, Swords, Plus, Loader2, Calendar, Search, ArrowRightLeft, Check, Copy, Save, AlertCircle, LayoutGrid, Trophy, ArrowUpDown } from "lucide-react";

interface Player {
  id?: string;
  name: string;
  image?: string | null;
  technique?: number;
  cardio?: number;
  overall?: number;
}

interface SlotOption {
  label: string;
  key: string;
  day: string;
  hour: number;
  count: number;
  users: any[];
}

interface TeamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayers?: Player[];
  slotInfo?: { day: string; hour: number };
  availableSlots?: SlotOption[];
  allCommunityUsers?: Array<{ id: string; name: string | null; customName?: string | null; image?: string | null; isBanned?: boolean }>;
}

const SECRET_RATINGS: Record<string, { tech: number; cardio: number }> = {
  mohamed: { tech: 3.5, cardio: 3.0 },
  axel: { tech: 4.0, cardio: 4.5 },
  mamarou: { tech: 4.25, cardio: 4.5 },
  mehmet: { tech: 3.5, cardio: 4.5 },
  emre: { tech: 3.5, cardio: 4.5 },
  souley: { tech: 3.5, cardio: 3.0 },
  soufiane: { tech: 3.25, cardio: 4.0 },
  david: { tech: 2.25, cardio: 4.0 },
  mikail: { tech: 2.0, cardio: 4.0 },
  djerry: { tech: 1.75, cardio: 3.5 },
  valentin: { tech: 1.5, cardio: 3.5 },
  bilal: { tech: 4.0, cardio: 4.0 },
  rayan: { tech: 3.75, cardio: 4.5 },
  idriss: { tech: 3.5, cardio: 4.0 },
  thomas: { tech: 3.0, cardio: 4.0 },
  yassine: { tech: 3.25, cardio: 3.5 },
  lucas: { tech: 2.5, cardio: 4.0 },
  karim: { tech: 2.75, cardio: 3.5 },
  sami: { tech: 2.0, cardio: 3.5 },
  yanis: { tech: 2.25, cardio: 4.0 },
};

function balancePlayersSecretly(players: Player[]): { team1: Player[]; team2: Player[] } {
  const playersWithScores = players.map((p) => {
    const key = (p.name || "").toLowerCase().trim();
    const ref = SECRET_RATINGS[key] || { tech: 3.0, cardio: 3.5 };
    const tech = p.technique ?? ref.tech;
    const cardio = p.cardio ?? ref.cardio;
    const overall = (tech * 0.6 + cardio * 0.4) * 2;
    return { ...p, overall };
  });

  const shuffled = [...playersWithScores].sort(() => Math.random() - 0.5);
  shuffled.sort((a, b) => (b.overall || 5) - (a.overall || 5));

  const t1: Player[] = [];
  const t2: Player[] = [];
  let s1 = 0;
  let s2 = 0;
  const target = Math.ceil(shuffled.length / 2);

  shuffled.forEach((pl) => {
    const ov = pl.overall || 5;
    if (t1.length < target && (s1 <= s2 || t2.length >= target)) {
      t1.push({ name: pl.name, id: pl.id, image: pl.image });
      s1 += ov;
    } else {
      t2.push({ name: pl.name, id: pl.id, image: pl.image });
      s2 += ov;
    }
  });

  return { team1: t1, team2: t2 };
}

// Tactical Pitch Player with Drag & Drop or Click-to-Swap
function TacticalPitchPlayer({
  player,
  index,
  teamNumber,
  isSelectedForSwap,
  onSelectForSwap,
  onDropOnPlayer,
  onQuickTransfer,
}: {
  player: Player;
  index: number;
  teamNumber: 1 | 2;
  isSelectedForSwap: boolean;
  onSelectForSwap: () => void;
  onDropOnPlayer: (sourceTeam: 1 | 2, sourceIdx: number) => void;
  onQuickTransfer: () => void;
}) {
  const isTeam1 = teamNumber === 1;
  const borderColor = isSelectedForSwap ? "#38BDF8" : isTeam1 ? "#22C55E" : "#94A3B8";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", JSON.stringify({ fromTeam: teamNumber, index }));
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const dataStr = e.dataTransfer.getData("text/plain");
          if (!dataStr) return;
          const { fromTeam, index: fromIdx } = JSON.parse(dataStr);
          onDropOnPlayer(fromTeam, fromIdx);
        } catch {}
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectForSwap();
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        zIndex: 5,
        cursor: "pointer",
        userSelect: "none",
      }}
      className="group"
      title="Clique ou glisse pour échanger avec un autre joueur"
    >
      <div style={{ position: "relative" }}>
        {/* Avatar Circle */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "#0F172A",
            border: `2.5px solid ${borderColor}`,
            overflow: "hidden",
            boxShadow: isSelectedForSwap
              ? "0 0 16px rgba(56, 189, 248, 0.8), 0 6px 16px rgba(0,0,0,0.6)"
              : "0 6px 16px rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            transform: isSelectedForSwap ? "scale(1.08)" : "scale(1)",
          }}
          className="group-hover:scale-105"
        >
          {player.image ? (
            <img
              src={player.image}
              alt={player.name}
              referrerPolicy="no-referrer"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "16px", fontWeight: 800, color: "white" }}>
              {player.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Number Badge */}
        <span
          style={{
            position: "absolute",
            bottom: "-3px",
            right: "-3px",
            width: "17px",
            height: "17px",
            borderRadius: "50%",
            background: isTeam1 ? "#22C55E" : "#CBD5E1",
            color: isTeam1 ? "#022C22" : "#0F172A",
            fontSize: "9px",
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
          }}
        >
          {index + 1}
        </span>

        {/* Hover Quick Swap Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickTransfer();
          }}
          title={`Transférer vers Équipe ${isTeam1 ? 2 : 1}`}
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#38BDF8",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 10,
          }}
          className="group-hover:!flex hover:scale-110 transition-all"
        >
          <ArrowRightLeft size={11} />
        </button>
      </div>

      {/* Name Tag */}
      <div
        style={{
          marginTop: "4px",
          padding: "2px 8px",
          borderRadius: "8px",
          background: isSelectedForSwap ? "rgba(56, 189, 248, 0.3)" : "rgba(10, 15, 20, 0.88)",
          border: isSelectedForSwap ? "1px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(8px)",
          color: "white",
          fontSize: "11px",
          fontWeight: 700,
          whiteSpace: "nowrap",
          maxWidth: "85px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textAlign: "center",
        }}
      >
        {player.name}
      </div>
    </div>
  );
}

export default function TeamGeneratorModal({
  isOpen,
  onClose,
  initialPlayers = [],
  slotInfo,
  availableSlots = [],
  allCommunityUsers = [],
}: TeamGeneratorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [dbUsers, setDbUsers] = useState<Array<{ id: string; name: string; customName?: string | null; image?: string | null; isBanned?: boolean }>>([]);

  // Default view is 'list' as requested
  const [viewMode, setViewMode] = useState<"list" | "pitch">("list");
  const [selectedSlotKey, setSelectedSlotKey] = useState<string>("");
  const [team1, setTeam1] = useState<Player[]>([]);
  const [team2, setTeam2] = useState<Player[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Click-to-swap state
  const [selectedSwapPlayer, setSelectedSwapPlayer] = useState<{ teamNumber: 1 | 2; index: number } | null>(null);

  const prevIsOpenRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const valid = data.filter((u) => !u.isBanned && u.customName && u.customName.trim().length > 0);
          setDbUsers(valid);
        }
      })
      .catch((err) => console.error("Error fetching community users:", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userImageMap = useMemo(() => {
    const map = new Map<string, string | null>();
    dbUsers.forEach((u) => {
      if (u.customName) map.set(u.customName.toLowerCase().trim(), u.image || null);
    });
    allCommunityUsers.forEach((u) => {
      if (u.customName) map.set(u.customName.toLowerCase().trim(), u.image || null);
    });
    return map;
  }, [dbUsers, allCommunityUsers]);

  const allKnownFirstNames = useMemo(() => {
    const namesSet = new Set<string>();
    dbUsers.forEach((u) => {
      if (!u.isBanned && u.customName && u.customName.trim().length > 0) {
        namesSet.add(u.customName.trim());
      }
    });
    allCommunityUsers.forEach((u) => {
      if (!(u as any).isBanned && u.customName && u.customName.trim().length > 0) {
        namesSet.add(u.customName.trim());
      }
    });
    return Array.from(namesSet);
  }, [dbUsers, allCommunityUsers]);

  const allCurrentPlayers = useMemo(() => [...team1, ...team2], [team1, team2]);

  const filteredSuggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const currentLower = new Set(allCurrentPlayers.map((p) => p.name.toLowerCase()));
    const availableNames = allKnownFirstNames.filter((name) => !currentLower.has(name.toLowerCase()));

    if (!query) return availableNames.slice(0, 8);
    return availableNames.filter((name) => name.toLowerCase().includes(query)).slice(0, 8);
  }, [searchQuery, allKnownFirstNames, allCurrentPlayers]);

  const rebalanceRoster = useCallback(
    (players: Player[]) => {
      if (players.length < 2) return;
      setIsGenerating(true);
      setSelectedSwapPlayer(null);
      const withImages = players.map((p) => ({
        ...p,
        image: p.image || userImageMap.get((p.name || "").toLowerCase().trim()) || null,
      }));
      const result = balancePlayersSecretly(withImages);
      setTeam1(result.team1);
      setTeam2(result.team2);
      setTimeout(() => setIsGenerating(false), 50);
    },
    [userImageMap]
  );

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    if (justOpened) {
      setViewMode("list"); // Default view is list
      setSelectedSwapPlayer(null);
      setSavedSuccessMessage(null);
      setCopiedSuccess(false);
      setSearchQuery("");
      setShowSuggestions(false);

      if (initialPlayers && initialPlayers.length >= 2) {
        const cleanList = initialPlayers
          .filter((p) => (p as any).isBanned !== true && ((p as any).customName || p.name))
          .map((p) => {
            const displayName = ((p as any).customName || p.name).trim();
            return {
              name: displayName,
              id: p.id,
              image: p.image || userImageMap.get(displayName.toLowerCase()) || null,
            };
          });
        if (cleanList.length >= 2) {
          rebalanceRoster(cleanList);
        }
      } else if (availableSlots && availableSlots.length > 0) {
        const initialSlot = availableSlots[0];
        setSelectedSlotKey(initialSlot.key);
        const playersFromSlot = initialSlot.users
          .filter((u) => !u.isBanned && (u.customName || u.name))
          .map((u) => {
            const displayName = (u.customName || u.name).trim();
            return {
              name: displayName,
              id: u.id,
              image: u.image || userImageMap.get(displayName.toLowerCase()) || null,
            };
          });
        if (playersFromSlot.length >= 2) {
          rebalanceRoster(playersFromSlot);
        }
      }
    }
  }, [isOpen, initialPlayers, availableSlots, rebalanceRoster, userImageMap]);

  const handleSelectSlot = (slotKey: string) => {
    setSelectedSlotKey(slotKey);
    setSelectedSwapPlayer(null);
    setSavedSuccessMessage(null);
    const found = availableSlots.find((s) => s.key === slotKey);
    if (found && found.users) {
      const list = found.users
        .filter((u) => !u.isBanned && (u.customName || u.name))
        .map((u) => {
          const displayName = (u.customName || u.name).trim();
          return {
            name: displayName,
            id: u.id,
            image: u.image || userImageMap.get(displayName.toLowerCase()) || null,
          };
        });
      if (list.length >= 2) {
        rebalanceRoster(list);
      }
    }
  };

  const handleAddPlayerName = (nameToAdd: string) => {
    let clean = nameToAdd.trim();
    if (!clean) return;

    if (allCurrentPlayers.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
      setSearchQuery("");
      setShowSuggestions(false);
      return;
    }

    const image = userImageMap.get(clean.toLowerCase()) || null;
    const newPlayer = { name: clean, image };
    setSearchQuery("");
    setShowSuggestions(false);
    setSelectedSwapPlayer(null);
    setSavedSuccessMessage(null);

    if (team1.length <= team2.length) {
      setTeam1([...team1, newPlayer]);
    } else {
      setTeam2([...team2, newPlayer]);
    }
  };

  const handleRemoveFromTeam = (teamIndex: 1 | 2, playerIdx: number) => {
    setSelectedSwapPlayer(null);
    setSavedSuccessMessage(null);
    if (teamIndex === 1) {
      setTeam1(team1.filter((_, i) => i !== playerIdx));
    } else {
      setTeam2(team2.filter((_, i) => i !== playerIdx));
    }
  };

  const handleSwapTeam = (fromTeam: 1 | 2, playerIdx: number) => {
    setSelectedSwapPlayer(null);
    setSavedSuccessMessage(null);
    if (fromTeam === 1) {
      const playerToMove = team1[playerIdx];
      setTeam1(team1.filter((_, i) => i !== playerIdx));
      setTeam2([...team2, playerToMove]);
    } else {
      const playerToMove = team2[playerIdx];
      setTeam2(team2.filter((_, i) => i !== playerIdx));
      setTeam1([...team1, playerToMove]);
    }
  };

  // Swapping Player A and Player B directly (interversion de places)
  const handleSwapDirect = (teamA: 1 | 2, indexA: number, teamB: 1 | 2, indexB: number) => {
    setSelectedSwapPlayer(null);
    setSavedSuccessMessage(null);

    if (teamA === teamB) {
      if (indexA === indexB) return;
      if (teamA === 1) {
        const next = [...team1];
        const temp = next[indexA];
        next[indexA] = next[indexB];
        next[indexB] = temp;
        setTeam1(next);
      } else {
        const next = [...team2];
        const temp = next[indexA];
        next[indexA] = next[indexB];
        next[indexB] = temp;
        setTeam2(next);
      }
    } else {
      const pA = teamA === 1 ? team1[indexA] : team2[indexA];
      const pB = teamB === 1 ? team1[indexB] : team2[indexB];
      if (teamA === 1) {
        const nextT1 = [...team1];
        const nextT2 = [...team2];
        nextT1[indexA] = pB;
        nextT2[indexB] = pA;
        setTeam1(nextT1);
        setTeam2(nextT2);
      } else {
        const nextT2 = [...team2];
        const nextT1 = [...team1];
        nextT2[indexA] = pB;
        nextT1[indexB] = pA;
        setTeam2(nextT2);
        setTeam1(nextT1);
      }
    }
  };

  const handlePlayerClickSwap = (teamNumber: 1 | 2, index: number) => {
    if (!selectedSwapPlayer) {
      setSelectedSwapPlayer({ teamNumber, index });
    } else {
      handleSwapDirect(selectedSwapPlayer.teamNumber, selectedSwapPlayer.index, teamNumber, index);
    }
  };

  const handlePitchDrop = (targetTeam: 1 | 2, e: React.DragEvent) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const { fromTeam, index } = JSON.parse(dataStr);
      if (fromTeam !== targetTeam) {
        handleSwapTeam(fromTeam, index);
      }
    } catch {}
  };

  const handleSaveTeams = async () => {
    const isBalancedCount = team1.length === team2.length && team1.length >= 2;
    if (!isBalancedCount || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/team-generator/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotLabel: currentSlotLabel,
          team1,
          team2,
        }),
      });

      if (res.ok) {
        setSavedSuccessMessage("Équipes validées et publiées sur Discord avec succès !");
      } else {
        setSavedSuccessMessage("Équipes enregistrées !");
      }
    } catch (err) {
      console.error("Error saving teams:", err);
      setSavedSuccessMessage("Équipes enregistrées !");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSavedSuccessMessage(null);
      }, 5000);
    }
  };

  const handleCopyRoster = () => {
    const t1List = team1.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const t2List = team2.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const text = `⚽ COMPOSITION DU MATCH\n📅 ${currentSlotLabel || "Match de la semaine"}\n\n🟢 ÉQUIPE 1 (${team1.length}) :\n${t1List}\n\n⚪ ÉQUIPE 2 (${team2.length}) :\n${t2List}`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  const isEvenTeams = team1.length === team2.length && team1.length >= 2;
  const currentSlot = availableSlots.find((s) => s.key === selectedSlotKey) || availableSlots[0];
  const currentSlotLabel = currentSlot?.label || (slotInfo ? `${slotInfo.day} à ${slotInfo.hour}h` : null);

  // Grouping players in 1-2-2 Tactical Formations
  const t1GK = team1.slice(0, 1);
  const t1Defs = team1.slice(1, 3);
  const t1Atts = team1.slice(3);

  const t2GK = team2.slice(0, 1);
  const t2Defs = team2.slice(1, 3);
  const t2Atts = team2.slice(3);

  if (!mounted || typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSwapPlayer(null);
            }}
            style={{
              width: "100%",
              maxWidth: "860px",
              background: "rgba(8, 10, 12, 0.98)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderRadius: "24px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "24px 28px",
              position: "relative",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.85)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#38BDF8",
                  }}
                >
                  <Swords size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Générateur d&apos;Équipes
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.45)" }}>
                    {currentSlotLabel ? `Créneau : ${currentSlotLabel}` : `${allCurrentPlayers.length} joueurs inscrits`}
                  </p>
                </div>
              </div>

              {/* View Switcher (Default: List) & Close */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.04)", padding: "3px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                  <button
                    onClick={() => setViewMode("list")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "7px",
                      background: viewMode === "list" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                      border: viewMode === "list" ? "1px solid rgba(255, 255, 255, 0.15)" : "none",
                      color: viewMode === "list" ? "white" : "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <LayoutGrid size={12} />
                    <span>Liste</span>
                  </button>
                  <button
                    onClick={() => setViewMode("pitch")}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "7px",
                      background: viewMode === "pitch" ? "rgba(34, 197, 94, 0.18)" : "transparent",
                      border: viewMode === "pitch" ? "1px solid rgba(34, 197, 94, 0.35)" : "none",
                      color: viewMode === "pitch" ? "#4ADE80" : "rgba(255, 255, 255, 0.5)",
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Trophy size={12} />
                    <span>Terrain</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255, 255, 255, 0.6)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.10)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Slot Switcher Section */}
            {availableSlots.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(255, 255, 255, 0.45)" }}>
                    Créneau ({availableSlots.length} créneaux) :
                  </span>
                  <button
                    onClick={() => rebalanceRoster(allCurrentPlayers)}
                    disabled={isGenerating || allCurrentPlayers.length < 2}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                      color: "#022C22",
                      fontWeight: 900,
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      cursor: "pointer",
                    }}
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={13} /> : <Shuffle size={13} />}
                    <span>Re-mélanger</span>
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {availableSlots.map((s) => {
                    const isSelected = s.key === selectedSlotKey;
                    return (
                      <button
                        key={s.key}
                        onClick={() => handleSelectSlot(s.key)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "12px",
                          background: isSelected ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.03)",
                          border: isSelected ? "1.5px solid #22C55E" : "1px solid rgba(255, 255, 255, 0.07)",
                          color: isSelected ? "#4ADE80" : "rgba(255, 255, 255, 0.7)",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: isSelected ? 800 : 600,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Calendar size={13} color={isSelected ? "#4ADE80" : "rgba(255, 255, 255, 0.4)"} />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parity Status Alert */}
            {!isEvenTeams && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.20)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                  color: "#FBBF24",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>
                  Équipes déséquilibrées ({team1.length} vs {team2.length}) : ajoutez ou déplacez un joueur pour équilibrer.
                </span>
              </div>
            )}

            {/* ═════════ DEFAULT VIEW: LIST ═════════ */}
            {viewMode === "list" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px", marginBottom: "18px" }}>
                {/* TEAM 1 */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(34, 197, 94, 0.18)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E" }} />
                      <span style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4ADE80" }}>
                        Équipe 1
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.5)" }}>
                      {team1.length} joueurs
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {team1.map((player, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 12px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.04)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "6px", background: "rgba(34, 197, 94, 0.12)", color: "#4ADE80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{player.name}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleSwapTeam(1, idx)}
                            title="Transférer vers Équipe 2"
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "none",
                              borderRadius: "6px",
                              padding: "4px 6px",
                              color: "rgba(255, 255, 255, 0.6)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoveFromTeam(1, idx)}
                            title="Retirer ce joueur"
                            style={{
                              background: "none",
                              border: "none",
                              color: "rgba(255, 255, 255, 0.35)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              padding: "4px",
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TEAM 2 */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.10)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", paddingBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94A3B8" }} />
                      <span style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "#E2E8F0" }}>
                        Équipe 2
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255, 255, 255, 0.5)" }}>
                      {team2.length} joueurs
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    {team2.map((player, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "7px 12px",
                          borderRadius: "10px",
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.04)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ width: "20px", height: "20px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.08)", color: "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>{player.name}</span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => handleSwapTeam(2, idx)}
                            title="Transférer vers Équipe 1"
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "none",
                              borderRadius: "6px",
                              padding: "4px 6px",
                              color: "rgba(255, 255, 255, 0.6)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                          <button
                            onClick={() => handleRemoveFromTeam(2, idx)}
                            title="Retirer ce joueur"
                            style={{
                              background: "none",
                              border: "none",
                              color: "rgba(255, 255, 255, 0.35)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              padding: "4px",
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═════════ 2D TACTICAL PITCH VIEW (1-2-2 / Dynamic Position Swapping) ═════════ */}
            {viewMode === "pitch" && (
              <div
                style={{
                  background: "linear-gradient(180deg, #070e0a 0%, #040705 100%)",
                  border: "1.5px solid rgba(34, 197, 94, 0.20)",
                  borderRadius: "18px",
                  padding: "16px 14px",
                  marginBottom: "18px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.85)",
                }}
              >
                {/* Field Markings */}
                <div style={{ position: "absolute", top: 0, bottom: 0, left: "20px", right: "20px", borderLeft: "1.5px solid rgba(255,255,255,0.06)", borderRight: "1.5px solid rgba(255,255,255,0.06)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "50%", left: "20px", right: "20px", height: "1.5px", background: "rgba(255,255,255,0.08)", transform: "translateY(-50%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "50%", left: "50%", width: "80px", height: "80px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.08)", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />

                {/* Team 1 Side (Top Half: Formation 1-2-2) */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handlePitchDrop(1, e)}
                  style={{ marginBottom: "20px", padding: "8px", borderRadius: "14px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22C55E" }} />
                      <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#4ADE80" }}>
                        Équipe 1 ({team1.length} joueurs)
                      </span>
                    </div>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Tactique 1 - 2 - 2</span>
                  </div>

                  {/* 1-2-2 Lines on Pitch */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                    {/* Line 1: GK */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {t1GK.map((p, idx) => (
                        <TacticalPitchPlayer
                          key={idx}
                          player={p}
                          index={0}
                          teamNumber={1}
                          isSelectedForSwap={selectedSwapPlayer?.teamNumber === 1 && selectedSwapPlayer?.index === 0}
                          onSelectForSwap={() => handlePlayerClickSwap(1, 0)}
                          onDropOnPlayer={(srcTeam, srcIdx) => handleSwapDirect(srcTeam, srcIdx, 1, 0)}
                          onQuickTransfer={() => handleSwapTeam(1, 0)}
                        />
                      ))}
                    </div>

                    {/* Line 2: 2 Defs */}
                    <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: "380px" }}>
                      {t1Defs.map((p, idx) => (
                        <TacticalPitchPlayer
                          key={idx + 1}
                          player={p}
                          index={idx + 1}
                          teamNumber={1}
                          isSelectedForSwap={selectedSwapPlayer?.teamNumber === 1 && selectedSwapPlayer?.index === idx + 1}
                          onSelectForSwap={() => handlePlayerClickSwap(1, idx + 1)}
                          onDropOnPlayer={(srcTeam, srcIdx) => handleSwapDirect(srcTeam, srcIdx, 1, idx + 1)}
                          onQuickTransfer={() => handleSwapTeam(1, idx + 1)}
                        />
                      ))}
                    </div>

                    {/* Line 3: 2 Atts */}
                    <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: "380px" }}>
                      {t1Atts.map((p, idx) => (
                        <TacticalPitchPlayer
                          key={idx + 3}
                          player={p}
                          index={idx + 3}
                          teamNumber={1}
                          isSelectedForSwap={selectedSwapPlayer?.teamNumber === 1 && selectedSwapPlayer?.index === idx + 3}
                          onSelectForSwap={() => handlePlayerClickSwap(1, idx + 3)}
                          onDropOnPlayer={(srcTeam, srcIdx) => handleSwapDirect(srcTeam, srcIdx, 1, idx + 3)}
                          onQuickTransfer={() => handleSwapTeam(1, idx + 3)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team 2 Side (Bottom Half: Formation 1-2-2) */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handlePitchDrop(2, e)}
                  style={{ marginTop: "20px", padding: "8px", borderRadius: "14px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#94A3B8" }} />
                      <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", color: "#E2E8F0" }}>
                        Équipe 2 ({team2.length} joueurs)
                      </span>
                    </div>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>Tactique 1 - 2 - 2</span>
                  </div>

                  {/* 1-2-2 Lines on Pitch */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
                    {/* Line 1: 2 Atts */}
                    <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: "380px" }}>
                      {t2Atts.map((p, idx) => (
                        <TacticalPitchPlayer
                          key={idx + 3}
                          player={p}
                          index={idx + 3}
                          teamNumber={2}
                          isSelectedForSwap={selectedSwapPlayer?.teamNumber === 2 && selectedSwapPlayer?.index === idx + 3}
                          onSelectForSwap={() => handlePlayerClickSwap(2, idx + 3)}
                          onDropOnPlayer={(srcTeam, srcIdx) => handleSwapDirect(srcTeam, srcIdx, 2, idx + 3)}
                          onQuickTransfer={() => handleSwapTeam(2, idx + 3)}
                        />
                      ))}
                    </div>

                    {/* Line 2: 2 Defs */}
                    <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: "380px" }}>
                      {t2Defs.map((p, idx) => (
                        <TacticalPitchPlayer
                          key={idx + 1}
                          player={p}
                          index={idx + 1}
                          teamNumber={2}
                          isSelectedForSwap={selectedSwapPlayer?.teamNumber === 2 && selectedSwapPlayer?.index === idx + 1}
                          onSelectForSwap={() => handlePlayerClickSwap(2, idx + 1)}
                          onDropOnPlayer={(srcTeam, srcIdx) => handleSwapDirect(srcTeam, srcIdx, 2, idx + 1)}
                          onQuickTransfer={() => handleSwapTeam(2, idx + 1)}
                        />
                      ))}
                    </div>

                    {/* Line 3: GK */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      {t2GK.map((p, idx) => (
                        <TacticalPitchPlayer
                          key={idx}
                          player={p}
                          index={0}
                          teamNumber={2}
                          isSelectedForSwap={selectedSwapPlayer?.teamNumber === 2 && selectedSwapPlayer?.index === 0}
                          onSelectForSwap={() => handlePlayerClickSwap(2, 0)}
                          onDropOnPlayer={(srcTeam, srcIdx) => handleSwapDirect(srcTeam, srcIdx, 2, 0)}
                          onQuickTransfer={() => handleSwapTeam(2, 0)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add Player & Search with Autocomplete from Database/Admin Users */}
            <div style={{ padding: "14px 16px", borderRadius: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255, 255, 255, 0.45)" }}>
                  Effectif engagé ({allCurrentPlayers.length} joueurs)
                </span>
                {allCurrentPlayers.length === 10 && (
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#4ADE80" }}>
                    Format 5 vs 5 Complet
                  </span>
                )}
              </div>

              <div ref={searchContainerRef} style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <Search size={14} color="rgba(255, 255, 255, 0.4)" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim()) {
                          handleAddPlayerName(searchQuery);
                        }
                      }}
                      placeholder="Ajouter un joueur par son prénom (ex: Souley, Axel...)"
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 34px",
                        borderRadius: "10px",
                        background: "rgba(0, 0, 0, 0.5)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: "12px",
                        color: "white",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => handleAddPlayerName(searchQuery)}
                    disabled={!searchQuery.trim()}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      background: searchQuery.trim() ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      color: searchQuery.trim() ? "#4ADE80" : "rgba(255, 255, 255, 0.4)",
                      fontSize: "11px",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: searchQuery.trim() ? "pointer" : "not-allowed",
                    }}
                  >
                    <Plus size={13} />
                    <span>Ajouter</span>
                  </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      right: 0,
                      marginBottom: "6px",
                      background: "rgba(10, 14, 20, 0.98)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      padding: "6px",
                      zIndex: 100,
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                      gap: "4px",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.7)",
                    }}
                  >
                    {filteredSuggestions.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleAddPlayerName(name)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          background: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 600,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(34, 197, 94, 0.15)";
                          e.currentTarget.style.color = "#4ADE80";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                          e.currentTarget.style.color = "white";
                        }}
                      >
                        <Plus size={11} color="#4ADE80" />
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar (Save & Copy) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={handleCopyRoster}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 14px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copiedSuccess ? <Check size={14} color="#4ADE80" /> : <Copy size={14} />}
                <span>{copiedSuccess ? "Copié dans le presse-papier !" : "Copier la composition"}</span>
              </button>

              <button
                onClick={handleSaveTeams}
                disabled={!isEvenTeams || isSaving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  background: isEvenTeams && !isSaving ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" : "rgba(255, 255, 255, 0.05)",
                  border: "none",
                  color: isEvenTeams && !isSaving ? "#022C22" : "rgba(255, 255, 255, 0.3)",
                  fontSize: "12px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  cursor: isEvenTeams && !isSaving ? "pointer" : "not-allowed",
                }}
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>{isSaving ? "Envoi Discord..." : "Valider et Enregistrer"}</span>
              </button>
            </div>

            {/* Saved Success Toast Notification */}
            {savedSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.30)",
                  color: "#4ADE80",
                  fontSize: "12px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                <Check size={15} />
                <span>{savedSuccessMessage}</span>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
