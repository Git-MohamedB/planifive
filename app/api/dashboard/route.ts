import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Monday of current week
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(today);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(currentMonday);
    nextSunday.setDate(currentMonday.getDate() + 7);

    // 1. Fetch Dispos for this week
    const weekAvailabilities = await prisma.availability.findMany({
      where: {
        date: {
          gte: currentMonday,
          lt: nextSunday,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            customName: true,
            image: true,
            accentColor: true,
          },
        },
      },
    });

    // 2. Fetch Active Calls
    const activeCalls = await prisma.call.findMany({
      where: {
        date: {
          gte: today,
        },
      },
      orderBy: {
        date: "asc",
      },
      take: 3,
      include: {
        creator: {
          select: { id: true, name: true, customName: true, image: true },
        },
        responses: {
          include: {
            user: { select: { id: true, name: true, customName: true, image: true } },
          },
        },
      },
    });

    // 3. Fetch Recent Matches
    const recentMatches = await prisma.match.findMany({
      orderBy: { date: "desc" },
      take: 5,
      include: {
        team1: { select: { id: true, name: true, customName: true, image: true } },
        team2: { select: { id: true, name: true, customName: true, image: true } },
      },
    });

    // 4. Compute Personal User Stats (if logged in)
    let userStats = null;
    let userDisposCountThisWeek = 0;
    if (userId) {
      // Get the current user's name and customName for text-based matching
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, customName: true },
      });

      const userName = currentUser?.name?.toLowerCase() || "";
      const userCustomName = currentUser?.customName?.toLowerCase() || "";

      // Fetch ALL matches (we need to check team1Names/team2Names text fields too)
      const allMatches = await prisma.match.findMany({
        include: {
          team1: { select: { id: true } },
          team2: { select: { id: true } },
        },
        orderBy: { date: "desc" },
      });

      // Helper to safely parse team names whether they are JSON arrays or plain strings
      const parseNames = (raw: any): string[] => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        if (typeof raw === "string") {
          try {
            const p = JSON.parse(raw);
            if (Array.isArray(p)) return p;
          } catch {
            return raw.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }
        return [];
      };

      // Filter matches where the user participated (by ID relation OR by name in team1Names/team2Names)
      const userMatches = allMatches.filter((m) => {
        // Check by user ID in relations
        const inTeam1ById = m.team1.some((u: any) => u.id === userId);
        const inTeam2ById = m.team2.some((u: any) => u.id === userId);
        if (inTeam1ById || inTeam2ById) return true;

        const t1Names = parseNames(m.team1Names);
        const t2Names = parseNames(m.team2Names);
        const allNames = [...t1Names, ...t2Names].map((n: string) => n?.trim().toLowerCase()).filter(Boolean);

        if (userName && allNames.includes(userName)) return true;
        if (userCustomName && allNames.includes(userCustomName)) return true;

        return false;
      });

      let wins = 0;
      let losses = 0;
      let draws = 0;

      userMatches.forEach((m) => {
        // Determine which team the user is on
        const inTeam1ById = m.team1.some((u: any) => u.id === userId);
        const inTeam2ById = m.team2.some((u: any) => u.id === userId);

        let inTeam1 = inTeam1ById;
        if (!inTeam1ById && !inTeam2ById) {
          const t1Names = parseNames(m.team1Names).map((n: string) => n?.trim().toLowerCase());
          inTeam1 = !!((userName && t1Names.includes(userName)) || (userCustomName && t1Names.includes(userCustomName)));
        }

        const userWon = inTeam1 ? m.scoreTeam1 > m.scoreTeam2 : m.scoreTeam2 > m.scoreTeam1;
        const isDraw = m.scoreTeam1 === m.scoreTeam2;

        if (isDraw) draws++;
        else if (userWon) wins++;
        else losses++;
      });

      // Compute current win streak from recent matches (ordered by date DESC)
      let currentStreak = 0;
      for (const m of userMatches) {
        const inTeam1ById = m.team1.some((u: any) => u.id === userId);
        const inTeam2ById = m.team2.some((u: any) => u.id === userId);

        let inTeam1 = inTeam1ById;
        if (!inTeam1ById && !inTeam2ById) {
          const t1Names = parseNames(m.team1Names).map((n: string) => n?.trim().toLowerCase());
          inTeam1 = !!((userName && t1Names.includes(userName)) || (userCustomName && t1Names.includes(userCustomName)));
        }

        const userWon = inTeam1 ? m.scoreTeam1 > m.scoreTeam2 : m.scoreTeam2 > m.scoreTeam1;
        const isDraw = m.scoreTeam1 === m.scoreTeam2;

        if (userWon && !isDraw) {
          currentStreak++;
        } else {
          break; // Stop counting streak as soon as there's a non-win
        }
      }

      const totalMatches = userMatches.length;
      const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      // User's filled slots this week
      userDisposCountThisWeek = weekAvailabilities.filter((a) => a.userId === userId).length;

      userStats = {
        totalMatches,
        wins,
        losses,
        draws,
        winRate,
        currentStreak,
        disposCount: userDisposCountThisWeek,
      };
    }

    // 5. Compute Group Dispo Users
    const weekUsersMap = new Map<string, any>();
    (weekAvailabilities as any[]).forEach((a: any) => {
      if (a.user && !weekUsersMap.has(a.user.id)) {
        weekUsersMap.set(a.user.id, a.user);
      }
    });
    const weekUsers = Array.from(weekUsersMap.values());

    // 6. Find Top / Best Golden Slots for this week
    const slotsMap = new Map<string, { date: string; hour: number; count: number; users: any[] }>();
    (weekAvailabilities as any[]).forEach((a: any) => {
      const dStr = a.date.toISOString().split("T")[0];
      const key = `${dStr}-${a.hour}`;
      if (!slotsMap.has(key)) {
        slotsMap.set(key, { date: dStr, hour: a.hour, count: 0, users: [] });
      }
      const slot = slotsMap.get(key)!;
      slot.count++;
      slot.users.push(a.user);
    });

    const sortedSlots = Array.from(slotsMap.values()).sort((a, b) => b.count - a.count);
    const bestSlots = sortedSlots.slice(0, 5);

    // 7. Compute 7-day trend (Monday to Sunday)
    const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const dailyTrend = DAYS_SHORT.map((label, index) => {
      const dayDate = new Date(currentMonday);
      dayDate.setDate(currentMonday.getDate() + index);
      const dStr = dayDate.toISOString().split("T")[0];
      
      const dayDispos = weekAvailabilities.filter(
        (a) => a.date.toISOString().split("T")[0] === dStr
      );

      // Unique users on this day
      const dayUniqueUsers = new Set(dayDispos.map((a) => a.userId)).size;

      return {
        day: label,
        date: dStr,
        count: dayDispos.length,
        uniqueUsers: dayUniqueUsers,
      };
    });

    const totalCommunityUsers = await prisma.user.count({
      where: { isBanned: false },
    });

    // 8. Compute Month MVP (Joueur du Mois / Dernier MVP)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let monthMatches = await prisma.match.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      orderBy: { date: "desc" },
      include: {
        team1: { select: { id: true, name: true, customName: true, image: true, technique: true, cardio: true } },
        team2: { select: { id: true, name: true, customName: true, image: true, technique: true, cardio: true } },
      },
    });

    let isLastMonthFallback = false;
    if (monthMatches.length === 0) {
      // Fallback: take all recorded matches to find the most recent MVP
      monthMatches = await prisma.match.findMany({
        orderBy: { date: "desc" },
        take: 40,
        include: {
          team1: { select: { id: true, name: true, customName: true, image: true, technique: true, cardio: true } },
          team2: { select: { id: true, name: true, customName: true, image: true, technique: true, cardio: true } },
        },
      });
      isLastMonthFallback = true;
    }

    // Fetch all users for name to avatar mapping
    const allDbUsers = await prisma.user.findMany({
      select: { id: true, name: true, customName: true, image: true, technique: true, cardio: true },
    });
    const userByNameMap = new Map<string, typeof allDbUsers[0]>();
    allDbUsers.forEach((u) => {
      if (u.name) userByNameMap.set(u.name.toLowerCase(), u);
      if (u.customName) userByNameMap.set(u.customName.toLowerCase(), u);
    });

    const playerMonthStats: Record<string, { id: string; name: string; image?: string; matches: number; wins: number; technique: number; cardio: number }> = {};

    monthMatches.forEach((m) => {
      const wonT1 = m.scoreTeam1 > m.scoreTeam2;
      const wonT2 = m.scoreTeam2 > m.scoreTeam1;

      // 1. From Relations
      m.team1.forEach((u) => {
        const key = u.id;
        if (!playerMonthStats[key]) playerMonthStats[key] = { id: u.id, name: u.customName || u.name || "Joueur", image: u.image || undefined, matches: 0, wins: 0, technique: u.technique || 3.5, cardio: u.cardio || 3.5 };
        playerMonthStats[key].matches++;
        if (wonT1) playerMonthStats[key].wins++;
      });

      m.team2.forEach((u) => {
        const key = u.id;
        if (!playerMonthStats[key]) playerMonthStats[key] = { id: u.id, name: u.customName || u.name || "Joueur", image: u.image || undefined, matches: 0, wins: 0, technique: u.technique || 3.5, cardio: u.cardio || 3.5 };
        playerMonthStats[key].matches++;
        if (wonT2) playerMonthStats[key].wins++;
      });

      // 2. From team1Names / team2Names JSON
      let t1Names: string[] = [];
      let t2Names: string[] = [];
      try { if (m.team1Names) t1Names = JSON.parse(m.team1Names); } catch {}
      try { if (m.team2Names) t2Names = JSON.parse(m.team2Names); } catch {}

      t1Names.forEach((nameStr) => {
        if (!nameStr || typeof nameStr !== "string") return;
        const clean = nameStr.trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        const matchedUser = userByNameMap.get(key);
        const resolvedId = matchedUser?.id || key;
        const resolvedName = matchedUser?.customName || matchedUser?.name || clean;
        const resolvedImage = matchedUser?.image || undefined;

        if (!playerMonthStats[resolvedId]) {
          playerMonthStats[resolvedId] = {
            id: resolvedId,
            name: resolvedName,
            image: resolvedImage,
            matches: 0,
            wins: 0,
            technique: matchedUser?.technique || 3.5,
            cardio: matchedUser?.cardio || 3.5,
          };
        }
        playerMonthStats[resolvedId].matches++;
        if (wonT1) playerMonthStats[resolvedId].wins++;
      });

      t2Names.forEach((nameStr) => {
        if (!nameStr || typeof nameStr !== "string") return;
        const clean = nameStr.trim();
        if (!clean) return;
        const key = clean.toLowerCase();
        const matchedUser = userByNameMap.get(key);
        const resolvedId = matchedUser?.id || key;
        const resolvedName = matchedUser?.customName || matchedUser?.name || clean;
        const resolvedImage = matchedUser?.image || undefined;

        if (!playerMonthStats[resolvedId]) {
          playerMonthStats[resolvedId] = {
            id: resolvedId,
            name: resolvedName,
            image: resolvedImage,
            matches: 0,
            wins: 0,
            technique: matchedUser?.technique || 3.5,
            cardio: matchedUser?.cardio || 3.5,
          };
        }
        playerMonthStats[resolvedId].matches++;
        if (wonT2) playerMonthStats[resolvedId].wins++;
      });
    });

    let monthMvp: any = null;
    Object.values(playerMonthStats).forEach((p) => {
      if (p.matches === 0) return;
      const rate = Math.round((p.wins / p.matches) * 100);
      const ovr = Math.min(99, Math.max(68, Math.round(55 + (rate * 0.25) + (p.technique * 4) + (p.cardio * 3))));
      const candidate = { ...p, winRate: rate, ovr, isLastMonth: isLastMonthFallback };

      if (!monthMvp) {
        monthMvp = candidate;
      } else {
        // Preference: min 2 matches, then higher win rate, then more wins
        if (candidate.matches >= 2 && monthMvp.matches < 2) {
          monthMvp = candidate;
        } else if (candidate.matches >= 2 && monthMvp.matches >= 2) {
          if (candidate.winRate > monthMvp.winRate || (candidate.winRate === monthMvp.winRate && candidate.wins > monthMvp.wins)) {
            monthMvp = candidate;
          }
        } else if (monthMvp.matches < 2 && candidate.wins > monthMvp.wins) {
          monthMvp = candidate;
        }
      }
    });

    return NextResponse.json({
      weekStart: currentMonday.toISOString(),
      weekUsersCount: weekUsers.length,
      totalCommunityUsers,
      weekUsers,
      bestSlots,
      dailyTrend,
      activeCalls,
      recentMatches,
      userStats,
      monthMvp,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
