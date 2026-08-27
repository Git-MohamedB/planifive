import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDemoSession } from "@/lib/demoData";

export async function POST(req: Request) {
    console.log("🟢 [API] POST /api/calls/respond called");
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            console.log("🔴 [API] Unauthorized");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { callId, status } = body;

        if (isDemoSession(session)) {
            return NextResponse.json({
                success: true,
                response: { id: "demo-resp", callId, userId: session.user.id, status },
                isDemo: true,
            });
        }

        if (!callId || !status) {
            console.log("🔴 [API] Missing callId or status");
            return NextResponse.json({ error: "Missing callId or status" }, { status: 400 });
        }

        // 1. Upsert the Response
        // Since we have @@unique([callId, userId]), upsert works perfectly
        console.log(`🔵 [API] Upserting response for user ${session.user.id}: ${status}`);
        const response = await prisma.callResponse.upsert({
            where: {
                callId_userId: {
                    callId,
                    userId: session.user.id
                }
            },
            update: { status },
            create: {
                callId,
                userId: session.user.id,
                status
            }
        });
        console.log("🟢 [API] Response upserted:", response);

        // 2. Auto-Fill Availability Logic if ACCEPTED
        if (status === "ACCEPTED") {
            console.log("🔵 [API] Status is ACCEPTED, fetching call details...");
            // Fetch Context: Call details to know when to add availability
            const call = await prisma.call.findUnique({
                where: { id: callId }
            });

            if (call) {
                console.log("🟢 [API] Call found:", call);
                const hoursToAdd = [];
                const duration = call.duration || 60;
                // Logic: 60 min -> 1 slot (h)
                // Logic: 90 min -> 2 slots (h, h+1)
                const slotsCount = duration === 90 ? 2 : 1;

                console.log(`🔵 [API] Duration: ${duration}, Slots: ${slotsCount}`);

                for (let i = 0; i < slotsCount; i++) {
                    hoursToAdd.push(call.hour + i);
                }

                console.log("🔵 [API] Hours to add:", hoursToAdd);

                const availabilityPromises = hoursToAdd.map(h => {
                    // Handle midnight crossing if necessary (simplification: max 23)
                    if (h > 23) return null; // Or handle next day logic, but schema uses Date+Hour

                    // Upsert Availability
                    // We use upsert to avoid error if already available
                    return prisma.availability.upsert({
                        where: {
                            userId_date_hour: {
                                userId: session.user.id,
                                date: call.date, // Same date as call
                                hour: h
                            }
                        },
                        update: {}, // Already exists, do nothing
                        create: {
                            userId: session.user.id,
                            date: call.date,
                            hour: h
                        }
                    });
                }).filter(Boolean);

                await Promise.all(availabilityPromises);
                console.log("🟢 [API] Availability updated for all slots");
            } else {
                console.log("🔴 [API] Call NOT found for ID:", callId);
            }
        }
        // 3. Logic: If DECLINED, we should REMOVE availability for these slots
        else if (status === "DECLINED") {
            console.log("🔵 [API] Status is DECLINED, removing availability...");
            const call = await prisma.call.findUnique({
                where: { id: callId }
            });

            if (call) {
                const duration = call.duration || 60;
                const slotsCount = duration === 90 ? 2 : 1;
                const hoursToRemove = [];
                for (let i = 0; i < slotsCount; i++) {
                    hoursToRemove.push(call.hour + i);
                }

                await prisma.availability.deleteMany({
                    where: {
                        userId: session.user.id,
                        date: call.date,
                        hour: { in: hoursToRemove }
                    }
                });
                console.log("🟢 [API] Availability removed for slots:", hoursToRemove);
            }
        }

        return NextResponse.json({ success: true, response });

    } catch (error) {
        console.error("🔴 [API] Error responding to call:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
