"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Calendar, ChevronDown, List, Table2 } from "lucide-react";
import { useState } from "react";

const phases = [
  {
    name: "赛前准备",
    color: "bg-blue-600",
    items: [
      { time: "09:30-11:30", title: "场地搭建与物料准备", location: "操场", desc: "确认4个游戏站位置、划定躲避球场地边界线、放置寻宝积分卡" },
      { time: "11:30-12:00", title: "工作人员到位与岗前确认", location: "各岗位", desc: "工作人员签到，领取工作证，确认对讲群组正常" },
      { time: "12:00-12:25", title: "参赛队伍签到与候场", location: "操场主席台前", desc: "16支参赛队伍到场签到，领取队伍臂贴" },
      { time: "12:25-12:30", title: "全员候场与最终设备检查", location: "开幕区", desc: "所有参赛队伍按指定站位集合，设备最终核对" },
    ],
  },
  {
    name: "开幕仪式",
    color: "bg-yellow-500",
    items: [
      { time: "12:30-12:45", title: "开幕讲话与活动启动", location: "操场主席台", desc: "主持人开场、代表致辞、宣读活动规则、宣布启动" },
    ],
  },
  {
    name: "第一轮：同步轮转积分赛",
    color: "bg-purple-600",
    items: [
      { time: "12:45-13:05", title: "第一轮轮转", location: "4个游戏站", desc: "8组队伍进4个游戏站，每4组对决" },
      { time: "13:05-13:25", title: "第二轮轮转", location: "4个游戏站", desc: "所有队伍按固定轮转顺序进入下一个游戏站" },
      { time: "13:25-13:45", title: "第三轮轮转", location: "4个游戏站", desc: "完成第三轮游戏站轮转" },
      { time: "13:45-14:05", title: "第四轮轮转", location: "4个游戏站", desc: "完成最后一轮，所有队伍完成4个游戏项目" },
    ],
  },
  {
    name: "中场休整",
    color: "bg-gray-500",
    items: [
      { time: "14:05-14:10", title: "中场休整与寻宝规则宣讲", location: "操场", desc: "参赛队伍休息，主持人宣讲第二轮寻宝赛规则" },
    ],
  },
  {
    name: "第二轮：\"械\"逅寻宝赛",
    color: "bg-red-600",
    items: [
      { time: "14:10-14:50", title: "校园寻宝积分环节", location: "二期校园", desc: "16支队伍同时出发，凭线索卡在指定区域寻找积分卡" },
      { time: "14:50-15:05", title: "寻宝结束与最终积分核对", location: "积分登记处", desc: "计时结束，完成所有队伍积分统计和总排名核对" },
    ],
  },
  {
    name: "闭幕与转场",
    color: "bg-orange-500",
    items: [
      { time: "15:05-15:20", title: "第一场结束，准备第二场", location: "操场", desc: "总结问题，组织第一场队伍有序离场" },
      { time: "15:20-15:35", title: "场地复位与第二场前置准备", location: "各游戏站", desc: "道具复位、重置积分卡位置、第二场队伍签到" },
    ],
  },
  {
    name: "第二场",
    color: "bg-green-600",
    items: [
      { time: "15:35-15:50", title: "第二场开幕与规则宣讲", location: "操场主席台", desc: "主持人开场，重申活动核心规则" },
      { time: "15:50-17:10", title: "第一轮轮转积分赛（4轮）", location: "4个游戏站", desc: "流程同第一场，完成4轮游戏站轮转" },
      { time: "17:10-17:15", title: "中场休整与寻宝规则宣讲", location: "操场", desc: "中场休息，寻宝规则重申" },
      { time: "17:15-17:55", title: "校园寻宝积分环节", location: "二期校园", desc: "第二场寻宝赛" },
      { time: "17:55-18:00", title: "第二场成绩整理与退场", location: "操场", desc: "感谢全体参赛队伍与工作人员，组织退场" },
    ],
  },
];

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

export default function SchedulePage() {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 场次说明 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-0.5 h-3.5 bg-blue-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">场次说明</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">第一场</span>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p><span className="font-medium text-gray-700">时间：</span>12:30-15:20</p>
                <p><span className="font-medium text-gray-700">参与：</span>16支队伍（大一）</p>
                <p><span className="font-medium text-gray-700">集合：</span>12:00 主席台</p>
              </div>
            </div>
            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">第二场</span>
              <div className="mt-2 space-y-1 text-xs text-gray-600">
                <p><span className="font-medium text-gray-700">时间：</span>15:35-18:00</p>
                <p><span className="font-medium text-gray-700">参与：</span>16支队伍（大二）</p>
                <p><span className="font-medium text-gray-700">集合：</span>15:20 主席台</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 时间线 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-0.5 h-3.5 bg-red-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-900">详细流程</h2>
            </div>
            <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                列表
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                表格
              </button>
            </div>
          </div>

          {/* Mobile accordion (lg:hidden) */}
          <div className="lg:hidden relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />

            <div className="space-y-3">
              {phases.map((phase, phaseIdx) => (
                <motion.div
                  key={phase.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: phaseIdx * 0.04 }}
                >
                  <button
                    onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)}
                    className="relative flex items-center gap-3 w-full text-left"
                  >
                    <div className={`relative z-10 w-10 h-10 ${phase.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${expandedPhase === phaseIdx ? "rotate-180" : ""}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{phase.name}</h3>
                      <p className="text-[10px] text-gray-400">{phase.items.length}个环节</p>
                    </div>
                  </button>

                  {expandedPhase === phaseIdx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="ml-13 mt-2 space-y-2 pl-13"
                    >
                      {phase.items.map((item) => (
                        <div key={item.title} className="bg-gray-50 rounded-xl p-3.5">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              {item.time}
                            </span>
                            <h4 className="text-xs font-semibold text-gray-900">{item.title}</h4>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-1.5">{item.desc}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <MapPin className="w-3 h-3" /> {item.location}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop table view */}
          {viewMode === "table" && (
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">阶段</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">时间</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600 whitespace-nowrap">地点</th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-600">详情</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map((phase, phaseIdx) => (
                    <>
                      {phase.items.map((item, itemIdx) => (
                        <tr
                          key={`${phase.name}-${item.title}`}
                          className={`border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${
                            itemIdx === 0 ? "border-t border-gray-100" : ""
                          }`}
                        >
                          {itemIdx === 0 && (
                            <td
                              rowSpan={phase.items.length}
                              className="py-3 px-3 align-top"
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 ${phase.color} rounded-full flex-shrink-0`} />
                                <span className="font-bold text-gray-900 whitespace-nowrap">{phase.name}</span>
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-3">
                            <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {item.time}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 text-gray-600 whitespace-nowrap">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs">{item.location}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Desktop list view (same as mobile accordion but expanded) */}
          {viewMode === "list" && (
            <div className="hidden lg:block relative">
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />

              <div className="space-y-3">
                {phases.map((phase, phaseIdx) => (
                  <motion.div
                    key={phase.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: phaseIdx * 0.04 }}
                  >
                    <button
                      onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)}
                      className="relative flex items-center gap-3 w-full text-left"
                    >
                      <div className={`relative z-10 w-10 h-10 ${phase.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${expandedPhase === phaseIdx ? "rotate-180" : ""}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">{phase.name}</h3>
                        <p className="text-[10px] text-gray-400">{phase.items.length}个环节</p>
                      </div>
                    </button>

                    {expandedPhase === phaseIdx && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="ml-13 mt-2 space-y-2 pl-13"
                      >
                        {phase.items.map((item, itemIdx) => (
                          <div key={`${item.title}-${itemIdx}`} className="bg-gray-50 rounded-xl p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                {item.time}
                              </span>
                              <h4 className="text-xs font-semibold text-gray-900">{item.title}</h4>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-1.5">{item.desc}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <MapPin className="w-3 h-3" /> {item.location}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
