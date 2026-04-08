import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const station = searchParams.get("station");
    const round = searchParams.get("round");
    const teamId = searchParams.get("teamId");
    const sessionFilter = searchParams.get("session");

    const where: any = {};
    if (station) where.station = station;
    if (round) where.round = parseInt(round);
    if (teamId) where.teamId = teamId;
    if (sessionFilter && (sessionFilter === "FIRST" || sessionFilter === "SECOND")) {
      where.team = { session: sessionFilter };
    }

    const scores = await prisma.score.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, session: true } },
        recorder: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scores);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { teamId, station, round, score, reason } = body;

    if (!teamId || !station || score === undefined) {
      return NextResponse.json({ error: "缺少必填参数" }, { status: 400 });
    }

    if (typeof score !== "number" || isNaN(score)) {
      return NextResponse.json({ error: "分数必须为数字" }, { status: 400 });
    }

    if (score < -1000 || score > 10000) {
      return NextResponse.json({ error: "分数范围应在 -1000 到 10000 之间" }, { status: 400 });
    }

    const newScore = await prisma.score.create({
      data: {
        teamId,
        station,
        round: round || null,
        score,
        reason: reason || null,
        recordedBy: authResult.userId,
      },
      include: {
        team: { select: { name: true, session: true } },
        recorder: { select: { name: true } },
      },
    });

    await updateTeamTotalScore(teamId);

    return NextResponse.json(newScore);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "录入失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, teamId, station, round, score, reason } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    if (score !== undefined) {
      if (typeof score !== "number" || isNaN(score)) {
        return NextResponse.json({ error: "分数必须为数字" }, { status: 400 });
      }
      if (score < -1000 || score > 10000) {
        return NextResponse.json({ error: "分数范围应在 -1000 到 10000 之间" }, { status: 400 });
      }
    }

    const existing = await prisma.score.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const oldTeamId = existing.teamId;

    const updated = await prisma.score.update({
      where: { id },
      data: {
        station: station || undefined,
        round: round !== undefined ? round : undefined,
        score: score !== undefined ? score : undefined,
        reason: reason !== undefined ? reason : undefined,
      },
      include: {
        team: { select: { name: true, session: true } },
        recorder: { select: { name: true } },
      },
    });

    await updateTeamTotalScore(oldTeamId);
    if (teamId && teamId !== oldTeamId) {
      await updateTeamTotalScore(teamId);
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    const existing = await prisma.score.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    const teamId = existing.teamId;

    await prisma.score.delete({ where: { id } });

    await updateTeamTotalScore(teamId);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "删除失败" }, { status: 500 });
  }
}

async function updateTeamTotalScore(teamId: string) {
  const totalScores = await prisma.score.aggregate({
    where: { teamId, station: { not: "TREASURE_HUNT" } },
    _sum: { score: true },
  });

  const treasureScores = await prisma.score.aggregate({
    where: { teamId, station: "TREASURE_HUNT" },
    _sum: { score: true },
  });

  await prisma.team.update({
    where: { id: teamId },
    data: {
      totalScore: totalScores._sum.score || 0,
      treasureScore: treasureScores._sum.score || 0,
    },
  });
}
