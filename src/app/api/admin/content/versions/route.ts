import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const permissions = (session.user as any).permissions || [];
    if (!hasPermission(permissions, "MANAGE_SETTINGS")) {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) return NextResponse.json({ error: "缺少 pageId" }, { status: 400 });

    const versions = await prisma.pageVersion.findMany({
      where: { pageId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(versions);
  } catch {
    return NextResponse.json({ error: "获取历史版本失败" }, { status: 500 });
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
    const { pageId, versionId } = body;

    if (!pageId || !versionId) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

    const version = await prisma.pageVersion.findUnique({ where: { id: versionId } });
    if (!version) return NextResponse.json({ error: "版本不存在" }, { status: 404 });

    const blocks = JSON.parse(version.blocks);

    // Restore blocks
    await prisma.pageBlock.deleteMany({ where: { pageId } });
    for (const block of blocks) {
      await prisma.pageBlock.create({
        data: {
          pageId,
          type: block.type,
          key: block.key,
          title: block.title,
          config: block.config,
          content: block.content,
          sortOrder: block.sortOrder,
        },
      });
    }

    // Create a new version entry for the rollback
    const versionCount = await prisma.pageVersion.count({ where: { pageId } });
    await prisma.pageVersion.create({
      data: {
        pageId,
        version: versionCount + 1,
        blocks: version.blocks,
        status: "draft",
        createdBy: `回滚至版本 ${version.version} - ${(session.user as any).name || "admin"}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "回滚失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const permissions = (session.user as any).permissions || [];
    if (!permissions.includes("MANAGE_SETTINGS")) return NextResponse.json({ error: "无权限" }, { status: 403 });
    const { searchParams } = new URL(req.url);
    const versionId = searchParams.get("versionId");
    if (!versionId) return NextResponse.json({ error: "缺少 versionId" }, { status: 400 });
    await prisma.pageVersion.delete({ where: { id: versionId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "删除失败" }, { status: 500 });
  }
}
