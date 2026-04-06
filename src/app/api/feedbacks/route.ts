import { auth } from "@/lib/auth";
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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { overallRating, contentRating, organizationRating, suggestion } = body;

    const feedback = await prisma.feedback.create({
      data: {
        userId: (session.user as any).id,
        overallRating: overallRating || null,
        contentRating: contentRating || null,
        organizationRating: organizationRating || null,
        suggestion: suggestion || null,
      },
    });

    return NextResponse.json(feedback);
  } catch {
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
