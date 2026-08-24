"use client";

import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { ChevronLeft, ChevronRight, Save, Copy, Loader2, Calendar, Megaphone, Trash2, Users, Check, X, Flame, Sparkles, Swords, Layers, MapPin, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import ConfirmModal from "./ConfirmModal";
import ActiveCallVisual from "./ActiveCallVisual";
import ActiveCallDetailsModal from "./ActiveCallDetailsModal";
import CelebrationOverlay from "./CelebrationOverlay";
import TeamGeneratorModal from "./TeamGeneratorModal";
import { haptic } from "@/lib/haptics";
import { getLeFiveBookingInfo } from "@/lib/lefive";

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
const DAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MATCH_SIZE = 10;

type UserInfo = { id: string; name: string | null; image: string | null; customName?: string | null };
type SlotData = { users: UserInfo[]; count: number };

// Types pour la communication avec la Navbar (1h & 1h30)
export type GoldenSlot = {
  day: string;
  hour: number;
  endHour?: number;
  date: Date;
  count: number;
  duration?: '1h' | '1h30';
  type?: 'golden' | 'best';
  users?: string[];
};

export type SlotStats = {
  max1h: number;
  max2h: number;
  slots1h: GoldenSlot[];
  slots2h: GoldenSlot[];
};

interface Call {
  id: string;
  date: string; // ISO string
  hour: number;
  location: string;
  duration: number;
  creatorId: string;
  creator: { name: string | null; image: string | null };
}

interface PlanningGridProps {
  onUpdateStats?: (stats: SlotStats) => void;
  onOpenCallModal?: (date?: string, hour?: string) => void;
}

export default function PlanningGrid({ onUpdateStats, onOpenCallModal }: PlanningGridProps) {
  const { data: session, status } = useSession();
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [mySlots, setMySlots] = useState<string[]>([]);
  const [slotDetails, setSlotDetails] = useState<Record<string, SlotData>>({});
  const [calls, setCalls] = useState<Call[]>([]); // Active calls
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ dayIndex: number; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ dayIndex: number; hour: number } | null>(null);

  // États pour le modal de confirmation
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "apply" | "deleteCall" | null>(null);
  const [callToDelete, setCallToDelete] = useState<string | null>(null);

  // Active Call Details Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedActiveCall, setSelectedActiveCall] = useState<Call | null>(null);

  // Ref to track if we are currently mutating data (to pause polling)
  const isMutating = useRef(false);
  // Ref to track the timestamp of the last mutation to discard stale fetches
  const lastMutationTime = useRef(0);

  // MANUAL SAVE MODE
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const touchedWeeksRef = useRef<Set<string>>(new Set());
  const [showDispoPanel, setShowDispoPanel] = useState(false);

  // New Features: Heatmap, Celebration & Team Generator
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [heatmapDemo, setHeatmapDemo] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [teamGeneratorOpen, setTeamGeneratorOpen] = useState(false);
  const [teamGeneratorPlayers, setTeamGeneratorPlayers] = useState<any[]>([]);
  const [teamGeneratorSlotInfo, setTeamGeneratorSlotInfo] = useState<{ day: string; hour: number } | undefined>(undefined);

  // Admin Slot Management
  const [adminAssignSlot, setAdminAssignSlot] = useState<{ date: string; hour: number; dayName: string } | null>(null);
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<string>("");
  const [selectedHoursToAssign, setSelectedHoursToAssign] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [assignMode, setAssignMode] = useState<"existing" | "new">("existing");
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestTechnique, setNewGuestTechnique] = useState("3.5");
  const [newGuestCardio, setNewGuestCardio] = useState("3.5");
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [allCommunityUsers, setAllCommunityUsers] = useState<any[]>([]);

  const ADMIN_EMAILS = ["sheizeracc@gmail.com"];
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllCommunityUsers(data);
      })
      .catch((e) => console.error(e));
  }, []);

  const openAdminAssignModal = (date: string, hour: number, dayName: string) => {
    setAdminAssignSlot({ date, hour, dayName });
    setSelectedHoursToAssign([hour]);
    setSelectedUserToAssign("");
    setIsDropdownOpen(false);
    setUserSearchQuery("");
  };

  const handleAdminAddDisposMulti = async (userId: string, date: string, hours: number[]) => {
    if (!isAdmin || !userId || hours.length === 0) return;
    try {
      await Promise.all(
        hours.map((h) =>
          fetch("/api/admin/slot-availability", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, date, hour: h, action: "add" }),
          })
        )
      );
      haptic.playSelect();
      await fetchDispos();
      setAdminAssignSlot(null);
      setSelectedUserToAssign("");
      setIsDropdownOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminCreateAndAssignGuestMulti = async (date: string, hours: number[]) => {
    if (!isAdmin || !newGuestName.trim() || hours.length === 0) return;
    setIsCreatingGuest(true);
    try {
      const cleanName = newGuestName.trim();
      const techVal = parseFloat(String(newGuestTechnique).replace(",", ".")) || 3.5;
      const cardioVal = parseFloat(String(newGuestCardio).replace(",", ".")) || 3.5;

      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          customName: cleanName,
          technique: techVal,
          cardio: cardioVal,
        }),
      });

      if (!userRes.ok) {
        const errData = await userRes.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la création du joueur");
      }

      const createdUser = await userRes.json();

      const uRes = await fetch("/api/users");
      const updatedList = await uRes.json();
      if (Array.isArray(updatedList)) setAllCommunityUsers(updatedList);

      await handleAdminAddDisposMulti(createdUser.id, date, hours);
      setNewGuestName("");
      setAssignMode("existing");
    } catch (e: any) {
      console.error("Error creating and assigning guest:", e);
      alert(e?.message || "Erreur lors de la création de l'invité");
    } finally {
      setIsCreatingGuest(false);
    }
  };

  const handleAdminRemoveDispo = async (userId: string, date: string, hour: number) => {
    if (!isAdmin || !userId) return;
    try {
      const res = await fetch("/api/admin/slot-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, hour, action: "remove" }),
      });
      if (res.ok) {
        haptic.playDeselect();
        await fetchDispos();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDemoCount = (dayIdx: number, h: number) => {
    const patterns: Record<string, number> = {
      "6-18": 10, "6-19": 10, "6-17": 8, "6-20": 7, "6-15": 4, "6-11": 2,
      "5-18": 9, "5-19": 8, "5-17": 6, "5-16": 5, "5-20": 4, "5-11": 1,
      "4-19": 10, "4-20": 9, "4-18": 7, "4-21": 5, "4-12": 2,
      "3-19": 8, "3-20": 6, "3-18": 4, "3-12": 3,
      "2-18": 6, "2-19": 5, "2-14": 4, "2-20": 3, "2-12": 1,
      "1-19": 5, "1-18": 3, "1-12": 2,
      "0-19": 4, "0-18": 2, "0-12": 1,
    };
    return patterns[`${dayIdx}-${h}`] ?? 0;
  };

  // Refs needed for polling interval to access fresh state
  const mySlotsRef = useRef(mySlots);
  const unsavedChangesRef = useRef(unsavedChanges);
  const sessionRef = useRef(session);

  useEffect(() => {
    mySlotsRef.current = mySlots;
    unsavedChangesRef.current = unsavedChanges;
    sessionRef.current = session;
  }, [mySlots, unsavedChanges, session]);

  useEffect(() => {
    fetchDispos();
    fetchCalls();

    // Polling every 10 seconds to keep data fresh without overwriting user actions immediately
    const interval = setInterval(() => {
      fetchDispos();
      fetchCalls();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentMonday]);

  // Calculer les stats (Créneaux 1h et Créneaux 1h30 / 2h) à chaque changement de données
  useEffect(() => {
    if (!onUpdateStats) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only

    // 1. Extraire toutes les dates uniques des données disponibles (slotDetails)
    const uniqueDates = new Set<string>();

    Object.keys(slotDetails).forEach(key => {
      const parts = key.split('-');
      if (parts.length >= 4) {
        const dateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
        uniqueDates.add(dateStr);
      }
    });

    for (let i = 0; i < 7; i++) {
      const date = addDays(currentMonday, i);
      uniqueDates.add(formatDateLocal(date));
    }

    const sortedDates = Array.from(uniqueDates).sort();

    const raw1h: GoldenSlot[] = [];
    const raw2h: GoldenSlot[] = [];
    let max1h = 0;
    let max2h = 0;

    sortedDates.forEach(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);

      if (dateObj < today) return;

      const dayIndex = dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1;
      const dayName = DAYS[dayIndex];

      // --- CALCUL 1H (Pour chaque heure de 8h à 23h) ---
      for (let h = 8; h <= 23; h++) {
        const slot = slotDetails[`${dateStr}-${h}`];
        const users = slot?.users || [];
        const count = users.length;

        if (count > 0) {
          if (count > max1h) max1h = count;
          raw1h.push({
            day: dayName,
            hour: h,
            endHour: h + 1,
            date: dateObj,
            count,
            duration: '1h',
            type: count >= MATCH_SIZE ? 'golden' : 'best',
            users: users.map(u => u.id),
          });
        }
      }

      // --- CALCUL 1H30 (2 heures consécutives h et h+1, de 8h à 22h) ---
      for (let h = 8; h <= 22; h++) {
        const slot1 = slotDetails[`${dateStr}-${h}`];
        const slot2 = slotDetails[`${dateStr}-${h + 1}`];

        const users1 = slot1?.users || [];
        const users2 = slot2?.users || [];

        // Utilisateurs présents sur les 2 heures
        const commonUsers = users1.filter(u1 => users2.some(u2 => u2.id === u1.id));
        const count2h = commonUsers.length;

        if (count2h > 0) {
          if (count2h > max2h) max2h = count2h;
          raw2h.push({
            day: dayName,
            hour: h,
            endHour: h + 2,
            date: dateObj,
            count: count2h,
            duration: '1h30',
            type: count2h >= MATCH_SIZE ? 'golden' : 'best',
            users: commonUsers.map(u => u.id),
          });
        }
      }
    });

    const sorter = (a: GoldenSlot, b: GoldenSlot) => {
      if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
      return a.hour - b.hour;
    };

    // Filter 1h slots: Show all golden (10/10) or best potentials if no golden
    const golden1h = raw1h.filter(s => s.type === 'golden').sort(sorter);
    const bestPotential1h = (max1h > 0 && max1h < MATCH_SIZE)
      ? raw1h.filter(s => s.count === max1h).sort(sorter)
      : (golden1h.length === 0 ? raw1h.filter(s => s.count === max1h).sort(sorter) : []);

    const slots1h = golden1h.length > 0 ? golden1h : bestPotential1h;

    // Filter 2h slots: Show all golden (10/10) or best potentials if no golden
    const golden2h = raw2h.filter(s => s.type === 'golden').sort(sorter);
    const bestPotential2h = (max2h > 0 && max2h < MATCH_SIZE)
      ? raw2h.filter(s => s.count === max2h).sort(sorter)
      : (golden2h.length === 0 ? raw2h.filter(s => s.count === max2h).sort(sorter) : []);

    const slots2h = golden2h.length > 0 ? golden2h : bestPotential2h;

    onUpdateStats({
      max1h,
      max2h,
      slots1h,
      slots2h,
    });
  }, [slotDetails, currentMonday, onUpdateStats]);

  useEffect(() => {
    const handleGlobalMouseUp = async () => {
      // If dragStart equals dragEnd, it's a click, so let onClick handle it.
      // We only apply drag selection if we actually dragged across multiple slots (or at least moved).
      // However, checking strictly equality might be tricky if we want drag-to-select single slot to work?
      // Actually, standard behavior: Click = Toggle. Drag = Set range.
      // If I click, dragStart == dragEnd.
      // If I want to fix the double toggle, I should skip applyDragSelection if start == end.
      if (isDragging && dragStart && dragEnd) {
        if (dragStart.dayIndex !== dragEnd.dayIndex || dragStart.hour !== dragEnd.hour) {
          applyDragSelection();
        }
      }
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd]);

  const fetchDispos = async () => {
    if (isMutating.current) return; // Skip polling if user is interacting

    const fetchStartTime = Date.now();

    try {
      // Fetch range: Current week - 1 week to Current week + 2 weeks (buffer)
      const start = new Date(currentMonday);
      start.setDate(start.getDate() - 7);
      const end = new Date(currentMonday);
      end.setDate(end.getDate() + 21);

      const query = `?start=${start.toISOString()}&end=${end.toISOString()}`;
      const res = await fetch(`/api/availability${query}`, { cache: "no-store" });

      if (res.ok) {
        const data = await res.json();

        // STALE CHECK: If a mutation happened AFTER this fetch started, discard the result.
        if (!isMutating.current && lastMutationTime.current < fetchStartTime) {

          let nextSlotDetails = data.slotDetails || {};
          const currentSession = sessionRef.current;
          const currentUnsaved = unsavedChangesRef.current;
          const currentMySlots = mySlotsRef.current;

          // OPTIMIZATION: Merge server data with local optimistic state if unsaved
          if (currentUnsaved && currentSession?.user?.id) {
            // 1. Deep copy to avoid mutating data.slotDetails directly
            const mergedDetails = { ...nextSlotDetails };

            // 2. Remove "Me" from ALL server slots (to clear old server state about me)
            Object.keys(mergedDetails).forEach(key => {
              const details = { ...mergedDetails[key] }; // Copy level 2
              const userIndex = details.users.findIndex((u: any) => u.id === currentSession.user?.id);
              if (userIndex !== -1) {
                details.users = details.users.filter((u: any) => u.id !== currentSession.user?.id);
                details.count = Math.max(0, details.count - 1);
                mergedDetails[key] = details;
              }
            });

            // 3. Add "Me" to slots based on local mySlots
            currentMySlots.forEach(key => {
              // Ensure slot object exists
              const details = mergedDetails[key] ? { ...mergedDetails[key] } : { users: [], count: 0 };

              // Add me if not present (should not be present due to step 2)
              details.users = [
                ...details.users,
                {
                  id: currentSession.user?.id,
                  name: currentSession.user?.name || "Moi",
                  image: currentSession.user?.image || null
                }
              ];
              details.count++;

              mergedDetails[key] = details;
            });

            nextSlotDetails = mergedDetails;
          } else {
            // Only update mySlots if NO unsaved changes
            setMySlots(data.mySlots || []);
          }

          setSlotDetails(nextSlotDetails);
        }
      }
    } catch (error) { console.error(error); }
  };

  const fetchCalls = async () => {
    try {
      const res = await fetch("/api/calls");
      if (res.ok) {
        const data = await res.json();
        setCalls(data);
      }
    } catch (error) { console.error(error); }
  };

  const saveChanges = async () => {
    setIsSaving(true);
    try {
      // 1. Collect all weeks touched or currently viewed
      const weeksSet = new Set<string>(touchedWeeksRef.current);
      weeksSet.add(formatDateLocal(currentMonday));

      const weeksPayload: { start: string; end: string; slots: { date: string; hour: number }[] }[] = [];

      weeksSet.forEach(mondayStr => {
        const [y, m, d] = mondayStr.split('-').map(Number);
        const monDate = new Date(y, m - 1, d);
        const sunDate = addDays(monDate, 6);

        const slotsForWeek: { date: string; hour: number }[] = [];
        for (let i = 0; i < 7; i++) {
          const date = addDays(monDate, i);
          const dateStr = formatDateLocal(date);
          for (const hour of HOURS) {
            const key = `${dateStr}-${hour}`;
            if (mySlots.includes(key)) {
              slotsForWeek.push({ date: dateStr, hour });
            }
          }
        }

        weeksPayload.push({
          start: formatDateLocal(monDate),
          end: formatDateLocal(sunDate),
          slots: slotsForWeek
        });
      });

      // 2. Send PUT request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 mins timeout

      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeks: weeksPayload
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "Save failed");
      }

      touchedWeeksRef.current.clear();
      setUnsavedChanges(false);
      // Force refresh to confirm sync
      lastMutationTime.current = Date.now(); // Reset stale check
      await fetchDispos();

    } catch (error: any) {
      console.error("Save error:", error);
      alert(`Erreur lors de la sauvegarde: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const applyDragSelection = async () => {
    if (!dragStart || !dragEnd || !session?.user?.id) return;

    // Update mutation timestamp
    lastMutationTime.current = Date.now();
    touchedWeeksRef.current.add(formatDateLocal(currentMonday));

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

    // Optimistic Update of Slots
    setMySlots(newSlots);
    setUnsavedChanges(true);

    // Instant optimistic update of slotDetails counts
    setSlotDetails(prev => {
      const next = { ...prev };
      slotsToUpdate.forEach(({ date, hour }) => {
        const k = `${date}-${hour}`;
        const cur = next[k] ? { ...next[k], users: [...next[k].users] } : { users: [], count: 0 };
        if (isRemoving) {
          cur.users = cur.users.filter((u: any) => u.id !== session.user?.id);
          cur.count = Math.max(0, cur.count - 1);
        } else {
          if (!cur.users.some((u: any) => u.id === session.user?.id)) {
            cur.users.push({
              id: session.user.id,
              name: session.user.name || "Moi",
              image: session.user.image || null
            });
            cur.count++;
          }
        }
        next[k] = cur;
      });
      return next;
    });
  };

  const toggleSlot = async (dateStr: string, hour: number) => {
    if (status !== "authenticated") {
      alert("Connecte-toi pour voter !");
      return;
    }

    lastMutationTime.current = Date.now();
    touchedWeeksRef.current.add(formatDateLocal(currentMonday));

    const key = `${dateStr}-${hour}`;
    const isSelected = mySlots.includes(key);

    // Check if this slot is part of an active call
    const callOnSlot = calls.find(c => {
      // Normalize dates to YYYY-MM-DD string for safe comparison
      const callDateKey = formatDateLocal(new Date(c.date));
      const myDateKey = dateStr; // already YYYY-MM-DD
      const start = c.hour;
      const end = c.hour + (c.duration === 90 ? 2 : 1);
      return callDateKey === myDateKey && hour >= start && hour < end;
    });

    console.log("🟠 [GRID] toggleSlot clicked:", dateStr, hour, "Call found?", !!callOnSlot);

    if (callOnSlot) {
      console.log("🟠 [GRID] Call Creator:", callOnSlot.creatorId, "My ID:", session?.user?.id);
      console.log("🟠 [GRID] Opening Details Modal for Call:", callOnSlot.id);
      setSelectedActiveCall(callOnSlot);
      setDetailsModalOpen(true);
      return;
    }

    // --- HAPTIC FEEDBACK CLICK ---
    if (isSelected) {
      haptic.playDeselect();
    } else {
      haptic.playSelect();
    }

    // --- OPTIMISTIC UPDATE ONLY ---
    setMySlots(prev => isSelected ? prev.filter(s => s !== key) : [...prev, key]);
    setUnsavedChanges(true);

    // Update slotDetails immediately for responsiveness
    setSlotDetails(prev => {
      const currentDetails = prev[key] || { users: [], count: 0 };
      let newUsers = [...currentDetails.users];
      let newCount = currentDetails.count;

      if (isSelected) {
        newUsers = newUsers.filter(u => u.id !== session.user?.id);
        newCount = Math.max(0, newCount - 1);
      } else {
        if (session.user && !newUsers.some(u => u.id === session.user?.id)) {
          newUsers.push({
            id: session.user.id,
            name: session.user.name || "Moi",
            image: session.user.image || null
          });
          newCount++;
          if (newCount === 10) {
            setCelebrationOpen(true);
          }
        }
      }
      return { ...prev, [key]: { users: newUsers, count: newCount } };
    });
  };

  const handleAction = async (action: "save" | "apply") => {
    console.log("🔵 handleAction appelé avec action:", action);
    setPendingAction(action);
    setModalOpen(true);
    console.log("🔵 Modal state set to true, modalOpen should be:", true);
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    console.log("🟢 executeAction appelé avec pendingAction:", pendingAction);

    if (pendingAction === "deleteCall" && callToDelete) {
      try {
        await fetch(`/api/calls?id=${callToDelete}`, { method: "DELETE" });
        setCalls(calls.filter(c => c.id !== callToDelete));
        // Also refresh slots to remove the blue border immediately
        fetchDispos();
      } catch (e) {
        console.error("Failed to delete call", e);
      }
      setLoadingAction(null);
      setPendingAction(null);
      setCallToDelete(null);
      setModalOpen(false);
      return;
    }

    setLoadingAction(pendingAction);
    const body: any = { action: pendingAction };
    if (pendingAction === "save") {
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
    if (pendingAction === "apply") {
      touchedWeeksRef.current.add(formatDateLocal(currentMonday));
      setUnsavedChanges(true);
      await fetchDispos();
    }
    setLoadingAction(null);
    setPendingAction(null);
    setModalOpen(false); // Close modal
  };

  const handleDeleteCall = async (callId: string) => {
    try {
      const res = await fetch(`/api/calls?id=${callId}`, { method: "DELETE" });
      if (res.ok) {
        fetchCalls();
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const changeWeek = (dir: number) => {
    setDirection(dir);
    setCurrentMonday(prev => addDays(prev, dir * 7));
  };

  const isMouseDownRef = useRef(false);
  const dragModeRef = useRef<"add" | "remove">("add");
  const dragStartRef = useRef<{ dayIndex: number; hour: number } | null>(null);
  const dragEndRef = useRef<{ dayIndex: number; hour: number } | null>(null);

  // Helper to compute all keys in the 2D bounding box formed by dragStart and dragEnd
  const getDragRectangleKeys = (
    start: { dayIndex: number; hour: number },
    end: { dayIndex: number; hour: number }
  ) => {
    const minD = Math.min(start.dayIndex, end.dayIndex);
    const maxD = Math.max(start.dayIndex, end.dayIndex);
    const minH = Math.min(start.hour, end.hour);
    const maxH = Math.max(start.hour, end.hour);
    const keys: string[] = [];

    for (let d = minD; d <= maxD; d++) {
      const date = addDays(currentMonday, d);
      const dateStr = formatDateLocal(date);
      for (let h = minH; h <= maxH; h++) {
        keys.push(`${dateStr}-${h}`);
      }
    }
    return keys;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current && dragStartRef.current && dragEndRef.current) {
        const start = dragStartRef.current;
        const end = dragEndRef.current;
        const mode = dragModeRef.current;
        const rectKeys = getDragRectangleKeys(start, end);

        if (rectKeys.length > 0) {
          setMySlots((prev) => {
            let nextSlots: string[];
            if (mode === "add") {
              const set = new Set(prev);
              rectKeys.forEach((k) => set.add(k));
              nextSlots = Array.from(set);
            } else {
              const removeSet = new Set(rectKeys);
              nextSlots = prev.filter((k) => !removeSet.has(k));
            }
            return nextSlots;
          });

          // Update slotDetails for all cells in rectangle
          setSlotDetails((prev) => {
            const next = { ...prev };
            rectKeys.forEach((key) => {
              const current = next[key] || { users: [], count: 0 };
              let newUsers = [...current.users];
              let newCount = current.count;
              const hasMe = newUsers.some((u) => u.id === session?.user?.id);

              if (mode === "add" && !hasMe && session?.user) {
                newUsers.push({
                  id: session.user.id,
                  name: session.user.name || "Moi",
                  image: session.user.image || null,
                });
                newCount++;
                if (newCount === 10) {
                  setCelebrationOpen(true);
                }
              } else if (mode === "remove" && hasMe && session?.user) {
                newUsers = newUsers.filter((u) => u.id !== session.user?.id);
                newCount = Math.max(0, newCount - 1);
              }

              next[key] = { users: newUsers, count: newCount };
            });
            return next;
          });

          setUnsavedChanges(true);
        }
      }

      isMouseDownRef.current = false;
      dragStartRef.current = null;
      dragEndRef.current = null;
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [currentMonday, session]);

  const handleCellMouseDown = (dateStr: string, hour: number, dayIndex: number) => {
    const callOnSlot = calls.find((c) => {
      const callDateKey = formatDateLocal(new Date(c.date));
      const start = c.hour;
      const end = c.hour + (c.duration === 90 ? 2 : 1);
      return callDateKey === dateStr && hour >= start && hour < end;
    });

    if (callOnSlot) {
      setSelectedActiveCall(callOnSlot);
      setDetailsModalOpen(true);
      return;
    }

    const key = `${dateStr}-${hour}`;
    const currentlySelected = mySlots.includes(key);
    const mode = currentlySelected ? "remove" : "add";

    dragModeRef.current = mode;
    isMouseDownRef.current = true;
    dragStartRef.current = { dayIndex, hour };
    dragEndRef.current = { dayIndex, hour };
    setIsDragging(true);
    setDragStart({ dayIndex, hour });
    setDragEnd({ dayIndex, hour });

    if (mode === "add") {
      haptic.playSelect();
    } else {
      haptic.playDeselect();
    }
  };

  const handleCellMouseEnter = (dateStr: string, hour: number, dayIndex: number) => {
    if (!isMouseDownRef.current) return;
    dragEndRef.current = { dayIndex, hour };
    setDragEnd({ dayIndex, hour });

    if (dragModeRef.current === "add") {
      haptic.playSelect();
    } else {
      haptic.playDeselect();
    }
  };

  const isInDragZone = (dIndex: number, h: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const minD = Math.min(dragStart.dayIndex, dragEnd.dayIndex);
    const maxD = Math.max(dragStart.dayIndex, dragEnd.dayIndex);
    const minH = Math.min(dragStart.hour, dragEnd.hour);
    const maxH = Math.max(dragStart.hour, dragEnd.hour);
    return dIndex >= minD && dIndex <= maxD && h >= minH && h <= maxH;
  };

  // --- HELPER GOLDEN / READY SLOT ---
  const checkFull = (dStr: string, h: number) => {
    const key = `${dStr}-${h}`;
    return (slotDetails[key]?.count || 0) >= MATCH_SIZE;
  };
  const isGoldenSlot = (dStr: string, h: number) => {
    if (!checkFull(dStr, h)) return false;
    // Highlight if part of a 2-hour consecutive sequence with MATCH_SIZE (1h30 Five match complete)
    const prev = checkFull(dStr, h - 1);
    const next = checkFull(dStr, h + 1);
    return prev || next;
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 25 : -25,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -25 : 25,
      opacity: 0,
    }),
  };

  // --- Compute users who have set at least 1 hour of dispo on the current week ---
  const weekDispoUsers = useMemo(() => {
    const userMap = new Map<string, UserInfo>();
    for (let i = 0; i < 7; i++) {
      const date = addDays(currentMonday, i);
      const dateStr = formatDateLocal(date);
      for (const hour of HOURS) {
        const key = `${dateStr}-${hour}`;
        const details = slotDetails[key];
        if (details?.users) {
          details.users.forEach(u => {
            if (u.id && !userMap.has(u.id)) {
              userMap.set(u.id, u);
            }
          });
        }
      }
    }
    return Array.from(userMap.values());
  }, [slotDetails, currentMonday]);

  // --- Compute total users (all who have ever set a dispo, used for counting missing) ---
  const allKnownUsers = useMemo(() => {
    const userMap = new Map<string, UserInfo>();
    Object.values(slotDetails).forEach(details => {
      details?.users?.forEach(u => {
        if (u.id && !userMap.has(u.id)) {
          userMap.set(u.id, u);
        }
      });
    });
    return Array.from(userMap.values());
  }, [slotDetails]);

  const missingUsers = useMemo(() => {
    const dispoIds = new Set(weekDispoUsers.map(u => u.id));
    return allKnownUsers.filter(u => !dispoIds.has(u.id));
  }, [allKnownUsers, weekDispoUsers]);

  const readySlotsList = useMemo(() => {
    const list: Array<{ label: string; key: string; day: string; hour: number; count: number; users: any[] }> = [];
    DAYS.forEach((day, i) => {
      const date = addDays(currentMonday, i);
      const dateStr = formatDateLocal(date);
      HOURS.forEach((hour) => {
        const key = `${dateStr}-${hour}`;
        const details = slotDetails[key];
        if (details && details.users) {
          const validUsers = details.users.filter(
            (u: any) => !u.isBanned && u.customName && u.customName.trim().length > 0
          );
          if (validUsers.length >= 2) {
            list.push({
              label: `${day} ${date.getDate()}/${date.getMonth() + 1} à ${hour}h (${validUsers.length} joueurs)`,
              key,
              day,
              hour,
              count: validUsers.length,
              users: validUsers,
            });
          }
        }
      });
    });
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [currentMonday, slotDetails]);

  console.log("🟣 Rendering PlanningGrid - modalOpen:", modalOpen, "pendingAction:", pendingAction);

  return (
    <>
      <div style={{
        width: '100%',
        height: '100%',
        background: 'rgba(8, 10, 12, 0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        userSelect: 'none',
        overflow: 'visible',
      }}>

        {/* HEADER GRILLE GLASS */}
        <div style={{
          height: '60px',
          background: 'rgba(8, 10, 12, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          position: 'relative',
          zIndex: 100,
        }}>
          {/* Left: Week Navigator Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '4px 6px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
            gap: '4px',
          }}>
            <button
              onClick={() => changeWeek(-1)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px' }}>
              <Calendar size={14} color="#22C55E" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {currentMonday.toLocaleDateString("fr-FR", { month: "long", day: "numeric" })}
              </span>
            </div>
            <button
              onClick={() => changeWeek(1)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Center: Save Changes Floating Pill */}
          {unsavedChanges && (
            <div className="absolute left-1/2 top-0 -translate-x-1/2 z-10 h-full flex items-center">
              <button
                onClick={saveChanges}
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(22,163,74,0.2) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  boxShadow: '0 0 25px rgba(34,197,94,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  padding: '8px 24px',
                  color: '#22C55E',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>SAUVEGARDER</span>
              </button>
            </div>
          )}

          {/* Right: Dispos Users Pill + Template Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Dispos Users Pill */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDispoPanel(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: showDispoPanel ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: '14px',
                  padding: '6px 12px',
                  border: showDispoPanel ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s ease',
                }}
              >
                <Users size={14} color="rgba(255, 255, 255, 0.7)" />
                <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  {weekDispoUsers.length}
                </span>
                {/* Mini avatar stack */}
                <div style={{ display: 'flex', marginLeft: '2px' }}>
                  {weekDispoUsers.slice(0, 4).map((u, idx) => (
                    <div
                      key={u.id}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid rgba(10, 14, 20, 0.95)',
                        marginLeft: idx > 0 ? '-8px' : '0',
                        background: '#1a1a2e',
                        flexShrink: 0,
                      }}
                    >
                      {u.image ? (
                        <img src={u.image} alt={u.name || ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', color: 'white', fontSize: '9px', fontWeight: 800 }}>
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                  {weekDispoUsers.length > 4 && (
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: '2px solid rgba(10, 14, 20, 0.95)',
                      marginLeft: '-8px',
                      background: 'rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 800,
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      +{weekDispoUsers.length - 4}
                    </div>
                  )}
                </div>
              </button>

              {/* Dropdown panel */}
              {showDispoPanel && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'rgba(8, 10, 12, 0.98)',
                    backdropFilter: 'blur(32px)',
                    WebkitBackdropFilter: 'blur(32px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '16px',
                    minWidth: '280px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 999999,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#4ADE80" />
                      <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255, 255, 255, 0.6)' }}>Dispos cette semaine</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#4ADE80' }}>{weekDispoUsers.length}</span>
                  </div>

                  {/* Users who HAVE dispos */}
                  {weekDispoUsers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {weekDispoUsers.map(u => (
                        <div key={u.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 10px',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}>
                          <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1.5px solid rgba(255, 255, 255, 0.15)',
                          }}>
                            {u.image ? (
                              <img src={u.image} alt={u.name || ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155', color: 'white', fontSize: '10px', fontWeight: 800 }}>
                                {(u.name || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'white', flex: 1 }}>{u.name || 'Utilisateur'}</span>
                          <Check size={14} color="#4ADE80" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', padding: '8px 0', textAlign: 'center' }}>Personne n'a rempli ses dispos</div>
                  )}

                  {/* Separator + Users who have NOT set dispos */}
                  {missingUsers.length > 0 && (
                    <>
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255, 255, 255, 0.4)' }}>Pas encore rempli</span>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(239, 68, 68, 0.8)' }}>{missingUsers.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {missingUsers.map(u => (
                            <div key={u.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '6px 10px',
                              borderRadius: '10px',
                              background: 'rgba(239, 68, 68, 0.06)',
                              border: '1px solid rgba(239, 68, 68, 0.12)',
                              opacity: 0.7,
                            }}>
                              <div style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '2px solid rgba(239, 68, 68, 0.2)',
                                filter: 'grayscale(0.6)',
                              }}>
                                {u.image ? (
                                  <img src={u.image} alt={u.name || ''} referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#666', color: 'white', fontSize: '10px', fontWeight: 800 }}>
                                    {(u.name || '?').charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', flex: 1 }}>{u.name || 'Utilisateur'}</span>
                              <X size={14} color="rgba(239, 68, 68, 0.6)" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Template Actions Capsule */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '16px',
              padding: '4px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              gap: '4px'
            }}>
              {/* Heatmap Toggle */}
              <button
                onClick={() => {
                  const next = !heatmapMode;
                  setHeatmapMode(next);
                  if (!next) setHeatmapDemo(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  background: heatmapMode ? 'rgba(34, 197, 94, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                  border: heatmapMode ? '1px solid rgba(34, 197, 94, 0.45)' : 'none',
                  color: heatmapMode ? '#4ADE80' : 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 700,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:scale-105"
                title="Activer/Désactiver le mode Heatmap d'intensité"
              >
                <Flame size={14} color={heatmapMode ? '#4ADE80' : 'rgba(255,255,255,0.7)'} />
                <span>Heatmap</span>
              </button>



              {/* Team Generator (Active only when at least 1 slot has 10 players) */}
              {readySlotsList.some((s) => s.count >= 10) && (
                <button
                  onClick={() => {
                    const bestSlot = readySlotsList.find((s) => s.count >= 10) || readySlotsList[0];
                    setTeamGeneratorPlayers(bestSlot ? bestSlot.users : weekDispoUsers);
                    setTeamGeneratorSlotInfo(bestSlot ? { day: bestSlot.day, hour: bestSlot.hour } : undefined);
                    setTeamGeneratorOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:bg-[#38BDF8]/20 transition-all hover:scale-105"
                  title="Générer les équipes pour le match à 10 joueurs"
                >
                  <Swords size={14} />
                  <span>Équipes</span>
                </button>
              )}

              {/* Sauver Modèle */}
              <button
                onClick={() => handleAction("save")}
                disabled={loadingAction === "save"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 700,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
              >
                {loadingAction === "save" ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                <span>Sauver Modèle</span>
              </button>

              {/* Appliquer Modèle */}
              <button
                onClick={() => handleAction("apply")}
                disabled={loadingAction === "apply"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 700,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
              >
                {loadingAction === "apply" ? <Loader2 className="animate-spin" size={14} /> : <Copy size={14} />}
                <span>Appliquer</span>
              </button>
            </div>
          </div>
        </div>

        {/* ZONE GRILLE GLASS */}
        <div className="flex-1 relative w-full h-full bg-[#080808] overflow-hidden rounded-b-[20px]">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={currentMonday.toISOString()}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.22 },
                opacity: { duration: 0.18 },
              }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="w-full h-full grid grid-cols-[55px_repeat(7,1fr)] grid-rows-[45px_repeat(16,minmax(0,1fr))]">
                <div className="bg-[#0B0B0B] border-b border-r border-[#181818]"></div>

                {/* En-têtes Jours */}
                {DAYS.map((day, i) => {
                  const date = addDays(currentMonday, i);
                  const isToday = new Date().toDateString() === date.toDateString();
                  return (
                    <div key={day} className={`flex flex-col items-center justify-center border-b border-r border-[#181818] transition-colors ${isToday ? 'bg-[#121212]' : 'bg-[#0B0B0B]'}`}>
                      <span className={`text-[10px] font-bold tracking-widest ${isToday ? 'text-[#22C55E]' : 'text-gray-400'}`}>{day}</span>
                      <span className={`text-base font-bold ${isToday ? 'text-white' : 'text-gray-300'}`}>{date.getDate()}</span>
                    </div>
                  );
                })}

                {/* Corps */}
                {HOURS.map((hour) => (
                  <Fragment key={hour}>
                    <div className="bg-[#0B0B0B] border-b border-r border-[#181818] flex items-center justify-center text-[11px] font-mono text-gray-500 font-semibold select-none pointer-events-none">{hour}h</div>

                    {DAYS.map((_, i) => {
                      const date = addDays(currentMonday, i);
                      const dateStr = formatDateLocal(date);
                      const key = `${dateStr}-${hour}`;

                      const isSelectedReal = mySlots.includes(key);
                      const isDragZone = isInDragZone(i, hour);
                      const isSelected = isDragZone
                        ? dragModeRef.current === "add"
                        : isSelectedReal;

                      const details = slotDetails[key] || { users: [], count: 0 };
                      const isMeInSlot = details.users.some((u: any) => u.id === session?.user?.id);
                      let count = details.count;
                      if (heatmapMode && heatmapDemo) {
                        count = getDemoCount(i, hour);
                      } else if (isDragZone) {
                        if (dragModeRef.current === "add" && !isMeInSlot) {
                          count += 1;
                        } else if (dragModeRef.current === "remove" && isMeInSlot) {
                          count = Math.max(0, count - 1);
                        }
                      }
                      const isFull = count >= MATCH_SIZE;
                      const isGold = isGoldenSlot(dateStr, hour);

                      // Check for active call
                      const activeCall = calls.find(
                        (c) =>
                          new Date(c.date).toDateString() === new Date(dateStr).toDateString() &&
                          hour >= c.hour &&
                          hour < c.hour + (c.duration === 90 ? 2 : 1)
                      );

                      // Dynamic Styles
                      let parentClasses = `relative z-0 group transition-colors duration-150 border-b border-r border-[#181818] cursor-pointer flex flex-col items-center justify-center hover:!z-[99999]`;
                      const parentStyle: React.CSSProperties = {};

                      // PRIORITY: Active Call > Heatmap > 10+ Gold Match > Selection
                      if (activeCall) {
                        parentStyle.background = 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)';
                        parentStyle.zIndex = 10;
                        parentStyle.boxShadow = 'none';
                      } else if (heatmapMode) {
                        // In Heatmap mode: display the heatmap gradient across the board (personal vote already included in count)
                        if (count >= MATCH_SIZE) {
                          // 10+ Joueurs : Match Prêt (Vert vif / émeraude intense)
                          parentStyle.background = 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)';
                          parentStyle.border = '1.5px solid #86EFAC';
                          parentStyle.boxShadow = 'none';
                          parentStyle.zIndex = 15;
                        } else if (count >= 8) {
                          // 8-9 Joueurs (Palier 5 : Très chaud / Imminent)
                          parentStyle.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.78) 0%, rgba(22, 163, 74, 0.68) 100%)';
                          parentStyle.border = '1px solid rgba(74, 222, 128, 0.65)';
                          parentStyle.boxShadow = 'none';
                        } else if (count >= 6) {
                          // 6-7 Joueurs (Palier 4 : Chaud / Majorité atteinte)
                          parentStyle.background = 'linear-gradient(135deg, rgba(34, 197, 94, 0.55) 0%, rgba(22, 163, 74, 0.45) 100%)';
                          parentStyle.border = '1px solid rgba(74, 222, 128, 0.45)';
                          parentStyle.boxShadow = 'none';
                        } else if (count >= 4) {
                          // 4-5 Joueurs (Palier 3 : Moyen)
                          parentStyle.background = 'rgba(34, 197, 94, 0.35)';
                          parentStyle.border = '1px solid rgba(34, 197, 94, 0.28)';
                          parentStyle.boxShadow = 'none';
                        } else if (count >= 2) {
                          // 2-3 Joueurs (Palier 2 : Faible)
                          parentStyle.background = 'rgba(34, 197, 94, 0.18)';
                          parentStyle.border = '1px solid rgba(34, 197, 94, 0.16)';
                          parentStyle.boxShadow = 'none';
                        } else if (count >= 1) {
                          // 1 Joueur (Palier 1 : Amorçage)
                          parentStyle.background = 'rgba(34, 197, 94, 0.09)';
                          parentStyle.border = '1px solid rgba(34, 197, 94, 0.10)';
                          parentStyle.boxShadow = 'none';
                        } else {
                          // 0 Joueur : Éteint
                          parentStyle.background = 'rgba(0, 0, 0, 0.70)';
                          parentStyle.opacity = 0.20;
                        }
                      } else if (count >= MATCH_SIZE) {
                        parentStyle.background = 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)';
                        parentStyle.zIndex = 10;
                        parentStyle.boxShadow = 'none';
                      } else if (isSelected) {
                        // Glass Green Selection (No halo)
                        parentStyle.background = 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)';
                        parentStyle.zIndex = 10;
                        parentStyle.boxShadow = 'none';
                      } else {
                        // Default state - Clean Neutral Dark
                        parentClasses += " hover:bg-white/[0.04]";
                      }

                      const isLeftSide = i <= 3; // Lundi à Jeudi: affichage à droite | Vendredi à Dimanche: affichage à gauche
                      const isTopEdge = hour <= 10;
                      const isBottomEdge = hour >= 21;

                      const tooltipContainerStyle: React.CSSProperties = {
                        position: 'absolute',
                        zIndex: 99999,
                        ...(isTopEdge
                          ? { top: '0px', transform: 'none' }
                          : isBottomEdge
                            ? { bottom: '0px', top: 'auto', transform: 'none' }
                            : { top: '50%', transform: 'translateY(-50%)' }),
                        ...(isLeftSide
                          ? { left: '100%', paddingLeft: '10px' }
                          : { right: '100%', left: 'auto', paddingRight: '10px' }),
                      };

                      return (
                        <div
                          key={key}
                          onMouseDown={(e) => {
                            if (e.button === 0) handleCellMouseDown(dateStr, hour, i);
                          }}
                          onMouseEnter={() => handleCellMouseEnter(dateStr, hour, i)}
                          style={parentStyle}
                          className={parentClasses}
                        >
                          {/* VISUAL LAYER (Active Call = Blue Glow + Blue Background, 10+ Match = Gold Glow + Gold Background) */}
                          {activeCall ? (
                            <ActiveCallVisual isSelected={isSelected} variant="call" />
                          ) : !heatmapMode && count >= MATCH_SIZE ? (
                            <ActiveCallVisual isSelected={isSelected} variant="gold" />
                          ) : null}

                          {count > 0 && (
                            <div className="w-full h-full flex items-center justify-center pointer-events-none relative z-50">
                              <span className={`font-black ${
                                heatmapMode && count >= MATCH_SIZE
                                  ? 'text-[#022C22] text-[15px] font-black tracking-tight'
                                  : 'text-white text-sm font-bold'
                              }`}>
                                {count}
                              </span>
                            </div>
                          )}

                          {/* TOOLTIP - Liquid Glass Spacious & Aesthetic Modal Card in Obsidian Theme */}
                          {!isDragging && (
                            <div
                              style={tooltipContainerStyle}
                              className="hidden group-hover:block pointer-events-auto"
                              onMouseDown={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                style={{
                                  background: '#121212',
                                  border: '1px solid #282828',
                                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
                                  borderRadius: '18px',
                                  width: '290px',
                                  maxWidth: '290px',
                                  padding: '16px',
                                  boxSizing: 'border-box',
                                  overflowX: 'hidden',
                                }}
                                className="flex flex-col gap-3 relative"
                              >
                                {/* Header */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: '1px solid #222222',
                                  paddingBottom: '10px',
                                }}>
                                  <span style={{ fontSize: '10px', fontWeight: 900, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                    JOUEURS INSCRITS
                                  </span>
                                  {isGold ? (
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      color: '#FDE047',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                      background: 'rgba(234, 179, 8, 0.15)',
                                      border: '1px solid rgba(234, 179, 8, 0.35)',
                                      padding: '2px 8px',
                                      borderRadius: '12px'
                                    }}>
                                      1H30 PRÊT
                                    </span>
                                  ) : activeCall ? (
                                    <span style={{
                                      fontSize: '10px',
                                      fontWeight: 800,
                                      color: '#38BDF8',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.06em',
                                      background: 'rgba(56, 189, 248, 0.15)',
                                      border: '1px solid rgba(56, 189, 248, 0.3)',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      <Megaphone size={10} /> APPEL EN COURS
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontSize: '11px',
                                      fontWeight: 900,
                                      color: count >= MATCH_SIZE ? '#22C55E' : '#EF4444',
                                      background: count >= MATCH_SIZE ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                      border: count >= MATCH_SIZE ? '1px solid rgba(34, 197, 94, 0.30)' : '1px solid rgba(239, 68, 68, 0.30)',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      letterSpacing: '0.04em'
                                    }}>
                                      {count} / {MATCH_SIZE}
                                    </span>
                                  )}
                                </div>

                                {/* Active call info if present */}
                                {activeCall && (
                                  <div style={{
                                    background: 'rgba(56, 189, 248, 0.10)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    borderRadius: '14px',
                                    padding: '10px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    marginBottom: '12px',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <MapPin size={13} color="#FFFFFF" />
                                        <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '12px' }}>
                                          {activeCall.location}
                                        </span>
                                      </div>
                                      {(() => {
                                        const bookingInfo = getLeFiveBookingInfo(activeCall.location);
                                        return (
                                          <a
                                            href={bookingInfo.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '3px',
                                              padding: '2px 7px',
                                              borderRadius: '6px',
                                              background: 'rgba(56, 189, 248, 0.15)',
                                              border: '1px solid rgba(56, 189, 248, 0.30)',
                                              color: '#38BDF8',
                                              fontSize: '10px',
                                              fontWeight: 700,
                                              textDecoration: 'none',
                                            }}
                                            className="hover:bg-[#38BDF8]/25"
                                            title="Réserver sur le site Le Five"
                                          >
                                            <span>Réserver</span>
                                            <ExternalLink size={9} />
                                          </a>
                                        );
                                      })()}
                                    </div>
                                    <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '11px' }}>
                                      Appel lancé par <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{activeCall.creator.name}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Player List */}
                                <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '5px',
                                  maxHeight: '190px',
                                  overflowY: 'auto',
                                  overflowX: 'hidden'
                                }} className="custom-scrollbar">
                                  {details.users.map((u, idx) => {
                                    const isSub = idx >= MATCH_SIZE;
                                    return (
                                      <div
                                        key={idx}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          gap: '8px',
                                          background: isSub ? 'rgba(234, 179, 8, 0.08)' : '#181818',
                                          border: isSub ? '1px solid rgba(234, 179, 8, 0.20)' : '1px solid #242424',
                                          borderRadius: '10px',
                                          padding: '6px 10px',
                                          transition: 'all 0.15s ease',
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                          <div style={{
                                             width: '24px',
                                             height: '24px',
                                             borderRadius: '50%',
                                             overflow: 'hidden',
                                             border: isSub ? '1.5px solid #F59E0B' : '1.5px solid #22C55E',
                                             background: '#141414',
                                             flexShrink: 0,
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'center',
                                           }}>
                                            {u.image ? (
                                              <img
                                                src={u.image}
                                                alt={u.name || "Joueur"}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                              />
                                            ) : (
                                              <span style={{ fontSize: '10px', fontWeight: 800, color: '#FFFFFF' }}>
                                                {u.name ? u.name[0].toUpperCase() : "?"}
                                              </span>
                                            )}
                                          </div>
                                          <span style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#FFFFFF',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {u.name}
                                          </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                          <span style={{
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            color: isSub ? '#F59E0B' : 'rgba(255, 255, 255, 0.35)',
                                          }}>
                                            {isSub ? `R${idx - MATCH_SIZE + 1}` : `#${idx + 1}`}
                                          </span>
                                          {isAdmin && (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleAdminRemoveDispo(u.id, dateStr, hour);
                                              }}
                                              style={{
                                                background: 'rgba(239, 68, 68, 0.15)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                color: '#EF4444',
                                                borderRadius: '6px',
                                                width: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                fontSize: '10px',
                                                fontWeight: 'bold',
                                                lineHeight: 1,
                                                padding: 0
                                              }}
                                              title="Retirer ce joueur (Admin)"
                                            >
                                              ✕
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {details.users.length === 0 && !activeCall && (
                                    <div style={{
                                      padding: '16px 0',
                                      textAlign: 'center',
                                      color: 'rgba(255, 255, 255, 0.35)',
                                      fontSize: '12px',
                                      fontStyle: 'italic'
                                    }}>
                                      Aucun joueur inscrit
                                    </div>
                                  )}

                                  {/* Admin Inscribe Player/Guest Action */}
                                  {isAdmin && (
                                     <button
                                       onMouseDown={(e) => e.stopPropagation()}
                                       onPointerDown={(e) => e.stopPropagation()}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         openAdminAssignModal(dateStr, hour, DAYS[i]);
                                       }}
                                       style={{
                                         display: 'flex',
                                         alignItems: 'center',
                                         justifyContent: 'center',
                                         gap: '6px',
                                         padding: '8px 12px',
                                         borderRadius: '10px',
                                         background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                         border: '1px solid rgba(255, 255, 255, 0.25)',
                                         color: '#FFFFFF',
                                         fontSize: '11px',
                                         fontWeight: 600,
                                         textTransform: 'uppercase',
                                         letterSpacing: '0.04em',
                                         cursor: 'pointer',
                                         marginTop: '8px',
                                         boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                                       }}
                                       className="hover:scale-[1.02] active:scale-95 transition-all"
                                     >
                                       <span>+ Inscrire un Joueur / Invité</span>
                                     </button>
                                   )}

                                  {/* Team Generator button in Tooltip - only if 10 players */}
                                  {details.users.filter((u: any) => !u.isBanned && (u.customName || u.name)).length >= 10 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setTeamGeneratorPlayers(details.users);
                                        setTeamGeneratorSlotInfo({ day: DAYS[i], hour });
                                        setTeamGeneratorOpen(true);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        padding: '8px 12px',
                                        borderRadius: '12px',
                                        background: 'rgba(56, 189, 248, 0.15)',
                                        border: '1px solid rgba(56, 189, 248, 0.35)',
                                        color: '#38BDF8',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        cursor: 'pointer',
                                        marginTop: '6px',
                                      }}
                                      className="hover:bg-[#38BDF8]/25 transition-all"
                                    >
                                      <Swords size={13} />
                                      <span>Équilibrer Équipes</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                              {/* Arrow pointing to the slot */}
                              <div
                                style={{
                                  background: '#121212',
                                  borderColor: '#282828',
                                  position: 'absolute',
                                  width: '10px',
                                  height: '10px',
                                  transform: 'rotate(45deg)',
                                  top: isTopEdge ? '20px' : isBottomEdge ? 'auto' : 'calc(50% - 5px)',
                                  bottom: isBottomEdge ? '20px' : 'auto',
                                  ...(isLeftSide ? { left: '5px' } : { right: '5px' }),
                                }}
                                className={isLeftSide ? "border-b border-l" : "border-t border-r"}
                              />
                            </div>
                          )}

                          {/* Call Action in Tooltip (or Context Menu) */}
                          {/* We use the same tooltip for simplicity, but we add a button if no call exists */}
                          {!activeCall && !isGold && count < MATCH_SIZE && (
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col gap-2 pointer-events-auto">
                              {/* Existing tooltip content is above, we might need to merge them or just add the button to the existing tooltip */}
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

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => {
          console.log("🔴 Modal fermé");
          setModalOpen(false);
          setPendingAction(null);
          setCallToDelete(null);
        }}
        onConfirm={executeAction}
        title={
          pendingAction === "deleteCall" ? "Supprimer l'appel ?" :
            pendingAction === "save" ? "Sauvegarder le Modèle" : "Appliquer le Modèle"
        }
        message={
          pendingAction === "deleteCall"
            ? "Êtes-vous sûr de vouloir supprimer votre appel ? Cela désinscrira tous les participants."
            : pendingAction === "save"
              ? "Voulez-vous sauvegarder cette semaine comme modèle de référence ?"
              : "Voulez-vous appliquer le modèle sauvegardé à cette semaine ?"
        }
        type={pendingAction === "deleteCall" ? "danger" : (pendingAction === "apply" ? "apply" : "save")}
      />

      <ActiveCallDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        call={selectedActiveCall}
        implicitAttendees={(() => {
          if (!selectedActiveCall) return [];
          try {
            const d = new Date(selectedActiveCall.date);
            const dateKey = formatDateLocal(d);
            const startH = selectedActiveCall.hour;

            // Logic: 60 min -> 1 slot, 90 min -> 2 slots
            const duration = selectedActiveCall.duration || 60;
            const slotsCount = duration === 90 ? 2 : 1;
            const endH = startH + slotsCount;

            const lists: any[][] = [];
            for (let h = startH; h < endH; h++) {
              const key = `${dateKey}-${h}`;
              if (slotDetails[key]?.users) {
                lists.push(slotDetails[key].users);
              } else {
                // If a slot is missing data (nobody there), then nobody conforms to "all slots"
                return [];
              }
            }

            if (lists.length === 0) return [];

            // Intersection: Users present in ALL lists
            return lists[0].filter((u: any) =>
              lists.every(list => list.some((u2: any) => u2.id === u.id))
            );
          } catch (e) { console.error("Error calc implicit", e); return []; }
        })()}
        onResponseUpdate={() => {
          fetchCalls();
          fetchDispos();
        }}
      />

      {/* CELEBRATION OVERLAY */}
      <CelebrationOverlay
        isOpen={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        onOpenTeamGenerator={() => {
          const bestSlot = readySlotsList.find((s) => s.count >= 10) || readySlotsList[0];
          setTeamGeneratorPlayers(bestSlot ? bestSlot.users : weekDispoUsers);
          setTeamGeneratorSlotInfo(bestSlot ? { day: bestSlot.day, hour: bestSlot.hour } : undefined);
          setTeamGeneratorOpen(true);
        }}
      />

      {/* TEAM GENERATOR MODAL */}
      <TeamGeneratorModal
        isOpen={teamGeneratorOpen}
        onClose={() => setTeamGeneratorOpen(false)}
        initialPlayers={teamGeneratorPlayers}
        slotInfo={teamGeneratorSlotInfo}
        availableSlots={readySlotsList}
        allCommunityUsers={allCommunityUsers}
      />

      {/* ADMIN ASSIGN PLAYER / GUEST MODAL */}
      {adminAssignSlot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => {
            setAdminAssignSlot(null);
            setIsDropdownOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#070A0D',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '24px',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95)',
              padding: '24px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'white' }}>
                  Inscrire un Joueur sur le Planning
                </h3>
                <span style={{ fontSize: '12px', color: '#4ADE80', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {adminAssignSlot.dayName} • {adminAssignSlot.date}
                </span>
              </div>
              <button
                onClick={() => {
                  setAdminAssignSlot(null);
                  setIsDropdownOpen(false);
                }}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.04)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <button
                type="button"
                onClick={() => {
                  setAssignMode("existing");
                  setIsDropdownOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  background: assignMode === "existing" ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: assignMode === "existing" ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Joueur Enregistré
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignMode("new");
                  setIsDropdownOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  background: assignMode === "new" ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'transparent',
                  color: assignMode === "new" ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                + Nouvel Invité Externe
              </button>
            </div>

            {/* Multi-Hour Selection Chips */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                  Créneaux sélectionnés ({selectedHoursToAssign.length})
                </label>
                <span style={{ fontSize: '10px', color: '#4ADE80', fontWeight: 600 }}>
                  Clique pour ajouter d&apos;autres heures
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '90px', overflowY: 'auto', padding: '2px' }} className="custom-scrollbar">
                {HOURS.map((h) => {
                  const isChecked = selectedHoursToAssign.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          if (selectedHoursToAssign.length > 1) {
                            setSelectedHoursToAssign(selectedHoursToAssign.filter((hour) => hour !== h));
                          }
                        } else {
                          setSelectedHoursToAssign([...selectedHoursToAssign, h].sort((a, b) => a - b));
                        }
                      }}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        border: isChecked ? '1px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: isChecked ? 'rgba(34, 197, 94, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                        color: isChecked ? '#4ADE80' : 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      {h}h00
                    </button>
                  );
                })}
              </div>
            </div>

            {assignMode === "existing" ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Custom Obsidian Pure-Black Dropdown */}
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Sélectionner un Joueur ou Invité
                  </label>
                  
                  {/* Trigger Button */}
                  <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      background: '#0D1117',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span>
                      {selectedUserToAssign
                        ? (allCommunityUsers.find((u: any) => u.id === selectedUserToAssign)?.customName ||
                            allCommunityUsers.find((u: any) => u.id === selectedUserToAssign)?.name ||
                            "Joueur sélectionné")
                        : "-- Choisir un joueur --"}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>▼</span>
                  </div>

                  {/* Floating Pure-Black Menu */}
                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 4000,
                        marginTop: '6px',
                        background: '#070A0D',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        borderRadius: '14px',
                        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.95)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        padding: '6px',
                        boxSizing: 'border-box',
                      }}
                      className="custom-scrollbar"
                    >
                      {/* Search in Dropdown */}
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          marginBottom: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.10)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '12px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />

                      {allCommunityUsers
                        .filter((u: any) => !u.isBanned)
                        .filter((u: any) => {
                          const dName = (u.customName || u.name || "").toLowerCase();
                          return dName.includes(userSearchQuery.toLowerCase());
                        })
                        .map((u: any) => {
                          const dName = u.customName || u.name || "Joueur";
                          const isAlreadyIn = slotDetails[`${adminAssignSlot.date}-${adminAssignSlot.hour}`]?.users?.some((su: any) => su.id === u.id);
                          const isSelected = selectedUserToAssign === u.id;

                          return (
                            <div
                              key={u.id}
                              onClick={() => {
                                setSelectedUserToAssign(u.id);
                                setIsDropdownOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 10px',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(34, 197, 94, 0.20)' : 'transparent',
                                color: isSelected ? '#4ADE80' : isAlreadyIn ? 'rgba(255, 255, 255, 0.45)' : 'white',
                                fontSize: '13px',
                                fontWeight: isSelected ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                              }}
                              className="hover:bg-white/[0.06]"
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', background: '#1F2937', flexShrink: 0 }}>
                                  {u.image ? (
                                    <img src={u.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'white' }}>
                                      {dName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span>{dName}</span>
                              </div>
                              {isAlreadyIn && (
                                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>
                                  Inscrit
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminAssignSlot(null);
                      setIsDropdownOpen(false);
                    }}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.10)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!selectedUserToAssign}
                    onClick={() => handleAdminAddDisposMulti(selectedUserToAssign, adminAssignSlot.date, selectedHoursToAssign)}
                    style={{
                      padding: '9px 20px',
                      borderRadius: '12px',
                      background: selectedUserToAssign
                        ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: selectedUserToAssign ? 'white' : 'rgba(255, 255, 255, 0.3)',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: selectedUserToAssign ? 'pointer' : 'not-allowed',
                      boxShadow: selectedUserToAssign ? '0 4px 14px rgba(34, 197, 94, 0.35)' : 'none',
                    }}
                  >
                    {selectedHoursToAssign.length > 1
                      ? `Inscrire sur les ${selectedHoursToAssign.length} créneaux`
                      : "Inscrire sur le Créneau"}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAdminCreateAndAssignGuestMulti(adminAssignSlot.date, selectedHoursToAssign);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Prénom / Nom du Joueur Invité *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ex: Guillaume, Sofiane, Karim..."
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '11px 14px',
                      background: '#0D1117',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Symmetrical Stepper Controls for Ratings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Technique (0-5)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0D1117', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '4px', boxSizing: 'border-box' }}>
                      <button
                        type="button"
                        onClick={() => setNewGuestTechnique(String(Math.max(0, Math.round((parseFloat(newGuestTechnique) - 0.5) * 10) / 10)))}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '16px',
                        }}
                      >
                        -
                      </button>
                      <span style={{ flex: 1, textAlign: 'center', color: 'white', fontWeight: 800, fontSize: '15px' }}>
                        {newGuestTechnique}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewGuestTechnique(String(Math.min(5, Math.round((parseFloat(newGuestTechnique) + 0.5) * 10) / 10)))}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '16px',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Cardio (0-5)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#0D1117', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '4px', boxSizing: 'border-box' }}>
                      <button
                        type="button"
                        onClick={() => setNewGuestCardio(String(Math.max(0, Math.round((parseFloat(newGuestCardio) - 0.5) * 10) / 10)))}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '16px',
                        }}
                      >
                        -
                      </button>
                      <span style={{ flex: 1, textAlign: 'center', color: 'white', fontWeight: 800, fontSize: '15px' }}>
                        {newGuestCardio}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewGuestCardio(String(Math.min(5, Math.round((parseFloat(newGuestCardio) + 0.5) * 10) / 10)))}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '16px',
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setAssignMode("existing")}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.10)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={!newGuestName.trim() || isCreatingGuest}
                    style={{
                      padding: '9px 20px',
                      borderRadius: '12px',
                      background: newGuestName.trim()
                        ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: newGuestName.trim() ? 'white' : 'rgba(255, 255, 255, 0.3)',
                      fontWeight: 800,
                      fontSize: '12px',
                      cursor: newGuestName.trim() ? 'pointer' : 'not-allowed',
                      boxShadow: newGuestName.trim() ? '0 4px 14px rgba(34, 197, 94, 0.35)' : 'none',
                    }}
                  >
                    {isCreatingGuest
                      ? "Création..."
                      : selectedHoursToAssign.length > 1
                        ? `Créer et Inscrire (${selectedHoursToAssign.length} créneaux)`
                        : "Créer et Inscrire"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ActionButton({ onClick, loading, label, icon, green = false, className = "" }: any) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        flex items-center gap-2 px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 h-full outline-none rounded-full cursor-pointer
        ${green
          ? 'bg-gradient-to-r from-[#22C55E]/90 to-[#16a34a]/90 backdrop-blur-md border border-white/30 text-black shadow-[0_0_20px_rgba(34,197,94,0.4),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:from-[#22C55E] hover:to-[#15803d] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]'
          : 'bg-white/[0.06] backdrop-blur-md border border-white/10 hover:bg-white/[0.12] hover:border-white/20 text-gray-200 hover:text-white shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)]'}
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none
        ${className}
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
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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