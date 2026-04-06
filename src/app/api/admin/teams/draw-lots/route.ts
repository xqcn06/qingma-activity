import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GameStation, Session } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { session: targetSession } = body;

    if (!targetSession || (targetSession !== "FIRST" && targetSession !== "SECOND")) {
      return NextResponse.json({ error: "缺少或无效的场次参数" }, { status: 400 });
    }

    const teamsInSession = await prisma.team.findMany({
      where: { session: targetSession as Session },
      orderBy: { createdAt: "asc" },
    });

    if (teamsInSession.length === 0) {
      return NextResponse.json({ error: "该场次没有队伍" }, { status: 400 });
    }

    if (teamsInSession.length % 2 !== 0) {
      return NextResponse.json({ error: "队伍数量必须为偶数才能抽签" }, { status: 400 });
    }

    const shuffled = [...teamsInSession].sort(() => Math.random() - 0.5);

    await prisma.rotationSchedule.deleteMany({
      where: { session: targetSession as Session },
    });

    await prisma.team.updateMany({
      where: { session: targetSession as Session },
      data: { rotationOrder: null },
    });

    const pairs: any[] = [];
    const rounds = 4;
    const gameStations: GameStation[] = [
      GameStation.LISTEN_COMMAND,
      GameStation.DODGEBALL,
      GameStation.CODE_BREAK,
      GameStation.NO_TOUCH_GROUND,
    ];

    for (let round = 1; round <= rounds; round++) {
      const offset = (round - 1) * 2;
      for (let i = 0; i < shuffled.length; i += 2) {
        const teamA = shuffled[(i + offset) % shuffled.length];
        const teamB = shuffled[(i + offset + 1) % shuffled.length];
        const station = gameStations[(round - 1 + Math.floor(i / 2)) % gameStations.length];

        await prisma.rotationSchedule.create({
          data: {
            session: targetSession as Session,
            round,
            station,
            teamAId: teamA.id,
            teamBId: teamB.id,
          },
        });

        if (round === 1) {
          pairs.push({
            teamA: teamA.name,
            teamB: teamB.name,
            station,
          });
        }
      }
    }

    for (let i = 0; i < shuffled.length; i++) {
      await prisma.team.update({
        where: { id: shuffled[i].id },
        data: { rotationOrder: Math.floor(i / 2) + 1 },
      });
    }

    return NextResponse.json({
      success: true,
      pairs,
      rotationCount: shuffled.length / 2,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "抽签失败" }, { status: 500 });
  }
}
