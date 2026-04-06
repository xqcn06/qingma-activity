import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 公开 API，获取页面内容（无需登录）
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
    }

    const page = await prisma.page.findUnique({
      where: { slug, isEnabled: true },
      include: {
        blocks: {
          where: { isEnabled: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "页面不存在" }, { status: 404 });
    }

    // 解析 JSON 内容
    const blocks = page.blocks.map((block) => ({
      ...block,
      config: block.config ? JSON.parse(block.config) : {},
      content: block.content ? (() => {
        try { return JSON.parse(block.content); } catch { return block.content; }
      })() : null,
    }));

    return NextResponse.json({ ...page, blocks });
  } catch {
    return NextResponse.json({ error: "获取页面内容失败" }, { status: 500 });
  }
}
