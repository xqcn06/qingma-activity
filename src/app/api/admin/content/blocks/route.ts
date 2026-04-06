import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 获取指定页面的所有块
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json({ error: "缺少 pageId 参数" }, { status: 400 });
    }

    const blocks = await prisma.pageBlock.findMany({
      where: { pageId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(blocks);
  } catch {
    return NextResponse.json({ error: "获取内容块失败" }, { status: 500 });
  }
}

// 创建内容块
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await req.json();
    const { pageId, type, key, title, config, content, sortOrder } = body;

    if (!pageId || !key || !title) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }

    const block = await prisma.pageBlock.create({
      data: {
        pageId,
        type: type || "text",
        key,
        title,
        config: config || "{}",
        content: content || "",
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(block);
  } catch {
    return NextResponse.json({ error: "创建内容块失败" }, { status: 500 });
  }
}
