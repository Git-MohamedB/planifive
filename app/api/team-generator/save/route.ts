import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { slotLabel, date, location, team1 = [], team2 = [] } = body;

    const team1PlayerNames = team1.map((p: any) => (p.customName || p.name || "Joueur").trim());
    const team2PlayerNames = team2.map((p: any) => (p.customName || p.name || "Joueur").trim());

    // 1. Auto-create the Match in History
    let createdMatch = null;
    if (team1PlayerNames.length > 0 && team2PlayerNames.length > 0) {
      createdMatch = await prisma.match.create({
        data: {
          date: date ? new Date(date) : new Date(),
          location: location || "Five",
          scoreTeam1: 0,
          scoreTeam2: 0,
          team1Names: JSON.stringify(team1PlayerNames),
          team2Names: JSON.stringify(team2PlayerNames),
        },
      });
    }

    // 2. Format Discord Embed
    const team1Names = team1PlayerNames.map((name: string, i: number) => `**${i + 1}.** ${name}`).join("\n");
    const team2Names = team2PlayerNames.map((name: string, i: number) => `**${i + 1}.** ${name}`).join("\n");

    const embed = {
      title: "⚽ COMPOSITION DES ÉQUIPES DU FIVE",
      description: slotLabel ? `📅 **Créneau retenu :** ${slotLabel}` : "Composition validée pour le match",
      color: 0x22c55e,
      fields: [
        {
          name: `🟢 ÉQUIPE 1 (${team1.length} joueurs)`,
          value: team1Names || "Aucun joueur",
          inline: true,
        },
        {
          name: `⚪ ÉQUIPE 2 (${team2.length} joueurs)`,
          value: team2Names || "Aucun joueur",
          inline: true,
        },
      ],
      footer: {
        text: `Planifive • Validé par ${session?.user?.name || "Organisateur"}`,
      },
      timestamp: new Date().toISOString(),
    };

    const content = `📢 **Les équipes pour le Five sont prêtes !** (${slotLabel || "Match de la semaine"})`;

    await sendDiscordWebhook(embed, content);

    return NextResponse.json({
      success: true,
      message: "Équipes validées, match ajouté à l'historique et publié sur Discord !",
      match: createdMatch,
    });
  } catch (error) {
    console.error("Error saving teams and sending to Discord:", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement et de l'envoi Discord" }, { status: 500 });
  }
}
