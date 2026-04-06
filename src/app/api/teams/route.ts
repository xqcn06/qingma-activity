import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      where: { publishedAt: { not: null } },
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
      orderBy: [{ session: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(teams);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
