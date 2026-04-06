import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

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
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "请选择要导出的报名" }, { status: 400 });
    }

    const where: any = { id: { in: ids } };
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

    const ws = XLSX.utils.json_to_sheet(exportData);

    // 列宽设置
    ws["!cols"] = [
      { wch: 6 },   // 序号
      { wch: 12 },  // 姓名
      { wch: 16 },  // 学号
      { wch: 8 },   // 年级
      { wch: 16 },  // 班级
      { wch: 14 },  // 手机号
      { wch: 24 },  // 邮箱
      { wch: 8 },   // 场次
      { wch: 12 },  // 主职务
      { wch: 16 },  // 兼任职务
      { wch: 10 },  // 状态
      { wch: 20 },  // 备注
      { wch: 20 },  // 拒绝原因
      { wch: 20 },  // 报名时间
    ];

    // 标题行
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } }];
    ws["A1"] = { t: "s", v: `报名数据 (共${registrations.length}人) - ${new Date().toLocaleDateString("zh-CN")}`, s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "报名数据");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(`报名数据_${new Date().toISOString().slice(0, 10)}.xlsx`)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
