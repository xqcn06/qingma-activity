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
    const category = searchParams.get("category");

    const where: any = {};
    if (category && category !== "ALL") where.category = category;

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const results = await Promise.all(
      settings.map(async (item: { key: string; value: string; category: string; description?: string }) => {
        return prisma.setting.upsert({
          where: { key: item.key },
          create: {
            key: item.key,
            value: item.value,
            category: item.category,
            description: item.description || null,
          },
          update: {
            value: item.value,
            category: item.category,
            description: item.description || null,
          },
        });
      })
    );

    return NextResponse.json({ success: true, data: results });
  } catch {
    return NextResponse.json({ error: "更新设置失败" }, { status: 500 });
  }
}
