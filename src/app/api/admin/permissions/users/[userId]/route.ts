import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Permission, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

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

const VALID_ROLES: Role[] = ["TEACHER", "ADMIN", "STAFF", "STUDENT"];

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const check = await checkManageAdminsPermission();
  if (!check.authorized) return check.error!;

  const { userId } = await params;
  const body = await req.json();
  const { role, permissions, resetPassword } = body as {
    role?: Role;
    permissions?: Permission[];
    resetPassword?: boolean;
  };

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { permissions: { select: { permission: true } } },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (targetUser.role === "TEACHER" && check.role !== "TEACHER") {
    return NextResponse.json({ error: "不能修改老师账号" }, { status: 403 });
  }

  if (targetUser.role === "TEACHER" && role && role !== "TEACHER") {
    return NextResponse.json({ error: "不能将老师降级" }, { status: 403 });
  }

  const targetIsSuperAdmin = targetUser.role === "TEACHER" || targetUser.permissions.some((p) => p.permission === "MANAGE_ADMINS");
  if (targetIsSuperAdmin && check.role !== "TEACHER") {
    return NextResponse.json({ error: "不能修改超级管理员" }, { status: 403 });
  }

  const updateData: any = {};
  const newRole = role && role !== targetUser.role ? role : targetUser.role;

  if (role && role !== targetUser.role) {
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "无效的角色" }, { status: 400 });
    }
    updateData.role = role;
    
    if (role !== "ADMIN" && role !== "TEACHER") {
      await prisma.adminPermission.deleteMany({ where: { userId } });
    }
  }

  if (permissions !== undefined) {
    if (targetUser.role === "TEACHER") {
      return NextResponse.json({ error: "老师拥有所有权限，无需单独分配" }, { status: 400 });
    }
    
    if (newRole !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员角色才能分配权限" }, { status: 400 });
    }

    const invalidPerms = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
    if (invalidPerms.length > 0) {
      return NextResponse.json({ error: `无效的权限: ${invalidPerms.join(", ")}` }, { status: 400 });
    }

    await prisma.adminPermission.deleteMany({ where: { userId } });

    if (permissions.length > 0) {
      await prisma.adminPermission.createMany({
        data: permissions.map((permission) => ({ userId, permission })),
      });
    }
  }

  if (resetPassword) {
    updateData.password = await bcrypt.hash("123456", 10);
    updateData.isFirstLogin = true;
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  return NextResponse.json({ success: true });
}
