import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id: teamId, userId } = await params;

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  return NextResponse.json({ success: true });
}
