import { prisma } from "./prisma";
import { auth } from "./auth";
import { NextResponse } from "next/server";
import type { Permission } from "@prisma/client";

/**
 * 检查用户是否拥有指定权限
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // 老师拥有所有权限
  if (user.role === "TEACHER") return true;

  // 检查管理员权限
  const perm = await prisma.adminPermission.findUnique({
    where: {
      userId_permission: { userId, permission },
    },
  });

  return !!perm;
}

/**
 * 检查用户是否为管理员（ADMIN 或 TEACHER）或工作人员
 */
export async function isStaffRole(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;
  return ["ADMIN", "TEACHER", "STAFF"].includes(user.role);
}

/**
 * 统一鉴权：验证登录 + 管理员/工作人员角色
 * 返回 { userId } 或 NextResponse 错误
 */
export async function requireAdminAuth(): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const isStaff = await isStaffRole(userId);
  if (!isStaff) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }
  return { userId };
}

/**
 * 统一鉴权：验证登录 + 特定权限
 * 返回 { userId } 或 NextResponse 错误
 */
export async function requirePermission(permission: Permission): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const can = await hasPermission(userId, permission);
  if (!can) {
    return NextResponse.json({ error: "无权限操作" }, { status: 403 });
  }
  return { userId };
}

/**
 * 检查用户是否拥有任一权限
 */
export async function hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
  for (const perm of permissions) {
    if (await hasPermission(userId, perm)) return true;
  }
  return false;
}

/**
 * 获取用户的所有权限
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return [];

  // 老师拥有所有权限
  if (user.role === "TEACHER") {
    return [
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
  }

  const perms = await prisma.adminPermission.findMany({
    where: { userId },
    select: { permission: true },
  });

  return perms.map((p) => p.permission);
}

/**
 * 检查是否为管理员角色（ADMIN 或 TEACHER）
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN" || user?.role === "TEACHER";
}

/**
 * 检查是否为老师角色
 */
export async function isTeacher(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "TEACHER";
}

/**
 * 检查是否为超级管理员（拥有 MANAGE_ADMINS 权限）
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  return hasPermission(userId, "MANAGE_ADMINS");
}

/**
 * 检查是否为活动工作人员（系统工作人员角色 或 有APPROVED的StaffAssignment）
 */
export async function isActivityStaff(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return false;

  // 系统工作人员角色
  if (user.role === "STAFF" || user.role === "TEACHER" || user.role === "ADMIN") return true;

  // 有APPROVED的StaffAssignment
  const assignment = await prisma.staffAssignment.findFirst({
    where: { userId, status: "APPROVED" },
  });
  return !!assignment;
}
