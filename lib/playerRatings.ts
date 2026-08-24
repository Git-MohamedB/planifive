// Base de données des niveaux des joueurs pour le Five
// Notes fournies : Technicité / Foot (/5) et Cardio / Intensité (/5)

export interface PlayerRating {
  name: string;
  aliases: string[];
  technique: number; // /5
  cardio: number;    // /5
  overall: number;   // /10 (calculé)
}

export const PLAYER_RATINGS: Record<string, PlayerRating> = {
  david: {
    name: "David",
    aliases: ["david"],
    technique: 2.25,
    cardio: 4.0,
    overall: Math.round(((2.25 * 0.6 + 4.0 * 0.4) * 2) * 10) / 10, // 5.9/10
  },
  valentin: {
    name: "Valentin",
    aliases: ["valentin"],
    technique: 1.5,
    cardio: 3.5,
    overall: Math.round(((1.5 * 0.6 + 3.5 * 0.4) * 2) * 10) / 10, // 4.6/10
  },
  mikail: {
    name: "Mikail",
    aliases: ["mikail", "mika"],
    technique: 2.0,
    cardio: 4.0,
    overall: Math.round(((2.0 * 0.6 + 4.0 * 0.4) * 2) * 10) / 10, // 5.6/10
  },
  emre: {
    name: "Emre",
    aliases: ["emre"],
    technique: 3.5,
    cardio: 4.5,
    overall: Math.round(((3.5 * 0.6 + 4.5 * 0.4) * 2) * 10) / 10, // 7.8/10
  },
  djerry: {
    name: "Djerry",
    aliases: ["djerry"],
    technique: 1.75,
    cardio: 3.5,
    overall: Math.round(((1.75 * 0.6 + 3.5 * 0.4) * 2) * 10) / 10, // 4.9/10
  },
  axel: {
    name: "Axel",
    aliases: ["axel"],
    technique: 4.0,
    cardio: 4.5,
    overall: Math.round(((4.0 * 0.6 + 4.5 * 0.4) * 2) * 10) / 10, // 8.4/10
  },
  mohamed: {
    name: "Mohamed",
    aliases: ["mohamed", "momo"],
    technique: 3.5,
    cardio: 3.0,
    overall: Math.round(((3.5 * 0.6 + 3.0 * 0.4) * 2) * 10) / 10, // 6.6/10
  },
  soufiane: {
    name: "Soufiane",
    aliases: ["soufiane", "souf"],
    technique: 4.0,
    cardio: 4.5,
    overall: Math.round(((4.0 * 0.6 + 4.5 * 0.4) * 2) * 10) / 10, // 8.4/10
  },
  sekou: {
    name: "Sekou",
    aliases: ["sekou"],
    technique: 3.25,
    cardio: 4.0,
    overall: Math.round(((3.25 * 0.6 + 4.0 * 0.4) * 2) * 10) / 10, // 7.1/10
  },
  dylan: {
    name: "Dylan",
    aliases: ["dylan"],
    technique: 4.25,
    cardio: 4.25,
    overall: Math.round(((4.25 * 0.6 + 4.25 * 0.4) * 2) * 10) / 10, // 8.5/10
  },
  mehmet: {
    name: "Mehmet",
    aliases: ["mehmet"],
    technique: 2.5,
    cardio: 3.0,
    overall: Math.round(((2.5 * 0.6 + 3.0 * 0.4) * 2) * 10) / 10, // 5.4/10
  },
  souley: {
    name: "Souley",
    aliases: ["souley", "souleymane"],
    technique: 3.5,
    cardio: 3.0,
    overall: Math.round(((3.5 * 0.6 + 3.0 * 0.4) * 2) * 10) / 10, // 6.6/10
  },
  mamarou: {
    name: "Mamarou",
    aliases: ["mamarou", "mamadou", "mams"],
    technique: 4.25,
    cardio: 4.5,
    overall: Math.round(((4.25 * 0.6 + 4.5 * 0.4) * 2) * 10) / 10, // 8.7/10
  },
};

export function getPlayerRating(playerNameOrCustom: string | null | undefined): PlayerRating {
  if (!playerNameOrCustom) {
    return { name: "Joueur", aliases: [], technique: 2.5, cardio: 3.5, overall: 5.8 };
  }

  const clean = playerNameOrCustom.trim().toLowerCase();
  
  for (const key of Object.keys(PLAYER_RATINGS)) {
    const p = PLAYER_RATINGS[key];
    if (key === clean || p.aliases.some((a) => clean.includes(a) || a.includes(clean))) {
      return p;
    }
  }

  // Default fallback rating
  return {
    name: playerNameOrCustom,
    aliases: [],
    technique: 2.5,
    cardio: 3.5,
    overall: 5.8,
  };
}
