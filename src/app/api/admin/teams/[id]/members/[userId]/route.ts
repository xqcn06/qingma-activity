import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const authResult = await requireAdminAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id: teamId, userId } = await params;

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId, userId } },
  });

  return NextResponse.json({ success: true });
}
