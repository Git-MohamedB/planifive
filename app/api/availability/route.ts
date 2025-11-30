import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth";

type SlotData = {
  users: { id: string; name: string | null; image: string | null }[];
  count: number;
};

// --- GET ---
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User introuvable" }, { status: 404 });

  const allDispos = await prisma.availability.findMany({
    where: { date: { gte: new Date() } },
    include: { user: { select: { id: true, name: true, image: true } } }
  });

  const mySlots: string[] = [];
  const slotDetails: Record<string, SlotData> = {};

  allDispos.forEach((dispo) => {
    const dateStr = dispo.date.toISOString().split("T")[0];
    const key = `${dateStr}-${dispo.hour}`;
    if (!slotDetails[key]) slotDetails[key] = { users: [], count: 0 };
    slotDetails[key].count++;
    slotDetails[key].users.push({ id: dispo.user.id, name: dispo.user.name, image: dispo.user.image });
    if (dispo.userId === user.id) mySlots.push(key);
  });

  return NextResponse.json({ mySlots, slotDetails });
}

// --- POST (Toggle simple) ---
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "401" }, { status: 401 });

  const { date, hour } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "404" }, { status: 404 });

  const targetDate = new Date(date);
  const MATCH_SIZE = 10; // Set to 10 as requested

  const existing = await prisma.availability.findFirst({
    where: { userId: user.id, date: targetDate, hour: hour },
  });

  if (existing) {
    // Deleting availability
    await prisma.availability.delete({ where: { id: existing.id } });

    // Check count AFTER deletion
    const newCount = await prisma.availability.count({
      where: { date: targetDate, hour: hour },
    });

    // Only trigger cancellation if we dropped BELOW the limit
    if (newCount < MATCH_SIZE) {
      // --- CHECK FOR BROKEN GOLDEN SLOT ---
      console.log(`[DELETE] Count dropped to ${newCount} (Limit ${MATCH_SIZE}). Checking for broken golden slot...`);
      const potentialStarts = [hour - 2, hour - 1, hour];

      for (const startH of potentialStarts) {
        if (startH < 8 || startH > 21) continue;

        const status = await prisma.slotStatus.findUnique({
          where: { date_hour: { date: targetDate, hour: startH } },
        });

        if (status?.isGoldenNotified) {
          console.log(`[DELETE] Broken Golden Slot found starting at ${startH}h`);

          const dateStr = targetDate.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
          const embed = {
            title: "❌ DÉSISTEMENT SUR UN MATCH 3H !",
            description: `${user.name || "Un joueur"} s'est désisté du créneau de ${hour}h, annulant la session de 3h (${startH}h - ${startH + 3}h).`,
            color: 0xEF4444, // Red
            fields: [
              { name: "📅 Date", value: dateStr, inline: true },
              { name: "⏰ Session impactée", value: `${startH}h - ${startH + 3}h`, inline: true },
              { name: "📉 Action", value: "Le statut confirmé a été révoqué.", inline: false },
              { name: "🔗 Remonter l'équipe", value: "[Clique ici](https://five-planner.vercel.app/)" }
            ],
            footer: { text: "Planifive • Désistement" },
            timestamp: new Date().toISOString(),
          };

          const { sendDiscordWebhook } = await import("../../../lib/discord");
          await sendDiscordWebhook(embed);

          // Reset the golden notification status
          await prisma.slotStatus.update({
            where: { date_hour: { date: targetDate, hour: startH } },
            data: { isGoldenNotified: false }
          });
        }
      }
    }

    return NextResponse.json({ status: "removed" });
  } else {
    // Adding availability
    await prisma.availability.create({
      data: { userId: user.id, date: targetDate, hour: hour },
    });

    // --- CHECK FULL FIVE ---
    const count = await prisma.availability.count({
      where: { date: targetDate, hour: hour },
    });

    if (count >= MATCH_SIZE) {
      // 1. Single Slot Notification -> DISABLED as per user request
      /*
      const status = await prisma.slotStatus.findUnique({
        where: { date_hour: { date: targetDate, hour: hour } },
      });

      if (!status?.isFullNotified) {
         ...
      }
      */

      // 2. Check Golden Slot (3 Consecutive Slots)
      const hoursToCheck = [hour - 2, hour - 1, hour, hour + 1, hour + 2];
      const slotsData = await Promise.all(hoursToCheck.map(async (h) => {
        if (h < 8 || h > 23) return { count: 0, users: [] };
        const users = await prisma.availability.findMany({
          where: { date: targetDate, hour: h },
          include: { user: true }
        });
        return { count: users.length, users: users.map(u => u.user.name || "Inconnu") };
      }));

      // Check for sequence of 3
      let goldenStartHour = -1;
      let goldenPlayers: string[] = [];

      if (slotsData[0].count >= MATCH_SIZE && slotsData[1].count >= MATCH_SIZE && slotsData[2].count >= MATCH_SIZE) {
        goldenStartHour = hour - 2;
        const allPlayers = [...slotsData[0].users, ...slotsData[1].users, ...slotsData[2].users];
        goldenPlayers = Array.from(new Set(allPlayers));
      }
      else if (slotsData[1].count >= MATCH_SIZE && slotsData[2].count >= MATCH_SIZE && slotsData[3].count >= MATCH_SIZE) {
        goldenStartHour = hour - 1;
        const allPlayers = [...slotsData[1].users, ...slotsData[2].users, ...slotsData[3].users];
        goldenPlayers = Array.from(new Set(allPlayers));
      }
      else if (slotsData[2].count >= MATCH_SIZE && slotsData[3].count >= MATCH_SIZE && slotsData[4].count >= MATCH_SIZE) {
        goldenStartHour = hour;
        const allPlayers = [...slotsData[2].users, ...slotsData[3].users, ...slotsData[4].users];
        goldenPlayers = Array.from(new Set(allPlayers));
      }

      if (goldenStartHour !== -1) {
        const goldenStatus = await prisma.slotStatus.findUnique({
          where: { date_hour: { date: targetDate, hour: goldenStartHour } },
        });

        if (!goldenStatus?.isGoldenNotified) {
          const dateStr = targetDate.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
          const playersList = goldenPlayers.map(p => `• ${p}`).join("\n");

          const embed = {
            title: "🏆 MATCH 3H CONFIRMÉ !",
            description: `Incroyable ! 3 créneaux consécutifs sont complets (${goldenStartHour}h - ${goldenStartHour + 3}h) !`,
            color: 0xFACC15, // Gold
            fields: [
              { name: "📅 Date", value: dateStr, inline: true },
              { name: "⏰ Créneaux", value: `${goldenStartHour}h - ${goldenStartHour + 1}h - ${goldenStartHour + 2}h`, inline: true },
              { name: "⚽ Joueurs présents", value: playersList || "Aucun joueur trouvé", inline: false },
              { name: "🔗 Rejoindre", value: "[Clique ici](https://five-planner.vercel.app/)" }
            ],
            footer: { text: "Planifive • Golden Session" },
            timestamp: new Date().toISOString(),
          };

          const { sendDiscordWebhook } = await import("../../../lib/discord");
          await sendDiscordWebhook(embed);

          await prisma.slotStatus.upsert({
            where: { date_hour: { date: targetDate, hour: goldenStartHour } },
            update: { isGoldenNotified: true },
            create: { date: targetDate, hour: goldenStartHour, isGoldenNotified: true },
          });
        }
      }
    }

    return NextResponse.json({ status: "added" });
  }
}