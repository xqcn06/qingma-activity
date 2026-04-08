import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const block = await prisma.pageBlock.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.config !== undefined && { config: body.config }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.isEnabled !== undefined && { isEnabled: body.isEnabled }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });

    return NextResponse.json(block);
  } catch {
    return NextResponse.json({ error: "更新内容块失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.pageBlock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除内容块失败" }, { status: 500 });
  }
}
