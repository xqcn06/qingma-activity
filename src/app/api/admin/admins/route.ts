import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUserId = (session.user as any).id;
  const canManage = await hasPermission(currentUserId, "MANAGE_ADMINS");
  if (!canManage) {
    return NextResponse.json({ error: "无权限访问" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const roleFilter = searchParams.get("role") || "ALL";

  const where: any = {
    role: { in: ["ADMIN", "TEACHER"] },
  };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { studentId: { contains: search } },
    ];
  }

  if (roleFilter !== "ALL") {
    where.role = roleFilter;
  }

  const admins = await prisma.user.findMany({
    where,
    include: {
      _count: { select: { permissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(admins);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUserId = (session.user as any).id;
  const canManage = await hasPermission(currentUserId, "MANAGE_ADMINS");
  if (!canManage) {
    return NextResponse.json({ error: "无权限操作" }, { status: 403 });
  }

  const body = await req.json();
  const { name, studentId, grade, className, role, phone, email } = body;

  if (!name || !studentId || !phone) {
    return NextResponse.json({ error: "姓名、学号、手机号为必填" }, { status: 400 });
  }

  if (!["ADMIN", "TEACHER"].includes(role)) {
    return NextResponse.json({ error: "角色必须为 ADMIN 或 TEACHER" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { studentId } });
  if (existing) {
    return NextResponse.json({ error: "学号已存在" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.create({
    data: {
      name,
      studentId,
      grade: grade ? parseInt(grade) : null,
      className: className || null,
      role,
      phone,
      email: email || null,
      password: hashedPassword,
      isFirstLogin: true,
    },
    include: {
      _count: { select: { permissions: true } },
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUserId = (session.user as any).id;
  const canManage = await hasPermission(currentUserId, "MANAGE_ADMINS");
  if (!canManage) {
    return NextResponse.json({ error: "无权限操作" }, { status: 403 });
  }

  const body = await req.json();
  const { id, resetPassword, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: "用户ID为必填" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    include: {
      permissions: { select: { permission: true } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (!["ADMIN", "TEACHER"].includes(existing.role)) {
    return NextResponse.json({ error: "只能修改管理员或老师" }, { status: 400 });
  }

  const isTargetSuperAdmin = existing.role === "TEACHER" || existing.permissions.some((p) => p.permission === "MANAGE_ADMINS");
  const isCurrentUserSuperAdmin = await hasPermission(currentUserId, "MANAGE_ADMINS");

  if (isTargetSuperAdmin && existing.id !== currentUserId) {
    const isOtherSuperAdmin = await hasPermission(existing.id, "MANAGE_ADMINS");
    if (isOtherSuperAdmin && !isCurrentUserSuperAdmin) {
      return NextResponse.json({ error: "不能修改超级管理员" }, { status: 403 });
    }
  }

  const updateData: any = { ...data };
  delete updateData.id;
  delete updateData.resetPassword;

  if (resetPassword) {
    updateData.password = await bcrypt.hash("123456", 10);
    updateData.isFirstLogin = true;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      _count: { select: { permissions: true } },
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUserId = (session.user as any).id;
  const canManage = await hasPermission(currentUserId, "MANAGE_ADMINS");
  if (!canManage) {
    return NextResponse.json({ error: "无权限操作" }, { status: 403 });
  }

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "用户ID为必填" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    include: {
      permissions: { select: { permission: true } },
    },
  });

  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (!["ADMIN", "TEACHER"].includes(target.role)) {
    return NextResponse.json({ error: "只能禁用管理员或老师" }, { status: 400 });
  }

  const isSuperAdmin = target.role === "TEACHER" || target.permissions.some((p) => p.permission === "MANAGE_ADMINS");
  if (isSuperAdmin) {
    return NextResponse.json({ error: "不能禁用超级管理员" }, { status: 403 });
  }

  await prisma.user.update({
    where: { id },
    data: { isDisabled: true },
  });

  return NextResponse.json({ success: true });
}
