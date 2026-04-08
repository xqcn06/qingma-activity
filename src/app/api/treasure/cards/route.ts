import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
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

    // Get unfound treasure cards for this session
    const treasureCards = await prisma.treasureCard.findMany({
      where: {
        session: teamMember.team.session,
        found: false,
      },
      orderBy: { value: "desc" },
    });

    // Get team's treasure score
    const teamTreasureScore = teamMember.team.treasureScore || 0;

    // Get clue cards for this team
    const clueCards = await prisma.clueCard.findMany({
      where: {
        session: teamMember.team.session,
        distributedTo: teamMember.team.id,
      },
      orderBy: { tier: "asc" },
    });

    // Get map image
    const mapSetting = await prisma.setting.findFirst({
      where: { key: "treasure_map_image" },
    });

    return NextResponse.json({
      treasureCards,
      clueCards,
      mapImageUrl: mapSetting?.value || null,
      teamName: teamMember.team.name,
      teamTreasureScore,
    });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
