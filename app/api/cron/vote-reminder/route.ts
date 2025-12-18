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

        // 2. Fetch All Users with Discord Accounts + Future Availabilities
        // We need the discord ID to mention them
        // We also check their availabilities to see if they "implicitly" voted
        // 2. Fetch All Users with Discord Accounts + Future Availabilities
        // We need the discord ID to mention them
        // We also check their availabilities to see if they "implicitly" voted
        const allUsers = await prisma.user.findMany({
            where: {
                isBanned: false // EXCLUDE BANNED USERS
            },
            include: {
                accounts: {
                    where: { provider: 'discord' }
                },
                availabilities: {
                    where: { date: { gte: now } }
                }
            }
        } as any);

        // 3. Identification Logic
        const missingVotesByUser: Record<string, { discordId: string, name: string, missingDates: string[] }> = {};

        for (const user of allUsers) {
            const discordAccount = user.accounts[0];
            if (!discordAccount?.providerAccountId) continue;

            const missingForThisUser: string[] = [];

            for (const call of futureCalls) {
                const hasResponded = call.responses.some(r => r.userId === user.id);
                const hasAvailability = user.availabilities.some(a =>
                    new Date(a.date).toDateString() === new Date(call.date).toDateString() &&
                    a.hour === call.hour
                );

                if (!hasResponded && !hasAvailability) {
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
        // Mentions must be in content to PING
        let mentionsString = "";
        let description = "**Des votes sont manquants pour les prochains Five !**\n\n";

        for (const userId of missingUserIds) {
            const data = missingVotesByUser[userId];
            const datesString = data.missingDates.join(", ");

            // Add to Notification content
            mentionsString += `<@${data.discordId}> `;

            // Add to Embed description
            description += `**${data.name}** : Pas de réponse pour le **${datesString}**\n`;
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
            // Pass mentionsString as "content" to trigger push notification
            await sendDiscordWebhook(embed, mentionsString);
        } else {
            console.log("Dev mode: Webhook not sent", JSON.stringify(embed, null, 2));
            console.log("Mentions Content:", mentionsString);
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
