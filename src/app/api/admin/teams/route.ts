import { auth } from "@/lib/auth";
import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: { select: { name: true, studentId: true, className: true } },
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

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { action } = body;

    if (action === "publish") {
      await prisma.team.updateMany({
        data: { publishedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
