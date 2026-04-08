import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/permissions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const session = searchParams.get("session");

    const where: any = {};
    if (session && (session === "FIRST" || session === "SECOND")) {
      where.session = session;
    }

    const schedules = await prisma.rotationSchedule.findMany({
      where,
      include: {
        teamA: { select: { id: true, name: true, session: true } },
        teamB: { select: { id: true, name: true, session: true } },
      },
      orderBy: [{ round: "asc" }, { station: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json({ error: "获取排班失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { session, round, station, teamAId, teamBId } = body;

    if (!session || !round || !station || !teamAId || !teamBId) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const schedule = await prisma.rotationSchedule.create({
      data: {
        session,
        round: parseInt(round),
        station,
        teamAId,
        teamBId,
      },
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "该轮次和站点的排班已存在" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "创建排班失败" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "缺少排班ID" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (data.round !== undefined) updateData.round = parseInt(data.round);
    if (data.station !== undefined) updateData.station = data.station;
    if (data.teamAId !== undefined) updateData.teamAId = data.teamAId;
    if (data.teamBId !== undefined) updateData.teamBId = data.teamBId;
    if (data.completed !== undefined) updateData.completed = data.completed;

    const schedule = await prisma.rotationSchedule.update({
      where: { id },
      data: updateData,
      include: {
        teamA: { select: { id: true, name: true } },
        teamB: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(schedule);
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "排班不存在" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "该轮次和站点的排班已存在" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "更新排班失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "缺少排班ID" },
        { status: 400 }
      );
    }

    await prisma.rotationSchedule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "排班不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "删除排班失败" }, { status: 500 });
  }
}
