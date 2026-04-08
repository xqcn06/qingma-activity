"use client";

import { motion } from "framer-motion";
import { MapPin, ChevronDown, List, Table2 } from "lucide-react";
import { useState } from "react";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

interface SchedulePageClientProps {
  phases: Array<{ name: string; color: string; items: Array<{ time: string; title: string; location: string; desc: string }> }>;
}

export default function SchedulePageClient({ phases }: SchedulePageClientProps) {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");

  if (phases.length === 0) {
    return (
      <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen flex items-center justify-center">
        <p className="text-gray-400">暂无日程数据</p>
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
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

        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-0.5 h-3.5 bg-red-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-900">详细流程</h2>
            </div>
            <div className="hidden lg:flex items-center bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode("list")} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <List className="w-3.5 h-3.5" /> 列表
              </button>
              <button onClick={() => setViewMode("table")} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${viewMode === "table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Table2 className="w-3.5 h-3.5" /> 表格
              </button>
            </div>
          </div>

          <div className="lg:hidden relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />
            <div className="space-y-3">
              {phases.map((phase, phaseIdx) => (
                <motion.div key={phase.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: phaseIdx * 0.04 }}>
                  <button onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)} className="relative flex items-center gap-3 w-full text-left">
                    <div className={`relative z-10 w-10 h-10 ${phase.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${expandedPhase === phaseIdx ? "rotate-180" : ""}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-900">{phase.name}</h3>
                      <p className="text-[10px] text-gray-400">{phase.items.length}个环节</p>
                    </div>
                  </button>
                  {expandedPhase === phaseIdx && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-13 mt-2 space-y-2 pl-13">
                      {phase.items.map((item, itemIdx) => (
                        <div key={`${item.title}-${itemIdx}`} className="bg-gray-50 rounded-xl p-3.5">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{item.time}</span>
                            <h4 className="text-xs font-semibold text-gray-900">{item.title}</h4>
                          </div>
                          <p className="text-[11px] text-gray-500 mb-1.5">{item.desc}</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400"><MapPin className="w-3 h-3" /> {item.location}</div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

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
                  {phases.map((phase) => (
                    <tbody key={phase.name}>
                      {phase.items.map((item, itemIdx) => (
                        <tr key={`${phase.name}-${item.title}`} className={`border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${itemIdx === 0 ? "border-t border-gray-100" : ""}`}>
                          {itemIdx === 0 && (
                            <td rowSpan={phase.items.length} className="py-3 px-3 align-top">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 ${phase.color} rounded-full flex-shrink-0`} />
                                <span className="font-bold text-gray-900 whitespace-nowrap">{phase.name}</span>
                              </div>
                            </td>
                          )}
                          <td className="py-3 px-3"><span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap">{item.time}</span></td>
                          <td className="py-3 px-3"><div className="flex items-center gap-1 text-gray-600 whitespace-nowrap"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="text-xs">{item.location}</span></div></td>
                          <td className="py-3 px-3"><div><p className="text-xs font-semibold text-gray-900">{item.title}</p><p className="text-[11px] text-gray-500 mt-0.5">{item.desc}</p></div></td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "list" && (
            <div className="hidden lg:block relative">
              <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-100" />
              <div className="space-y-3">
                {phases.map((phase, phaseIdx) => (
                  <motion.div key={phase.name} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: phaseIdx * 0.04 }}>
                    <button onClick={() => setExpandedPhase(expandedPhase === phaseIdx ? null : phaseIdx)} className="relative flex items-center gap-3 w-full text-left">
                      <div className={`relative z-10 w-10 h-10 ${phase.color} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${expandedPhase === phaseIdx ? "rotate-180" : ""}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-gray-900">{phase.name}</h3>
                        <p className="text-[10px] text-gray-400">{phase.items.length}个环节</p>
                      </div>
                    </button>
                    {expandedPhase === phaseIdx && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="ml-13 mt-2 space-y-2 pl-13">
                        {phase.items.map((item, itemIdx) => (
                          <div key={`${item.title}-${itemIdx}`} className="bg-gray-50 rounded-xl p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="text-xs font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{item.time}</span>
                              <h4 className="text-xs font-semibold text-gray-900">{item.title}</h4>
                            </div>
                            <p className="text-[11px] text-gray-500 mb-1.5">{item.desc}</p>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400"><MapPin className="w-3 h-3" /> {item.location}</div>
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
