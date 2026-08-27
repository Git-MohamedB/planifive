import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoSession } from "@/lib/demoData";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { pac, sho, pas, dri, def, phy } = body;

    const clamp = (val: any) => Math.min(99, Math.max(50, Math.round(Number(val) || 75)));

    if (isDemoSession(session)) {
      const cleanPac = clamp(pac);
      const cleanSho = clamp(sho);
      const cleanPas = clamp(pas);
      const cleanDri = clamp(dri);
      const cleanDef = clamp(def);
      const cleanPhy = clamp(phy);
      const ovr = Math.round(cleanPac * 0.15 + cleanSho * 0.25 + cleanPas * 0.15 + cleanDri * 0.2 + cleanDef * 0.1 + cleanPhy * 0.15);

      return NextResponse.json({
        success: true,
        ratingsCount: 5,
        fut: { ovr, pac: cleanPac, sho: cleanSho, pas: cleanPas, dri: cleanDri, def: cleanDef, phy: cleanPhy },
        myRating: { pac: cleanPac, sho: cleanSho, pas: cleanPas, dri: cleanDri, def: cleanDef, phy: cleanPhy },
      });
    }

    const voterId = session.user.id || session.user.email || "anon";
    const voterName = session.user.name || session.user.email?.split("@")[0] || "Joueur";

    // Find the target user ID (by ID or name)
    const rawTarget = decodeURIComponent(id);
    let targetKey = rawTarget;
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: rawTarget },
          { email: rawTarget },
          { name: { equals: rawTarget, mode: "insensitive" } },
          { customName: { equals: rawTarget, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, customName: true, email: true },
    });

    if (targetUser) {
      targetKey = targetUser.id;
    }

    // ── Self-Rating Check: Users cannot rate their own card! ──
    const isSelfRating =
      targetKey === voterId ||
      (targetUser && targetUser.id === voterId) ||
      (targetUser && targetUser.email && session.user.email && targetUser.email.toLowerCase() === session.user.email.toLowerCase()) ||
      (session.user.name && (rawTarget.toLowerCase() === session.user.name.toLowerCase() || (targetUser?.name && targetUser.name.toLowerCase() === session.user.name.toLowerCase())));

    if (isSelfRating) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas noter votre propre carte FUT." },
        { status: 403 }
      );
    }

    const cleanPac = clamp(pac);
    const cleanSho = clamp(sho);
    const cleanPas = clamp(pas);
    const cleanDri = clamp(dri);
    const cleanDef = clamp(def);
    const cleanPhy = clamp(phy);

    // Save to PostgreSQL via safe raw query upsert
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "FUTCardRating" ("id", "targetUserId", "voterUserId", "voterName", "pac", "sho", "pas", "dri", "def", "phy", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT ("targetUserId", "voterUserId")
         DO UPDATE SET
           "pac" = EXCLUDED."pac",
           "sho" = EXCLUDED."sho",
           "pas" = EXCLUDED."pas",
           "dri" = EXCLUDED."dri",
           "def" = EXCLUDED."def",
           "phy" = EXCLUDED."phy",
           "voterName" = EXCLUDED."voterName",
           "updatedAt" = NOW();`,
        targetKey,
        voterId,
        voterName,
        cleanPac,
        cleanSho,
        cleanPas,
        cleanDri,
        cleanDef,
        cleanPhy
      );
    } catch (dbErr) {
      console.warn("Direct SQL insert failed, trying Prisma model fallback:", dbErr);
      const model = (prisma as any).fUTCardRating || (prisma as any).futCardRating;
      if (model) {
        await model.upsert({
          where: {
            targetUserId_voterUserId: {
              targetUserId: targetKey,
              voterUserId: voterId,
            },
          },
          update: {
            pac: cleanPac,
            sho: cleanSho,
            pas: cleanPas,
            dri: cleanDri,
            def: cleanDef,
            phy: cleanPhy,
            voterName,
          },
          create: {
            targetUserId: targetKey,
            voterUserId: voterId,
            voterName,
            pac: cleanPac,
            sho: cleanSho,
            pas: cleanPas,
            dri: cleanDri,
            def: cleanDef,
            phy: cleanPhy,
          },
        });
      }
    }

    // Fetch all ratings for target user to compute new community averages
    let allRatings: any[] = [];
    try {
      allRatings = await prisma.$queryRawUnsafe(
        `SELECT "pac", "sho", "pas", "dri", "def", "phy", "voterUserId"
         FROM "FUTCardRating"
         WHERE "targetUserId" = $1 OR "targetUserId" = $2`,
        targetKey,
        rawTarget
      );
    } catch (qErr) {
      console.warn("Raw select failed, fallback to model:", qErr);
      const model = (prisma as any).fUTCardRating || (prisma as any).futCardRating;
      if (model) {
        allRatings = await model.findMany({
          where: {
            OR: [{ targetUserId: targetKey }, { targetUserId: rawTarget }],
          },
        });
      }
    }

    const count = allRatings.length;
    let avgPac = 0;
    let avgSho = 0;
    let avgPas = 0;
    let avgDri = 0;
    let avgDef = 0;
    let avgPhy = 0;

    allRatings.forEach((r: any) => {
      avgPac += r.pac;
      avgSho += r.sho;
      avgPas += r.pas;
      avgDri += r.dri;
      avgDef += r.def;
      avgPhy += r.phy;
    });

    const pacFinal = count > 0 ? Math.round(avgPac / count) : cleanPac;
    const shoFinal = count > 0 ? Math.round(avgSho / count) : cleanSho;
    const pasFinal = count > 0 ? Math.round(avgPas / count) : cleanPas;
    const driFinal = count > 0 ? Math.round(avgDri / count) : cleanDri;
    const defFinal = count > 0 ? Math.round(avgDef / count) : cleanDef;
    const phyFinal = count > 0 ? Math.round(avgPhy / count) : cleanPhy;
    const ovrFinal = Math.round(
      pacFinal * 0.15 +
      shoFinal * 0.25 +
      pasFinal * 0.15 +
      driFinal * 0.2 +
      defFinal * 0.1 +
      phyFinal * 0.15
    );

    return NextResponse.json({
      success: true,
      ratingsCount: count,
      fut: {
        ovr: ovrFinal,
        pac: pacFinal,
        sho: shoFinal,
        pas: pasFinal,
        dri: driFinal,
        def: defFinal,
        phy: phyFinal,
      },
      myRating: {
        pac: cleanPac,
        sho: cleanSho,
        pas: cleanPas,
        dri: cleanDri,
        def: cleanDef,
        phy: cleanPhy,
      },
    });
  } catch (error) {
    console.error("FUT Rating Error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
