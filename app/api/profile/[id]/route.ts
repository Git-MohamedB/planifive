import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlayerRating } from "@/lib/playerRatings";
import { getDemoProfile, isDemoSession } from "@/lib/demoData";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    
    let targetId = id;
    if (targetId === "me" || !targetId || targetId === "undefined") {
      targetId = session?.user?.id || "";
    }

    if (isDemoSession(session) || (targetId && targetId.startsWith("demo-"))) {
      return NextResponse.json(getDemoProfile(targetId, session?.user?.id || "demo-user"));
    }

    if (!targetId && !session?.user?.email) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Lookup user by ID first, then by email or name as fallback
    let user = targetId
      ? await prisma.user.findUnique({
          where: { id: targetId },
          select: {
            id: true,
            name: true,
            email: true,
            customName: true,
            image: true,
            accentColor: true,
            skillLevel: true,
            technique: true,
            cardio: true,
          },
        })
      : null;

    if (!user && targetId) {
      // Try finding by name or customName or email
      const decoded = decodeURIComponent(targetId);
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: decoded },
            { email: decoded },
            { name: { equals: decoded, mode: "insensitive" } },
            { customName: { equals: decoded, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          customName: true,
          image: true,
          accentColor: true,
          skillLevel: true,
          technique: true,
          cardio: true,
        },
      });
    }

    if (!user && session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          customName: true,
          image: true,
          accentColor: true,
          skillLevel: true,
          technique: true,
          cardio: true,
        },
      });
    }

    if (!user) {
      // Fallback for custom player names (e.g. Sheizer, Mehmet, David, etc.) not registered in User table
      const decodedName = decodeURIComponent(targetId);
      const hardcoded = getPlayerRating(decodedName);
      user = {
        id: decodedName,
        name: decodedName,
        email: `${decodedName.toLowerCase()}@planifive.local`,
        customName: decodedName,
        image: null,
        accentColor: "#22C55E",
        skillLevel: "INTERMEDIATE" as any,
        technique: hardcoded.technique || 3.5,
        cardio: hardcoded.cardio || 3.5,
      };
    }

    const userId = user.id;
    const isOwnProfile = session?.user?.id === userId || (user.email && session?.user?.email === user.email);

    // Get rating: DB values take priority, fallback to hardcoded playerRatings
    const hardcodedRating = getPlayerRating(user.customName || user.name);
    const technique = user.technique ?? hardcodedRating.technique;
    const cardio = user.cardio ?? hardcodedRating.cardio;
    const overall = Math.round(((technique * 0.6 + cardio * 0.4) * 2) * 10) / 10;

    // Fetch user matches by relation
    const matchesByRelation = await prisma.match.findMany({
      where: {
        OR: [{ team1: { some: { id: userId } } }, { team2: { some: { id: userId } } }],
      },
      orderBy: { date: "desc" },
      include: {
        team1: { select: { id: true, name: true, customName: true, image: true } },
        team2: { select: { id: true, name: true, customName: true, image: true } },
      },
    });

    // Also fetch matches where the player appears in team1Names or team2Names
    const playerNames = [user.name, user.customName].filter(Boolean).map(n => n!.toLowerCase());
    const allMatches = await prisma.match.findMany({
      where: {
        OR: [
          { team1Names: { not: null } },
          { team2Names: { not: null } },
        ],
      },
      orderBy: { date: "desc" },
      include: {
        team1: { select: { id: true, name: true, customName: true, image: true } },
        team2: { select: { id: true, name: true, customName: true, image: true } },
      },
    });

    // Merge matches: include matches where player is in teamXNames but not already in relation matches
    const relationMatchIds = new Set(matchesByRelation.map(m => m.id));
    const nameMatches = allMatches.filter(m => {
      if (relationMatchIds.has(m.id)) return false;
      const t1Names = m.team1Names ? JSON.parse(m.team1Names).map((n: string) => n.toLowerCase()) : [];
      const t2Names = m.team2Names ? JSON.parse(m.team2Names).map((n: string) => n.toLowerCase()) : [];
      return playerNames.some(pn => t1Names.includes(pn) || t2Names.includes(pn));
    });

    const matches = [...matchesByRelation, ...nameMatches].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let maxWinStreak = 0;
    let currentWinStreak = 0;
    let tempStreak = 0;

    // ─── Synergies & Némésis Tracking ───
    const teammateStats: Record<string, { name: string; image?: string; matches: number; wins: number }> = {};
    const opponentStats: Record<string, { name: string; image?: string; matches: number; losses: number }> = {};
    const dayCounts: Record<number, number> = {};
    const hourCounts: Record<number, number> = {};
    let weekendMatches = 0;

    const matchHistory = matches.map((m, idx) => {
      // Determine which team the player is on
      const inTeam1ByRelation = m.team1.some((u) => u.id === userId);
      const inTeam2ByRelation = m.team2.some((u) => u.id === userId);

      let inTeam1 = inTeam1ByRelation;
      if (!inTeam1ByRelation && !inTeam2ByRelation) {
        // Check by name
        const t1Names = m.team1Names ? JSON.parse(m.team1Names).map((n: string) => n.toLowerCase()) : [];
        const t2Names = m.team2Names ? JSON.parse(m.team2Names).map((n: string) => n.toLowerCase()) : [];
        inTeam1 = playerNames.some(pn => t1Names.includes(pn));
      }

      const myScore = inTeam1 ? m.scoreTeam1 : m.scoreTeam2;
      const opponentScore = inTeam1 ? m.scoreTeam2 : m.scoreTeam1;
      const won = myScore > opponentScore;
      const isDraw = myScore === opponentScore;

      // Track teammates (my team, excluding self)
      const myTeam = inTeam1 ? m.team1 : m.team2;
      const oppTeam = inTeam1 ? m.team2 : m.team1;

      myTeam.forEach((t) => {
        if (t.id !== userId) {
          const key = t.id;
          const tName = t.customName || t.name || "Coéquipier";
          if (!teammateStats[key]) teammateStats[key] = { name: tName, image: t.image || undefined, matches: 0, wins: 0 };
          teammateStats[key].matches++;
          if (won) teammateStats[key].wins++;
        }
      });

      oppTeam.forEach((o) => {
        const key = o.id;
        const oName = o.customName || o.name || "Adversaire";
        if (!opponentStats[key]) opponentStats[key] = { name: oName, image: o.image || undefined, matches: 0, losses: 0 };
        opponentStats[key].matches++;
        if (!won && !isDraw) opponentStats[key].losses++;
      });

      if (isDraw) {
        draws++;
        tempStreak = 0;
      } else if (won) {
        wins++;
        tempStreak++;
        if (tempStreak > maxWinStreak) maxWinStreak = tempStreak;
      } else {
        losses++;
        tempStreak = 0;
      }

      if (idx === 0 && won) {
        currentWinStreak = 1;
      }

      const matchDate = new Date(m.date);
      const dayIndex = matchDate.getDay();
      dayCounts[dayIndex] = (dayCounts[dayIndex] || 0) + 1;
      if (dayIndex === 0 || dayIndex === 6) weekendMatches++;

      return {
        id: m.id,
        date: m.date,
        location: m.location,
        myScore,
        opponentScore,
        result: isDraw ? "DRAW" : won ? "WIN" : "LOSS",
      };
    });

    const totalMatches = matches.length;
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    // ─── Best Synergy (Meilleur Duo) ───
    let bestSynergy: { name: string; image?: string; matches: number; wins: number; winRate: number } | null = null;
    Object.values(teammateStats).forEach((t) => {
      const rate = Math.round((t.wins / t.matches) * 100);
      if (t.matches >= 1) {
        if (!bestSynergy || (t.matches >= 2 && rate > bestSynergy.winRate) || (rate === bestSynergy.winRate && t.matches > bestSynergy.matches)) {
          bestSynergy = { ...t, winRate: rate };
        }
      }
    });

    // ─── Nemesis (Bête Noire) ───
    let nemesis: { name: string; image?: string; matches: number; losses: number; lossRate: number } | null = null;
    Object.values(opponentStats).forEach((o) => {
      const rate = Math.round((o.losses / o.matches) * 100);
      if (o.matches >= 1) {
        if (!nemesis || (o.matches >= 2 && rate > nemesis.lossRate) || (rate === nemesis.lossRate && o.matches > nemesis.matches)) {
          nemesis = { ...o, lossRate: rate };
        }
      }
    });

    const DAYS_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    let favDayIndex = 5; // Default Vendredi
    let maxDayCount = 0;
    Object.entries(dayCounts).forEach(([d, count]) => {
      const c = Number(count);
      if (c > maxDayCount) {
        maxDayCount = c;
        favDayIndex = Number(d);
      }
    });

    const availabilities = await prisma.availability.findMany({
      where: { userId },
      select: { hour: true },
    });

    availabilities.forEach((a) => {
      hourCounts[a.hour] = (hourCounts[a.hour] || 0) + 1;
    });

    let favHour = 20;
    let maxHourCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      const c = Number(count);
      if (c > maxHourCount) {
        maxHourCount = c;
        favHour = Number(h);
      }
    });

    // ─── Community Peer Ratings (Moyenne des notes attribuées par les autres) ───
    let communityRatings: any[] = [];
    try {
      communityRatings = await prisma.$queryRawUnsafe(
        `SELECT "pac", "sho", "pas", "dri", "def", "phy", "voterUserId"
         FROM "FUTCardRating"
         WHERE "targetUserId" = $1 OR "targetUserId" = $2 OR "targetUserId" = $3`,
        user.id,
        user.name || "",
        user.customName || ""
      );
    } catch (e) {
      console.warn("Could not query community ratings via SQL:", e);
      try {
        const model = (prisma as any).fUTCardRating || (prisma as any).futCardRating;
        if (model) {
          communityRatings = await model.findMany({
            where: {
              OR: [
                { targetUserId: user.id },
                ...(user.name ? [{ targetUserId: user.name }] : []),
                ...(user.customName ? [{ targetUserId: user.customName }] : []),
              ],
            },
          });
        }
      } catch {}
    }

    const voterId = session?.user?.id || session?.user?.email || "";
    const myRating = communityRatings.find((r: any) => r.voterUserId === voterId) || null;

    let futPAC = Math.min(99, Math.max(62, 60 + Math.round(totalMatches * 1.5 + availabilities.length * 0.6)));
    let futSHO = Math.min(99, Math.max(60, 52 + Math.round(winRate * 0.46)));
    let futPAS = Math.min(99, Math.max(60, 64 + Math.round(wins * 1.8 + technique * 3.5)));
    let futDRI = Math.min(99, Math.max(60, Math.round(55 + technique * 8.5)));
    let futDEF = Math.min(99, Math.max(60, Math.round(54 + cardio * 4.2 + wins * 1.2)));
    let futPHY = Math.min(99, Math.max(60, Math.round(55 + cardio * 8.5)));

    if (communityRatings.length > 0) {
      let sumPac = 0, sumSho = 0, sumPas = 0, sumDri = 0, sumDef = 0, sumPhy = 0;
      communityRatings.forEach((r: any) => {
        sumPac += r.pac;
        sumSho += r.sho;
        sumPas += r.pas;
        sumDri += r.dri;
        sumDef += r.def;
        sumPhy += r.phy;
      });
      const cCount = communityRatings.length;
      futPAC = Math.round(sumPac / cCount);
      futSHO = Math.round(sumSho / cCount);
      futPAS = Math.round(sumPas / cCount);
      futDRI = Math.round(sumDri / cCount);
      futDEF = Math.round(sumDef / cCount);
      futPHY = Math.round(sumPhy / cCount);
    }

    const futOVR = Math.min(99, Math.max(60, Math.round(futPAC * 0.15 + futSHO * 0.25 + futPAS * 0.15 + futDRI * 0.2 + futDEF * 0.1 + futPHY * 0.15)));

    // ─── Achievements / Badges (No Emojis, Lucide Identifiers) ───
    const badges = [
      {
        id: "roi_du_five",
        name: "Roi du Five",
        desc: "5 victoires d'affilée enregistrées",
        icon: "crown",
        color: "#FBBF24",
        unlocked: maxWinStreak >= 5,
        progress: Math.min(5, maxWinStreak),
        max: 5,
      },
      {
        id: "metronome",
        name: "Le Métronome",
        desc: "10 matchs disputés sur la plateforme",
        icon: "shield-check",
        color: "#38BDF8",
        unlocked: totalMatches >= 10,
        progress: Math.min(10, totalMatches),
        max: 10,
      },
      {
        id: "guerrier_dimanche",
        name: "Guerrier du Week-end",
        desc: "3 matchs disputés le week-end",
        icon: "swords",
        color: "#A855F7",
        unlocked: weekendMatches >= 3,
        progress: Math.min(3, weekendMatches),
        max: 3,
      },
      {
        id: "mvp_indiscutable",
        name: "MVP Indiscutable",
        desc: "Win rate supérieur ou égal à 65% (min 3 matchs)",
        icon: "star",
        color: "#F59E0B",
        unlocked: totalMatches >= 3 && winRate >= 65,
        progress: totalMatches >= 3 ? winRate : 0,
        max: 65,
      },
      {
        id: "renard_surfaces",
        name: "Renard des Surfaces",
        desc: "5 victoires au compteur",
        icon: "target",
        color: "#EF4444",
        unlocked: wins >= 5,
        progress: Math.min(5, wins),
        max: 5,
      },
      {
        id: "toujours_pret",
        name: "Toujours Prêt",
        desc: "15 créneaux indiqués sur le planning",
        icon: "zap",
        color: "#4ADE80",
        unlocked: availabilities.length >= 15,
        progress: Math.min(15, availabilities.length),
        max: 15,
      },
      {
        id: "legende",
        name: "Légende Planifive",
        desc: "20 matchs disputés au total",
        icon: "trophy",
        color: "#EAB308",
        unlocked: totalMatches >= 20,
        progress: Math.min(20, totalMatches),
        max: 20,
      },
    ];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        customName: user.customName,
        image: user.image,
        accentColor: user.accentColor,
        technique,
        cardio,
        overall: futOVR,
      },
      isOwnProfile,
      stats: {
        totalMatches,
        wins,
        losses,
        draws,
        winRate,
        maxWinStreak,
        currentWinStreak,
        favoriteDay: DAYS_NAMES[favDayIndex],
        favoriteHour: `${favHour}h`,
      },
      fut: {
        ovr: futOVR,
        pac: futPAC,
        sho: futSHO,
        pas: futPAS,
        dri: futDRI,
        def: futDEF,
        phy: futPHY,
      },
      ratingsCount: communityRatings.length,
      isCommunityRated: communityRatings.length > 0,
      myRating,
      synergy: bestSynergy,
      nemesis: nemesis,
      badges,
      matchHistory: matchHistory.slice(0, 15),
    });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
