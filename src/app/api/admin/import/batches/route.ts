import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        importer: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(batches);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
