import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await auth();
    if (!authSession?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, session: teamSession } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (teamSession !== undefined) updateData.session = teamSession;

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(team);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "更新失败" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authSession = await auth();
    if (!authSession?.user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.teamMember.deleteMany({
      where: { teamId: id },
    });

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "删除失败" }, { status: 500 });
  }
}
