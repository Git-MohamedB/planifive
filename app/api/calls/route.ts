import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, isAdmin } from "@/lib/auth";
import { sendDiscordWebhook } from "@/lib/discord";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { date, hour, location, duration = 60, price, comment } = await req.json();

    if (!date || hour === undefined || !location) {
        return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    try {
        // 1. Anti-Spam / Anti-Raid Protection (2-minute cooldown per user)
        const COOLDOWN_SECONDS = 120;
        const lastUserCall = await prisma.call.findFirst({
            where: {
                creatorId: user.id,
                createdAt: {
                    gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000)
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (lastUserCall) {
            const elapsedMs = Date.now() - new Date(lastUserCall.createdAt).getTime();
            const remainingSeconds = Math.max(1, Math.ceil((COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000));
            return NextResponse.json({
                error: `Protection anti-spam active : veuillez patienter encore ${remainingSeconds} seconde(s) avant de lancer un nouvel appel.`,
                remainingSeconds
            }, { status: 429 });
        }

        // 2. Prevent duplicate calls on same date & hour
        const existingCallOnSlot = await prisma.call.findFirst({
            where: {
                date: new Date(date),
                hour: parseInt(hour)
            }
        });

        if (existingCallOnSlot) {
            return NextResponse.json({
                error: "Un appel est déjà en cours sur ce créneau horaire."
            }, { status: 400 });
        }

        // Logic: 1h -> 1 slot (h) | 1h30 -> 2 slots (h, h+1)
        const slotsCount = parseInt(duration) === 90 ? 2 : 1;
        const slots = Array.from({ length: slotsCount }, (_, i) => parseInt(hour) + i);

        // 3. Create Call in DB
        const call = await prisma.call.create({
            data: {
                creatorId: user.id,
                date: new Date(date),
                hour: parseInt(hour),
                location,
                duration: parseInt(duration),
                price,
                comment
            } as any,
        });

        // 2. Auto-register creator for the duration + buffer
        for (const h of slots) {
            if (h <= 23) {
                const existing = await prisma.availability.findFirst({
                    where: {
                        userId: user.id,
                        date: new Date(date),
                        hour: h,
                    },
                });

                if (!existing) {
                    await prisma.availability.create({
                        data: {
                            userId: user.id,
                            date: new Date(date),
                            hour: h,
                        },
                    });
                }
            }
        }

        // 3. Send Discord Notification
        const dateObj = new Date(date);
        const dateStr = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
        const durationStr = parseInt(duration) === 90 ? "1h30" : "1h00";

        let description = `**${user.name || "Un joueur"}** lance un appel pour un Five !\n\n📅 **${dateStr}**\n⏰ **${hour}h00**\n⏱️ **Durée : ${durationStr}**\n📍 **${location}**`;

        if (price) description += `\n💰 **Prix : ${price}**`;
        if (comment) description += `\n📝 **Note : ${comment}**`;

        description += `\n\n👉 Connectez-vous pour rejoindre !`;

        const endHourText = parseInt(duration) === 90
            ? `${(parseInt(hour) + 2) % 24 === 0 ? "00" : (parseInt(hour) + 2) % 24}h (1h30)`
            : `${(parseInt(hour) + 1) % 24 === 0 ? "00" : (parseInt(hour) + 1) % 24}h (1h00)`;

        const embed = {
            title: "📢 NOUVEL APPEL FIVE !",
            description: description,
            color: 5763719, // #57F287 (Green)
            url: "https://planifive.vercel.app/",
            fields: [
                {
                    name: "Créneau réservé",
                    value: `${hour}h00 - ${endHourText}`,
                    inline: true
                }
            ],
            thumbnail: { url: user.image || "" },
            footer: { text: "Planifive • Let's play!" },
            timestamp: new Date().toISOString(),
        };

        // Create Buttons (ActionRow)
        // Create Buttons (ActionRow)
        const components = [
            {
                type: 1, // Action Row
                components: [
                    {
                        type: 2, // Button
                        style: 1, // Primary (Blurple)
                        label: "Je participe ✅",
                        custom_id: `accept_call:${call.id}`
                    },
                    {
                        type: 2, // Button
                        style: 4, // Danger (Red)
                        label: "Je passe ❌",
                        custom_id: `decline_call:${call.id}`
                    },
                    {
                        type: 2, // Button
                        style: 2, // Secondary (Grey)
                        label: "Liste inscrits 📋",
                        custom_id: `list_participants:${call.id}`
                    },
                    {
                        type: 2, // Button
                        style: 2, // Secondary (Grey)
                        label: "Annuler l'appel 🗑️",
                        custom_id: `cancel_call:${call.id}`
                    }
                ]
            }
        ];

        const msgId = await sendDiscordWebhook(embed, "@everyone 📢 NOUVEL APPEL !", components);

        if (msgId) {
            await prisma.call.update({
                where: { id: call.id },
                data: { discordMessageId: msgId }
            });
        }

        return NextResponse.json({ success: true, call });
    } catch (error) {
        console.error("Error creating call:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (id) {
            const call = await prisma.call.findUnique({
                where: { id },
                include: {
                    creator: { select: { name: true, image: true } },
                    responses: { include: { user: { select: { id: true, name: true, image: true } } } }
                } as any
            });
            return NextResponse.json(call);
        }

        // Fetch calls for the next 7 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const calls = await prisma.call.findMany({
            where: {
                date: {
                    gte: today,
                },
            },
            include: {
                creator: {
                    select: { name: true, image: true },
                },
                responses: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true }
                        }
                    }
                }
            } as any,
            orderBy: { date: 'asc' },
        });

        return NextResponse.json(calls);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch calls" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    try {
        // 1. Fetch the call to check ownership and get details for notification
        const call = await prisma.call.findUnique({
            where: { id },
            include: { creator: true }
        });

        if (!call) {
            return NextResponse.json({ error: "Call not found" }, { status: 404 });
        }

        // 2. Check permissions: Admin OR Creator
        const isCreator = call.creator.email?.toLowerCase() === session.user.email.toLowerCase();
        const hasAdminRights = isAdmin(session.user.email);

        if (!isCreator && !hasAdminRights) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 3. Delete the call
        await prisma.call.delete({
            where: { id },
        });

        // 4. Send Discord Notification
        const dateObj = new Date(call.date);
        const dateStr = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });

        const embed = {
            title: "❌ APPEL ANNULÉ",
            description: `**${call.creator.name || "Un joueur"}** a annulé son appel.\n\n📅 **${dateStr}**\n⏰ **${call.hour}h00**\n📍 **${call.location}**`,
            color: 15548997, // Red
            footer: { text: "Planifive" },
            timestamp: new Date().toISOString(),
        };

        await sendDiscordWebhook(embed, "❌ UN APPEL A ÉTÉ ANNULÉ !");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting call:", error);
        return NextResponse.json({ error: "Failed to delete call" }, { status: 500 });
    }
}
