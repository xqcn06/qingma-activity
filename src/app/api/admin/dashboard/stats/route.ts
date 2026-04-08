import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    const [
      totalRegistrations,
      approvedRegistrations,
      totalCheckins,
      totalTeams,
      totalMaterials,
      pendingMaterials,
      totalAnnouncements,
      totalFeedbacks,
    ] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: "APPROVED" } }),
      prisma.checkinRecord.count(),
      prisma.team.count(),
      prisma.material.count(),
      prisma.material.count({ where: { status: "PENDING" } }),
      prisma.announcement.count(),
      prisma.feedback.count(),
    ]);

    return NextResponse.json({
      totalRegistrations,
      approvedRegistrations,
      totalCheckins,
      totalTeams,
      totalMaterials,
      pendingMaterials,
      totalAnnouncements,
      totalFeedbacks,
    });
  } catch {
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
