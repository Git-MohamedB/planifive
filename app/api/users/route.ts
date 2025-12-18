import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        // Public route for Leaderboard usage (filtering banned users)
        // Restricted fields for privacy
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                image: true,
                customName: true,
                isBanned: true
                // No email, no accounts
            }
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}
