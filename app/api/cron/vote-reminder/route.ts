import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
    try {
        // Security Check (secret check for cron)
        const authHeader = req.headers.get('authorization');
        if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // 1. Fetch All Active & Upcoming Calls (from today onwards)
        const allCalls = await prisma.call.findMany({
            where: {
                date: { gte: todayStart }
            },
            include: {
                responses: true,
                creator: { select: { id: true, name: true } }
            },
            orderBy: { date: 'asc' }
        });

        // Filter out calls from today whose hour has already passed
        const currentHour = now.getHours();
        const activeCalls = allCalls.filter(call => {
            const callDate = new Date(call.date);
            callDate.setHours(0, 0, 0, 0);
            if (callDate.getTime() > todayStart.getTime()) return true;
            return call.hour > currentHour;
        });

        if (activeCalls.length === 0) {
            return NextResponse.json({ message: "Aucun appel actif en cours. Aucun ping nécessaire." });
        }

        // 2. Fetch All Active Users with Discord Accounts + Availabilities
        const allUsers: any[] = await prisma.user.findMany({
            where: {
                isBanned: false
            },
            include: {
                accounts: {
                    where: { provider: 'discord' }
                },
                availabilities: {
                    where: { date: { gte: todayStart } }
                }
            }
        } as any);

        // 3. Identification of Unresponded Users
        const missingVotesByUser: Record<string, { discordId: string, name: string, missingCalls: string[] }> = {};

        for (const user of (allUsers as any[])) {
            const discordAccount = (user as any).accounts?.[0];
            if (!discordAccount?.providerAccountId) continue;

            const missingForThisUser: string[] = [];

            for (const call of activeCalls) {
                // The creator has already confirmed
                const isCreator = call.creatorId === user.id;
                // Explicit response (ACCEPTED or DECLINED)
                const hasResponded = call.responses.some((r: any) => r.userId === user.id);
                // Implicit presence on the grid
                const hasAvailability = user.availabilities.some((a: any) => {
                    const aDate = new Date(a.date);
                    aDate.setHours(0, 0, 0, 0);
                    const cDate = new Date(call.date);
                    cDate.setHours(0, 0, 0, 0);
                    return aDate.getTime() === cDate.getTime() && a.hour === call.hour;
                });

                if (!isCreator && !hasResponded && !hasAvailability) {
                    const dateObj = new Date(call.date);
                    const dateStr = dateObj.toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' });
                    missingForThisUser.push(`${dateStr} à ${call.hour}h00 (${call.location})`);
                }
            }

            if (missingForThisUser.length > 0) {
                missingVotesByUser[user.id] = {
                    discordId: discordAccount.providerAccountId,
                    name: user.name || "Joueur",
                    missingCalls: missingForThisUser
                };
            }
        }

        const missingUserIds = Object.keys(missingVotesByUser);

        if (missingUserIds.length === 0) {
            return NextResponse.json({ message: "Tous les joueurs ont répondu aux appels ! Aucun ping envoyé." });
        }

        // 4. Construct Consolidated Discord Message
        let mentionsString = "";
        let description = "**Des réponses sont manquantes pour les prochains appels de Five !**\n\n";

        for (const userId of missingUserIds) {
            const data = missingVotesByUser[userId];
            const callsList = data.missingCalls.join("\n   • ");

            mentionsString += `<@${data.discordId}> `;
            description += `👤 **${data.name}** :\n   • ${callsList}\n\n`;
        }

        description += "👉 [Répondre sur PlaniFive](https://planifive.vercel.app/) *(ou clique directement sur les boutons sous le message de l'appel !)*";

        const embed = {
            title: "📢 Rappel de Disponibilité - Appel Five",
            description: description,
            color: 0xF1C40F, // Amber
            footer: { text: "Planifive • Merci de confirmer ta présence ou ton absence !" },
            timestamp: new Date().toISOString(),
        };

        // 5. Send Webhook
        await sendDiscordWebhook(embed, mentionsString);

        return NextResponse.json({
            success: true,
            message: `Rappels envoyés à ${missingUserIds.length} joueur(s).`,
            missingCount: missingUserIds.length
        });

    } catch (error) {
        console.error("Error in vote-reminder cron:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
