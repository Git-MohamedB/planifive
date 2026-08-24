import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: "DISCORD_WEBHOOK_URL is not configured" }, { status: 500 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Current Monday
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(today);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(currentMonday);
    nextSunday.setDate(currentMonday.getDate() + 7);

    // 1. Fetch Dispos
    const weekAvailabilities = await prisma.availability.findMany({
      where: {
        date: { gte: currentMonday, lt: nextSunday },
      },
      include: {
        user: {
          select: { id: true, name: true, customName: true },
        },
      },
    });

    // Compute unique players
    const playersSet = new Set<string>();
    weekAvailabilities.forEach((a: any) => {
      if (a.user) {
        playersSet.add(a.user.customName || a.user.name || "Joueur");
      }
    });

    // Compute top slots
    const slotsMap = new Map<string, { date: string; hour: number; count: number }>();
    weekAvailabilities.forEach((a: any) => {
      const dStr = a.date.toISOString().split("T")[0];
      const key = `${dStr}-${a.hour}`;
      if (!slotsMap.has(key)) {
        slotsMap.set(key, { date: dStr, hour: a.hour, count: 0 });
      }
      slotsMap.get(key)!.count++;
    });

    const sortedSlots = Array.from(slotsMap.values()).sort((a, b) => b.count - a.count);
    const topSlots = sortedSlots.slice(0, 3);

    // 2. Fetch Leaderboard Top Player
    const matches = await prisma.match.findMany({
      orderBy: { date: "desc" },
      take: 20,
      include: { team1: true, team2: true },
    });

    const playerWins: Record<string, number> = {};
    matches.forEach((m) => {
      const t1Won = m.scoreTeam1 > m.scoreTeam2;
      const t2Won = m.scoreTeam2 > m.scoreTeam1;
      if (t1Won) {
        m.team1.forEach((u) => {
          const n = u.name || "Joueur";
          playerWins[n] = (playerWins[n] || 0) + 1;
        });
      } else if (t2Won) {
        m.team2.forEach((u) => {
          const n = u.name || "Joueur";
          playerWins[n] = (playerWins[n] || 0) + 1;
        });
      }
    });

    const sortedMvp = Object.entries(playerWins).sort((a, b) => b[1] - a[1]);
    const mvpName = sortedMvp[0]?.[0] || "Aucun pour l'instant";
    const mvpWins = sortedMvp[0]?.[1] || 0;

    const daysFr = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    let slotsText = "Aucun créneau rempli pour l'instant.";
    if (topSlots.length > 0) {
      slotsText = topSlots
        .map((s, idx) => {
          const d = new Date(s.date);
          const dayName = daysFr[d.getDay()];
          const icon = s.count >= 10 ? "🔥" : "⚽";
          return `**${idx + 1}. ${dayName} ${d.getDate()}/${d.getMonth() + 1} à ${s.hour}h00** : **${s.count}/10 joueurs** ${icon}`;
        })
        .join("\n");
    }

    const embed = {
      title: "📊 RÉSUMÉ HEBDOMADAIRE DU FIVE ⚽",
      description: `Voici le point sur les disponibilités et la forme du groupe pour la semaine du **${currentMonday.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}** !`,
      color: 0x22c55e,
      fields: [
        {
          name: "👥 Joueurs Prêts",
          value: `**${playersSet.size}** joueur(s) ont posé leurs dispos`,
          inline: true,
        },
        {
          name: "👑 Joueur en Forme",
          value: `**${mvpName}** (${mvpWins} victoires)`,
          inline: true,
        },
        {
          name: "🔥 Meilleurs Créneaux de la Semaine",
          value: slotsText,
          inline: false,
        },
      ],
      footer: {
        text: "Planifive • Organise tes sessions de Five",
      },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      content: "📢 **Point Hebdomadaire Planifive disponible !**",
      embeds: [embed],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "📅 Ouvrir le Planning",
              url: process.env.NEXTAUTH_URL || "http://localhost:3000",
            },
          ],
        },
      ],
    };

    const discordRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return NextResponse.json({ error: "Discord Webhook failed", details: errText }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Weekly summary posted to Discord" });
  } catch (error) {
    console.error("Weekly Summary Discord Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
