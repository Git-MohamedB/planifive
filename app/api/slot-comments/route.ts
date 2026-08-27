import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoSession, DEMO_USERS } from "@/lib/demoData";

// GET comments for a specific date & hour, or for an entire date range
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (isDemoSession(session)) {
      return NextResponse.json([
        {
          id: "demo-comment-1",
          userId: "demo-user-2",
          date: new Date().toISOString(),
          hour: 20,
          type: "COMMENT",
          message: "Chaud pour le match de 20h !",
          createdAt: new Date().toISOString(),
          user: {
            id: DEMO_USERS[1].id,
            name: DEMO_USERS[1].name,
            customName: DEMO_USERS[1].customName,
            image: DEMO_USERS[1].image,
            accentColor: DEMO_USERS[1].accentColor,
          },
        },
      ]);
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const hourStr = searchParams.get("hour");
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    if (startStr && endStr) {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const comments = await prisma.slotComment.findMany({
        where: {
          date: { gte: start, lte: end },
        },
        include: {
          user: {
            select: { id: true, name: true, customName: true, image: true, accentColor: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      return NextResponse.json(comments);
    }

    if (!dateStr || hourStr === null) {
      return NextResponse.json({ error: "Missing date or hour" }, { status: 400 });
    }

    const date = new Date(dateStr);
    const hour = parseInt(hourStr, 10);

    const comments = await prisma.slotComment.findMany({
      where: { date, hour },
      include: {
        user: {
          select: { id: true, name: true, customName: true, image: true, accentColor: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Slot Comments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST create or update a comment / reaction
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, hour, type = "COMMENT", message } = body;

    if (!date || hour === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const comment = await prisma.slotComment.create({
      data: {
        userId: session.user.id,
        date: new Date(date),
        hour: Number(hour),
        type: String(type),
        message: message ? String(message).trim() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, customName: true, image: true, accentColor: true },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Slot Comments POST error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}

// DELETE a comment
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing comment id" }, { status: 400 });
    }

    const comment = await prisma.slotComment.findUnique({ where: { id } });
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Only creator or admin can delete
    const hasAdminRights = isAdmin(session.user.email);
    if (comment.userId !== session.user.id && !hasAdminRights) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.slotComment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slot Comments DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
