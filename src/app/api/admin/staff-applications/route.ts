import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

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
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, status, staffRoleId, staffRoleIds } = body;

    if (!id && !staffRoleIds) {
      return NextResponse.json({ error: "缺少申请ID或岗位列表" }, { status: 400 });
    }

    // 批量分配多个岗位
    if (staffRoleIds && Array.isArray(staffRoleIds)) {
      const assignment = await prisma.staffAssignment.findUnique({
        where: { id },
        include: { staffRole: true },
      });

      if (!assignment) {
        return NextResponse.json({ error: "申请不存在" }, { status: 404 });
      }

      const results = [];
      for (const roleId of staffRoleIds) {
        const existing = await prisma.staffAssignment.findUnique({
          where: {
            userId_staffRoleId_session: {
              userId: assignment.userId,
              staffRoleId: roleId,
              session: assignment.session,
            },
          },
        });

        if (existing) {
          results.push(await prisma.staffAssignment.update({
            where: { id: existing.id },
            data: { status: "APPROVED" },
            include: { staffRole: true, user: true },
          }));
        } else {
          results.push(await prisma.staffAssignment.create({
            data: {
              userId: assignment.userId,
              staffRoleId: roleId,
              session: assignment.session,
              status: "APPROVED",
            },
            include: { staffRole: true, user: true },
          }));
        }
      }

      return NextResponse.json(results);
    }

    // 单个更新
    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (staffRoleId) updateData.staffRoleId = staffRoleId;

    const application = await prisma.staffAssignment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(application);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "操作失败" }, { status: 500 });
  }
}

// 批量删除某人的某个岗位
export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少ID" }, { status: 400 });
    }

    await prisma.staffAssignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
