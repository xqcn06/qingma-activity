import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: { select: { name: true, className: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(feedbacks);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
