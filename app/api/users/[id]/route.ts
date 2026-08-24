import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";

// UPDATE (Soft Ban / Rename / Skills)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email || !isAdmin(session.user.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // In Next.js 15+, params is a Promise that must be awaited
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        }

        const body = await req.json();

        // We allow updating customName, isBanned, technique, cardio
        const dataToUpdate: any = {};
        if (typeof body.customName !== 'undefined') dataToUpdate.customName = body.customName;
        if (typeof body.isBanned !== 'undefined') dataToUpdate.isBanned = body.isBanned;
        if (typeof body.technique !== 'undefined') dataToUpdate.technique = body.technique !== null ? parseFloat(body.technique) : null;
        if (typeof body.cardio !== 'undefined') dataToUpdate.cardio = body.cardio !== null ? parseFloat(body.cardio) : null;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Keep DELETE just in case, but functionality moved to Soft Ban
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json({ error: "Use PATCH to ban users." }, { status: 405 });
}
