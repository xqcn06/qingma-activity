import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const registration = await prisma.registration.findUnique({
      where: { userId: (session.user as any).id },
    });

    return NextResponse.json(registration);
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
    const { session: sessionType, primaryPosition, secondaryPositions, phone, email, remark } = body;

    if (!sessionType || !primaryPosition || !phone) {
      return NextResponse.json({ error: "请填写必填项" }, { status: 400 });
    }

    if (!["FIRST", "SECOND"].includes(sessionType)) {
      return NextResponse.json({ error: "无效的场次选择" }, { status: 400 });
    }

    const existing = await prisma.registration.findUnique({
      where: { userId: (session.user as any).id },
    });

    if (existing) {
      return NextResponse.json({ error: "您已提交过报名，请勿重复提交" }, { status: 400 });
    }

    // 更新用户手机号和邮箱
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { phone, email: email || null },
    });

    const registration = await prisma.registration.create({
      data: {
        userId: (session.user as any).id,
        session: sessionType,
        primaryPosition,
        secondaryPositions: Array.isArray(secondaryPositions) && secondaryPositions.length > 0
          ? secondaryPositions.join(",")
          : null,
        remark: remark || null,
      },
    });

    return NextResponse.json(registration);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "提交失败" }, { status: 500 });
  }
}
