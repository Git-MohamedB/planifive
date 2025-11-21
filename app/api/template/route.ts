import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth"; // <--- Import Important

export async function POST(req: Request) {
  console.log("🔍 Debug: Appel API Template...");

  try {
    // CORRECTION ICI : On passe authOptions dans la parenthèse
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      console.error("❌ Erreur Session: Aucune session trouvée (getServerSession a renvoyé null)");
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    console.log("✅ Session trouvée pour:", session.user.email);

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "save") {
      const { slots } = body;
      await prisma.availabilityTemplate.deleteMany({ where: { userId: user.id } });
      if (slots && slots.length > 0) {
        await prisma.availabilityTemplate.createMany({
          data: slots.map((s: any) => ({
            userId: user.id,
            dayOfWeek: s.dayOfWeek,
            hour: s.hour,
          })),
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "apply") {
      const { mondayDate } = body;
      const monday = new Date(mondayDate);
      const template = await prisma.availabilityTemplate.findMany({ where: { userId: user.id } });

      if (template.length === 0) return NextResponse.json({ error: "Aucun modèle" }, { status: 400 });

      const newAvailabilities = [];
      for (const slot of template) {
        const dayOffset = slot.dayOfWeek === 0 ? 6 : slot.dayOfWeek - 1;
        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayOffset);

        const exists = await prisma.availability.findFirst({
          where: { userId: user.id, date: targetDate, hour: slot.hour },
        });

        if (!exists) {
          newAvailabilities.push({ userId: user.id, date: targetDate, hour: slot.hour });
        }
      }

      if (newAvailabilities.length > 0) {
        await prisma.availability.createMany({ data: newAvailabilities });
      }
      return NextResponse.json({ success: true, added: newAvailabilities.length });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });

  } catch (error: any) {
    console.error("🔥 CRASH:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}