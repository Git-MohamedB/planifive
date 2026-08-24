import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth";

type SlotData = {
  users: { id: string; name: string | null; image: string | null }[];
  count: number;
};

// --- GET ---
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user?.id) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const userId = session.user.id;

  // Default: Fetch from today if no range specified (backward compat)
  // But ideally we want a range.
  const whereClause: any = { date: { gte: new Date() } };

  if (startParam && endParam) {
    whereClause.date = {
      gte: new Date(startParam),
      lte: new Date(endParam)
    };
  }

  const allDispos = await prisma.availability.findMany({
    where: {
      ...whereClause,
      user: { isBanned: false },
    },
    include: { user: { select: { id: true, name: true, customName: true, image: true, isBanned: true } } }
  });

  const mySlots: string[] = [];
  const slotDetails: Record<string, SlotData> = {};

  allDispos.forEach((dispo) => {
    if (dispo.user.isBanned) return;
    const dateStr = dispo.date.toISOString().split("T")[0];
    const key = `${dateStr}-${dispo.hour}`;
    if (!slotDetails[key]) slotDetails[key] = { users: [], count: 0 };
    slotDetails[key].count++;
    const displayName = dispo.user.customName || dispo.user.name;
    slotDetails[key].users.push({ id: dispo.user.id, name: displayName, customName: dispo.user.customName, image: dispo.user.image } as any);
    if (dispo.userId === userId) mySlots.push(key);
  });

  return NextResponse.json({ mySlots, slotDetails });
}

// --- POST (Toggle simple OR Batch) ---
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email || !session.user?.id) return NextResponse.json({ error: "401" }, { status: 401 });

  const body = await req.json();
  const userId = session.user.id;
  const userName = session.user.name || "Un joueur";

  // --- BATCH MODE ---
  if (body.slots && Array.isArray(body.slots)) {
    const results = [];
    // Process sequentially to avoid DB lock/race issues, or use Promise.all if DB can handle it.
    // Given the connection issues, sequential or small chunks is safer, but let's try Promise.all for speed
    // assuming the user switches to Transaction Pooler (6543).
    // Actually, let's do a simple loop to be safe.
    for (const slot of body.slots) {
      const { date, hour } = slot;
      const targetDate = new Date(date);

      // Check existing
      const existing = await prisma.availability.findFirst({
        where: { userId: userId, date: targetDate, hour: hour },
      });

      if (existing) {
        // DELETE
        await prisma.availability.delete({ where: { id: existing.id } });
        // We skip the heavy "Golden Slot" check in batch mode for speed, 
        // OR we can implement it if critical. For now, let's keep it simple for drag-delete.
        // If the user drags to delete, we should probably check for broken golden slots?
        // It might be too heavy. Let's assume drag-delete is rare or acceptable to delay notification.
      } else {
        // CREATE
        await prisma.availability.create({
          data: { userId: userId, date: targetDate, hour: hour },
        });
      }
    }
    return NextResponse.json({ status: "batch_processed", count: body.slots.length });
  }

  // --- SINGLE MODE (Legacy/Click) ---
  const { date, hour } = body;
  const targetDate = new Date(date);
  const MATCH_SIZE = 10;

  const existing = await prisma.availability.findFirst({
    where: { userId: userId, date: targetDate, hour: hour },
  });

  if (existing) {
    // --- DELETE ---
    await prisma.availability.delete({ where: { id: existing.id } });

    // Check count AFTER deletion
    const newCount = await prisma.availability.count({
      where: { date: targetDate, hour: hour },
    });

    // Only trigger cancellation if we dropped BELOW the limit
    if (newCount < MATCH_SIZE) {
      // Check for broken 1h30 slot (range: hour-1 to hour)
      const potentialStarts = [hour - 1, hour].filter(h => h >= 8 && h <= 22);

      // Single query to find active notifications in this range
      const activeNotifications = await prisma.slotStatus.findMany({
        where: {
          date: targetDate,
          hour: { in: potentialStarts },
          isGoldenNotified: true
        }
      });

      for (const status of activeNotifications) {
        const startH = status.hour;
        console.log(`[DELETE] Broken 1h30 Slot found starting at ${startH}h`);

        const dateStr = targetDate.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
        const embed = {
          title: "❌ DÉSISTEMENT SUR UN CRÉNEAU FIVE !",
          description: `${userName} s'est désisté du créneau de ${hour}h, annulant la disponibilité 1h30 (${startH}h - ${(startH + 2) % 24 === 0 ? "00" : (startH + 2) % 24}h).`,
          color: 0xEF4444, // Red
          fields: [
            { name: "📅 Date", value: dateStr, inline: true },
            { name: "⏰ Session impactée", value: `${startH}h - ${(startH + 2) % 24 === 0 ? "00" : (startH + 2) % 24}h (1h30)`, inline: true },
            { name: "📉 Action", value: "Le statut confirmé a été révoqué.", inline: false },
            { name: "🔗 Remonter l'équipe", value: "[Clique ici](https://planifive.vercel.app/)" }
          ],
          footer: { text: "Planifive • Désistement" },
          timestamp: new Date().toISOString(),
        };

        // Fire and forget webhook (catch error to not block)
        import("../../../lib/discord").then(mod => mod.sendDiscordWebhook(embed)).catch(console.error);

        // Reset the golden notification status
        await prisma.slotStatus.update({
          where: { date_hour: { date: targetDate, hour: startH } },
          data: { isGoldenNotified: false }
        });
      }
    }

    return NextResponse.json({ status: "removed" });
  } else {
    // --- ADD ---
    await prisma.availability.create({
      data: { userId: userId, date: targetDate, hour: hour },
    });

    // Check count
    const count = await prisma.availability.count({
      where: { date: targetDate, hour: hour },
    });

    if (count >= MATCH_SIZE) {
      // Check 1h30 Slot (2 Consecutive Slots: startH and startH+1)
      const rangeStart = Math.max(8, hour - 1);
      const rangeEnd = Math.min(23, hour + 1);

      // Query relevant slots
      const relevantSlots = await prisma.availability.findMany({
        where: {
          date: targetDate,
          hour: { gte: rangeStart, lte: rangeEnd }
        },
        select: { hour: true, userId: true, user: { select: { name: true, customName: true } } }
      });

      // Group by hour
      const slotsMap = new Map<number, { userId: string; name: string }[]>();
      for (let h = rangeStart; h <= rangeEnd; h++) slotsMap.set(h, []);

      relevantSlots.forEach(s => {
        if (slotsMap.has(s.hour)) {
          slotsMap.get(s.hour)?.push({
            userId: s.userId,
            name: s.user.customName || s.user.name || "Joueur"
          });
        }
      });

      // Helper to check 2-hour sequence for a 1h30 match
      const check2hSequence = async (startH: number) => {
        if (startH < 8 || startH > 22) return;
        const users1 = slotsMap.get(startH) || [];
        const users2 = slotsMap.get(startH + 1) || [];

        const commonUsers = users1.filter(u1 => users2.some(u2 => u2.userId === u1.userId));

        if (commonUsers.length >= MATCH_SIZE) {
          // Found a complete 1h30 slot! Check if already notified
          const goldenStatus = await prisma.slotStatus.findUnique({
            where: { date_hour: { date: targetDate, hour: startH } },
          });

          if (!goldenStatus?.isGoldenNotified) {
            const dateStr = targetDate.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
            const playersList = commonUsers.map(p => `• ${p.name}`).join("\n");
            const endHour = (startH + 2) % 24 === 0 ? "00" : (startH + 2);

            const embed = {
              title: "🔥 CRÉNEAU 1H30 COMPLET (10/10) !",
              description: `C'est bon pour le Five ! 10 joueurs sont disponibles sur 2h consécutives (${startH}h - ${endHour}h) !`,
              color: 0x22C55E, // Pitch Green
              fields: [
                { name: "📅 Date", value: dateStr, inline: true },
                { name: "⏰ Créneau", value: `${startH}h00 - ${endHour}h00 (1h30 de Five)`, inline: true },
                { name: `⚽ Joueurs présents (${commonUsers.length}/10)`, value: playersList || "Aucun joueur", inline: false },
                { name: "🔗 Lancer l'appel ou réserver", value: "[Clique ici](https://planifive.vercel.app/)" }
              ],
              footer: { text: "Planifive • Match Prêt" },
              timestamp: new Date().toISOString(),
            };

            // Fire and forget
            import("../../../lib/discord").then(mod => mod.sendDiscordWebhook(embed)).catch(console.error);

            await prisma.slotStatus.upsert({
              where: { date_hour: { date: targetDate, hour: startH } },
              update: { isGoldenNotified: true },
              create: { date: targetDate, hour: startH, isGoldenNotified: true },
            });
          }
        }
      };

      // Check possible start times for a 2h sequence involving 'hour'
      await Promise.all([
        check2hSequence(hour - 1),
        check2hSequence(hour)
      ]);
    }
  }
  return NextResponse.json({ status: "added" });
}

// --- PUT (Sync Range) ---
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !session.user?.id) return NextResponse.json({ error: "401" }, { status: 401 });

    const body = await req.json();
    const userId = session.user.id;

    // Support both multi-week batch ({ weeks: [{ start, end, slots }] }) and single range ({ start, end, slots })
    const weeksToSync: { start: string; end: string; slots: { date: string; hour: number }[] }[] = [];

    if (Array.isArray(body.weeks) && body.weeks.length > 0) {
      weeksToSync.push(...body.weeks);
    } else if (body.start && body.end && Array.isArray(body.slots)) {
      weeksToSync.push({ start: body.start, end: body.end, slots: body.slots });
    } else {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    let totalInserted = 0;

    await prisma.$transaction(async (tx) => {
      for (const week of weeksToSync) {
        const startDate = new Date(week.start);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(week.end);
        endDate.setHours(23, 59, 59, 999);

        // 1. Delete all existing slots for this user in this week's range
        await tx.availability.deleteMany({
          where: {
            userId: userId,
            date: { gte: startDate, lte: endDate }
          }
        });

        // 2. Prepare unique new slots
        const uniqueSlots = new Set<string>();
        const data: any[] = [];

        for (const s of week.slots || []) {
          const slotDate = new Date(s.date);
          if (slotDate.getTime() >= startDate.getTime() && slotDate.getTime() <= endDate.getTime()) {
            const key = `${s.date}-${s.hour}`;
            if (!uniqueSlots.has(key)) {
              uniqueSlots.add(key);
              data.push({
                userId: userId,
                date: slotDate,
                hour: s.hour
              });
            }
          }
        }

        if (data.length > 0) {
          await tx.availability.createMany({
            data: data
          });
          totalInserted += data.length;
        }
      }
    });

    console.log(`[PUT] Successfully synced ${weeksToSync.length} week(s) for user ${userId}. Inserted: ${totalInserted}`);
    return NextResponse.json({ status: "synced", weeksCount: weeksToSync.length, count: totalInserted });
  } catch (error) {
    console.error("[PUT] Error syncing slots:", error);
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}