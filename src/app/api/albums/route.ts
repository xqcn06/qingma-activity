import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const albums = await prisma.album.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(albums);
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
