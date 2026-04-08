import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import TreasureMapClient from "./TreasureMapClient";

export const dynamic = "force-dynamic";

export default async function TreasureMapPage() {
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { studentId: (session.user as any).studentId },
  });

  if (!user) notFound();

  // Get user's team
  const teamMember = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    include: { team: true },
  });

  if (!teamMember) notFound();

  const team = teamMember.team;

  // Get treasure cards (only unfound ones for this session)
  const treasureCards = await prisma.treasureCard.findMany({
    where: {
      session: team.session,
      found: false,
    },
    orderBy: { value: "desc" },
  });

  // Get team's treasure score
  const teamWithScore = await prisma.team.findUnique({
    where: { id: team.id },
    select: { treasureScore: true },
  });

  // Get map image
  const mapSetting = await prisma.setting.findFirst({
    where: { key: "treasure_map_image" },
  });

  // Get clue cards for this team
  const clueCards = await prisma.clueCard.findMany({
    where: {
      session: team.session,
      distributedTo: team.id,
    },
    orderBy: { tier: "asc" },
  });

  return (
    <TreasureMapClient
      treasureCards={treasureCards}
      mapImageUrl={mapSetting?.value || null}
      teamName={team.name}
      teamTreasureScore={teamWithScore?.treasureScore || 0}
      clueCards={clueCards}
    />
  );
}
