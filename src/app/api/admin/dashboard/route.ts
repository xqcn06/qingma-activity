import { requireAdminAuth } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authResult = await requireAdminAuth();
    if (authResult instanceof NextResponse) return authResult;

    // Stats
    const [totalRegistrations, pendingCount, approvedCount, rejectedCount, teamCount, staffCount] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: "PENDING" } }),
      prisma.registration.count({ where: { status: "APPROVED" } }),
      prisma.registration.count({ where: { status: "REJECTED" } }),
      prisma.team.count(),
      prisma.staffAssignment.count(),
    ]);

    // Session stats
    const [firstSessionCount, secondSessionCount] = await Promise.all([
      prisma.registration.count({ where: { session: "FIRST" } }),
      prisma.registration.count({ where: { session: "SECOND" } }),
    ]);

    // Session comparison data for chart
    const sessionComparison = [
      { name: "报名人数", first: firstSessionCount, second: secondSessionCount, target: "144/136" },
      { name: "已通过", first: 0, second: 0, target: "-" },
      { name: "待审核", first: 0, second: 0, target: "-" },
    ];

    // Get approved counts per session
    const [firstApproved, secondApproved] = await Promise.all([
      prisma.registration.count({ where: { session: "FIRST", status: "APPROVED" } }),
      prisma.registration.count({ where: { session: "SECOND", status: "APPROVED" } }),
    ]);
    sessionComparison[1].first = firstApproved;
    sessionComparison[1].second = secondApproved;

    const [firstPending, secondPending] = await Promise.all([
      prisma.registration.count({ where: { session: "FIRST", status: "PENDING" } }),
      prisma.registration.count({ where: { session: "SECOND", status: "PENDING" } }),
    ]);
    sessionComparison[2].first = firstPending;
    sessionComparison[2].second = secondPending;

    // Score distribution (top teams)
    const teams = await prisma.team.findMany({
      take: 10,
      orderBy: { totalScore: "desc" },
      select: { name: true, totalScore: true, treasureScore: true },
    });

    const scoreDistribution = teams.map((t) => ({
      name: t.name,
      round1: t.totalScore,
      treasure: t.treasureScore,
      total: t.totalScore + t.treasureScore,
    }));

    // Feedback stats
    const feedbacks = await prisma.feedback.findMany({
      select: { overallRating: true, contentRating: true, organizationRating: true },
    });

    let feedbackStats = {
      overallAvg: 0,
      contentAvg: 0,
      organizationAvg: 0,
      total: feedbacks.length,
      distribution: [0, 0, 0, 0, 0], // 1-5 star counts
    };

    if (feedbacks.length > 0) {
      const validFeedbacks = feedbacks.filter((f) => f.overallRating);
      feedbackStats.overallAvg = validFeedbacks.reduce((s, f) => s + (f.overallRating || 0), 0) / validFeedbacks.length;
      feedbackStats.contentAvg = validFeedbacks.reduce((s, f) => s + (f.contentRating || 0), 0) / validFeedbacks.length;
      feedbackStats.organizationAvg = validFeedbacks.reduce((s, f) => s + (f.organizationRating || 0), 0) / validFeedbacks.length;

      validFeedbacks.forEach((f) => {
        if (f.overallRating && f.overallRating >= 1 && f.overallRating <= 5) {
          feedbackStats.distribution[f.overallRating - 1]++;
        }
      });
    }

    const feedbackDistribution = feedbackStats.distribution.map((count, i) => ({
      name: `${i + 1}星`,
      count,
    }));

    // Recent registrations
    const recentRegistrations = await prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, studentId: true, className: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalRegistrations,
        pendingCount,
        approvedCount,
        rejectedCount,
        teamCount,
        staffCount,
      },
      sessions: {
        first: firstSessionCount,
        second: secondSessionCount,
      },
      sessionComparison,
      scoreDistribution,
      feedbackStats,
      feedbackDistribution,
      recentRegistrations,
    });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
