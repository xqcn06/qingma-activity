import { prisma } from "@/lib/prisma";
import InfoPageClient from "./InfoPageClient";

export const dynamic = "force-dynamic";

function parseJson<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

export default async function InfoPage() {
  const page = await prisma.page.findFirst({
    where: { slug: "info", status: "published" },
    include: {
      blocks: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" } },
    },
  });

  const backgroundBlock = page?.blocks.find((b) => b.key === "info.background");
  const timeLocationBlock = page?.blocks.find((b) => b.key === "info.timeLocation");
  const participantsBlock = page?.blocks.find((b) => b.key === "info.participants");
  const organizationBlock = page?.blocks.find((b) => b.key === "info.organization");
  const highlightsBlock = page?.blocks.find((b) => b.key === "info.highlights");
  const noticesBlock = page?.blocks.find((b) => b.key === "info.notices");

  const background = parseJson<{ content: string }>(
    backgroundBlock?.content || null,
    { content: "为深入学习贯彻习近平新时代中国特色社会主义思想，落实立德树人根本任务，培养造就一批政治坚定、能力突出、素质优良的学生骨干队伍，机械工程学院团委特举办千层次\"青马工程\"学生干部开班仪式暨素质拓展活动。\n\n本次活动面向大一、大二两个学年所有班级班委，通过素质拓展环节，旨为提升学生干部的政治素养、团队协作能力、组织领导能力和服务意识。" }
  );

  const timeLocation = parseJson<any[]>(
    timeLocationBlock?.content || null,
    [
      { title: "活动时间", items: ["日期：5月15日", "第一场：12:30-15:20", "第二场：15:35-18:00"], icon: "Calendar" },
      { title: "活动地点", items: ["游戏区：操场", "寻宝区：楼宇周边+绿化区", "集合地：操场主席台"], icon: "MapPin" },
    ]
  );

  const participants = parseJson<any[]>(
    participantsBlock?.content || null,
    [
      { title: "第一场", subtitle: "大一学生干部", desc: "144人 · 16支队伍 · 每队9人" },
      { title: "第二场", subtitle: "大二学生干部", desc: "136人 · 16支队伍 · 每队8-9人" },
    ]
  );

  const organization = parseJson<{ text: string }[]>(
    organizationBlock?.content || null,
    [
      { text: "主办单位：机械工程学院团委" },
      { text: "承办单位：学生会组织部" },
      { text: "协办单位：青年志愿者协会" },
    ]
  );

  const highlights = parseJson<any[]>(
    highlightsBlock?.content || null,
    [
      { icon: "Shield", title: "政治素养提升", desc: "通过理论学习与实践相结合，提升学生干部的政治觉悟和理论素养", color: "from-red-500 to-red-600" },
      { icon: "Users", title: "团队协作能力", desc: "通过团队挑战项目，培养团队协作精神和组织协调能力", color: "from-blue-500 to-blue-600" },
      { icon: "Target", title: "领导力培养", desc: "在情景模拟和任务挑战中锻炼决策能力和领导才能", color: "from-purple-500 to-purple-600" },
      { icon: "Heart", title: "服务意识增强", desc: "强化学生干部的服务意识，提升为同学服务的能力和水平", color: "from-pink-500 to-pink-600" },
      { icon: "BookOpen", title: "知识储备拓展", desc: "通过知识竞赛环节，检验和拓展学生干部的知识面", color: "from-amber-500 to-amber-600" },
      { icon: "Award", title: "综合素质评价", desc: "全方位评价体系，记录每位参与者的成长与进步", color: "from-emerald-500 to-emerald-600" },
    ]
  );

  const notices = parseJson<{ text: string }[]>(
    noticesBlock?.content || null,
    [
      { text: "请穿着运动服装和运动鞋参加活动" },
      { text: "活动当天请携带学生证" },
      { text: "如有身体不适请提前告知负责人" },
      { text: "活动期间请服从工作人员安排" },
      { text: "注意个人财物安全" },
      { text: "活动期间保持手机畅通" },
    ]
  );

  return (
    <InfoPageClient
      background={background}
      timeLocation={timeLocation}
      participants={participants}
      organization={organization}
      highlights={highlights}
      notices={notices}
    />
  );
}
