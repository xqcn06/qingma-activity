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
    const { cardId } = body;

    if (!cardId) {
      return NextResponse.json({ error: "缺少积分卡ID" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { studentId: (session.user as any).studentId },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    // Get user's team
    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { team: true },
    });

    if (!teamMember) {
      return NextResponse.json({ error: "未加入队伍" }, { status: 404 });
    }

    // Find the treasure card
    const card = await prisma.treasureCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: "积分卡不存在" }, { status: 404 });
    }

    if (card.found) {
      return NextResponse.json({ error: "积分卡已被找到" }, { status: 400 });
    }

    // Mark card as found
    const updatedCard = await prisma.treasureCard.update({
      where: { id: cardId },
      data: {
        found: true,
        foundBy: teamMember.team.id,
      },
    });

    // Update team's treasure score
    const newScore = (teamMember.team.treasureScore || 0) + card.value;
    await prisma.team.update({
      where: { id: teamMember.team.id },
      data: { treasureScore: newScore },
    });

    return NextResponse.json({
      success: true,
      cardValue: card.value,
      newTeamScore: newScore,
    });
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
