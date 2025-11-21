"use client";

import { useState, useEffect, Fragment } from "react";
import { ChevronLeft, ChevronRight, Save, Copy, Loader2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MATCH_SIZE = 1;

type UserInfo = { name: string | null; image: string | null };
type SlotData = { users: UserInfo[]; count: number };

// Nouvelle prop pour communiquer avec la Navbar
// Nouvelle prop pour communiquer avec la Navbar
export type GoldenSlot = { day: string; hour: number; date: Date };

interface PlanningGridProps {
  onUpdateStats?: (slots: GoldenSlot[]) => void;
}

export default function PlanningGrid({ onUpdateStats }: PlanningGridProps) {
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [mySlots, setMySlots] = useState<string[]>([]);
  const [slotDetails, setSlotDetails] = useState<Record<string, SlotData>>({});
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ dayIndex: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ dayIndex: number; hour: number } | null>(null);

  useEffect(() => { fetchDispos(); }, [currentMonday]);

  // Calculer les stats (Matchs Gold) à chaque changement de données
  useEffect(() => {
    if (!onUpdateStats) return;

    let goldCount = 0;
    // On parcourt les 7 jours affichés
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentMonday, i);
      const dateStr = formatDateLocal(date);

      // On cherche les débuts de séquences de 3h (ex: 20h, 21h, 22h pleines)
      for (let h = 8; h <= 21; h++) { // Max 21 car 21+2 = 23
        const h1 = (slotDetails[`${dateStr}-${h}`]?.count || 0) >= MATCH_SIZE;
        const h2 = (slotDetails[`${dateStr}-${h + 1}`]?.count || 0) >= MATCH_SIZE;
        const h3 = (slotDetails[`${dateStr}-${h + 2}`]?.count || 0) >= MATCH_SIZE;

        if (h1 && h2 && h3) {
          goldCount++;
          // On saute les heures suivantes pour ne pas compter 2 fois la même séquence si elle se chevauche
          // (Optionnel selon ta logique, ici je compte les blocs distincts qui commencent)
        }
      }
    }
    const goldenSlots: GoldenSlot[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentMonday, i);
      const dateStr = formatDateLocal(date);
      for (let h = 8; h <= 21; h++) {
        const h1 = (slotDetails[`${dateStr}-${h}`]?.count || 0) >= MATCH_SIZE;
        const h2 = (slotDetails[`${dateStr}-${h + 1}`]?.count || 0) >= MATCH_SIZE;
        const h3 = (slotDetails[`${dateStr}-${h + 2}`]?.count || 0) >= MATCH_SIZE;
        if (h1 && h2 && h3) {
          goldenSlots.push({ day: DAYS[i], hour: h, date: date });
        }
      }
    }
    onUpdateStats(goldenSlots);
  }, [slotDetails, currentMonday, onUpdateStats]);

  useEffect(() => {
    const handleGlobalMouseUp = async () => {
      if (isDragging && dragStart && dragEnd) applyDragSelection();
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd]);

  const fetchDispos = async () => {
    try {
      const res = await fetch("/api/availability");
      if (res.ok) {
        const data = await res.json();
        setMySlots(data.mySlots || []);
        setSlotDetails(data.slotDetails || {});
      }
    } catch (error) { console.error(error); }
  };

  const applyDragSelection = async () => {
    if (!dragStart || !dragEnd) return;
    const minDay = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxDay = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minHour = Math.min(dragStart.hour, dragEnd.hour);
    const maxHour = Math.max(dragStart.hour, dragEnd.hour);

    const startDateStr = formatDateLocal(addDays(currentMonday, dragStart.dayIndex));
    const startKey = `${startDateStr}-${dragStart.hour}`;
    const isRemoving = mySlots.includes(startKey);

    const slotsToUpdate: { date: string; hour: number }[] = [];
    const newSlots = [...mySlots];

    for (let d = minDay; d <= maxDay; d++) {
      for (let h = minHour; h <= maxHour; h++) {
        const date = addDays(currentMonday, d);
        const dateStr = formatDateLocal(date);
        const key = `${dateStr}-${h}`;
        const isSelected = newSlots.includes(key);

        if (isRemoving && isSelected) {
          const idx = newSlots.indexOf(key);
          if (idx > -1) newSlots.splice(idx, 1);
          slotsToUpdate.push({ date: dateStr, hour: h });
        } else if (!isRemoving && !isSelected) {
          newSlots.push(key);
          slotsToUpdate.push({ date: dateStr, hour: h });
        }
      }
    }
    setMySlots(newSlots);
    for (const slot of slotsToUpdate) {
      await fetch("/api/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slot),
      });
    }
    fetchDispos();
  };

  const toggleSlot = async (dateStr: string, hour: number) => {
    const key = `${dateStr}-${hour}`;
    const isSelected = mySlots.includes(key);
    setMySlots(prev => isSelected ? prev.filter(s => s !== key) : [...prev, key]);
    await fetch("/api/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: dateStr, hour }), });
    fetchDispos();
  };

  const handleAction = async (action: "save" | "apply") => {
    if (!confirm(action === "save" ? "Sauvegarder ce modèle ?" : "Appliquer le modèle ?")) return;
    setLoadingAction(action);
    const body: any = { action };
    if (action === "save") {
      const slotsToSave = [];
      for (let i = 0; i < 7; i++) {
        const date = addDays(currentMonday, i);
        const dateStr = formatDateLocal(date);
        const dayOfWeek = date.getDay();
        for (const hour of HOURS) {
          if (mySlots.includes(`${dateStr}-${hour}`)) slotsToSave.push({ dayOfWeek, hour });
        }
      }
      body.slots = slotsToSave;
    } else {
      body.mondayDate = formatDateLocal(currentMonday);
    }
    await fetch("/api/template", { method: "POST", body: JSON.stringify(body) });
    if (action === "apply") await fetchDispos();
    setLoadingAction(null);
  };

  const changeWeek = (dir: number) => {
    setDirection(dir);
    setCurrentMonday(prev => addDays(prev, dir * 7));
  };

  const onMouseDown = (d: number, h: number) => { setIsDragging(true); setDragStart({ dayIndex: d, hour: h }); setDragEnd({ dayIndex: d, hour: h }); };
  const onMouseEnter = (d: number, h: number) => { if (isDragging) setDragEnd({ dayIndex: d, hour: h }); };
  const isInDragZone = (dIndex: number, h: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const minD = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxD = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minH = Math.min(dragStart.hour, dragEnd.hour);
    const maxH = Math.max(dragStart.hour, dragEnd.hour);
    return dIndex >= minD && dIndex <= maxD && h >= minH && h <= maxH;
  };

  // --- HELPER GOLDEN SLOT ---
  const checkFull = (dStr: string, h: number) => {
    const key = `${dStr}-${h}`;
    return (slotDetails[key]?.count || 0) >= MATCH_SIZE;
  };
  const isGoldenSlot = (dStr: string, h: number) => {
    if (!checkFull(dStr, h)) return false;
    const prev1 = checkFull(dStr, h - 1);
    const prev2 = checkFull(dStr, h - 2);
    const next1 = checkFull(dStr, h + 1);
    const next2 = checkFull(dStr, h + 2);
    return ((prev2 && prev1) || (prev1 && next1) || (next1 && next2));
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <div className="w-full h-full bg-[#121212] rounded-[32px] border border-[#222] flex flex-col overflow-hidden shadow-2xl relative select-none">

      {/* HEADER GRILLE */}
      <div className="flex items-center justify-between px-6 py-3 bg-[#181818] border-b border-[#282828] shrink-0">
        <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-2 px-2">
            <Calendar size={14} className="text-[#1ED760]" />
            <span className="text-sm font-bold text-white uppercase tracking-wider min-w-[140px] text-center">
              {currentMonday.toLocaleDateString("fr-FR", { month: "long", day: "numeric" })}
            </span>
          </div>
          <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition"><ChevronRight size={18} /></button>
        </div>

        <div className="flex gap-3">
          <ActionButton onClick={() => handleAction("save")} loading={loadingAction === "save"} label="Sauver Modèle" icon={<Save size={14} />} />
          <ActionButton onClick={() => handleAction("apply")} loading={loadingAction === "apply"} label="Appliquer" icon={<Copy size={14} />} primary />
        </div>
      </div>

      {/* ZONE GRILLE */}
      <div className="flex-1 relative w-full h-full overflow-hidden bg-[#0F0F0F]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentMonday.toISOString()}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <div className="w-full h-full grid grid-cols-[60px_repeat(7,1fr)] grid-rows-[50px_repeat(16,minmax(0,0.9fr))] divide-x divide-y divide-[#222]">
              <div className="bg-[#141414]"></div>

              {/* En-têtes Jours */}
              {DAYS.map((day, i) => {
                const date = addDays(currentMonday, i);
                const isToday = new Date().toDateString() === date.toDateString();
                return (
                  <div key={day} className={`flex flex-col items-center justify-center ${isToday ? 'bg-[#1C1C1C]' : 'bg-[#141414]'}`}>
                    <span className={`text-[10px] font-bold tracking-widest mb-1 ${isToday ? 'text-[#1ED760]' : 'text-gray-500'}`}>{day}</span>
                    <span className={`text-lg font-bold ${isToday ? 'text-white' : 'text-gray-400'}`}>{date.getDate()}</span>
                  </div>
                );
              })}

              {/* Corps */}
              {HOURS.map((hour) => (
                <Fragment key={hour}>
                  <div className="bg-[#141414] flex items-center justify-center text-[11px] font-mono text-gray-600 font-medium select-none pointer-events-none">{hour}h</div>

                  {DAYS.map((_, i) => {
                    const date = addDays(currentMonday, i);
                    const dateStr = formatDateLocal(date);
                    const key = `${dateStr}-${hour}`;

                    const isSelectedReal = mySlots.includes(key);
                    const isDragZone = isInDragZone(i, hour);
                    const isSelected = isDragZone ? !isSelectedReal : isSelectedReal;

                    const details = slotDetails[key] || { users: [], count: 0 };
                    const count = details.count;
                    const isFull = count >= MATCH_SIZE;
                    const isGold = isGoldenSlot(dateStr, hour);

                    let bgClass = "bg-transparent hover:bg-[#1E1E1E]";
                    let extraClasses = "";

                    if (isGold) {
                      extraClasses = "golden-slot";
                      bgClass = ""; // La classe golden-slot gère le background via l'animation
                    } else if (isFull) {
                      bgClass = "bg-red-500/10 hover:bg-red-500/20";
                    } else if (isSelected) {
                      bgClass = "bg-[#1ED760] hover:bg-[#1ed760]/90";
                    } else if (count > 0) {
                      bgClass = "bg-[#222] hover:bg-[#2A2A2A]";
                    }

                    if (isDragZone) bgClass = "bg-[#1ED760]/50";

                    return (
                      <div
                        key={key}
                        onMouseDown={() => onMouseDown(i, hour)}
                        onMouseEnter={() => onMouseEnter(i, hour)}
                        className={`relative cursor-pointer transition-colors duration-75 group ${bgClass} ${extraClasses}`}
                      >
                        {count > 0 && (
                          <div className="w-full h-full flex items-center justify-center pointer-events-none">
                            <span className={`text-sm font-bold ${isSelected || isGold ? 'text-black' : (isFull ? 'text-red-500' : 'text-white')}`}>
                              {count}
                            </span>
                          </div>
                        )}

                        {/* TOOLTIP MIS A JOUR : Photos minuscules (w-3 h-3) et compactes */}
                        {count > 0 && !isDragging && (
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block pointer-events-none">
                            <div className="bg-[#1A1A1A] border border-[#333] p-3 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] min-w-[200px] flex flex-col gap-3">
                              <div className="flex justify-between items-center border-b border-[#333] pb-2">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">JOUEURS</span>
                                {isGold ? (
                                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest animate-pulse">MATCH 3H</span>
                                ) : (
                                  <span className={`text-[10px] font-black ${isFull ? 'text-red-500' : 'text-[#1ED760]'}`}>
                                    {count}/{MATCH_SIZE}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                                {details.users.map((u, idx) => (
                                  <div key={idx} className="flex items-center gap-8">
                                    {/* Logo utilisateur */}
                                    <img
                                      src={u.image || ""}
                                      className="w-0.5 h-0.5 rounded-full bg-black object-cover flex-shrink-0"
                                      alt="u"
                                      style={{ width: '50px', height: '50px' }}
                                    />
                                    <span className="text-[14px] text-gray-300 font-bold truncate ml-16">{u.name}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="w-3 h-3 bg-[#1A1A1A] border-r border-b border-[#333] rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// UTILS
function ActionButton({ onClick, loading, label, icon, primary = false }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all hover:scale-105
        ${primary
          ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]'
          : 'bg-[#222] text-white border border-[#333] hover:border-[#555]'}
        disabled:opacity-50
      `}
    >
      {loading ? <Loader2 className="animate-spin" size={14} /> : icon}
      <span>{label}</span>
    </button>
  );
}

function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}