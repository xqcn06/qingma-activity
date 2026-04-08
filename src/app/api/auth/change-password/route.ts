import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const studentId = (session.user as any).studentId;
    if (!studentId) {
      return NextResponse.json({ error: "会话异常，请重新登录" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { studentId } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const body = await req.json();
    const { newPassword, oldPassword } = body;

    // 密码强度校验：至少8位，包含大小写字母和数字
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "密码至少8位" }, { status: 400 });
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json({ error: "密码需包含大写字母、小写字母和数字" }, { status: 400 });
    }

    // 非首次登录时，需验证旧密码
    if (!user.isFirstLogin) {
      if (!oldPassword) {
        return NextResponse.json({ error: "请输入当前密码" }, { status: 400 });
      }
      const isOldValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldValid) {
        return NextResponse.json({ error: "当前密码错误" }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        isFirstLogin: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("改密码错误:", e);
    return NextResponse.json({ error: e.message || "修改失败，请稍后重试" }, { status: 500 });
  }
}
