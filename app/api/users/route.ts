import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const ADMIN_EMAILS = ["sheizeracc@gmail.com"];

        if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}
