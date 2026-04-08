import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlockRenderer from "@/components/cms/BlockRenderer";

export const dynamic = "force-dynamic";

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const page = await prisma.page.findUnique({
    where: { slug },
    include: {
      blocks: {
        where: { isEnabled: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page || !page.isEnabled) {
    notFound();
  }

  return (
    <div>
      {page.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
