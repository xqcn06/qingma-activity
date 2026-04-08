import { prisma } from "@/lib/prisma";
import SchedulePageClient from "./SchedulePageClient";

export const dynamic = "force-dynamic";

const PHASE_COLORS: Record<string, string> = {
  "赛前准备": "bg-blue-600",
  "开幕仪式": "bg-yellow-500",
  "第一轮：同步轮转积分赛": "bg-purple-600",
  "中场休整": "bg-gray-500",
  "第二轮：\"械\"逅寻宝赛": "bg-red-600",
  "闭幕与转场": "bg-orange-500",
  "第二场": "bg-green-600",
};

function parseJson<T>(str: string, fallback: T): T {
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

export default async function SchedulePage() {
  const page = await prisma.page.findFirst({
    where: { slug: "schedule", status: "published" },
    include: { blocks: { orderBy: { sortOrder: "asc" } } },
  });

  let phases: Array<{ name: string; color: string; items: Array<{ time: string; title: string; location: string; desc: string }> }> = [];

  if (page && page.blocks.length > 0) {
    for (const block of page.blocks) {
      if (block.type === "schedule-phase") {
        const items = parseJson<any[]>(block.content, []);
        phases.push({
          name: block.title,
          color: parseJson<string>(block.config, PHASE_COLORS[block.title] || "bg-gray-500"),
          items,
        });
      }
    }
  }

  // Fallback hardcoded data
  if (phases.length === 0) {
    phases = [
      { name: "赛前准备", color: "bg-blue-600", items: [
        { time: "09:30-11:30", title: "场地搭建与物料准备", location: "操场", desc: "确认4个游戏站位置、划定躲避球场地边界线、放置寻宝积分卡" },
        { time: "11:30-12:00", title: "工作人员到位与岗前确认", location: "各岗位", desc: "工作人员签到，领取工作证，确认对讲群组正常" },
        { time: "12:00-12:25", title: "参赛队伍签到与候场", location: "操场主席台前", desc: "16支参赛队伍到场签到，领取队伍臂贴" },
        { time: "12:25-12:30", title: "全员候场与最终设备检查", location: "开幕区", desc: "所有参赛队伍按指定站位集合，设备最终核对" },
      ]},
      { name: "开幕仪式", color: "bg-yellow-500", items: [
        { time: "12:30-12:45", title: "开幕讲话与活动启动", location: "操场主席台", desc: "主持人开场、代表致辞、宣读活动规则、宣布启动" },
      ]},
      { name: "第一轮：同步轮转积分赛", color: "bg-purple-600", items: [
        { time: "12:45-13:05", title: "第一轮轮转", location: "4个游戏站", desc: "8组队伍进4个游戏站，每4组对决" },
        { time: "13:05-13:25", title: "第二轮轮转", location: "4个游戏站", desc: "所有队伍按固定轮转顺序进入下一个游戏站" },
        { time: "13:25-13:45", title: "第三轮轮转", location: "4个游戏站", desc: "完成第三轮游戏站轮转" },
        { time: "13:45-14:05", title: "第四轮轮转", location: "4个游戏站", desc: "完成最后一轮，所有队伍完成4个游戏项目" },
      ]},
      { name: "中场休整", color: "bg-gray-500", items: [
        { time: "14:05-14:10", title: "中场休整与寻宝规则宣讲", location: "操场", desc: "参赛队伍休息，主持人宣讲第二轮寻宝赛规则" },
      ]},
      { name: "第二轮：\"械\"逅寻宝赛", color: "bg-red-600", items: [
        { time: "14:10-14:50", title: "校园寻宝积分环节", location: "二期校园", desc: "16支队伍同时出发，凭线索卡在指定区域寻找积分卡" },
        { time: "14:50-15:05", title: "寻宝结束与最终积分核对", location: "积分登记处", desc: "计时结束，完成所有队伍积分统计和总排名核对" },
      ]},
      { name: "闭幕与转场", color: "bg-orange-500", items: [
        { time: "15:05-15:20", title: "第一场结束，准备第二场", location: "操场", desc: "总结问题，组织第一场队伍有序离场" },
        { time: "15:20-15:35", title: "场地复位与第二场前置准备", location: "各游戏站", desc: "道具复位、重置积分卡位置、第二场队伍签到" },
      ]},
      { name: "第二场", color: "bg-green-600", items: [
        { time: "15:35-15:50", title: "第二场开幕与规则宣讲", location: "操场主席台", desc: "主持人开场，重申活动核心规则" },
        { time: "15:50-17:10", title: "第一轮轮转积分赛（4轮）", location: "4个游戏站", desc: "流程同第一场，完成4轮游戏站轮转" },
        { time: "17:10-17:15", title: "中场休整与寻宝规则宣讲", location: "操场", desc: "中场休息，寻宝规则重申" },
        { time: "17:15-17:55", title: "校园寻宝积分环节", location: "二期校园", desc: "第二场寻宝赛" },
        { time: "17:55-18:00", title: "第二场成绩整理与退场", location: "操场", desc: "感谢全体参赛队伍与工作人员，组织退场" },
      ]},
    ];
  }

  return <SchedulePageClient phases={phases} />;
}
