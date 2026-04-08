import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

// Save as draft
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const { pageId, blocks } = body;

    if (!pageId || !blocks || !Array.isArray(blocks)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // Delete existing blocks and create new ones
    await prisma.pageBlock.deleteMany({ where: { pageId } });

    for (const block of blocks) {
      await prisma.pageBlock.create({
        data: {
          pageId,
          type: block.type,
          key: block.key,
          title: block.title,
          config: typeof block.config === "string" ? block.config : JSON.stringify(block.config || {}),
          content: typeof block.content === "string" ? block.content : JSON.stringify(block.content || ""),
          sortOrder: block.sortOrder || 0,
        },
      });
    }

    // Create a draft version
    const page = await prisma.page.findUnique({ where: { id: pageId }, include: { blocks: { orderBy: { sortOrder: "asc" } } } });
    const versionCount = await prisma.pageVersion.count({ where: { pageId } });

    await prisma.pageVersion.create({
      data: {
        pageId,
        version: versionCount + 1,
        blocks: JSON.stringify(page?.blocks || []),
        status: "draft",
        createdBy: (session.user as any).name || "admin",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "保存草稿失败" }, { status: 500 });
  }
}

// Publish page
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await req.json();
    const { pageId } = body;

    if (!pageId) return NextResponse.json({ error: "缺少 pageId" }, { status: 400 });

    // Create published version
    const page = await prisma.page.findUnique({ where: { id: pageId }, include: { blocks: { orderBy: { sortOrder: "asc" } } } });
    const versionCount = await prisma.pageVersion.count({ where: { pageId } });

    await prisma.pageVersion.create({
      data: {
        pageId,
        version: versionCount + 1,
        blocks: JSON.stringify(page?.blocks || []),
        status: "published",
        createdBy: (session.user as any).name || "admin",
      },
    });

    await prisma.page.update({
      where: { id: pageId },
      data: { status: "published", publishedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "发布失败" }, { status: 500 });
  }
}
