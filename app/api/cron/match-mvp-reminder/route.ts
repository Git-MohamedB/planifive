import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    // Security check for Cron
    const authHeader = req.headers.get("authorization");
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    // 2 hours ago threshold (matches ended at least 2h ago and within the last 30 hours)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const thirtyHoursAgo = new Date(now.getTime() - 30 * 60 * 60 * 1000);

    // Fetch matches in that window without a decided MVP winner
    const matches = await prisma.match.findMany({
      where: {
        date: {
          gte: thirtyHoursAgo,
          lte: twoHoursAgo,
        },
        mvpWinner: null,
      },
      orderBy: { date: "desc" },
    });

    if (matches.length === 0) {
      return NextResponse.json({ message: "Aucun match récent nécessitant un vote MVP." });
    }

    // Fetch all active users with Discord accounts to ping them
    const allUsers = await prisma.user.findMany({
      where: { isBanned: false },
      include: {
        accounts: {
          where: { provider: "discord" },
        },
      },
    });

    const userByNameOrCustom: Record<string, { discordId?: string; name: string }> = {};
    allUsers.forEach((u) => {
      const discordId = u.accounts[0]?.providerAccountId;
      if (u.name) {
        userByNameOrCustom[u.name.toLowerCase().trim()] = { discordId, name: u.name };
      }
      if (u.customName) {
        userByNameOrCustom[u.customName.toLowerCase().trim()] = { discordId, name: u.customName };
      }
    });

    const results = [];
    const baseUrl = process.env.NEXTAUTH_URL || "https://planifive.vercel.app";

    for (const match of matches) {
      let team1Names: string[] = [];
      let team2Names: string[] = [];
      try {
        team1Names = match.team1Names ? JSON.parse(match.team1Names) : [];
      } catch {
        team1Names = [];
      }
      try {
        team2Names = match.team2Names ? JSON.parse(match.team2Names) : [];
      } catch {
        team2Names = [];
      }

      const allPlayers = [...team1Names, ...team2Names].filter(Boolean);
      if (allPlayers.length === 0) continue;

      // Collect Discord mentions for participants
      const mentions: string[] = [];
      allPlayers.forEach((pName) => {
        const found = userByNameOrCustom[pName.toLowerCase().trim()];
        if (found?.discordId) {
          mentions.push(`<@${found.discordId}>`);
        }
      });

      const formattedDate = new Date(match.date).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });

      const mentionsContent = mentions.length > 0 ? mentions.join(" ") : undefined;

      await sendDiscordWebhook(
        {
          title: "👑 Élection du MVP du Match !",
          description: `Le Five de **${formattedDate}** est terminé depuis 2h ! Le temps de rentrer et souffler est passé, c'est maintenant l'heure d'élire le **MVP de la rencontre** ⚡\n\n[👉 **Cliquez ici pour voter sur Planifive**](${baseUrl}/history)`,
          fields: [
            {
              name: "🏆 Score Final",
              value: `**Équipe 1** ${match.scoreTeam1} - ${match.scoreTeam2} **Équipe 2**`,
              inline: false,
            },
            {
              name: "🔵 Équipe 1",
              value: team1Names.length > 0 ? team1Names.join(", ") : "—",
              inline: true,
            },
            {
              name: "🔴 Équipe 2",
              value: team2Names.length > 0 ? team2Names.join(", ") : "—",
              inline: true,
            },
            {
              name: "🗳️ Comment voter ?",
              value: `Rendez-vous dans la section **Historique** pour attribuer votre vote à votre coéquipier ou adversaire préféré !`,
              inline: false,
            },
          ],
          color: 0xf59e0b, // Gold/Amber
          url: `${baseUrl}/history`,
          footer: {
            text: "Planifive • Système de Vote MVP",
          },
        },
        mentionsContent
      );

      results.push({ matchId: match.id, date: match.date, playersNotified: allPlayers.length });
    }

    return NextResponse.json({
      success: true,
      matchesProcessed: results.length,
      details: results,
    });
  } catch (error: any) {
    console.error("Error in match-mvp-reminder cron:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du rappel MVP" },
      { status: 500 }
    );
  }
}
