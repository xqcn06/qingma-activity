import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/permissions";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const sessionParam = searchParams.get("session");
    const userType = searchParams.get("userType");
    const checkinSessionId = searchParams.get("checkinSessionId");

    if (!sessionParam || !["FIRST", "SECOND"].includes(sessionParam)) {
      return NextResponse.json({ error: "缺少或无效的 session 参数" }, { status: 400 });
    }

    // === 学生签到统计 ===
    const studentRegistrations = await prisma.registration.findMany({
      where: { status: "APPROVED", session: sessionParam as any },
      include: {
        user: { select: { id: true, name: true, studentId: true, className: true, grade: true, role: true } },
      },
    });

    const studentWhere: any = { session: sessionParam as any, userType: "STUDENT" };
    if (checkinSessionId) studentWhere.checkinSessionId = checkinSessionId;

    const studentRecords = await prisma.checkinRecord.findMany({
      where: studentWhere,
      include: {
        user: { select: { id: true, name: true, studentId: true, className: true, grade: true, role: true } },
        checkinSession: { select: { id: true, name: true, status: true } },
      },
      orderBy: { checkedAt: "desc" },
    });

    const checkedStudentIds = new Set(studentRecords.map((r) => r.userId));
    const uncheckedStudents = studentRegistrations
      .filter((reg) => !checkedStudentIds.has(reg.userId))
      .map((reg) => ({
        userId: reg.userId,
        name: reg.user.name,
        studentId: reg.user.studentId,
        className: reg.user.className,
        grade: reg.user.grade,
      }));

    // 队伍统计
    const teamMembers = await prisma.teamMember.findMany({
      where: { team: { session: sessionParam as any } },
      include: {
        team: { select: { id: true, name: true } },
        user: { select: { id: true } },
      },
    });

    const userIdToTeam = new Map(teamMembers.map((tm) => [tm.userId, tm.team]));

    const teamStats: Record<string, { teamName: string; total: number; checked: number; onTime: number; late: number }> = {};

    for (const tm of teamMembers) {
      const teamName = tm.team.name;
      if (!teamStats[teamName]) {
        teamStats[teamName] = { teamName, total: 0, checked: 0, onTime: 0, late: 0 };
      }
      teamStats[teamName].total++;
    }

    for (const record of studentRecords) {
      const team = userIdToTeam.get(record.userId);
      const teamName = team?.name || "未分组";
      if (!teamStats[teamName]) {
        teamStats[teamName] = { teamName, total: 0, checked: 0, onTime: 0, late: 0 };
      }
      teamStats[teamName].checked++;
      if (record.status === "ON_TIME") teamStats[teamName].onTime++;
      if (record.status === "LATE") teamStats[teamName].late++;
    }

    const ungroupedStudents = studentRegistrations.filter((reg) => !userIdToTeam.has(reg.userId));
    const ungroupedChecked = studentRecords.filter((r) => !userIdToTeam.has(r.userId)).length;
    if (ungroupedStudents.length > 0) {
      teamStats["未分组"] = {
        teamName: "未分组",
        total: ungroupedStudents.length,
        checked: ungroupedChecked,
        onTime: studentRecords.filter((r) => !userIdToTeam.has(r.userId) && r.status === "ON_TIME").length,
        late: studentRecords.filter((r) => !userIdToTeam.has(r.userId) && r.status === "LATE").length,
      };
    }

    const studentStats = {
      total: studentRegistrations.length,
      checked: studentRecords.length,
      onTime: studentRecords.filter((r) => r.status === "ON_TIME").length,
      late: studentRecords.filter((r) => r.status === "LATE").length,
      absent: studentRegistrations.length - studentRecords.length,
      teamBreakdown: Object.values(teamStats),
    };

    // === 工作人员签到统计 ===
    const staffAssignments = await prisma.staffAssignment.findMany({
      where: { session: sessionParam as any },
      include: {
        user: { select: { id: true, name: true, studentId: true, className: true, phone: true } },
        staffRole: { select: { id: true, name: true } },
      },
    });

    const staffWhere: any = { session: sessionParam as any, userType: "STAFF" };
    if (checkinSessionId) staffWhere.checkinSessionId = checkinSessionId;

    const staffRecords = await prisma.checkinRecord.findMany({
      where: staffWhere,
      include: {
        user: { select: { id: true, name: true, studentId: true, className: true, phone: true } },
        checkinSession: { select: { id: true, name: true, status: true } },
      },
      orderBy: { checkedAt: "desc" },
    });

    const checkedStaffIds = new Set(staffRecords.map((r) => r.userId));
    const uncheckedStaff = staffAssignments
      .filter((a) => !checkedStaffIds.has(a.userId))
      .map((a) => ({
        userId: a.userId,
        name: a.user.name,
        studentId: a.user.studentId,
        phone: a.user.phone,
        roleName: a.staffRole?.name || "未知岗位",
      }));

    // 按岗位统计
    const roleStats: Record<string, { roleName: string; total: number; checked: number; onTime: number; late: number }> = {};

    for (const a of staffAssignments) {
      const roleName = a.staffRole?.name || "未知岗位";
      if (!roleStats[roleName]) {
        roleStats[roleName] = { roleName, total: 0, checked: 0, onTime: 0, late: 0 };
      }
      roleStats[roleName].total++;
    }

    for (const record of staffRecords) {
      const assignment = staffAssignments.find((a) => a.userId === record.userId);
      const roleName = assignment?.staffRole?.name || "未知岗位";
      if (!roleStats[roleName]) {
        roleStats[roleName] = { roleName, total: 0, checked: 0, onTime: 0, late: 0 };
      }
      roleStats[roleName].checked++;
      if (record.status === "ON_TIME") roleStats[roleName].onTime++;
      if (record.status === "LATE") roleStats[roleName].late++;
    }

    const staffStats = {
      total: staffAssignments.length,
      checked: staffRecords.length,
      onTime: staffRecords.filter((r) => r.status === "ON_TIME").length,
      late: staffRecords.filter((r) => r.status === "LATE").length,
      absent: staffAssignments.length - staffRecords.length,
      roleBreakdown: Object.values(roleStats),
    };

    return NextResponse.json({
      studentRecords,
      studentStats,
      uncheckedStudents,
      staffRecords,
      staffStats,
      uncheckedStaff,
    });
  } catch {
    return NextResponse.json({ error: "获取签到记录失败" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { studentId, session: sessionParam, checkinSessionId } = body;

    if (!studentId || !sessionParam) {
      return NextResponse.json({ error: "缺少 studentId 或 session 参数" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { studentId },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const hasStaffAssignment = await prisma.staffAssignment.findFirst({
      where: { userId: user.id, status: "APPROVED" },
    });
    const userType = (user.role === "STAFF" || user.role === "TEACHER" || user.role === "ADMIN" || hasStaffAssignment) ? "STAFF" : "STUDENT";

    const uniqueWhere: any = {
      userId: user.id,
      session: sessionParam as any,
    };
    if (checkinSessionId) {
      uniqueWhere.checkinSessionId = checkinSessionId;
    } else {
      uniqueWhere.checkinSessionId = null;
    }

    const existing = await prisma.checkinRecord.findFirst({
      where: uniqueWhere,
    });

    if (existing) {
      return NextResponse.json({ error: "该用户已签到", data: existing }, { status: 400 });
    }

    const record = await prisma.checkinRecord.create({
      data: {
        userId: user.id,
        session: sessionParam as any,
        userType,
        method: "MANUAL",
        status: "ON_TIME",
        checkinSessionId: checkinSessionId || null,
      },
      include: {
        user: {
          select: {
            name: true,
            studentId: true,
            className: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: record });
  } catch {
    return NextResponse.json({ error: "手动签到失败" }, { status: 500 });
  }
}
