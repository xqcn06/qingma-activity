import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 获取所有已通过报名的学生
    const registrations = await prisma.registration.findMany({
      where: { status: "APPROVED" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    if (registrations.length === 0) {
      return NextResponse.json({ error: "没有已通过的报名" }, { status: 400 });
    }

    // 按场次分组
    const firstSession = registrations.filter((r) => r.session === "FIRST");
    const secondSession = registrations.filter((r) => r.session === "SECOND");

    // 删除已有队伍和成员
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();

    const allTeams: any[] = [];

    // 为每场创建队伍
    for (const sessionData of [
      { registrations: firstSession, label: "第一场" },
      { registrations: secondSession, label: "第二场" },
    ]) {
      const regs = sessionData.registrations;
      if (regs.length === 0) continue;

      // 按姓氏拼音首字母排序
      const sorted = [...regs].sort((a, b) => {
        const charA = a.user.name.charAt(0);
        const charB = b.user.name.charAt(0);
        return charA.localeCompare(charB, "zh-Hans-CN", { sensitivity: "accent" });
      });

      // 分为8-9人一队
      const teamSize = Math.ceil(sorted.length / 16);
      const teams: any[] = [];

      for (let i = 0; i < sorted.length; i += teamSize) {
        const chunk = sorted.slice(i, i + teamSize);
        const teamIndex = teams.length + 1;

        // 识别队长：优先班长，其次团支书
        let captainIdx = -1;
        const priorityOrder = ["CLASS_MONITOR", "LEAGUE_SECRETARY", "STUDY_COMMISSAR", "LIFE_COMMISSAR", "CULTURE_COMMISSAR"];
        for (const pos of priorityOrder) {
          captainIdx = chunk.findIndex((r) => r.primaryPosition === pos);
          if (captainIdx >= 0) break;
        }

        const team = await prisma.team.create({
          data: {
            name: `第${teamIndex}组`,
            session: sessionData.registrations[0].session,
            members: {
              create: chunk.map((reg, idx) => ({
                userId: reg.userId,
                isCaptain: idx === (captainIdx >= 0 ? captainIdx : 0),
              })),
            },
          },
        });

        teams.push(team);
      }

      allTeams.push(...teams);
    }

    return NextResponse.json({
      success: true,
      teamCount: allTeams.length,
      teams: allTeams.map((t) => ({ id: t.id, name: t.name, session: t.session })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "分组失败" }, { status: 500 });
  }
}
