import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 获取用户类型
async function getUserType(userId: string): Promise<"STUDENT" | "STAFF"> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return "STUDENT";
  if (user.role === "STAFF" || user.role === "TEACHER" || user.role === "ADMIN") return "STAFF";
  const hasStaffAssignment = await prisma.staffAssignment.findFirst({
    where: { userId, status: "APPROVED" },
  });
  return hasStaffAssignment ? "STAFF" : "STUDENT";
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionParam = searchParams.get("session");

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { studentId: (session.user as any).studentId },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userType = await getUserType(user.id);

    // 获取当前场次下所有可用的签到活动
    const now = new Date();
    const activeSessions = await prisma.checkinSession.findMany({
      where: {
        session: sessionParam as any,
        userType,
        status: "ACTIVE",
        OR: [{ endTime: null }, { endTime: { gt: now } }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, startTime: true, endTime: true,
        fenceCenterLat: true, fenceCenterLng: true, fenceRadius: true, verificationCode: true,
      },
    });

    // 获取用户已签到记录
    const records = await prisma.checkinRecord.findMany({
      where: { userId: user.id, session: sessionParam as any },
      include: { checkinSession: { select: { id: true, name: true } } },
      orderBy: { checkedAt: "desc" },
    });

    const sessionsWithStatus = activeSessions.map((s) => {
      const record = records.find((r) => r.checkinSessionId === s.id);
      return {
        ...s, checkedIn: !!record,
        record: record ? { id: record.id, method: record.method, status: record.status, checkinTime: record.checkedAt } : null,
        config: { startTime: s.startTime, endTime: s.endTime, hasFence: !!(s.fenceCenterLat && s.fenceCenterLng && s.fenceRadius), fenceCenterLat: s.fenceCenterLat, fenceCenterLng: s.fenceCenterLng, fenceRadius: s.fenceRadius },
      };
    });

    return NextResponse.json({
      sessions: sessionsWithStatus,
      allRecords: records.map((r) => ({ id: r.id, checkinSessionId: r.checkinSessionId, checkinSessionName: r.checkinSession?.name, method: r.method, status: r.status, checkinTime: r.checkedAt })),
    });
  } catch {
    return NextResponse.json({ error: "获取签到状态失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { method, lat, lng, qrToken, code, session: sessionParam, checkinSessionId } = body;

    if (!method || !["GPS", "QR", "CODE"].includes(method)) {
      return NextResponse.json({ error: "无效的签到方式" }, { status: 400 });
    }

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { studentId: (session.user as any).studentId },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const userType = await getUserType(user.id);

    // 根据 checkinSessionId 获取签到活动
    let activeSession;
    if (checkinSessionId) {
      activeSession = await prisma.checkinSession.findUnique({ where: { id: checkinSessionId } });
      if (activeSession && (activeSession.session !== sessionParam || activeSession.userType !== userType)) {
        return NextResponse.json({ error: "签到活动不匹配" }, { status: 400 });
      }
    } else {
      activeSession = await prisma.checkinSession.findFirst({
        where: { session: sessionParam as any, userType, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!activeSession) {
      return NextResponse.json({ error: "该场次尚未开启签到" }, { status: 400 });
    }

    if (activeSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "该签到活动已结束" }, { status: 400 });
    }

    const now = new Date();
    const startTime = new Date(activeSession.startTime);
    const endTime = activeSession.endTime ? new Date(activeSession.endTime) : null;

    if (now < startTime) {
      return NextResponse.json({ error: "签到尚未开始" }, { status: 400 });
    }

    if (endTime && now > endTime) {
      return NextResponse.json({ error: "该签到活动已结束" }, { status: 400 });
    }

    const isLate = endTime ? now > endTime : false;

    // 检查是否已签到此活动
    const existing = await prisma.checkinRecord.findFirst({
      where: { userId: user.id, checkinSessionId: activeSession.id },
    });

    if (existing) {
      return NextResponse.json({ error: "您已签到，请勿重复签到", data: existing }, { status: 400 });
    }

    if (method === "GPS") {
      if (lat == null || lng == null) {
        return NextResponse.json({ error: "缺少 GPS 坐标" }, { status: 400 });
      }

      if (activeSession.fenceCenterLat != null && activeSession.fenceCenterLng != null && activeSession.fenceRadius != null) {
        const distance = haversineDistance(lat, lng, activeSession.fenceCenterLat, activeSession.fenceCenterLng);
        if (distance > activeSession.fenceRadius) {
          return NextResponse.json(
            { error: `您不在签到范围内（距离${Math.round(distance)}米，要求${activeSession.fenceRadius}米内）` },
            { status: 400 }
          );
        }
      }
    }

    if (method === "QR") {
      if (!qrToken) {
        return NextResponse.json({ error: "缺少二维码 Token" }, { status: 400 });
      }

      const validToken = await prisma.qRCodeToken.findFirst({
        where: { token: qrToken, checkinSessionId: activeSession.id, expiresAt: { gt: now } },
      });

      if (!validToken) {
        return NextResponse.json({ error: "二维码已过期或无效，请刷新后重试" }, { status: 400 });
      }
    }

    if (method === "CODE") {
      if (!code) {
        return NextResponse.json({ error: "缺少验证码" }, { status: 400 });
      }

      const inputCode = code.trim().toUpperCase();
      const correctCode = activeSession.verificationCode?.toUpperCase();
      if (!correctCode || inputCode !== correctCode) {
        return NextResponse.json({ error: "验证码错误" }, { status: 400 });
      }
    }

    const record = await prisma.checkinRecord.create({
      data: {
        userId: user.id,
        session: sessionParam as any,
        userType,
        method,
        lat: lat ?? null,
        lng: lng ?? null,
        status: isLate ? "LATE" : "ON_TIME",
        checkinSessionId: activeSession.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...record, checkinSessionName: activeSession.name, isLate },
    });
  } catch {
    return NextResponse.json({ error: "签到失败" }, { status: 500 });
  }
}
