import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";

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

    const now = new Date();

    const validToken = await prisma.qRCodeToken.findFirst({
      where: {
        session: sessionParam as any,
        expiresAt: { gt: now },
      },
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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { session: sessionParam } = body;

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 1000);

    const qrToken = await prisma.qRCodeToken.create({
      data: {
        token,
        session: sessionParam as any,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        token: qrToken.token,
        expiresAt: qrToken.expiresAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "生成二维码失败" }, { status: 500 });
  }
}
