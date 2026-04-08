import { auth } from "@/lib/auth";
import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { ids } = body;

    const where: any = {};
    if (ids && ids.length > 0) {
      where.id = { in: ids };
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { grade: "asc" }, { className: "asc" }, { name: "asc" }],
    });

    const ROLE_LABELS: Record<string, string> = {
      TEACHER: "老师",
      ADMIN: "管理员",
      STAFF: "工作人员",
      STUDENT: "学生",
    };

    const exportData = users.map((u, i) => ({
      序号: i + 1,
      姓名: u.name,
      学号: u.studentId,
      年级: u.grade ? `${u.grade}级` : "",
      班级: u.className || "",
      角色: ROLE_LABELS[u.role] || u.role,
      手机号: u.phone,
      邮箱: u.email || "",
      状态: u.isDisabled ? "已禁用" : "正常",
      首次登录: u.isFirstLogin ? "是" : "否",
      创建时间: u.createdAt.toLocaleString("zh-CN"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    // 列宽设置
    ws["!cols"] = [
      { wch: 6 },   // 序号
      { wch: 12 },  // 姓名
      { wch: 16 },  // 学号
      { wch: 8 },   // 年级
      { wch: 16 },  // 班级
      { wch: 10 },  // 角色
      { wch: 14 },  // 手机号
      { wch: 24 },  // 邮箱
      { wch: 8 },   // 状态
      { wch: 10 },  // 首次登录
      { wch: 20 },  // 创建时间
    ];

    // 标题行
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 10 } }];
    ws["A1"] = { t: "s", v: `学生数据 (共${users.length}人) - ${new Date().toLocaleDateString("zh-CN")}`, s: { font: { bold: true, sz: 14 }, alignment: { horizontal: "center" } } };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "学生数据");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(`学生数据_${new Date().toISOString().slice(0, 10)}.xlsx`)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出学生数据失败" }, { status: 500 });
  }
}
