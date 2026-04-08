import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const roles = await prisma.staffRole.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(roles);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { name, description, requiredCount, session: roleSession } = body;

    if (!name || !requiredCount) {
      return NextResponse.json({ error: "岗位名称和所需人数为必填" }, { status: 400 });
    }

    const role = await prisma.staffRole.create({
      data: {
        name,
        description: description || null,
        requiredCount: parseInt(requiredCount),
        session: roleSession || null,
      },
    });

    return NextResponse.json(role);
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, name, description, requiredCount, session: roleSession, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少岗位ID" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (requiredCount !== undefined) updateData.requiredCount = parseInt(requiredCount);
    if (roleSession !== undefined) updateData.session = roleSession;
    if (isActive !== undefined) updateData.isActive = isActive;

    const role = await prisma.staffRole.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(role);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少岗位ID" }, { status: 400 });
    }

    const existing = await prisma.staffRole.findUnique({
      where: { id },
      include: { _count: { select: { assignments: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    if (existing._count.assignments > 0) {
      return NextResponse.json({ error: "该岗位已有人员分配，无法删除" }, { status: 400 });
    }

    await prisma.staffRole.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
