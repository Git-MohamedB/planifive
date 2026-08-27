import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { DEMO_USERS, isDemoSession } from '@/lib/demoData';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (isDemoSession(session)) {
            return NextResponse.json(DEMO_USERS.map(u => ({
                id: u.id,
                name: u.name,
                image: u.image,
                customName: u.customName,
                isBanned: false,
                technique: u.technique,
                cardio: u.cardio,
            })));
        }

        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                image: true,
                customName: true,
                isBanned: true,
                technique: true,
                cardio: true,
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
        }

        const body = await req.json();
        const rawName = body.name || body.customName;

        if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
            return NextResponse.json({ error: "Nom du joueur requis" }, { status: 400 });
        }

        const cleanName = rawName.trim();
        const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@guest.planifive.internal`;
        const techVal = body.technique !== undefined ? parseFloat(body.technique) : 3.5;
        const cardioVal = body.cardio !== undefined ? parseFloat(body.cardio) : 3.5;

        const user = await prisma.user.create({
            data: {
                name: cleanName,
                customName: cleanName,
                email: guestEmail,
                technique: isNaN(techVal) ? 3.5 : techVal,
                cardio: isNaN(cardioVal) ? 3.5 : cardioVal,
                skillLevel: Math.round(((isNaN(techVal) ? 3.5 : techVal) + (isNaN(cardioVal) ? 3.5 : cardioVal))),
            },
        });

        return NextResponse.json(user);
    } catch (error: any) {
        console.error("Error creating guest user:", error);
        return NextResponse.json({ error: error?.message || "Erreur lors de la création du joueur" }, { status: 500 });
    }
}
