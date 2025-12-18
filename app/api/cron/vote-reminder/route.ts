import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendDiscordWebhook } from "@/lib/discord";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        // Security Check (simple secret check for cron)
        const authHeader = req.headers.get('authorization');
        if (process.env.NODE_ENV !== 'development' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch All Future Calls
        const now = new Date();
        const futureCalls = await prisma.call.findMany({
            where: {
                date: { gte: now }
            },
            include: {
                responses: true
            },
            orderBy: { date: 'asc' }
        });

        if (futureCalls.length === 0) {
            return NextResponse.json({ message: "No future calls found. No ping sent." });
        }

        // 2. Fetch All Users with Discord Accounts
        // We need the discord ID (providerAccountId) to mention them
        const allUsers = await prisma.user.findMany({
            include: {
                accounts: {
                    where: { provider: 'discord' }
                }
            }
        });

        // 3. Identification Logic
        // We want a map: UserID -> Array of missing Call Dates
        const missingVotesByUser: Record<string, { discordId: string, name: string, missingDates: string[] }> = {};

        for (const user of allUsers) {
            const discordAccount = user.accounts[0];
            if (!discordAccount?.providerAccountId) continue; // Skip users without Discord linked

            const missingForThisUser: string[] = [];

            for (const call of futureCalls) {
                // Check if user has responded to this call
                const hasResponded = call.responses.some(r => r.userId === user.id);

                if (!hasResponded) {
                    const dateStr = new Date(call.date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'numeric' });
                    missingForThisUser.push(dateStr);
                }
            }

            if (missingForThisUser.length > 0) {
                missingVotesByUser[user.id] = {
                    discordId: discordAccount.providerAccountId,
                    name: user.name || "Joueur",
                    missingDates: missingForThisUser
                };
            }
        }

        const missingUserIds = Object.keys(missingVotesByUser);

        if (missingUserIds.length === 0) {
            return NextResponse.json({ message: "Everyone has voted! No ping sent." });
        }

        // 4. Construct Consolidated Message
        // "Vous n'avez pas répondu à un appel en cours le [Date 1], [Date 2]..."

        // We will build a description string list.
        // To avoid hitting Discord's 2000 char limit or embed limit, we should be concise.

        let description = "**Des votes sont manquants pour les prochains Five !**\n\n";

        for (const userId of missingUserIds) {
            const data = missingVotesByUser[userId];
            const datesString = data.missingDates.join(", ");
            description += `<@${data.discordId}> : Pas de réponse pour le **${datesString}**\n`;
        }

        description += "\n👉 [Rendez-vous sur PlaniFive pour voter !](https://planifive.vercel.app/)";

        const embed = {
            title: "📢 Rappel de Vote",
            description: description,
            color: 0xF1C40F, // Yellow/Orange for alert
            footer: { text: "Planifive • Merci de répondre rapidement !" },
            timestamp: new Date().toISOString(),
        };

        // 5. Send Webhook
        if (process.env.NODE_ENV !== 'development' || req.url.includes('dryRun')) {
            await sendDiscordWebhook(embed);
        } else {
            console.log("Dev mode: Webhook not sent", JSON.stringify(embed, null, 2));
        }

        return NextResponse.json({
            success: true,
            message: `Sent reminders to ${missingUserIds.length} users.`,
            missingCount: missingUserIds.length
        });

    } catch (error) {
        console.error("Error in vote-reminder:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
