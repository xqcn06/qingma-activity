"use client";

import { motion } from "framer-motion";
import { Target, Clock, Users, Trophy, BookOpen, Map, Footprints, Brain, ChevronDown, ChevronUp, Gamepad2 } from "lucide-react";
import { useState } from "react";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

const gameStations = [
  {
    title: "听我口令",
    icon: Target,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    duration: "13-19分钟",
    maxScore: "3分",
    staffCount: "5人",
    description: "考验反应力和注意力的指令游戏",
    groupRule: "按活动前抽签小组进行",
    rules: [
      "主持人为发令者（工作人员），其余参赛人员为动作执行者",
      '有效指令：发令者说出带赛前约定的任意主语（如"XX"）的动作指令，执行者需立即完成对应动作',
      "无效指令：发令者说出无指定主语的动作指令，执行者需保持原地不动，不得做出任何动作",
      "淘汰：执行者出现执行无效指令、未执行有效指令、动作完成错误三种情况，均视为本轮淘汰，退出本轮游戏",
    ],
    scoringRules: [
      "单局游戏时长6分钟，每局结束后，组内剩余存活人数多的队伍获胜",
      "若双方最终人数一致，可加赛1min以内决胜局",
      "胜方队伍累计2分，负方队伍累计0分，若双方加时后剩余人数一致，各得1分",
    ],
    materials: "主持人",
  },
  {
    title: "躲避球",
    icon: Footprints,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    duration: "15分钟",
    maxScore: "1分",
    staffCount: "4人",
    description: "团队协作的投掷躲避游戏",
    groupRule: "每队分为两组（4/5人），每局比赛派一组上场",
    rules: [
      "场地设有边界线、击打线与中线。队员超出边界线即判出局；击打时须位于击打线以外",
      "每队场地旁设有一个纸箱，用于存放沙包",
      "每队分为两组，每局开始时，一队派出一组上场，另一组在场外等候；每局结束后，两组互换位置",
      "裁判哨响为一局开始。双方各派一名队员同时发球",
      "每局以哨声限制击打次数，裁判鸣哨16次，代表双方在该局共有16次击打机会",
      "上场队员若被沙包击中，即被淘汰；若用手接住沙包，则不淘汰，且接住者为本队获得加分",
    ],
    scoringRules: [
      "基础计分：圆内按剩余人数加分（2/3/4人），接住沙包一次+1分",
      "若最终小分相同，平局加赛1轮（若时间紧张，则总积分各加一分）",
      "各个小局积分总和多者获胜，胜者总积分加1分，败者不加分",
    ],
    materials: "沙包40个，胶带8卷，纸箱4个，哨子2个，计分板",
  },
  {
    title: "密码破译",
    icon: Brain,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    duration: "20分钟",
    maxScore: "3分",
    staffCount: "5人",
    description: "推理与协作的密码破解挑战",
    groupRule: "按活动前抽签小组进行",
    rules: [
      "每队需破解一组9位数字密码（如 72 945 618），由三个三位数段按一定顺序排列组成",
      "三个小组独立领取各自的线索卡，推理出本组的三位数",
      "各小组完成本组三位数后，需示意队长本组已就绪，队长将告知裁判，裁判将发放顺序线索卡",
      "此时三个三位数段的初始顺序并不等于最终密码的顺序。队伍需要根据额外的顺序线索卡来确定三个段的正确排列顺序",
      "最终，队伍将三个三位数按正确顺序拼接成9位密码，向裁判提交",
    ],
    scoringRules: [
      "在限定时间内成功完成三段推理的队伍，获得+2分",
      "在限定时间内全部完成所有任务的队伍，获得+1分",
      "若其中一队率先全部完成，该队获得+3分（率先完成奖）",
    ],
    materials: "推理线索卡、顺序线索卡、密码答案卡、辅助材料、信封、笔30支、桌子",
  },
  {
    title: "别碰地面",
    icon: Footprints,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    duration: "16分钟",
    maxScore: "2分",
    staffCount: "3人",
    description: "团队协作翻转地垫的挑战",
    groupRule: "按活动前抽签小组进行",
    rules: [
      "每队获得一块帆布地垫（2m×2m），全队成员站立在地垫上",
      "裁判宣布开始后，全队需在不踩到地面的前提下，将地垫完全翻面",
      "过程中任何人身体任何部位触地，则全队需回到初始状态重新开始",
      "地垫完全翻面且全员站立其上即为完成",
    ],
    scoringRules: [
      "两队同时进行，先完成者积2分，负方1分",
      "5分钟内均未完成，则按翻面比例定胜负",
      "若进度相同，加赛一轮（加赛限时3分钟且限制一次）",
    ],
    materials: "帆布地垫2块（2m×2m）",
  },
];

const treasureHunt = {
  title: "\"械\"逅寻宝赛",
  icon: Map,
  color: "from-red-500 to-red-600",
  duration: "55分钟",
  description: "凭线索卡在校园指定区域寻找积分卡",
  groupRule: "16支队伍全员参与，每队分成3小组",
  rules: [
    "各队伍凭借前一轮获得的线索卡，在二期校园指定区域内寻找积分卡（1分/2分/3分）",
    "按图索骥完成寻宝；超时未登记积分视为无效",
    "按找到的积分卡分值累计，最终总积分最高的队伍获胜",
  ],
  staff: [
    { role: "总控负责人", count: "1人", desc: "统筹整场寻宝活动的节奏与现场秩序" },
    { role: "计时+积分登记", count: "1人", desc: "把控游戏时长，核验各队伍上交的积分卡" },
    { role: "现场巡查+道具放置", count: "6人", desc: "赛前放置积分卡，赛中巡逻，赛后重置" },
  ],
};

export default function ActivitiesPage() {
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
            const Icon = station.icon;
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
                    className={`mt-4 pt-4 border-t ${station.bgColor} rounded-xl p-4`}
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
                          {station.rules.map((rule, idx) => (
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
                            {station.scoringRules.map((rule, idx) => (
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
            第二轮："械"逅寻宝赛
          </h2>
        </motion.div>
        <p className="text-sm text-gray-500 -mt-4">16支队伍全员参与，凭线索卡在校内寻宝</p>

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
              {treasureHunt.rules.map((rule, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-red-600 font-bold mt-0.5">{idx + 1}.</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">工作人员分配</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {treasureHunt.staff.map((s) => (
                <div key={s.role} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm text-gray-900">{s.role}</p>
                  <p className="text-xs text-gray-500">{s.count}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
