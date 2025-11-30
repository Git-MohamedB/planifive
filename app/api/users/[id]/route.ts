import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const session = await getServerSession(authOptions);
        const ADMIN_EMAILS = ["sheizeracc@gmail.com"];

        if (!session || !session.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { customName } = body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { customName } as any,
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Error updating user' }, { status: 500 });
    }
}
