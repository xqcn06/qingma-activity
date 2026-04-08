import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";
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

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { session: sessionParam, userType, checkinSessionId, exportMode = "all" } = body;

    const where: any = {};
    if (sessionParam && ["FIRST", "SECOND"].includes(sessionParam)) {
      where.session = sessionParam;
    }
    if (userType && ["STUDENT", "STAFF"].includes(userType)) {
      where.userType = userType;
    }
    if (checkinSessionId) {
      where.checkinSessionId = checkinSessionId;
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
        checkinSession: { select: { id: true, name: true, status: true } },
      },
      orderBy: { checkedAt: "asc" },
    });

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

    const sessionLabel = sessionParam ? (sessionParam === "FIRST" ? "第一场" : "第二场") : "全部";
    const typeLabel = userType === "STAFF" ? "工作人员" : userType === "STUDENT" ? "学生" : "全部";

    const wb = XLSX.utils.book_new();

    if (exportMode === "all") {
      const studentRecords = records.filter(r => r.userType === "STUDENT");
      const staffRecords = records.filter(r => r.userType === "STAFF");

      if (studentRecords.length > 0) {
        const studentData = studentRecords.map((r, i) => ({
          序号: i + 1,
          姓名: r.user.name,
          学号: r.user.studentId,
          年级: r.user.grade ? `${r.user.grade}级` : "",
          班级: r.user.className || "",
          签到活动: r.checkinSession?.name || "手动签到",
          签到方式: METHOD_LABELS[r.method] || r.method,
          状态: STATUS_LABELS[r.status] || r.status,
          签到时间: r.checkedAt.toLocaleString("zh-CN"),
        }));
        const ws = XLSX.utils.json_to_sheet(studentData);
        ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 20 }];
        styleHeaderRow(ws, 9);
        XLSX.utils.book_append_sheet(wb, ws, "学生签到记录");
      }

      if (staffRecords.length > 0) {
        const staffAssignments = await prisma.staffAssignment.findMany({
          where: { session: sessionParam || undefined },
          include: { staffRole: { select: { name: true } } },
        });
        const staffData = staffRecords.map((r, i) => {
          const assignment = staffAssignments.find(a => a.userId === r.userId);
          return {
            序号: i + 1,
            姓名: r.user.name,
            学号: r.user.studentId,
            岗位: assignment?.staffRole?.name || "未知",
            签到活动: r.checkinSession?.name || "手动签到",
            签到方式: METHOD_LABELS[r.method] || r.method,
            状态: STATUS_LABELS[r.status] || r.status,
            签到时间: r.checkedAt?.toLocaleString("zh-CN") || "",
          };
        });
        const ws = XLSX.utils.json_to_sheet(staffData);
        ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 8 }, { wch: 20 }];
        styleHeaderRow(ws, 8);
        XLSX.utils.book_append_sheet(wb, ws, "工作人员签到记录");
      }

      if (!sessionParam || userType !== "STAFF") {
        const registrations = await prisma.registration.findMany({
          where: { status: "APPROVED", session: sessionParam || undefined },
          include: { user: { select: { id: true, name: true, studentId: true, className: true, grade: true } } },
        });
        const checkedIds = new Set(records.filter(r => r.userType === "STUDENT").map(r => r.userId));
        const uncheckedStudents = registrations.filter(r => !checkedIds.has(r.userId));
        if (uncheckedStudents.length > 0) {
          const uncheckedData = uncheckedStudents.map((reg, i) => ({
            序号: i + 1,
            姓名: reg.user.name,
            学号: reg.user.studentId,
            年级: reg.user.grade ? `${reg.user.grade}级` : "",
            班级: reg.user.className || "",
          }));
          const ws = XLSX.utils.json_to_sheet(uncheckedData);
          ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 }];
          styleHeaderRow(ws, 5);
          XLSX.utils.book_append_sheet(wb, ws, "未签到学生");
        }
      }

      if (!sessionParam || userType !== "STUDENT") {
        const staffAssignments = await prisma.staffAssignment.findMany({
          where: { session: sessionParam || undefined },
          include: { user: { select: { name: true, studentId: true } }, staffRole: { select: { name: true } } },
        });
        const checkedStaffIds = new Set(records.filter(r => r.userType === "STAFF").map(r => r.userId));
        const uncheckedStaff = staffAssignments.filter(a => !checkedStaffIds.has(a.userId));
        if (uncheckedStaff.length > 0) {
          const uncheckedData = uncheckedStaff.map((a, i) => ({
            序号: i + 1,
            姓名: a.user.name,
            学号: a.user.studentId,
            岗位: a.staffRole?.name || "未知",
          }));
          const ws = XLSX.utils.json_to_sheet(uncheckedData);
          ws["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 16 }];
          styleHeaderRow(ws, 4);
          XLSX.utils.book_append_sheet(wb, ws, "未签到工作人员");
        }
      }
    } else {
      const exportData = records.map((r, i) => ({
        序号: i + 1,
        姓名: r.user.name,
        学号: r.user.studentId,
        年级: r.user.grade ? `${r.user.grade}级` : "",
        班级: r.user.className || "",
        手机号: r.user.phone || "",
        场次: r.session === "FIRST" ? "第一场" : "第二场",
        身份: r.userType === "STAFF" ? "工作人员" : "学生",
        签到活动: r.checkinSession?.name || "手动签到",
        签到方式: METHOD_LABELS[r.method] || r.method,
        状态: STATUS_LABELS[r.status] || r.status,
        签到时间: r.checkedAt?.toLocaleString("zh-CN") || "",
      }));

      const ws1 = XLSX.utils.json_to_sheet(exportData);
      ws1["!cols"] = [
        { wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 },
        { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 12 },
        { wch: 8 }, { wch: 20 },
      ];
      styleHeaderRow(ws1, 12);
      XLSX.utils.book_append_sheet(wb, ws1, "签到记录");

      let uncheckedList: any[] = [];
      if (userType === "STUDENT" || !userType) {
        const registrations = await prisma.registration.findMany({
          where: { status: "APPROVED", session: sessionParam || undefined },
          include: { user: { select: { id: true, name: true, studentId: true, className: true, grade: true } } },
        });
        const checkedIds = new Set(records.filter(r => r.userType === "STUDENT").map(r => r.userId));
        uncheckedList = registrations.filter(r => !checkedIds.has(r.userId));
      }
      if (userType === "STAFF" || !userType) {
        const staffAssignments = await prisma.staffAssignment.findMany({
          where: { session: sessionParam || undefined },
          include: { user: { select: { name: true, studentId: true } }, staffRole: { select: { name: true } } },
        });
        const checkedStaffIds = new Set(records.filter(r => r.userType === "STAFF").map(r => r.userId));
        const uncheckedStaff = staffAssignments.filter(a => !checkedStaffIds.has(a.userId));
        uncheckedList = [...uncheckedList, ...uncheckedStaff.map(a => ({
          user: a.user,
          session: a.session,
          roleName: a.staffRole?.name,
        }))];
      }

      if (uncheckedList.length > 0) {
        const uncheckedData = uncheckedList.map((item, i) => ({
          序号: i + 1,
          姓名: item.user.name,
          学号: item.user.studentId,
          年级: item.user.grade ? `${item.user.grade}级` : "",
          班级: item.user.className || "",
          场次: item.session === "FIRST" ? "第一场" : "第二场",
          岗位: item.roleName || "",
        }));
        const ws2 = XLSX.utils.json_to_sheet(uncheckedData);
        ws2["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }];
        styleHeaderRow(ws2, 7);
        XLSX.utils.book_append_sheet(wb, ws2, "未签到人员");
      }
    }

    const statsData = [
      { 统计项: "总签到人数", 数值: records.length },
      { 统计项: "准时签到", 数值: records.filter(r => r.status === "ON_TIME").length },
      { 统计项: "迟到", 数值: records.filter(r => r.status === "LATE").length },
      { 统计项: "签到率", 数值: records.length > 0 ? `${Math.round((records.filter(r => r.status === "ON_TIME").length / records.length) * 100)}%` : "0%" },
    ];
    const ws3 = XLSX.utils.json_to_sheet(statsData);
    ws3["!cols"] = [{ wch: 16 }, { wch: 12 }];
    styleHeaderRow(ws3, 2);
    XLSX.utils.book_append_sheet(wb, ws3, "统计信息");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const fileName = `签到记录_${typeLabel}_${sessionLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出签到记录失败" }, { status: 500 });
  }
}
