import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { callId, status } = await req.json(); // status: "ACCEPTED" | "DECLINED"

        if (!callId || !status) {
            return NextResponse.json({ error: "Missing callId or status" }, { status: 400 });
        }

        // 1. Upsert the Response
        // Since we have @@unique([callId, userId]), upsert works perfectly
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

        // 2. Auto-Fill Availability Logic if ACCEPTED
        if (status === "ACCEPTED") {
            // Fetch Context: Call details to know when to add availability
            const call = await prisma.call.findUnique({
                where: { id: callId }
            });

            if (call) {
                const hoursToAdd = [];
                const duration = call.duration || 60;
                // Logic: 60 min -> 4 slots (h, h+1, h+2, h+3)
                // Logic: 90 min -> 5 slots (h, h+1, h+2, h+3, h+4)
                const slotsCount = duration === 90 ? 5 : 4;

                for (let i = 0; i < slotsCount; i++) {
                    hoursToAdd.push(call.hour + i);
                }

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
            }
        }

        return NextResponse.json({ success: true, response });

    } catch (error) {
        console.error("Error responding to call:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
