import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { publishedAt: { not: null } },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });

    return NextResponse.json(announcements);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
