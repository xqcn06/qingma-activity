import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const sess = searchParams.get("session");
    const userType = searchParams.get("userType");
    const lastConfig = searchParams.get("lastConfig");

    // 获取上次签到配置（用于自动填充）
    if (lastConfig && sess && userType) {
      const lastSession = await prisma.checkinSession.findFirst({
        where: {
          session: sess as any,
          userType,
        },
        orderBy: { createdAt: "desc" },
        select: {
          fenceCenterLat: true,
          fenceCenterLng: true,
          fenceRadius: true,
          verificationCode: true,
          startTime: true,
        },
      });
      return NextResponse.json(lastSession);
    }

    const where: any = {};
    if (sess && ["FIRST", "SECOND"].includes(sess)) where.session = sess;
    if (userType && ["STUDENT", "STAFF"].includes(userType)) where.userType = userType;

    const sessions = await prisma.checkinSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "获取签到活动失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { name, session: sess, userType = "STUDENT", startTime, endTime, fenceCenterLat, fenceCenterLng, fenceRadius, verificationCode } = body;

    if (!name || !sess || !["FIRST", "SECOND"].includes(sess)) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const checkinSession = await prisma.checkinSession.create({
      data: {
        name,
        session: sess,
        userType,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        fenceCenterLat: fenceCenterLat ?? null,
        fenceCenterLng: fenceCenterLng ?? null,
        fenceRadius: fenceRadius ?? null,
        verificationCode: verificationCode ?? null,
      },
    });

    return NextResponse.json({ success: true, data: checkinSession });
  } catch {
    return NextResponse.json({ error: "创建签到活动失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, status, endTime, fenceCenterLat, fenceCenterLng, fenceRadius, verificationCode } = body;

    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (endTime) data.endTime = new Date(endTime);
    if (fenceCenterLat !== undefined) data.fenceCenterLat = fenceCenterLat;
    if (fenceCenterLng !== undefined) data.fenceCenterLng = fenceCenterLng;
    if (fenceRadius !== undefined) data.fenceRadius = fenceRadius;
    if (verificationCode !== undefined) data.verificationCode = verificationCode;

    const updated = await prisma.checkinSession.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: "更新签到活动失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");
    if (!sessionId) return NextResponse.json({ error: "缺少签到活动ID" }, { status: 400 });

    // Delete related records first
    await prisma.checkinRecord.deleteMany({ where: { checkinSessionId: sessionId } });
    // Delete the session
    await prisma.checkinSession.delete({ where: { id: sessionId } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
