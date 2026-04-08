import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const batch = await prisma.importBatch.findUnique({
      where: { id },
      include: {
        importLogs: {
          orderBy: { rowNumber: "asc" },
        },
        importer: {
          select: { name: true },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "导入批次不存在" }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
