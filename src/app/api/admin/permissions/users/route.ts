import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { Permission, Role } from "@prisma/client";

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
  if (!session?.user) return { authorized: false, error: new NextResponse(JSON.stringify({ error: "未登录" }), { status: 401 }) };

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (role === "TEACHER") return { authorized: true, userId, role };

  const hasPerm = await prisma.adminPermission.findUnique({
    where: { userId_permission: { userId, permission: "MANAGE_ADMINS" } },
  });

  if (!hasPerm) return { authorized: false, error: new NextResponse(JSON.stringify({ error: "权限不足" }), { status: 403 }) };
  return { authorized: true, userId, role };
}

export async function GET(req: Request) {
  const check = await checkManageAdminsPermission();
  if (!check.authorized) return check.error!;

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "ALL";
  const search = searchParams.get("search") || "";

  const where: any = {
    isDisabled: false,
  };

  if (role !== "ALL") {
    where.role = role as Role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { studentId: { contains: search } },
      { className: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { teamMembers: true, staffAssignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = users.map((user) => {
    const perms = user.role === "TEACHER"
      ? ALL_PERMISSIONS
      : user.permissions.map((p) => p.permission);

    return {
      id: user.id,
      name: user.name,
      studentId: user.studentId,
      role: user.role,
      grade: user.grade,
      className: user.className,
      phone: user.phone,
      permissions: perms,
      isSuperAdmin: perms.includes("MANAGE_ADMINS"),
      teamCount: user._count.teamMembers,
      staffCount: user._count.staffAssignments,
    };
  });

  return NextResponse.json(result);
}
