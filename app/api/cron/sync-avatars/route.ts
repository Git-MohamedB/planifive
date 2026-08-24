import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        // Security Check for Vercel Cron or Admin
        const authHeader = req.headers.get("authorization");
        const isCronAuthorized =
            process.env.NODE_ENV === "development" ||
            !process.env.CRON_SECRET ||
            authHeader === `Bearer ${process.env.CRON_SECRET}`;

        if (!isCronAuthorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const botToken = process.env.DISCORD_BOT_TOKEN;
        if (!botToken) {
            console.warn("⚠️ DISCORD_BOT_TOKEN is missing in environment variables. Avatars are refreshed automatically when users log in.");
            return NextResponse.json({
                success: false,
                warning: "DISCORD_BOT_TOKEN manquant dans les variables d'environnement. Les avatars se synchronisent automatiquement lors de chaque connexion des joueurs. Pour une synchro quotidienne automatique sans reconnexion, ajoutez DISCORD_BOT_TOKEN dans votre .env / Vercel.",
            });
        }

        // Fetch non-banned users with Discord accounts
        const users = (await prisma.user.findMany({
            where: {
                isBanned: false,
                accounts: { some: { provider: "discord" } },
            },
            include: {
                accounts: { where: { provider: "discord" } },
            },
        } as any)) as any[];

        let updatedCount = 0;
        const errors: string[] = [];

        for (const user of users) {
            const discordId = user.accounts?.[0]?.providerAccountId;
            if (!discordId) continue;

            try {
                const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
                    headers: {
                        Authorization: `Bot ${botToken}`,
                    },
                    cache: "no-store",
                });

                if (res.ok) {
                    const discordUser = await res.json();
                    let imageUrl = user.image;

                    if (discordUser.avatar) {
                        const format = discordUser.avatar.startsWith("a_") ? "gif" : "png";
                        imageUrl = `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.${format}`;
                    } else {
                        // Discord Default Avatar logic
                        const discriminator = parseInt(discordUser.discriminator ?? "0", 10);
                        if (discriminator === 0) {
                            const defaultId = Number(BigInt(discordId) >> BigInt(22)) % 6;
                            imageUrl = `https://cdn.discordapp.com/embed/avatars/${defaultId}.png`;
                        } else {
                            imageUrl = `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
                        }
                    }

                    // Update in database if avatar changed
                    if (imageUrl && imageUrl !== user.image) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { image: imageUrl },
                        });
                        updatedCount++;
                    }
                } else {
                    errors.push(`Discord API status ${res.status} for user ${user.name || discordId}`);
                }
            } catch (err: any) {
                errors.push(`Failed for user ${user.name || discordId}: ${err?.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            totalUsers: users.length,
            updatedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error("Error in sync-avatars cron:", error);
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
