import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const LOCK_DURATION = 5 * 60 * 1000; // 5分钟

async function checkPermission() {
  const session = await auth();
  if (!session?.user) {
    return { authorized: false, error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (role === "TEACHER" || role === "ADMIN") {
    return { authorized: true, userId, userName: session.user.name as string };
  }
  return { authorized: false, error: NextResponse.json({ error: "权限不足" }, { status: 403 }) };
}

export async function GET(req: Request) {
  const check = await checkPermission();
  if (!check.authorized) return check.error;

  const { searchParams } = new URL(req.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const lock = await prisma.editLock.findUnique({
    where: { targetType_targetId: { targetType, targetId } },
  });

  if (!lock) {
    return NextResponse.json({ locked: false });
  }

  if (lock.expiresAt < new Date()) {
    await prisma.editLock.delete({
      where: { id: lock.id },
    });
    return NextResponse.json({ locked: false });
  }

  return NextResponse.json({
    locked: true,
    userId: lock.userId,
    userName: lock.userName,
    lockedAt: lock.lockedAt,
    isSelf: lock.userId === check.userId,
  });
}

export async function POST(req: Request) {
  const check = await checkPermission();
  if (!check.authorized) return check.error;

  const { targetType, targetId } = await req.json();

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const existingLock = await prisma.editLock.findUnique({
    where: { targetType_targetId: { targetType, targetId } },
  });

  if (existingLock) {
    if (existingLock.expiresAt < new Date()) {
      await prisma.editLock.delete({ where: { id: existingLock.id } });
    } else if (existingLock.userId !== check.userId) {
      return NextResponse.json({
        error: "已被其他用户编辑",
        lockedBy: existingLock.userName,
      }, { status: 409 });
    }
  }

  const lock = await prisma.editLock.upsert({
    where: { targetType_targetId: { targetType, targetId } },
    update: {
      userId: check.userId,
      userName: check.userName,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + LOCK_DURATION),
    },
    create: {
      targetType,
      targetId,
      userId: check.userId,
      userName: check.userName,
      expiresAt: new Date(Date.now() + LOCK_DURATION),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const check = await checkPermission();
  if (!check.authorized) return check.error;

  const { targetType, targetId, force } = await req.json();

  if (!targetType || !targetId) {
    return NextResponse.json({ error: "缺少参数" }, { status: 400 });
  }

  const existingLock = await prisma.editLock.findUnique({
    where: { targetType_targetId: { targetType, targetId } },
  });

  if (!existingLock) {
    return NextResponse.json({ success: true });
  }

  if (existingLock.userId !== check.userId && !force) {
    return NextResponse.json({ error: "不能解除他人的锁" }, { status: 403 });
  }

  await prisma.editLock.delete({ where: { id: existingLock.id } });

  return NextResponse.json({ success: true });
}
