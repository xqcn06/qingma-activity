import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { fromTeamId, toTeamId, userId } = body;

    if (!fromTeamId || !toTeamId || !userId) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const targetTeam = await prisma.team.findUnique({
      where: { id: toTeamId },
    });

    if (!targetTeam) {
      return NextResponse.json({ error: "目标队伍不存在" }, { status: 404 });
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: toTeamId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: "该成员已在目标队伍中" }, { status: 400 });
    }

    const currentMember = await prisma.teamMember.findFirst({
      where: { userId, teamId: fromTeamId },
      include: { team: true },
    });

    if (!currentMember) {
      return NextResponse.json({ error: "该成员不在源队伍中" }, { status: 400 });
    }

    await prisma.teamMember.delete({
      where: { id: currentMember.id },
    });

    await prisma.teamMember.create({
      data: {
        teamId: toTeamId,
        userId,
        isCaptain: false,
      },
    });

    const oldTeamCaptainCount = await prisma.teamMember.count({
      where: { teamId: fromTeamId, isCaptain: true },
    });

    if (oldTeamCaptainCount === 0) {
      const firstMember = await prisma.teamMember.findFirst({
        where: { teamId: fromTeamId },
        orderBy: { createdAt: "asc" },
      });
      if (firstMember) {
        await prisma.teamMember.update({
          where: { id: firstMember.id },
          data: { isCaptain: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "移动成员失败" }, { status: 500 });
  }
}
