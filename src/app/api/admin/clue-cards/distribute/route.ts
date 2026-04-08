import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { session } = body;

    if (!session || (session !== "FIRST" && session !== "SECOND")) {
      return NextResponse.json(
        { error: "请指定有效的场次（FIRST 或 SECOND）" },
        { status: 400 }
      );
    }

    const teams = await prisma.team.findMany({
      where: { session },
      orderBy: { totalScore: "desc" },
    });

    if (teams.length === 0) {
      return NextResponse.json(
        { error: "该场次没有队伍数据" },
        { status: 400 }
      );
    }

    const clueCards = await prisma.clueCard.findMany({
      where: { session, distributed: false },
      orderBy: { tier: "asc" },
    });

    if (clueCards.length === 0) {
      return NextResponse.json(
        { error: "该场次没有未分配的线索卡" },
        { status: 400 }
      );
    }

    const tierA = clueCards.filter((c) => c.tier === "A");
    const tierB = clueCards.filter((c) => c.tier === "B");
    const tierC = clueCards.filter((c) => c.tier === "C");

    const sortedTeams = [...teams].sort((a, b) => b.totalScore - a.totalScore);
    const third = Math.ceil(sortedTeams.length / 3);

    const topTier = sortedTeams.slice(0, third);
    const midTier = sortedTeams.slice(third, third * 2);
    const lowTier = sortedTeams.slice(third * 2);

    const updates: any[] = [];

    for (let i = 0; i < topTier.length && i < tierA.length; i++) {
      updates.push({
        id: tierA[i].id,
        data: { distributed: true, distributedTo: topTier[i].id },
      });
    }

    for (let i = 0; i < midTier.length && i < tierB.length; i++) {
      updates.push({
        id: tierB[i].id,
        data: { distributed: true, distributedTo: midTier[i].id },
      });
    }

    for (let i = 0; i < lowTier.length && i < tierC.length; i++) {
      updates.push({
        id: tierC[i].id,
        data: { distributed: true, distributedTo: lowTier[i].id },
      });
    }

    const results = await Promise.all(
      updates.map((u) =>
        prisma.clueCard.update({
          where: { id: u.id },
          data: u.data,
        })
      )
    );

    return NextResponse.json({
      success: true,
      distributed: results.length,
      breakdown: {
        tierA: results.filter((r) => r.tier === "A").length,
        tierB: results.filter((r) => r.tier === "B").length,
        tierC: results.filter((r) => r.tier === "C").length,
      },
    });
  } catch (error: any) {
    console.error("Distribute clue cards error:", error);
    return NextResponse.json(
      { error: "分配线索卡失败: " + (error.message || "未知错误") },
      { status: 500 }
    );
  }
}
