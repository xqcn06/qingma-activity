import { auth } from "@/lib/auth";
import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "ALL";
  const grade = searchParams.get("grade") || "ALL";
  const className = searchParams.get("className") || "ALL";
  const status = searchParams.get("status") || "ALL";

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { studentId: { contains: search } },
      { className: { contains: search } },
    ];
  }

  if (role !== "ALL") {
    where.role = role;
  }

  if (grade !== "ALL") {
    where.grade = parseInt(grade);
  }

  if (className !== "ALL") {
    where.className = className;
  }

  if (status === "ACTIVE") {
    where.isDisabled = false;
  } else if (status === "DISABLED") {
    where.isDisabled = true;
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      registration: { select: { status: true, session: true } },
      teamMembers: { select: { team: { select: { name: true } }, isCaptain: true } },
      staffAssignments: { select: { status: true, session: true } },
      _count: { select: { permissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { name, studentId, grade, className, role, phone, email, password } = body;

  if (!name || !studentId || !phone) {
    return NextResponse.json({ error: "姓名、学号、手机号为必填" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { studentId } });
  if (existing) {
    return NextResponse.json({ error: "学号已存在" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password || "123456", 10);

  const user = await prisma.user.create({
    data: {
      name,
      studentId,
      grade: grade ? parseInt(grade) : null,
      className: className || null,
      role: role || "STUDENT",
      phone,
      email: email || null,
      password: hashedPassword,
      isFirstLogin: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { id, name, studentId, grade, className, role, phone, email, password, isDisabled } = body;

  if (!id) {
    return NextResponse.json({ error: "用户ID为必填" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const updateData: any = {};

  if (name !== undefined && name !== existing.name) updateData.name = name;
  if (studentId !== undefined && studentId !== existing.studentId) updateData.studentId = studentId;
  if (grade !== undefined && grade !== "" && grade !== existing.grade) updateData.grade = grade ? parseInt(grade) : null;
  if (className !== undefined && className !== existing.className) updateData.className = className || null;
  if (role !== undefined && role !== existing.role) updateData.role = role;
  if (phone !== undefined && phone !== existing.phone) updateData.phone = phone;
  if (email !== undefined && email !== existing.email) updateData.email = email || null;
  if (isDisabled !== undefined && isDisabled !== existing.isDisabled) updateData.isDisabled = isDisabled;

  if (password && password.trim()) {
    updateData.password = await bcrypt.hash(password, 10);
    updateData.isFirstLogin = true;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "没有需要更新的内容" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(user);
}

export async function PUT(req: Request) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { id, action } = body;

  if (!id) {
    return NextResponse.json({ error: "用户ID为必填" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (action === "resetPassword") {
    const hashedPassword = await bcrypt.hash("123456", 10);
    const user = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword, isFirstLogin: true },
    });
    return NextResponse.json(user);
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 });
}

export async function DELETE(req: Request) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "用户ID为必填" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { isDisabled: true },
  });

  return NextResponse.json({ success: true });
}
