import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 获取单个页面（含内容块）
export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "缺少 slug 参数" }, { status: 400 });
    }

    const page = await prisma.page.findUnique({
      where: { slug },
      include: { blocks: { orderBy: { sortOrder: "asc" } } },
    });

    if (!page) {
      return NextResponse.json({ error: "页面不存在" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "获取页面失败" }, { status: 500 });
  }
}
