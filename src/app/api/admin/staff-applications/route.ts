import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const sessionFilter = searchParams.get("session");

    const where: Record<string, unknown> = {};
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter;
    }
    if (sessionFilter && sessionFilter !== "ALL") {
      where.session = sessionFilter;
    }

    const applications = await prisma.staffAssignment.findMany({
      where,
      include: {
        user: { select: { name: true, studentId: true, className: true, phone: true } },
        staffRole: { select: { id: true, name: true, requiredCount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(applications);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, staffRoleId } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少申请ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (staffRoleId) updateData.staffRoleId = staffRoleId;

    const application = await prisma.staffAssignment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(application);
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
