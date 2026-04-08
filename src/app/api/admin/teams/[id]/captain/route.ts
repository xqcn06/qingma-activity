import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: teamId } = await params;
  const body = await req.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "用户ID为必填" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.teamMember.updateMany({
      where: { teamId },
      data: { isCaptain: false },
    });

    await tx.teamMember.update({
      where: { teamId_userId: { teamId, userId } },
      data: { isCaptain: true },
    });
  });

  return NextResponse.json({ success: true });
}
