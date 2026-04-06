import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Permission } from "@prisma/client";

const ALL_PERMISSIONS: Permission[] = [
  "MANAGE_REGISTRATIONS",
  "MANAGE_TEAMS",
  "MANAGE_STAFF",
  "MANAGE_SCHEDULE",
  "MANAGE_ANNOUNCEMENTS",
  "MANAGE_SCORES",
  "MANAGE_MATERIALS",
  "MANAGE_ROTATION",
  "MANAGE_TREASURE",
  "VIEW_FEEDBACKS",
  "MANAGE_SETTINGS",
  "VIEW_LOGS",
  "EXPORT_DATA",
  "MANAGE_ADMINS",
];

async function checkManageAdminsPermission() {
  const session = await auth();
  if (!session?.user) return { authorized: false, userId: null, error: new NextResponse(JSON.stringify({ error: "未登录" }), { status: 401 }) };

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (role === "TEACHER") return { authorized: true, userId, role };

  const hasPerm = await prisma.adminPermission.findUnique({
    where: { userId_permission: { userId, permission: "MANAGE_ADMINS" } },
  });

  if (!hasPerm) return { authorized: false, userId: null, error: new NextResponse(JSON.stringify({ error: "权限不足" }), { status: 403 }) };
  return { authorized: true, userId, role };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const check = await checkManageAdminsPermission();
  if (!check.authorized) return check.error!;

  const { userId } = await params;
  const body = await req.json();
  const { permissions }: { permissions: Permission[] } = body;

  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: "权限列表格式错误" }, { status: 400 });
  }

  const invalidPerms = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
  if (invalidPerms.length > 0) {
    return NextResponse.json({ error: `无效的权限: ${invalidPerms.join(", ")}` }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, name: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (targetUser.role !== "ADMIN" && targetUser.role !== "TEACHER") {
    return NextResponse.json({ error: "只能修改管理员权限" }, { status: 400 });
  }

  const targetPerms = targetUser.role === "TEACHER"
    ? ALL_PERMISSIONS
    : (await prisma.adminPermission.findMany({ where: { userId } })).map((p) => p.permission);

  if (targetPerms.includes("MANAGE_ADMINS")) {
    return NextResponse.json({ error: "不能修改超级管理员的权限" }, { status: 403 });
  }

  await prisma.adminPermission.deleteMany({ where: { userId } });

  if (permissions.length > 0) {
    await prisma.adminPermission.createMany({
      data: permissions.map((permission) => ({ userId, permission })),
    });
  }

  return NextResponse.json({ success: true });
}
