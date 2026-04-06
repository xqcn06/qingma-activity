import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const application = await prisma.staffAssignment.findUnique({
      where: { userId: (session.user as any).id },
      include: {
        staffRole: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(application);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    await prisma.staffAssignment.delete({
      where: { userId: (session.user as any).id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "取消失败" }, { status: 500 });
  }
}
