import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlayerRating } from "@/lib/playerRatings";
import { DEMO_USERS } from "@/lib/demoData";

interface PlayerInput {
  id?: string;
  name: string;
  image?: string | null;
  technique?: number;
  cardio?: number;
  overall: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { playerIds = [], customPlayers = [] } = body;

    let players: PlayerInput[] = [];

    // 1. Fetch DB players or Demo players
    if (playerIds.length > 0) {
      const demoMatches = DEMO_USERS.filter((u) => playerIds.includes(u.id));
      if (demoMatches.length > 0) {
        players = demoMatches.map((u) => {
          const overall = Math.round(((u.technique * 0.6 + u.cardio * 0.4) * 2) * 10) / 10;
          return {
            id: u.id,
            name: u.customName || u.name,
            image: u.image,
            technique: u.technique,
            cardio: u.cardio,
            overall,
          };
        });
      } else {
        const dbUsers = await prisma.user.findMany({
          where: { id: { in: playerIds } },
          select: {
            id: true,
            name: true,
            customName: true,
            image: true,
            technique: true,
            cardio: true,
          },
        });

        players = dbUsers.map((u) => {
          const displayName = u.customName || u.name || "Joueur";
          const hardcoded = getPlayerRating(displayName);
          const technique = u.technique ?? hardcoded.technique;
          const cardio = u.cardio ?? hardcoded.cardio;
          const overall = Math.round(((technique * 0.6 + cardio * 0.4) * 2) * 10) / 10;
          return {
            id: u.id,
            name: displayName,
            image: u.image,
            technique,
            cardio,
            overall,
          };
        });
      }
    }

    // 2. Add any custom / guest players
    if (customPlayers.length > 0) {
      const allDbUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          customName: true,
          image: true,
          technique: true,
          cardio: true,
        },
      });

      customPlayers.forEach((cp: any) => {
        const cpName = (cp.name || "").trim().toLowerCase();
        const matchedDbUser = allDbUsers.find(
          (u) =>
            (u.customName && u.customName.toLowerCase() === cpName) ||
            (u.name && u.name.toLowerCase().includes(cpName)) ||
            (u.customName && cpName.includes(u.customName.toLowerCase()))
        );

        const displayName = cp.name || matchedDbUser?.customName || matchedDbUser?.name || "Invité";
        const hardcoded = getPlayerRating(displayName);
        const technique = cp.technique ?? matchedDbUser?.technique ?? hardcoded.technique;
        const cardio = cp.cardio ?? matchedDbUser?.cardio ?? hardcoded.cardio;
        const overall = Math.round(((technique * 0.6 + cardio * 0.4) * 2) * 10) / 10;

        players.push({
          id: matchedDbUser?.id,
          name: displayName,
          image: matchedDbUser?.image || null,
          technique,
          cardio,
          overall,
        });
      });
    }

    if (players.length < 2) {
      return NextResponse.json(
        { error: "Au moins 2 joueurs requis pour générer des équipes" },
        { status: 400 }
      );
    }

    // Balancing algorithm:
    // Sort by overall strength descending, then greedily distribute
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    shuffled.sort((a, b) => b.overall - a.overall);

    const team1: PlayerInput[] = [];
    const team2: PlayerInput[] = [];
    let sum1 = 0;
    let sum2 = 0;

    const targetTeamSize = Math.ceil(players.length / 2);

    shuffled.forEach((player) => {
      const level = player.overall;

      if (team1.length < targetTeamSize && (sum1 <= sum2 || team2.length >= targetTeamSize)) {
        team1.push(player);
        sum1 += level;
      } else {
        team2.push(player);
        sum2 += level;
      }
    });

    const diff = Math.abs(Math.round((sum1 - sum2) * 10) / 10);

    return NextResponse.json({
      team1,
      team2,
      team1TotalLevel: Math.round(sum1 * 10) / 10,
      team2TotalLevel: Math.round(sum2 * 10) / 10,
      difference: diff,
      totalPlayers: players.length,
    });
  } catch (error) {
    console.error("Team Generator Error:", error);
    return NextResponse.json({ error: "Failed to generate teams" }, { status: 500 });
  }
}
