"use client";

import { motion } from "framer-motion";
import { Target, Clock, Users, Trophy, BookOpen, Map, Footprints, Brain, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const ICON_MAP: Record<string, any> = {
  Target, Footprints, Brain, Map,
};

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

interface ActivitiesPageClientProps {
  gameStations: Array<{
    title: string;
    icon: string;
    color: string;
    duration: string;
    maxScore: string;
    staffCount: string;
    description: string;
    groupRule: string;
    rules: string[];
    scoringRules: string[];
    materials: string;
  }>;
  treasureHunt: {
    title: string;
    duration: string;
    description: string;
    groupRule: string;
    rules: string[];
    staff: Array<{ role: string; count: string; desc: string }>;
  };
}

export default function ActivitiesPageClient({ gameStations, treasureHunt }: ActivitiesPageClientProps) {
  const [expandedStation, setExpandedStation] = useState<number | null>(null);

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6 space-y-6">
        <motion.div {...fadeInUp} className="flex items-center gap-2">
          <span className="w-0.5 h-3.5 bg-blue-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600" />
            第一轮：同步轮转积分赛
          </h2>
        </motion.div>
        <p className="text-sm text-gray-500 -mt-4">16支队伍抽签分8组，每组2队，4个游戏站同步开始</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {gameStations.map((station, i) => {
            const Icon = ICON_MAP[station.icon] || Target;
            const isExpanded = expandedStation === i;
            return (
              <motion.div
                key={station.title}
                {...fadeInUp}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-5 border border-gray-100/80 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <button
                  onClick={() => setExpandedStation(isExpanded ? null : i)}
                  className="w-full flex items-center gap-4 text-left"
                >
                  <div className={`w-12 h-12 bg-gradient-to-r ${station.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900">{station.title}</h3>
                    <p className="text-sm text-gray-500">{station.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400 flex-shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {station.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-4 h-4" /> {station.maxScore}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t bg-gray-50 rounded-xl p-4"
                  >
                    <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">预计时长</p>
                        <p className="font-semibold text-gray-900">{station.duration}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">最高积分</p>
                        <p className="font-semibold text-gray-900">{station.maxScore}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-gray-400 text-xs">工作人员</p>
                        <p className="font-semibold text-gray-900">{station.staffCount}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" /> 分组规则
                      </h4>
                      <p className="text-sm text-gray-600">{station.groupRule}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" /> 游戏规则
                        </h4>
                        <ul className="space-y-1">
                          {station.rules.map((rule: string, idx: number) => (
                            <li key={idx} className="text-sm text-gray-600 flex gap-2">
                              <span className="text-red-600 font-bold mt-0.5">{idx + 1}.</span>
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="mb-4 lg:mb-0">
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <Trophy className="w-4 h-4" /> 积分规则
                          </h4>
                          <ul className="space-y-1">
                            {station.scoringRules.map((rule: string, idx: number) => (
                              <li key={idx} className="text-sm text-gray-600 flex gap-2">
                                <span className="text-red-600 font-bold mt-0.5">{idx + 1}.</span>
                                {rule}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">所需物料</h4>
                          <p className="text-sm text-gray-600">{station.materials}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div {...fadeInUp} className="flex items-center gap-2 pt-4">
          <span className="w-0.5 h-3.5 bg-amber-600 rounded-full" />
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Map className="w-5 h-5 text-amber-600" />
            第二轮：{treasureHunt.title}
          </h2>
        </motion.div>
        <p className="text-sm text-gray-500 -mt-4">{treasureHunt.groupRule}</p>

        <motion.div
          {...fadeInUp}
          className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">预计时长</p>
              <p className="font-bold text-gray-900">{treasureHunt.duration}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">参与方式</p>
              <p className="font-bold text-gray-900">全员参与</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">积分类型</p>
              <p className="font-bold text-gray-900">1分/2分/3分</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-2">游戏规则</h4>
            <ul className="space-y-1">
              {treasureHunt.rules.map((rule: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-red-600 font-bold mt-0.5">{idx + 1}.</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {treasureHunt.staff && treasureHunt.staff.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">工作人员分配</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {treasureHunt.staff.map((s: any) => (
                  <div key={s.role} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-900">{s.role}</p>
                    <p className="text-xs text-gray-500">{s.count}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Treasure Map CTA */}
          <Link href="/treasure-map" className="mt-6 block">
            <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-6 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Map className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">进入寻宝地图</h3>
                    <p className="text-sm text-white/70">查看线索卡和积分卡位置</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
