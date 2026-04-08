import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const sessionFilter = searchParams.get("session");

    const where: any = {};
    if (sessionFilter && sessionFilter !== "ALL") where.session = sessionFilter;

    const schedules = await prisma.scheduleItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(schedules);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { title, description, session: itemSession, startTime, endTime, location, sortOrder, phase } = body;

    if (!title || !itemSession || !startTime || !endTime) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const schedule = await prisma.scheduleItem.create({
      data: {
        title,
        description: description || null,
        session: itemSession,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        location: location || null,
        sortOrder: sortOrder ?? 0,
        phase: phase || null,
      },
    });

    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少日程ID" }, { status: 400 });
    }

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.session !== undefined) updateData.session = data.session;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
    if (data.location !== undefined) updateData.location = data.location;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.phase !== undefined) updateData.phase = data.phase;

    const schedule = await prisma.scheduleItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(schedule);
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少日程ID" }, { status: 400 });
    }

    await prisma.scheduleItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
