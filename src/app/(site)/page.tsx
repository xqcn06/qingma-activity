import { prisma } from "@/lib/prisma";
import HomePageClient from "./HomePageClient";

export const dynamic = "force-dynamic";

function parseJson<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

export default async function HomePage() {
  const page = await prisma.page.findFirst({
    where: { slug: "home", status: "published" },
    include: {
      blocks: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const heroBlock = page?.blocks.find((b) => b.key === "hero.banner");
  const announcementBlock = page?.blocks.find((b) => b.key === "hero.announcement");
  const featuresBlock = page?.blocks.find((b) => b.key === "home.features");
  const overviewBlock = page?.blocks.find((b) => b.key === "home.overview");
  const ctaBlock = page?.blocks.find((b) => b.key === "home.cta");

  const hero = parseJson<{ title: string; subtitle: string; badge: string; org: string }>(
    heroBlock?.content || null,
    { title: "青马工程", subtitle: "学生干部素质拓展活动", badge: "2026年机械工程学院", org: "大连交通大学 · 机械工程学院团委" }
  );

  const announcement = parseJson<{ title: string; content: string; badge: string }>(
    announcementBlock?.content || null,
    { title: "最新公告", content: "2026年青马工程学生干部素质拓展活动报名已开启，请各班班委登录网站确认报名信息！", badge: "公告" }
  );

  const features = parseJson<any[]>(
    featuresBlock?.content || null,
    [
      { href: "/info", label: "活动信息", icon: "Sparkles", color: "from-blue-500 to-blue-600" },
      { href: "/schedule", label: "日程安排", icon: "Calendar", color: "from-green-500 to-emerald-600" },
      { href: "/activities", label: "活动环节", icon: "Target", color: "from-purple-500 to-purple-600" },
      { href: "/groups", label: "分组查询", icon: "Users", color: "from-orange-500 to-orange-600" },
      { href: "/ranking", label: "积分排行", icon: "Trophy", color: "from-yellow-500 to-amber-600" },
      { href: "/announcements", label: "通知公告", icon: "Megaphone", color: "from-red-500 to-red-600" },
      { href: "/gallery", label: "活动相册", icon: "ImageIcon", color: "from-pink-500 to-pink-600" },
      { href: "/register", label: "活动报名", icon: "Footprints", color: "from-indigo-500 to-indigo-600" },
      { href: "/staff", label: "工作人员", icon: "UserPlus", color: "from-cyan-500 to-cyan-600" },
      { href: "/feedback", label: "意见反馈", icon: "MessageSquare", color: "from-teal-500 to-teal-600" },
    ]
  );

  const overview = parseJson<any[]>(
    overviewBlock?.content || null,
    [
      { icon: "Calendar", title: "活动时间", value: "5月15日", sub: "第一场 12:30-15:20" },
      { icon: "MapPin", title: "活动地点", value: "大连交通大学", sub: "二期校园" },
      { icon: "Users", title: "参与对象", value: "280人", sub: "大一144人 / 大二136人" },
      { icon: "Clock", title: "活动形式", value: "两轮制", sub: "轮转积分赛 + 寻宝赛" },
    ]
  );

  const cta = parseJson<{ title: string; desc: string }>(
    ctaBlock?.content || null,
    { title: "准备好挑战自我了吗？", desc: "登录网站确认报名信息，与优秀的同学们一起成长！" }
  );

  return (
    <HomePageClient
      hero={hero}
      announcement={announcement}
      features={features}
      overview={overview}
      cta={cta}
    />
  );
}
