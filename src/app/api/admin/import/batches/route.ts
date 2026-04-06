import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

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
