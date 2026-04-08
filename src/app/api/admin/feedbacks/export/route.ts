import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function styleHeaderRow(ws: any, colCount: number) {
  const headerStyle = {
    fill: { fgColor: { rgb: "DC2626" } },
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
  };
  for (let c = 0; c < colCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[cellRef]) ws[cellRef].s = headerStyle;
  }
}

export async function POST() {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: { select: { name: true, studentId: true, className: true, grade: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const wb = XLSX.utils.book_new();

    // Title
    const titleData = [["青马工程 - 反馈数据"], [`导出日期：${new Date().toLocaleString("zh-CN")}`], [`共 ${feedbacks.length} 条记录`]];
    const wsTitle = XLSX.utils.aoa_to_sheet(titleData);
    wsTitle["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
    wsTitle["A1"].s = { font: { bold: true, sz: 14, color: { rgb: "DC2626" } }, alignment: { horizontal: "center" } };
    wsTitle["A2"].s = { font: { sz: 10, color: { rgb: "6B7280" } } };
    wsTitle["A3"].s = { font: { sz: 10, color: { rgb: "6B7280" } } };
    wsTitle["!cols"] = [{ wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsTitle, "封面");

    // Data
    const data = feedbacks.map((f, i) => ({
      序号: i + 1,
      姓名: f.user?.name || "-",
      学号: f.user?.studentId || "-",
      年级: f.user?.grade ? `${f.user.grade}级` : "-",
      班级: f.user?.className || "-",
      总体评分: f.overallRating ? `${f.overallRating}/5` : "-",
      内容评分: f.contentRating ? `${f.contentRating}/5` : "-",
      组织评分: f.organizationRating ? `${f.organizationRating}/5` : "-",
      建议或感想: f.suggestion || "-",
      提交时间: f.createdAt.toLocaleString("zh-CN"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 40 }, { wch: 20 },
    ];
    styleHeaderRow(ws, 10);
    XLSX.utils.book_append_sheet(wb, ws, "反馈数据");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const fileName = `反馈数据_${new Date().toISOString().slice(0, 10)}.xlsx`;

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
