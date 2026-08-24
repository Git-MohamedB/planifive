import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions, isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, date, hour, action } = body;

    if (!userId || !date || hour === undefined) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const targetDate = new Date(date);

    if (action === "remove") {
      await prisma.availability.deleteMany({
        where: { userId, date: targetDate, hour: Number(hour) },
      });
      return NextResponse.json({ success: true, action: "removed" });
    }

    // Default: Add if not existing
    const existing = await prisma.availability.findFirst({
      where: { userId, date: targetDate, hour: Number(hour) },
    });

    if (!existing) {
      await prisma.availability.create({
        data: { userId, date: targetDate, hour: Number(hour) },
      });
    }

    return NextResponse.json({ success: true, action: "added" });
  } catch (error: any) {
    console.error("Admin slot availability error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur gestion dispo admin" },
      { status: 500 }
    );
  }
}
