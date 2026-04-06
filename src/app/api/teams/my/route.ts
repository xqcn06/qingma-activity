import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: { userId: (session.user as any).id },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { name: true, className: true },
                },
              },
              orderBy: { isCaptain: "desc" },
            },
          },
        },
      },
    });

    if (!teamMember) {
      return NextResponse.json(null);
    }

    return NextResponse.json(teamMember.team);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
