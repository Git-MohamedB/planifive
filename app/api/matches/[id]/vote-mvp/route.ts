import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Connectez-vous pour voter pour le MVP" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { votedPlayerName } = body;

    if (!votedPlayerName || typeof votedPlayerName !== "string") {
      return NextResponse.json({ error: "Joueur invalide" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
    });

    if (!match) {
      return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
    }

    const voterId = (session.user.id || session.user.email || session.user.name || "anon").trim();

    let currentVotes: Record<string, string> = {};
    try {
      const rawVotes = (match as any).mvpVotes;
      if (rawVotes) {
        currentVotes = JSON.parse(rawVotes);
      }
    } catch {
      currentVotes = {};
    }

    // Record or update user's vote
    currentVotes[voterId] = votedPlayerName.trim();

    // Calculate the MVP with the most votes
    const voteCounts: Record<string, number> = {};
    Object.values(currentVotes).forEach((name) => {
      voteCounts[name] = (voteCounts[name] || 0) + 1;
    });

    let topPlayer = "";
    let maxVotes = 0;
    Object.entries(voteCounts).forEach(([name, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        topPlayer = name;
      }
    });

    const votesJson = JSON.stringify(currentVotes);

    // Save directly to PostgreSQL (handles both raw SQL and Prisma Client)
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Match" SET "mvpVotes" = $1, "mvpWinner" = $2 WHERE "id" = $3`,
        votesJson,
        topPlayer,
        id
      );
    } catch (sqlErr) {
      console.warn("Raw SQL update fallback to prisma update:", sqlErr);
      await (prisma.match as any).update({
        where: { id },
        data: {
          mvpVotes: votesJson,
          mvpWinner: topPlayer,
        },
      });
    }

    return NextResponse.json({
      success: true,
      mvpWinner: topPlayer,
      mvpVotes: currentVotes,
      voteCounts,
      myVote: currentVotes[voterId],
    });
  } catch (error: any) {
    console.error("MVP Vote Error:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur lors du vote" }, { status: 500 });
  }
}
