import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "../../../lib/prisma"; 
import { authOptions } from "../../../lib/auth"; 

type SlotData = {
  users: { name: string | null; image: string | null }[];
  count: number;
};

// --- GET ---
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User introuvable" }, { status: 404 });

  const allDispos = await prisma.availability.findMany({
    where: { date: { gte: new Date() } },
    include: { user: { select: { name: true, image: true } } }
  });

  const mySlots: string[] = [];
  const slotDetails: Record<string, SlotData> = {}; 

  allDispos.forEach((dispo) => {
    const dateStr = dispo.date.toISOString().split("T")[0];
    const key = `${dateStr}-${dispo.hour}`;
    if (!slotDetails[key]) slotDetails[key] = { users: [], count: 0 };
    slotDetails[key].count++;
    slotDetails[key].users.push({ name: dispo.user.name, image: dispo.user.image });
    if (dispo.userId === user.id) mySlots.push(key);
  });

  return NextResponse.json({ mySlots, slotDetails });
}

// --- POST (Toggle simple) ---
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) return NextResponse.json({ error: "401" }, { status: 401 });
  
  const { date, hour } = await req.json();
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "404" }, { status: 404 });
  
  const targetDate = new Date(date);

  const existing = await prisma.availability.findFirst({
    where: { userId: user.id, date: targetDate, hour: hour },
  });

  if (existing) {
    await prisma.availability.delete({ where: { id: existing.id } });
    return NextResponse.json({ status: "removed" });
  } else {
    await prisma.availability.create({
      data: { userId: user.id, date: targetDate, hour: hour },
    });
    return NextResponse.json({ status: "added" });
  }
}