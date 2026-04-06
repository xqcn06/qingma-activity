import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const STATIONS = ["LISTEN_COMMAND", "DODGEBALL", "CODE_BREAK", "NO_TOUCH_GROUND"] as const;

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(request: NextRequest) {
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
      orderBy: { name: "asc" },
    });

    if (teams.length !== 8) {
      return NextResponse.json(
        { error: `需要8支队伍才能生成排班，当前有 ${teams.length} 支` },
        { status: 400 }
      );
    }

    const existingCount = await prisma.rotationSchedule.count({
      where: { session },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: "该场次已存在排班，请先删除现有排班" },
        { status: 400 }
      );
    }

    const shuffled = shuffle(teams);
    const pairs: [string, string][] = [];
    for (let i = 0; i < 8; i += 2) {
      pairs.push([shuffled[i].id, shuffled[i + 1].id]);
    }

    const stationOrder = shuffle([...STATIONS]);
    const scheduleEntries: any[] = [];

    for (let round = 1; round <= 4; round++) {
      const rotatedStations = [
        ...stationOrder.slice(round - 1),
        ...stationOrder.slice(0, round - 1),
      ];

      for (let pairIdx = 0; pairIdx < 4; pairIdx++) {
        scheduleEntries.push({
          session,
          round,
          station: rotatedStations[pairIdx],
          teamAId: pairs[pairIdx][0],
          teamBId: pairs[pairIdx][1],
          completed: false,
        });
      }
    }

    const created = await prisma.rotationSchedule.createMany({
      data: scheduleEntries,
    });

    const schedules = await prisma.rotationSchedule.findMany({
      where: { session },
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
      },
      orderBy: [{ round: "asc" }, { station: "asc" }],
    });

    return NextResponse.json({
      success: true,
      count: created.count,
      schedules,
    });
  } catch (error: any) {
    console.error("Generate rotation error:", error);
    return NextResponse.json(
      { error: "生成排班失败: " + (error.message || "未知错误") },
      { status: 500 }
    );
  }
}
