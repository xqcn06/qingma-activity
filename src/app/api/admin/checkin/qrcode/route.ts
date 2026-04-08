import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";
import crypto from "crypto";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const sessionParam = searchParams.get("session");
    const userType = searchParams.get("userType") || "STUDENT";
    const checkinSessionId = searchParams.get("checkinSessionId");

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    const now = new Date();
    const where: any = {
      session: sessionParam as any,
      userType,
      expiresAt: { gt: now },
    };
    if (checkinSessionId) {
      where.checkinSessionId = checkinSessionId;
    }

    const validToken = await prisma.qRCodeToken.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      token: validToken?.token ?? null,
      expiresAt: validToken?.expiresAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: "获取二维码失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { session: sessionParam, userType = "STUDENT", checkinSessionId } = body;

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 1000);

    const qrToken = await prisma.qRCodeToken.create({
      data: {
        token,
        session: sessionParam as any,
        userType,
        checkinSessionId: checkinSessionId || null,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        token: qrToken.token,
        expiresAt: qrToken.expiresAt,
        countdown: 60,
      },
    });
  } catch {
    return NextResponse.json({ error: "生成二维码失败" }, { status: 500 });
  }
}
