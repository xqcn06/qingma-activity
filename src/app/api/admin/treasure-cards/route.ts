import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");
    const found = searchParams.get("found");
    const value = searchParams.get("value");

    const where: any = {};
    if (session && (session === "FIRST" || session === "SECOND")) {
      where.session = session;
    }
    if (found !== null && found !== undefined && found !== "") {
      where.found = found === "true";
    }
    if (value && ["1", "2", "3"].includes(value)) {
      where.value = parseInt(value);
    }

    const cards = await prisma.treasureCard.findMany({
      where,
      orderBy: [{ value: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(cards);
  } catch {
    return NextResponse.json({ error: "获取积分卡失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { session, value, location, lat, lng, batch } = body;

    if (batch) {
      const { count, session: batchSession, value: batchValue, location: batchLocation } = batch;

      if (!batchSession || !batchValue || !batchLocation || !count) {
        return NextResponse.json(
          { error: "缺少批量创建参数" },
          { status: 400 }
        );
      }

      const cards = await prisma.treasureCard.createMany({
        data: Array.from({ length: count }, () => ({
          session: batchSession,
          value: parseInt(batchValue),
          location: batchLocation,
        })),
      });

      return NextResponse.json({ success: true, count: cards.count }, { status: 201 });
    }

    if (!session || value === undefined || !location) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const card = await prisma.treasureCard.create({
      data: {
        session,
        value: parseInt(value),
        location,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        imageX: body.imageX !== undefined ? parseFloat(body.imageX) : null,
        imageY: body.imageY !== undefined ? parseFloat(body.imageY) : null,
        imageW: body.imageW !== undefined ? parseFloat(body.imageW) : null,
        imageH: body.imageH !== undefined ? parseFloat(body.imageH) : null,
        mapImageUrl: body.mapImageUrl || null,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error: any) {
    console.error("创建积分卡失败:", error);
    return NextResponse.json({ error: "创建积分卡失败: " + error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少积分卡ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (data.value !== undefined) updateData.value = parseInt(data.value);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.lat !== undefined) updateData.lat = data.lat ? parseFloat(data.lat) : null;
    if (data.lng !== undefined) updateData.lng = data.lng ? parseFloat(data.lng) : null;
    if (data.found !== undefined) updateData.found = data.found;
    if (data.foundBy !== undefined) updateData.foundBy = data.foundBy || null;
    if (data.imageX !== undefined) updateData.imageX = data.imageX !== null ? parseFloat(data.imageX) : null;
    if (data.imageY !== undefined) updateData.imageY = data.imageY !== null ? parseFloat(data.imageY) : null;
    if (data.imageW !== undefined) updateData.imageW = data.imageW !== null ? parseFloat(data.imageW) : null;
    if (data.imageH !== undefined) updateData.imageH = data.imageH !== null ? parseFloat(data.imageH) : null;
    if (data.mapImageUrl !== undefined) updateData.mapImageUrl = data.mapImageUrl || null;

    const card = await prisma.treasureCard.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(card);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "积分卡不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "更新积分卡失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少积分卡ID" }, { status: 400 });
    }

    await prisma.treasureCard.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "积分卡不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "删除积分卡失败" }, { status: 500 });
  }
}
