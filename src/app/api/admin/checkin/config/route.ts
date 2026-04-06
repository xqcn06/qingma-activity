import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    const config = await prisma.checkinConfig.findUnique({
      where: { session: sessionParam as any },
    });

    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: "获取签到配置失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { session: sessionParam, startTime, endTime, fenceCenterLat, fenceCenterLng, fenceRadius, verificationCode, mapGeoJson } = body;

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    if (!startTime || !endTime) {
      return NextResponse.json({ error: "缺少 startTime 或 endTime" }, { status: 400 });
    }

    const config = await prisma.checkinConfig.upsert({
      where: { session: sessionParam as any },
      create: {
        session: sessionParam as any,
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
