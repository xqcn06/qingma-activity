import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { blocks: true, versions: true } },
      },
    });

    return NextResponse.json(pages);
  } catch {
    return NextResponse.json({ error: "获取页面列表失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const { slug, title, description, type, sortOrder } = body;

    if (!slug || !title || !type) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: { slug, title, description, type, sortOrder: sortOrder || 0, status: "draft" },
    });

    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "创建页面失败" }, { status: 500 });
  }
}
