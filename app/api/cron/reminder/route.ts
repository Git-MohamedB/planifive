import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        // Security Check
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Find the most popular 4H slot in the next 21 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const searchEnd = new Date(today);
        searchEnd.setDate(today.getDate() + 21);

        // Fetch all availabilities for the next 21 days
        const availabilities = await prisma.availability.findMany({
            where: {
                date: {
                    gte: today,
                    lt: searchEnd,
                },
            },
            select: {
                userId: true,
                date: true,
                hour: true,
            },
        });

        if (availabilities.length === 0) {
            return NextResponse.json({ message: "No active slots found" });
        }

        // Group by Date -> Hour -> Set(UserIds)
        const slotsByDate: Record<string, Record<number, Set<string>>> = {};

        availabilities.forEach((av) => {
            const dateKey = av.date.toISOString().split('T')[0]; // YYYY-MM-DD
            if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = {};
            }
            if (!slotsByDate[dateKey][av.hour]) {
                slotsByDate[dateKey][av.hour] = new Set();
            }
            slotsByDate[dateKey][av.hour].add(av.userId);
        });

        let bestSlot = null;
        let maxCount = -1;

        // 1. Iterate through each day and find 2-hour windows (1h30 Five match)
        for (const [dateKey, hoursMap] of Object.entries(slotsByDate)) {
            for (let h = 8; h <= 22; h++) {
                const u1 = hoursMap[h];
                const u2 = hoursMap[h + 1];

                if (!u1 || !u2) continue;

                // Find intersection: Users present on both consecutive hours
                const intersection = new Set(
                    [...u1].filter(x => u2.has(x))
                );

                const count = intersection.size;
                const currentSlotDate = new Date(dateKey);

                if (count > maxCount) {
                    maxCount = count;
                    bestSlot = {
                        dateStr: dateKey,
                        startHour: h,
                        endHour: h + 2,
                        durationStr: "1h30",
                        count: count,
                        users: Array.from(intersection)
                    };
                } else if (count === maxCount && bestSlot) {
                    const bestSlotDate = new Date(bestSlot.dateStr);
                    if (currentSlotDate < bestSlotDate || (currentSlotDate.getTime() === bestSlotDate.getTime() && h < bestSlot.startHour)) {
                        bestSlot = {
                            dateStr: dateKey,
                            startHour: h,
                            endHour: h + 2,
                            durationStr: "1h30",
                            count: count,
                            users: Array.from(intersection)
                        };
                    }
                }
            }
        }

        // 2. If no 2h slot found, fallback to best 1h slot
        if (!bestSlot || bestSlot.count === 0) {
            for (const [dateKey, hoursMap] of Object.entries(slotsByDate)) {
                for (let h = 8; h <= 23; h++) {
                    const u = hoursMap[h];
                    if (!u) continue;
                    const count = u.size;
                    const currentSlotDate = new Date(dateKey);

                    if (count > maxCount) {
                        maxCount = count;
                        bestSlot = {
                            dateStr: dateKey,
                            startHour: h,
                            endHour: h + 1,
                            durationStr: "1h",
                            count: count,
                            users: Array.from(u)
                        };
                    } else if (count === maxCount && bestSlot) {
                        const bestSlotDate = new Date(bestSlot.dateStr);
                        if (currentSlotDate < bestSlotDate || (currentSlotDate.getTime() === bestSlotDate.getTime() && h < bestSlot.startHour)) {
                            bestSlot = {
                                dateStr: dateKey,
                                startHour: h,
                                endHour: h + 1,
                                durationStr: "1h",
                                count: count,
                                users: Array.from(u)
                            };
                        }
                    }
                }
            }
        }

        if (!bestSlot || bestSlot.count === 0) {
            return NextResponse.json({ message: "No active slots found" });
        }

        if (bestSlot.count >= 10) {
            return NextResponse.json({ message: "Best slot is already full", slot: bestSlot });
        }

        const missing = 10 - bestSlot.count;
        const dateObj = new Date(bestSlot.dateStr);
        const dateFormatted = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });

        // 3. Send Discord Reminder
        const embed = {
            title: "🔥 LE CRÉNEAU CHAUD DU MOMENT",
            description: `Le créneau le plus chaud est le **${dateFormatted} de ${bestSlot.startHour}h à ${bestSlot.endHour}h** (${bestSlot.durationStr}) !`,
            color: 0xEAB308, // Yellow
            fields: [
                { name: `👥 Inscrits (${bestSlot.durationStr})`, value: `${bestSlot.count}/10`, inline: true },
                { name: "🔥 Manquants", value: `${missing} joueurs`, inline: true },
                { name: "🔗 Rejoindre", value: "[Clique ici pour compléter le Five !](https://planifive.vercel.app/)" }
            ],
            footer: { text: "Planifive • Rappel Créneau" },
            timestamp: new Date().toISOString(),
        };

        await sendDiscordWebhook(embed);

        return NextResponse.json({ success: true, slot: bestSlot, embed: embed });
    } catch (error) {
        console.error("Error sending reminder:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
