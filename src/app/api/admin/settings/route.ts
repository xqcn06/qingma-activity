import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (key) where.key = key;

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // 按 key 查询时返回单个结果
    if (key) {
      return NextResponse.json(settings[0] || null);
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "获取设置失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();

    // 支持两种格式：{ settings: [...] } 数组格式 和 { key, value, category } 单条格式
    let items: Array<{ key: string; value: string; category: string; description?: string }>;
    if (body.settings && Array.isArray(body.settings)) {
      items = body.settings;
    } else if (body.key && body.value !== undefined) {
      items = [{ key: body.key, value: body.value, category: body.category || "general", description: body.description }];
    } else {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const results = await Promise.all(
      items.map(async (item) => {
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

    return NextResponse.json({ success: true, data: body.settings ? results : results[0] });
  } catch {
    return NextResponse.json({ error: "更新设置失败" }, { status: 500 });
  }
}
