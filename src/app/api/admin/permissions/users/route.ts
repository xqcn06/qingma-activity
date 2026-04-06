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

export async function GET() {
  const check = await checkManageAdminsPermission();
  if (!check.authorized) return check.error!;

  const adminUsers = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "TEACHER"] },
      isDisabled: false,
    },
    include: {
      permissions: { select: { permission: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = adminUsers.map((user) => {
    const perms = user.role === "TEACHER"
      ? ALL_PERMISSIONS
      : user.permissions.map((p) => p.permission);

    return {
      id: user.id,
      name: user.name,
      studentId: user.studentId,
      role: user.role,
      permissions: perms,
      isSuperAdmin: perms.includes("MANAGE_ADMINS"),
    };
  });

  return NextResponse.json(result);
}
