import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const sessionParam = searchParams.get("session");
    const userType = searchParams.get("userType") || "STUDENT";

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    const config = await prisma.checkinConfig.findUnique({
      where: { session_userType: { session: sessionParam as any, userType } },
    });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "获取签到配置失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { session: sessionParam, userType = "STUDENT", startTime, endTime, fenceCenterLat, fenceCenterLng, fenceRadius, verificationCode, mapGeoJson } = body;

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "缺少 startTime 或 endTime" }, { status: 400 });
    }

    const config = await prisma.checkinConfig.upsert({
      where: { session_userType: { session: sessionParam as any, userType } },
      create: {
        session: sessionParam as any,
        userType,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        fenceCenterLat: fenceCenterLat ?? null,
        fenceCenterLng: fenceCenterLng ?? null,
        fenceRadius: fenceRadius ?? null,
        verificationCode: verificationCode ?? null,
        mapGeoJson: mapGeoJson ?? null,
      },
      update: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        fenceCenterLat: fenceCenterLat ?? null,
        fenceCenterLng: fenceCenterLng ?? null,
        fenceRadius: fenceRadius ?? null,
        verificationCode: verificationCode ?? null,
        mapGeoJson: mapGeoJson ?? null,
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch {
    return NextResponse.json({ error: "保存签到配置失败" }, { status: 500 });
  }
}
