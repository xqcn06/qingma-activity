import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";
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
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

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

    const wb = XLSX.utils.book_new();

    // Title row
    const titleData = [["青马工程 - 物资清单"], [`导出日期：${new Date().toLocaleString("zh-CN")}`], [`共 ${materials.length} 条记录`]];
    const wsTitle = XLSX.utils.aoa_to_sheet(titleData);
    wsTitle["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
    wsTitle["A1"].s = { font: { bold: true, sz: 14, color: { rgb: "DC2626" } }, alignment: { horizontal: "center" } };
    wsTitle["A2"].s = { font: { sz: 10, color: { rgb: "6B7280" } } };
    wsTitle["A3"].s = { font: { sz: 10, color: { rgb: "6B7280" } } };
    wsTitle["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsTitle, "封面");

    // Data
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

    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: false });

    // Style header row
    const headerStyle = {
      fill: { fgColor: { rgb: "DC2626" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      alignment: { horizontal: "center", vertical: "center" },
    };
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }

    ws["!cols"] = [
      { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 8 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "物资清单");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = `物资清单_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
