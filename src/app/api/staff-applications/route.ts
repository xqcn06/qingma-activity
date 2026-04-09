import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { staffRoleId, session: sessionType } = body;

    if (!staffRoleId) {
      return NextResponse.json({ error: "缺少岗位ID" }, { status: 400 });
    }

    const existing = await prisma.staffAssignment.findFirst({
      where: { userId: (session.user as any).id },
    });

    if (existing) {
      return NextResponse.json({ error: "您已申请过工作人员岗位" }, { status: 400 });
    }

    const application = await prisma.staffAssignment.create({
      data: {
        userId: (session.user as any).id,
        staffRoleId,
        session: sessionType || "FIRST",
        status: "PENDING",
      },
    });

    return NextResponse.json(application);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "申请失败" }, { status: 500 });
  }
}
