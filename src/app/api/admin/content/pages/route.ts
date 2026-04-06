import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 获取所有页面（含内容块）
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const pages = await prisma.page.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        blocks: { orderBy: { sortOrder: "asc" } },
        _count: { select: { blocks: true } },
      },
    });

    return NextResponse.json(pages);
  } catch {
    return NextResponse.json({ error: "获取内容失败" }, { status: 500 });
  }
}

// 创建页面
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await req.json();
    const { slug, title, description, sortOrder } = body;

    if (!slug || !title) {
      return NextResponse.json({ error: "缺少 slug 或 title" }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: { slug, title, description, sortOrder: sortOrder || 0 },
    });

    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "创建页面失败" }, { status: 500 });
  }
}
