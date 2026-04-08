import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { session } = body;

    if (!session || (session !== "FIRST" && session !== "SECOND")) {
      return NextResponse.json(
        { error: "请指定有效的场次（FIRST 或 SECOND）" },
        { status: 400 }
      );
    }

    const result = await prisma.treasureCard.updateMany({
      where: { session },
      data: {
        found: false,
        foundBy: null,
      },
    });

    return NextResponse.json({
      success: true,
      resetCount: result.count,
    });
  } catch {
    return NextResponse.json({ error: "重置积分卡失败" }, { status: 500 });
  }
}
