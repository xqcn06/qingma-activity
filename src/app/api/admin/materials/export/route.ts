import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

const STATION_LABELS: Record<string, string> = {
  LISTEN_COMMAND: "听我口令",
  DODGEBALL: "躲避球",
  CODE_BREAK: "密码破译",
  NO_TOUCH_GROUND: "别碰地面",
  TREASURE_HUNT: "寻宝赛",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待采购",
  PURCHASED: "已采购",
  ALLOCATED: "已分配",
  USED: "已使用",
};

const CATEGORY_LABELS: Record<string, string> = {
  "游戏专属": "游戏专属",
  "全场通用": "全场通用",
  "可借用": "可借用",
  "可选": "可选",
};

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { gameStation, category, status } = body;

    const where: any = {};
    if (gameStation) where.gameStation = gameStation;
    if (category) where.category = category;
    if (status) where.status = status;

    const materials = await prisma.material.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const data = materials.map((m) => ({
      "物资名称": m.name,
      "分类": CATEGORY_LABELS[m.category || ""] || m.category || "-",
      "游戏站": STATION_LABELS[m.gameStation || ""] || m.gameStation || "-",
      "数量": m.quantity,
      "单位": m.unit || "-",
      "单价": m.unitPrice ? `¥${m.unitPrice.toFixed(2)}` : "-",
      "总价": m.totalPrice ? `¥${m.totalPrice.toFixed(2)}` : "-",
      "分配给": m.allocatedTo || "-",
      "场次": m.session === "FIRST" ? "第一场" : m.session === "SECOND" ? "第二场" : "-",
      "状态": STATUS_LABELS[m.status] || m.status,
      "备注": m.description || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    const colWidths = [
      { wch: 20 },
      { wch: 12 },
      { wch: 14 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 30 },
    ];
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "物资清单");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="物资清单_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
