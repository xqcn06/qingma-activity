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
    const sessionFilter = searchParams.get("session");
    const phase = searchParams.get("phase");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const where: any = {};
    if (sessionFilter && sessionFilter !== "ALL") where.session = sessionFilter;
    if (phase && phase !== "ALL") where.phase = phase;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { operator: { contains: search } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityLog.count({ where }),
    ]);

    const stats = await prisma.activityLog.groupBy({
      by: ["session"],
      _count: true,
    });

    const phaseStats = await prisma.activityLog.groupBy({
      by: ["phase"],
      _count: true,
    });

    return NextResponse.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      stats: {
        total,
        bySession: stats.reduce((acc, s) => {
          acc[s.session] = s._count;
          return acc;
        }, {} as Record<string, number>),
        byPhase: phaseStats.reduce((acc, p) => {
          acc[p.phase] = p._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch {
    return NextResponse.json({ error: "获取日志失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { session: logSession, phase, action, operator } = body;

    if (!logSession || !phase || !action) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const log = await prisma.activityLog.create({
      data: {
        session: logSession,
        phase,
        action,
        operator: operator || (session.user as any).name || "系统",
      },
    });

    return NextResponse.json(log);
  } catch {
    return NextResponse.json({ error: "创建日志失败" }, { status: 500 });
  }
}
