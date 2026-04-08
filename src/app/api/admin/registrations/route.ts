import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const sessionType = searchParams.get("session");
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (sessionType && sessionType !== "ALL") where.session = sessionType;
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { studentId: { contains: search } } },
        { user: { className: { contains: search } } },
      ];
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
            grade: true,
            className: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(registrations);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id, status, rejectReason } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const data: any = { status };
    if (status === "REJECTED" && rejectReason) {
      data.rejectReason = rejectReason;
    }
    if (status === "APPROVED") {
      data.confirmedAt = new Date();
    }

    const registration = await prisma.registration.update({
      where: { id },
      data,
    });

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "缺少报名ID" }, { status: 400 });
    }

    await prisma.registration.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json().catch(() => ({}));
    const { ids } = body;

    const where: any = ids && Array.isArray(ids) && ids.length > 0 ? { id: { in: ids } } : {};
    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
            grade: true,
            className: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const POSITION_LABELS: Record<string, string> = {
      CLASS_MONITOR: "班长",
      LEAGUE_SECRETARY: "团支书",
      STUDY_COMMISSAR: "学习委员",
      LIFE_COMMISSAR: "生活委员",
      CULTURE_COMMISSAR: "文体委员",
      PROPAGANDA: "宣传委员",
      PSYCHOLOGY: "心理委员",
      ORGANIZATION: "组织委员",
      INFO: "信息委员",
      NONE: "其他",
    };

    const SESSION_LABELS: Record<string, string> = {
      FIRST: "第一场",
      SECOND: "第二场",
    };

    const STATUS_LABELS: Record<string, string> = {
      PENDING: "待审核",
      APPROVED: "已通过",
      REJECTED: "已拒绝",
    };

    const exportData = registrations.map((r: any, i) => ({
      序号: i + 1,
      姓名: r.user.name,
      学号: r.user.studentId,
      年级: r.user.grade ? `${r.user.grade}级` : "",
      班级: r.user.className || "",
      手机号: r.user.phone,
      邮箱: r.user.email || "",
      场次: SESSION_LABELS[r.session] || r.session,
      主职务: POSITION_LABELS[r.primaryPosition] || r.primaryPosition,
      兼任职务: r.secondaryPositions || "",
      状态: STATUS_LABELS[r.status] || r.status,
      备注: r.remark || "",
      拒绝原因: r.rejectReason || "",
      报名时间: r.createdAt.toLocaleString("zh-CN"),
    }));

    const wb = XLSX.utils.book_new();

    // Cover page
    const titleData = [["青马工程 - 报名数据"], [`导出日期：${new Date().toLocaleString("zh-CN")}`], [`共 ${registrations.length} 条记录`]];
    const wsTitle = XLSX.utils.aoa_to_sheet(titleData);
    wsTitle["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];
    wsTitle["A1"].s = { font: { bold: true, sz: 14, color: { rgb: "DC2626" } }, alignment: { horizontal: "center" } };
    wsTitle["A2"].s = { font: { sz: 10, color: { rgb: "6B7280" } } };
    wsTitle["A3"].s = { font: { sz: 10, color: { rgb: "6B7280" } } };
    wsTitle["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 },
      { wch: 14 }, { wch: 24 }, { wch: 8 }, { wch: 12 }, { wch: 16 },
      { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTitle, "封面");

    const ws = XLSX.utils.json_to_sheet(exportData);

    // 列宽设置
    ws["!cols"] = [
      { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 },
      { wch: 14 }, { wch: 24 }, { wch: 8 }, { wch: 12 }, { wch: 16 },
      { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    ];

    // Header styling
    const headerStyle = {
      fill: { fgColor: { rgb: "DC2626" } },
      font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
      alignment: { horizontal: "center", vertical: "center" },
    };
    for (let c = 0; c < 14; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }

    XLSX.utils.book_append_sheet(wb, ws, "报名数据");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`报名数据_${new Date().toISOString().slice(0, 10)}.xlsx`)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
