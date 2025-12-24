import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nacl from "tweetnacl";

const prisma = new PrismaClient();

// Your Discord Public Key from Vercel ENV
const PUB_KEY = process.env.DISCORD_PUBLIC_KEY;

// Helper to generate the updated Embed
async function getUpdatedEmbed(callId: string) {
    const call = await prisma.call.findUnique({
        where: { id: callId },
        include: {
            creator: true,
            responses: { include: { user: true } }
        }
    });

    if (!call) return null;

    // 1. Fetch Implicit Participants (Availability on Grid)
    // Logic: 1h -> 4 slots
    const slotsCount = call.duration === 90 ? 5 : 4;
    const slots = Array.from({ length: slotsCount }, (_, i) => call.hour + i);

    // Find users who have ALL these slots
    // Since we need to join multiple times, simplified approach:
    // User must have availability for Call Date at Hour X, X+1...
    // We fetch all availabilities for this date/hours
    const availabilities = await prisma.availability.findMany({
        where: {
            date: call.date,
            hour: { in: slots }
        },
        select: { userId: true, hour: true }
    });

    const userMap: Record<string, number> = {};
    availabilities.forEach(a => {
        userMap[a.userId] = (userMap[a.userId] || 0) + 1;
    });

    const implicitUserIds = Object.keys(userMap).filter(uid => userMap[uid] === slotsCount);

    // 2. Merge with Explicit Responses (ACCEPTED)
    const acceptedUserIds = new Set<string>();

    // Explicit wins
    call.responses.forEach(r => {
        if (r.status === "ACCEPTED") acceptedUserIds.add(r.userId);
    });

    // Add implicit if not explicitly declined
    implicitUserIds.forEach(uid => {
        const hasResponse = call.responses.find(r => r.userId === uid);
        if (!hasResponse || hasResponse.status !== "DECLINED") {
            acceptedUserIds.add(uid);
        }
    });

    // 3. Fetch User Names for the List
    const participants = await prisma.user.findMany({
        where: { id: { in: Array.from(acceptedUserIds) } },
        select: { name: true, customName: true }
    });

    const participantNames = participants.map(p => p.customName || p.name || "Joueur");
    const count = participantNames.length;
    const missing = 10 - count;

    // Reconstruct Embed
    const dateObj = new Date(call.date);
    const dateStr = dateObj.toLocaleDateString("fr-FR", { weekday: 'long', day: 'numeric', month: 'long' });
    const durationStr = call.duration === 90 ? "1h30" : "1h00";

    let description = `**${call.creator.name || "Un joueur"}** lance un appel pour un Five !\n\n📅 **${dateStr}**\n⏰ **${call.hour}h00**\n⏱️ **Durée : ${durationStr}**\n📍 **${call.location}**`;
    if (call.price) description += `\n💰 **Prix : ${call.price}**`;
    if (call.comment) description += `\n📝 **Note : ${call.comment}**`;
    description += `\n\n👉 Connectez-vous pour rejoindre !`;

    const embed = {
        title: "📢 NOUVEL APPEL FIVE !",
        description: description,
        color: 5763719, // #57F287 (Green)
        url: "https://planifive.vercel.app/",
        fields: [
            {
                name: "Créneau réservé",
                value: `${call.hour}h - ${(call.hour + slotsCount) % 24 === 0 ? "00" : (call.hour + slotsCount) % 24}h`,
                inline: true
            },
            {
                name: `👥 Participants (${count}/10)`,
                value: count > 0 ? participantNames.join(", ") : "Aucun inscrit pour le moment",
                inline: false
            },
            {
                name: "🔥 Places restantes",
                value: `${missing > 0 ? missing : 0} places`,
                inline: true
            }
        ],
        thumbnail: { url: call.creator.image || "" },
        footer: { text: "Planifive • Let's play!" },
        timestamp: new Date().toISOString(),
    };

    return embed;
}

// Helper to sync availability on Accept
async function syncAvailabilityOnAccept(userId: string, call: any) {
    // If the user accepts the call, we add availability for the duration of the call
    const slotsCount = call.duration === 90 ? 5 : 4;
    const slots = Array.from({ length: slotsCount }, (_, i) => call.hour + i);

    const upserts = slots.map(h => {
        if (h > 23) return null;
        return prisma.availability.upsert({
            where: {
                userId_date_hour: {
                    userId,
                    date: call.date,
                    hour: h
                }
            },
            create: { userId, date: call.date, hour: h },
            update: {} // Logic: if already exists, do nothing
        });
    });

    await Promise.all(upserts.filter(p => p !== null));
}

// Helper to remove availability on Cancel (for creator)
async function syncAvailabilityOnCancel(userId: string, call: any) {
    // If creator cancels, we assume they want to clear that block or at least we remove their Availabilities
    // matching the call time.
    const slotsCount = call.duration === 90 ? 5 : 4;
    const slots = Array.from({ length: slotsCount }, (_, i) => call.hour + i);

    await prisma.availability.deleteMany({
        where: {
            userId,
            date: call.date,
            hour: { in: slots }
        }
    });
}

export async function POST(req: Request) {
    try {
        if (!PUB_KEY) {
            console.error("Missing DISCORD_PUBLIC_KEY");
            return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
        }

        // 1. Verify Signature
        const signature = req.headers.get("X-Signature-Ed25519");
        const timestamp = req.headers.get("X-Signature-Timestamp");
        const bodyText = await req.text();

        if (!signature || !timestamp || !bodyText) {
            return NextResponse.json({ error: "Invalid Request" }, { status: 401 });
        }

        const isVerified = nacl.sign.detached.verify(
            Buffer.from(timestamp + bodyText),
            Buffer.from(signature, "hex"),
            Buffer.from(PUB_KEY, "hex")
        );

        if (!isVerified) {
            return NextResponse.json({ error: "Invalid Signature" }, { status: 401 });
        }

        // 2. Parse Body
        const body = JSON.parse(bodyText);

        // 3. Handle PING
        if (body.type === 1) return NextResponse.json({ type: 1 });

        // 4. Handle Buttons (Type 3)
        if (body.type === 3) {
            const customId = body.data.custom_id;
            const discordUserId = body.member?.user?.id || body.user?.id;
            const [action, callId] = customId.split(":");

            if (!discordUserId || !callId) {
                return NextResponse.json({ type: 4, data: { content: "❌ Erreur interne.", flags: 64 } });
            }

            // Identify User
            const userAccount = await prisma.account.findFirst({
                where: { provider: 'discord', providerAccountId: discordUserId },
                include: { user: true }
            });

            if (!userAccount) {
                return NextResponse.json({ type: 4, data: { content: "🚫 Connecte-toi d'abord sur le site !", flags: 64 } });
            }

            const userId = userAccount.userId;

            // Retrieve Call (Basic fetch for permission checks, full fetch inside helpers if needed but we pass `call` to helpers)
            // Ideally we need date/hour for helpers, so let's fetch basic.
            const call = await prisma.call.findUnique({ where: { id: callId } });

            if (!call) return NextResponse.json({ type: 4, data: { content: "L'appel n'existe plus.", flags: 64 } });

            // --- CANCEL ACTION ---
            if (action === "cancel_call") {
                if (call.creatorId !== userId) {
                    return NextResponse.json({ type: 4, data: { content: "❌ Seul le créateur peut annuler l'appel.", flags: 64 } });
                }

                // Parallelize: Delete Call AND Delete Creator's Availability
                const cancelTasks = [
                    prisma.call.delete({ where: { id: callId } }),
                    syncAvailabilityOnCancel(userId, call)
                ];
                await Promise.all(cancelTasks);

                return NextResponse.json({
                    type: 7, // Update Message
                    data: {
                        embeds: [{
                            title: "❌ APPEL ANNULÉ",
                            description: `L'appel a été annulé par **${userAccount.user.name ?? "le créateur"}**.`,
                            color: 15548997 // Red
                        }],
                        components: [] // Remove buttons
                    }
                });
            }

            // --- PARTICIPATION ACTION ---
            if (action === "decline_call" && call.creatorId === userId) {
                return NextResponse.json({ type: 4, data: { content: "❌ Le créateur ne peut pas refuser son propre appel.", flags: 64 } });
            }

            const status = action === "accept_call" ? "ACCEPTED" : "DECLINED";

            // Optimize: Upsert Response AND Sync Availability (if accept) in parallel
            const tasks: any[] = [
                prisma.callResponse.upsert({
                    where: { callId_userId: { callId, userId } },
                    create: { callId, userId, status },
                    update: { status }
                })
            ];

            if (action === "accept_call") {
                tasks.push(syncAvailabilityOnAccept(userId, call));
            }

            // Execute concurrent tasks
            await Promise.all(tasks);

            // Re-calculate Embed with fresh data
            const newEmbed = await getUpdatedEmbed(callId);

            if (!newEmbed) {
                console.error("Failed to generate updated embed");
                return NextResponse.json({ type: 4, data: { content: "Erreur affichage.", flags: 64 } });
            }

            return NextResponse.json({
                type: 7,
                data: {
                    embeds: [newEmbed]
                }
            });
        }

        return NextResponse.json({ error: "Unknown Type" }, { status: 400 });

    } catch (error) {
        console.error("Interaction Error (Top Level):", error); // Log the actual error
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
