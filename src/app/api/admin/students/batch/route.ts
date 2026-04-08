import { auth } from "@/lib/auth";
import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { ids, action } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "请选择要操作的用户" }, { status: 400 });
  }

  if (action === "disable") {
    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { isDisabled: true },
    });
  } else if (action === "enable") {
    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { isDisabled: false },
    });
  } else if (action === "reset-password") {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash("123456", 10);
    await prisma.user.updateMany({
      where: { id: { in: ids } },
      data: { password: hashedPassword, isFirstLogin: true },
    });
  } else {
    return NextResponse.json({ error: "无效的操作类型" }, { status: 400 });
  }

  return NextResponse.json({ success: true, count: ids.length });
}
