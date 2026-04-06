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

    const record = await prisma.checkinRecord.findUnique({
      where: {
        userId_session: {
          userId: user.id,
          session: sessionParam as any,
        },
      },
    });

    const config = await prisma.checkinConfig.findUnique({
      where: { session: sessionParam as any },
    });

    return NextResponse.json({
      checkedIn: !!record,
      record,
      config: config
        ? {
            startTime: config.startTime,
            endTime: config.endTime,
            hasFence: !!(config.fenceCenterLat && config.fenceCenterLng && config.fenceRadius),
          }
        : null,
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
    const { method, lat, lng, qrToken, code, session: sessionParam } = body;

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

    const config = await prisma.checkinConfig.findUnique({
      where: { session: sessionParam as any },
    });

    if (!config) {
      return NextResponse.json({ error: "该场次尚未配置签到" }, { status: 400 });
    }

    const now = new Date();
    const startTime = new Date(config.startTime);
    const endTime = new Date(config.endTime);

    if (now < startTime) {
      return NextResponse.json({ error: "签到尚未开始" }, { status: 400 });
    }

    const isLate = now > endTime;

    const existing = await prisma.checkinRecord.findUnique({
      where: {
        userId_session: {
          userId: user.id,
          session: sessionParam as any,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "您已签到，请勿重复签到", data: existing }, { status: 400 });
    }

    if (method === "GPS") {
      if (lat == null || lng == null) {
        return NextResponse.json({ error: "缺少 GPS 坐标" }, { status: 400 });
      }

      if (config.fenceCenterLat != null && config.fenceCenterLng != null && config.fenceRadius != null) {
        const distance = haversineDistance(lat, lng, config.fenceCenterLat, config.fenceCenterLng);
        if (distance > config.fenceRadius) {
          return NextResponse.json(
            { error: `您不在签到范围内（距离${Math.round(distance)}米，要求${config.fenceRadius}米内）` },
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
        where: {
          token: qrToken,
          session: sessionParam as any,
          expiresAt: { gt: now },
        },
      });

      if (!validToken) {
        return NextResponse.json({ error: "二维码已过期或无效，请刷新后重试" }, { status: 400 });
      }
    }

    if (method === "CODE") {
      if (!code) {
        return NextResponse.json({ error: "缺少验证码" }, { status: 400 });
      }

      if (!config.verificationCode || code.toUpperCase() !== config.verificationCode.toUpperCase()) {
        return NextResponse.json({ error: "验证码错误" }, { status: 400 });
      }
    }

    // 判断用户类型：STAFF = 系统工作人员(STAFF/TEACHER/ADMIN) 或 有APPROVED的StaffAssignment
    const hasStaffAssignment = await prisma.staffAssignment.findFirst({
      where: { userId: user.id, status: "APPROVED" },
    });
    const userType = (user.role === "STAFF" || user.role === "TEACHER" || user.role === "ADMIN" || hasStaffAssignment) ? "STAFF" : "STUDENT";

    const record = await prisma.checkinRecord.create({
      data: {
        userId: user.id,
        session: sessionParam as any,
        userType,
        method,
        lat: lat ?? null,
        lng: lng ?? null,
        status: isLate ? "LATE" : "ON_TIME",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        isLate,
      },
    });
  } catch {
    return NextResponse.json({ error: "签到失败" }, { status: 500 });
  }
}
