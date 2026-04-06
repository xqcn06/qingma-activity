import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");
    const tier = searchParams.get("tier");
    const distributed = searchParams.get("distributed");

    const where: any = {};
    if (session && (session === "FIRST" || session === "SECOND")) {
      where.session = session;
    }
    if (tier && ["A", "B", "C"].includes(tier)) {
      where.tier = tier;
    }
    if (distributed !== null && distributed !== undefined && distributed !== "") {
      where.distributed = distributed === "true";
    }

    const cards = await prisma.clueCard.findMany({
      where,
      orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(cards);
  } catch {
    return NextResponse.json({ error: "获取线索卡失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session, tier, content, distributed, distributedTo } = body;

    if (!session || !tier || !content) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!["A", "B", "C"].includes(tier)) {
      return NextResponse.json(
        { error: "线索卡等级必须为 A、B 或 C" },
        { status: 400 }
      );
    }

    const card = await prisma.clueCard.create({
      data: {
        session,
        tier,
        content,
        distributed: distributed || false,
        distributedTo: distributedTo || null,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建线索卡失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少线索卡ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (data.tier !== undefined) updateData.tier = data.tier;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.distributed !== undefined) updateData.distributed = data.distributed;
    if (data.distributedTo !== undefined) updateData.distributedTo = data.distributedTo || null;

    const card = await prisma.clueCard.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(card);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "线索卡不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "更新线索卡失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少线索卡ID" }, { status: 400 });
    }

    await prisma.clueCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "线索卡不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "删除线索卡失败" }, { status: 500 });
  }
}
