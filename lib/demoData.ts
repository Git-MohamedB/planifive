// lib/demoData.ts
// Dataset complet et réaliste pour le Mode Démo / Recruteur (100% Mock, 0 DB)

export interface DemoUser {
  id: string;
  name: string;
  customName: string;
  email: string;
  image: string;
  accentColor: string;
  technique: number;
  cardio: number;
  skillLevel: number;
  isBanned: boolean;
}

export interface DemoMatch {
  id: string;
  date: string;
  location: string;
  scoreTeam1: number;
  scoreTeam2: number;
  team1Names: string[];
  team2Names: string[];
  team1: DemoUser[];
  team2: DemoUser[];
  mvpWinner: string;
  mvpVotes: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: "demo-user",
    name: "Kylian M.",
    customName: "Kylian (Invité)",
    email: "demo@planifive.app",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    accentColor: "#22C55E",
    technique: 4.8,
    cardio: 4.6,
    skillLevel: 9,
    isBanned: false,
  },
  {
    id: "demo-user-2",
    name: "Zinédine Z.",
    customName: "Zizou",
    email: "zizou@planifive.app",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    accentColor: "#38BDF8",
    technique: 5.0,
    cardio: 4.0,
    skillLevel: 9,
    isBanned: false,
  },
  {
    id: "demo-user-3",
    name: "Antoine G.",
    customName: "Grizou",
    email: "grizou@planifive.app",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    accentColor: "#FBBF24",
    technique: 4.7,
    cardio: 4.8,
    skillLevel: 9,
    isBanned: false,
  },
  {
    id: "demo-user-4",
    name: "Thierry H.",
    customName: "Titi",
    email: "titi@planifive.app",
    image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    accentColor: "#EF4444",
    technique: 4.9,
    cardio: 4.3,
    skillLevel: 9,
    isBanned: false,
  },
  {
    id: "demo-user-5",
    name: "N'Golo K.",
    customName: "N'Golo",
    email: "ngolo@planifive.app",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    accentColor: "#10B981",
    technique: 4.3,
    cardio: 5.0,
    skillLevel: 9,
    isBanned: false,
  },
  {
    id: "demo-user-6",
    name: "Karim B.",
    customName: "KB9",
    email: "kb9@planifive.app",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    accentColor: "#6366F1",
    technique: 4.9,
    cardio: 4.2,
    skillLevel: 9,
    isBanned: false,
  },
  {
    id: "demo-user-7",
    name: "Ousmane D.",
    customName: "Dembouz",
    email: "dembouz@planifive.app",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    accentColor: "#EC4899",
    technique: 4.7,
    cardio: 4.4,
    skillLevel: 8,
    isBanned: false,
  },
  {
    id: "demo-user-8",
    name: "Paul P.",
    customName: "La Pioche",
    email: "pogba@planifive.app",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    accentColor: "#8B5CF6",
    technique: 4.8,
    cardio: 3.9,
    skillLevel: 8,
    isBanned: false,
  },
  {
    id: "demo-user-9",
    name: "Hugo L.",
    customName: "Hugo",
    email: "hugo@planifive.app",
    image: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    accentColor: "#14B8A6",
    technique: 4.0,
    cardio: 4.1,
    skillLevel: 8,
    isBanned: false,
  },
  {
    id: "demo-user-10",
    name: "Aurélien T.",
    customName: "Tchouam",
    email: "tchouam@planifive.app",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    accentColor: "#F97316",
    technique: 4.4,
    cardio: 4.7,
    skillLevel: 8,
    isBanned: false,
  },
  {
    id: "demo-user-11",
    name: "Eduardo C.",
    customName: "Cama",
    email: "cama@planifive.app",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    accentColor: "#06B6D4",
    technique: 4.5,
    cardio: 4.8,
    skillLevel: 8,
    isBanned: false,
  },
  {
    id: "demo-user-12",
    name: "Kingsley C.",
    customName: "King",
    email: "coman@planifive.app",
    image: "https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80",
    accentColor: "#E11D48",
    technique: 4.6,
    cardio: 4.5,
    skillLevel: 8,
    isBanned: false,
  },
];

// Helper to generate dynamic dates relative to current week
function getRelativeDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function getMondayOfCurrentWeek(): Date {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(today);
  mon.setDate(diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

export const DEMO_MATCHES: DemoMatch[] = [
  {
    id: "demo-match-1",
    date: getRelativeDate(2),
    location: "Le Five Paris 17",
    scoreTeam1: 10,
    scoreTeam2: 8,
    team1Names: ["Kylian (Invité)", "Zizou", "N'Golo", "Dembouz", "Cama"],
    team2Names: ["Grizou", "Titi", "KB9", "La Pioche", "Tchouam"],
    team1: [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[4], DEMO_USERS[6], DEMO_USERS[10]],
    team2: [DEMO_USERS[2], DEMO_USERS[3], DEMO_USERS[5], DEMO_USERS[7], DEMO_USERS[9]],
    mvpWinner: "Kylian (Invité)",
    mvpVotes: JSON.stringify({ "demo-user": "Kylian (Invité)", "demo-user-2": "Kylian (Invité)", "demo-user-5": "Kylian (Invité)" }),
  },
  {
    id: "demo-match-2",
    date: getRelativeDate(6),
    location: "UrbanSoccer Porte d'Aubervilliers",
    scoreTeam1: 12,
    scoreTeam2: 9,
    team1Names: ["Zizou", "KB9", "Titi", "Hugo", "King"],
    team2Names: ["Kylian (Invité)", "Grizou", "N'Golo", "La Pioche", "Cama"],
    team1: [DEMO_USERS[1], DEMO_USERS[5], DEMO_USERS[3], DEMO_USERS[8], DEMO_USERS[11]],
    team2: [DEMO_USERS[0], DEMO_USERS[2], DEMO_USERS[4], DEMO_USERS[7], DEMO_USERS[10]],
    mvpWinner: "Zizou",
    mvpVotes: JSON.stringify({ "demo-user-2": "Zizou", "demo-user-6": "Zizou" }),
  },
  {
    id: "demo-match-3",
    date: getRelativeDate(9),
    location: "Le Five Créteil",
    scoreTeam1: 7,
    scoreTeam2: 7,
    team1Names: ["Kylian (Invité)", "Tchouam", "N'Golo", "King", "Hugo"],
    team2Names: ["Zizou", "Grizou", "Dembouz", "KB9", "La Pioche"],
    team1: [DEMO_USERS[0], DEMO_USERS[9], DEMO_USERS[4], DEMO_USERS[11], DEMO_USERS[8]],
    team2: [DEMO_USERS[1], DEMO_USERS[2], DEMO_USERS[6], DEMO_USERS[5], DEMO_USERS[7]],
    mvpWinner: "N'Golo",
    mvpVotes: JSON.stringify({ "demo-user": "N'Golo", "demo-user-9": "N'Golo" }),
  },
  {
    id: "demo-match-4",
    date: getRelativeDate(14),
    location: "UrbanSoccer La Défense",
    scoreTeam1: 11,
    scoreTeam2: 6,
    team1Names: ["Kylian (Invité)", "Zizou", "Grizou", "Titi", "Cama"],
    team2Names: ["KB9", "N'Golo", "Dembouz", "Tchouam", "King"],
    team1: [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[2], DEMO_USERS[3], DEMO_USERS[10]],
    team2: [DEMO_USERS[5], DEMO_USERS[4], DEMO_USERS[6], DEMO_USERS[9], DEMO_USERS[11]],
    mvpWinner: "Titi",
    mvpVotes: JSON.stringify({ "demo-user-4": "Titi" }),
  },
  {
    id: "demo-match-5",
    date: getRelativeDate(18),
    location: "Le Five Paris 17",
    scoreTeam1: 8,
    scoreTeam2: 9,
    team1Names: ["Kylian (Invité)", "KB9", "La Pioche", "Hugo", "King"],
    team2Names: ["Zizou", "Grizou", "Titi", "N'Golo", "Dembouz"],
    team1: [DEMO_USERS[0], DEMO_USERS[5], DEMO_USERS[7], DEMO_USERS[8], DEMO_USERS[11]],
    team2: [DEMO_USERS[1], DEMO_USERS[2], DEMO_USERS[3], DEMO_USERS[4], DEMO_USERS[6]],
    mvpWinner: "Grizou",
    mvpVotes: JSON.stringify({ "demo-user-3": "Grizou" }),
  },
  {
    id: "demo-match-6",
    date: getRelativeDate(23),
    location: "Le Five Créteil",
    scoreTeam1: 14,
    scoreTeam2: 12,
    team1Names: ["Kylian (Invité)", "Zizou", "N'Golo", "Tchouam", "Cama"],
    team2Names: ["Grizou", "Titi", "KB9", "Dembouz", "La Pioche"],
    team1: [DEMO_USERS[0], DEMO_USERS[1], DEMO_USERS[4], DEMO_USERS[9], DEMO_USERS[10]],
    team2: [DEMO_USERS[2], DEMO_USERS[3], DEMO_USERS[5], DEMO_USERS[6], DEMO_USERS[7]],
    mvpWinner: "Kylian (Invité)",
    mvpVotes: JSON.stringify({ "demo-user": "Kylian (Invité)" }),
  },
  {
    id: "demo-match-7",
    date: getRelativeDate(28),
    location: "UrbanSoccer Porte d'Aubervilliers",
    scoreTeam1: 9,
    scoreTeam2: 5,
    team1Names: ["Zizou", "Grizou", "Titi", "Kylian (Invité)", "Hugo"],
    team2Names: ["KB9", "N'Golo", "Dembouz", "Tchouam", "King"],
    team1: [DEMO_USERS[1], DEMO_USERS[2], DEMO_USERS[3], DEMO_USERS[0], DEMO_USERS[8]],
    team2: [DEMO_USERS[5], DEMO_USERS[4], DEMO_USERS[6], DEMO_USERS[9], DEMO_USERS[11]],
    mvpWinner: "Zizou",
    mvpVotes: JSON.stringify({ "demo-user-2": "Zizou" }),
  },
];

export function getDemoDashboardData() {
  const currentMonday = getMondayOfCurrentWeek();
  const DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Week dispo distribution
  const dailyCounts = [6, 10, 7, 8, 9, 5, 4];
  const dailyTrend = DAYS_SHORT.map((day, idx) => {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + idx);
    return {
      day,
      date: d.toISOString().split("T")[0],
      count: dailyCounts[idx],
      uniqueUsers: Math.min(dailyCounts[idx], 10),
    };
  });

  const tuesdayDate = new Date(currentMonday);
  tuesdayDate.setDate(currentMonday.getDate() + 1);
  const tuesdayStr = tuesdayDate.toISOString().split("T")[0];

  const fridayDate = new Date(currentMonday);
  fridayDate.setDate(currentMonday.getDate() + 4);
  const fridayStr = fridayDate.toISOString().split("T")[0];

  const bestSlots = [
    {
      date: tuesdayStr,
      hour: 20,
      count: 10,
      users: DEMO_USERS.slice(0, 10).map(u => ({ id: u.id, name: u.customName, image: u.image })),
    },
    {
      date: fridayStr,
      hour: 19,
      count: 9,
      users: DEMO_USERS.slice(0, 9).map(u => ({ id: u.id, name: u.customName, image: u.image })),
    },
    {
      date: tuesdayStr,
      hour: 21,
      count: 8,
      users: DEMO_USERS.slice(0, 8).map(u => ({ id: u.id, name: u.customName, image: u.image })),
    },
    {
      date: fridayStr,
      hour: 20,
      count: 7,
      users: DEMO_USERS.slice(1, 8).map(u => ({ id: u.id, name: u.customName, image: u.image })),
    },
  ];

  return {
    weekStart: currentMonday.toISOString(),
    weekUsersCount: 11,
    totalCommunityUsers: DEMO_USERS.length,
    weekUsers: DEMO_USERS.slice(0, 11).map(u => ({
      id: u.id,
      name: u.name,
      customName: u.customName,
      image: u.image,
    })),
    bestSlots,
    dailyTrend,
    activeCalls: [
      {
        id: "demo-call-1",
        creatorId: "demo-user",
        date: tuesdayDate.toISOString(),
        hour: 20,
        location: "Le Five Créteil",
        duration: 60,
        price: "10€",
        comment: "Match chaud de mardi soir ! Prenez vos crampons.",
        creator: DEMO_USERS[0],
        responses: DEMO_USERS.slice(0, 8).map(u => ({
          id: `resp-${u.id}`,
          callId: "demo-call-1",
          userId: u.id,
          status: "ACCEPTED",
          user: u,
        })),
      },
    ],
    recentMatches: DEMO_MATCHES.slice(0, 5),
    userStats: {
      totalMatches: 7,
      wins: 5,
      losses: 1,
      draws: 1,
      winRate: 71,
      currentStreak: 2,
      disposCount: 4,
    },
    monthMvp: {
      id: "demo-user-2",
      name: "Zizou",
      image: DEMO_USERS[1].image,
      matches: 7,
      wins: 6,
      winRate: 86,
      ovr: 92,
    },
  };
}

export function getDemoAvailabilities(userId = "demo-user") {
  const currentMonday = getMondayOfCurrentWeek();
  const mySlots: string[] = [];
  const slotDetails: Record<string, { users: any[]; count: number }> = {};

  // Build fake slots for the week
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(currentMonday);
    d.setDate(currentMonday.getDate() + dayOffset);
    const dateStr = d.toISOString().split("T")[0];

    // Hours 18 to 22
    for (let h = 18; h <= 22; h++) {
      const key = `${dateStr}-${h}`;
      let slotUsers: DemoUser[] = [];

      if (dayOffset === 1 && h === 20) {
        // Tuesday 20h = 10 users (Golden Slot)
        slotUsers = DEMO_USERS.slice(0, 10);
      } else if (dayOffset === 1 && h === 21) {
        slotUsers = DEMO_USERS.slice(0, 8);
      } else if (dayOffset === 4 && h === 19) {
        slotUsers = DEMO_USERS.slice(0, 9);
      } else if (dayOffset === 4 && h === 20) {
        slotUsers = DEMO_USERS.slice(1, 8);
      } else if (dayOffset === 2 && h === 19) {
        slotUsers = DEMO_USERS.slice(2, 8);
      } else if (dayOffset === 3 && h === 20) {
        slotUsers = DEMO_USERS.slice(0, 7);
      } else if (dayOffset === 0 && h === 20) {
        slotUsers = DEMO_USERS.slice(3, 8);
      }

      if (slotUsers.length > 0) {
        slotDetails[key] = {
          count: slotUsers.length,
          users: slotUsers.map(u => ({
            id: u.id,
            name: u.customName,
            customName: u.customName,
            image: u.image,
          })),
        };
        if (slotUsers.some(u => u.id === userId)) {
          mySlots.push(key);
        }
      }
    }
  }

  return { mySlots, slotDetails };
}

export function isDemoSession(session: any): boolean {
  if (!session?.user) return false;
  const u = session.user;
  return u.id === "demo-user" || u.email === "demo@planifive.app" || u.isDemo === true;
}

export function getDemoProfile(targetIdOrName = "demo-user", sessionUserId = "demo-user") {
  const decoded = decodeURIComponent(targetIdOrName).toLowerCase();
  
  let targetUser = DEMO_USERS.find(
    u => u.id === targetIdOrName || 
         u.name.toLowerCase() === decoded || 
         u.customName.toLowerCase() === decoded ||
         (targetIdOrName === "me" && u.id === "demo-user")
  ) || DEMO_USERS[0];

  const isOwnProfile = targetUser.id === sessionUserId || (sessionUserId === "demo-user" && targetUser.id === "demo-user");

  const tech = targetUser.technique;
  const card = targetUser.cardio;
  const futOVR = Math.round(55 + (tech * 4.5) + (card * 3.5));

  const badges = [
    { id: "roi_du_five", name: "Roi du Five", desc: "5 victoires d'affilée enregistrées", icon: "crown", color: "#FBBF24", unlocked: true, progress: 5, max: 5 },
    { id: "metronome", name: "Le Métronome", desc: "10 matchs disputés sur la plateforme", icon: "shield-check", color: "#38BDF8", unlocked: true, progress: 7, max: 10 },
    { id: "guerrier_dimanche", name: "Guerrier du Week-end", desc: "3 matchs disputés le week-end", icon: "swords", color: "#A855F7", unlocked: true, progress: 3, max: 3 },
    { id: "mvp_indiscutable", name: "MVP Indiscutable", desc: "Win rate supérieur ou égal à 65%", icon: "star", color: "#F59E0B", unlocked: true, progress: 71, max: 65 },
    { id: "renard_surfaces", name: "Renard des Surfaces", desc: "5 victoires au compteur", icon: "target", color: "#EF4444", unlocked: true, progress: 5, max: 5 },
    { id: "toujours_pret", name: "Toujours Prêt", desc: "15 créneaux indiqués sur le planning", icon: "zap", color: "#4ADE80", unlocked: true, progress: 12, max: 15 },
    { id: "legende", name: "Légende Planifive", desc: "20 matchs disputés au total", icon: "trophy", color: "#EAB308", unlocked: false, progress: 7, max: 20 },
  ];

  return {
    user: {
      id: targetUser.id,
      name: targetUser.name,
      customName: targetUser.customName,
      image: targetUser.image,
      accentColor: targetUser.accentColor,
      technique: tech,
      cardio: card,
      overall: futOVR,
    },
    isOwnProfile,
    stats: {
      totalMatches: 7,
      wins: 5,
      losses: 1,
      draws: 1,
      winRate: 71,
      maxWinStreak: 4,
      currentWinStreak: 2,
      favoriteDay: "Mardi",
      favoriteHour: "20h",
    },
    fut: {
      ovr: futOVR,
      pac: Math.round(75 + tech * 3.5),
      sho: Math.round(70 + tech * 4),
      pas: Math.round(72 + tech * 3),
      dri: Math.round(74 + tech * 3.8),
      def: Math.round(60 + card * 3),
      phy: Math.round(68 + card * 4.2),
    },
    ratingsCount: 4,
    isCommunityRated: true,
    myRating: { pac: 88, sho: 85, pas: 82, dri: 89, def: 65, phy: 78 },
    synergy: { name: "Zizou", image: DEMO_USERS[1].image, matches: 4, wins: 3, winRate: 75 },
    nemesis: { name: "Titi", image: DEMO_USERS[3].image, matches: 3, losses: 2, lossRate: 67 },
    badges,
    matchHistory: DEMO_MATCHES.map(m => {
      const inT1 = m.team1Names.includes(targetUser.customName) || m.team1Names.includes(targetUser.name);
      const myScore = inT1 ? m.scoreTeam1 : m.scoreTeam2;
      const oppScore = inT1 ? m.scoreTeam2 : m.scoreTeam1;
      const isDraw = myScore === oppScore;
      const won = myScore > oppScore;
      return {
        id: m.id,
        date: m.date,
        location: m.location,
        myScore,
        opponentScore: oppScore,
        result: isDraw ? "DRAW" : won ? "WIN" : "LOSS",
      };
    }),
  };
}
