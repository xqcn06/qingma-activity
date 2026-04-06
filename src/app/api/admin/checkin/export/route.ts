import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await req.json();
    const { session: sessionParam, userType } = body;

    const where: any = {};
    if (sessionParam && ["FIRST", "SECOND"].includes(sessionParam)) {
      where.session = sessionParam;
    }
    if (userType && ["STUDENT", "STAFF"].includes(userType)) {
      where.userType = userType;
    }

    const records = await prisma.checkinRecord.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
            grade: true,
            className: true,
            role: true,
            phone: true,
          },
        },
      },
      orderBy: { checkedAt: "asc" },
    });

    // 获取未签到人员
    let uncheckedList: any[] = [];
    if (userType === "STUDENT" || !userType) {
      const registrations = await prisma.registration.findMany({
        where: { status: "APPROVED", session: sessionParam || undefined },
        include: { user: { select: { id: true, name: true, studentId: true, className: true, grade: true } } },
      });
      const checkedIds = new Set(records.filter(r => r.userType === "STUDENT").map(r => r.userId));
      uncheckedList = registrations.filter(r => !checkedIds.has(r.userId));
    }

    const STATUS_LABELS: Record<string, string> = {
      ON_TIME: "准时",
      LATE: "迟到",
      ABSENT: "缺勤",
    };

    const METHOD_LABELS: Record<string, string> = {
      GPS: "GPS定位",
      QR: "二维码",
      CODE: "验证码",
      MANUAL: "手动补签",
    };

    // 签到记录数据
    const exportData = records.map((r, i) => ({
      序号: i + 1,
      姓名: r.user.name,
      学号: r.user.studentId,
      年级: r.user.grade ? `${r.user.grade}级` : "",
      班级: r.user.className || "",
      手机号: r.user.phone || "",
      场次: r.session === "FIRST" ? "第一场" : "第二场",
      身份: r.userType === "STAFF" ? "工作人员" : "学生",
      签到方式: METHOD_LABELS[r.method] || r.method,
      状态: STATUS_LABELS[r.status] || r.status,
      签到时间: r.checkedAt.toLocaleString("zh-CN"),
    }));

    // 未签到人员数据
    const uncheckedData = uncheckedList.map((reg, i) => ({
      序号: i + 1,
      姓名: reg.user.name,
      学号: reg.user.studentId,
      年级: reg.user.grade ? `${reg.user.grade}级` : "",
      班级: reg.user.className || "",
      场次: reg.session === "FIRST" ? "第一场" : "第二场",
    }));

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 签到记录表
    const ws1 = XLSX.utils.json_to_sheet(exportData);
    ws1["!cols"] = [
      { wch: 6 },   // 序号
      { wch: 12 },  // 姓名
      { wch: 16 },  // 学号
      { wch: 8 },   // 年级
      { wch: 16 },  // 班级
      { wch: 14 },  // 手机号
      { wch: 8 },   // 场次
      { wch: 10 },  // 身份
      { wch: 12 },  // 签到方式
      { wch: 8 },   // 状态
      { wch: 20 },  // 签到时间
    ];

    // 添加标题行样式（通过合并单元格实现）
    const sessionLabel = sessionParam ? (sessionParam === "FIRST" ? "第一场" : "第二场") : "全部";
    const typeLabel = userType === "STAFF" ? "工作人员" : userType === "STUDENT" ? "学生" : "全部";
    ws1["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
    ws1["A1"] = { t: "s", v: `${typeLabel}签到记录 - ${sessionLabel} (${new Date().toLocaleDateString("zh-CN")})`, s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } };

    XLSX.utils.book_append_sheet(wb, ws1, "签到记录");

    // 未签到人员表
    if (uncheckedData.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(uncheckedData);
      ws2["!cols"] = [
        { wch: 6 },
        { wch: 12 },
        { wch: 16 },
        { wch: 8 },
        { wch: 16 },
        { wch: 8 },
      ];
      ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
      ws2["A1"] = { t: "s", v: `未签到人员名单 - ${sessionLabel} (共${uncheckedData.length}人)`, s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } };
      XLSX.utils.book_append_sheet(wb, ws2, "未签到人员");
    }

    // 统计信息表
    const statsData = [
      { 统计项: "总人数", 数值: records.length },
      { 统计项: "准时签到", 数值: records.filter(r => r.status === "ON_TIME").length },
      { 统计项: "迟到", 数值: records.filter(r => r.status === "LATE").length },
      { 统计项: "未签到", 数值: uncheckedData.length },
      { 统计项: "签到率", 数值: records.length > 0 ? `${Math.round((records.filter(r => r.status === "ON_TIME").length / (records.length + uncheckedData.length)) * 100)}%` : "0%" },
    ];
    const ws3 = XLSX.utils.json_to_sheet(statsData);
    ws3["!cols"] = [{ wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws3, "统计信息");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = `签到记录_${typeLabel}_${sessionLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出签到记录失败" }, { status: 500 });
  }
}
