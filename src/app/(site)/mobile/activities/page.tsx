"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Target,
  Users,
  Map,
  Megaphone,
  ImageIcon,
  MessageSquare,
  UserPlus,
  ChevronRight,
  Sparkles,
  Footprints,
  Brain,
} from "lucide-react";

const categories = [
  {
    title: "核心信息",
    items: [
      { href: "/info", label: "活动信息", desc: "时间、地点、参与对象", icon: Sparkles, color: "from-blue-500 to-blue-600" },
      { href: "/schedule", label: "日程安排", desc: "详细活动时间表", icon: Calendar, color: "from-green-500 to-emerald-600" },
      { href: "/groups", label: "分组查询", desc: "查看你的队伍和队友", icon: Users, color: "from-orange-500 to-orange-600" },
    ],
  },
  {
    title: "活动环节",
    items: [
      { href: "/activities", label: "游戏环节", desc: "听我口令、躲避球、密码破译", icon: Target, color: "from-purple-500 to-purple-600" },
      { href: "/activities", label: "寻宝赛", desc: "\"械\"逅寻宝 - 校园寻宝挑战", icon: Map, color: "from-red-500 to-red-600" },
    ],
  },
  {
    title: "互动参与",
    items: [
      { href: "/announcements", label: "通知公告", desc: "最新活动通知和提醒", icon: Megaphone, color: "from-amber-500 to-amber-600" },
      { href: "/gallery", label: "活动相册", desc: "精彩瞬间回顾", icon: ImageIcon, color: "from-pink-500 to-pink-600" },
      { href: "/feedback", label: "意见反馈", desc: "你的建议对我们很重要", icon: MessageSquare, color: "from-teal-500 to-teal-600" },
      { href: "/staff", label: "工作人员招募", desc: "加入我们工作团队", icon: UserPlus, color: "from-indigo-500 to-indigo-600" },
    ],
  },
];

const fadeInUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

export default function MobileActivitiesPage() {
  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {categories.map((category, ci) => (
          <motion.div
            key={category.title}
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ delay: ci * 0.08 }}
          >
            <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">{category.title}</h2>
            <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden shadow-sm">
              {category.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${item.href}-${i}`}
                    href={item.href}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/80 active:bg-gray-100/80 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* 热门环节预览 */}
        <motion.div
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">热门环节</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {[
              { title: "听我口令", round: "第一轮", icon: Target, color: "from-blue-500 to-blue-600", desc: "指令反应游戏" },
              { title: "躲避球", round: "第一轮", icon: Footprints, color: "from-purple-500 to-purple-600", desc: "投掷躲避" },
              { title: "密码破译", round: "第一轮", icon: Brain, color: "from-amber-500 to-amber-600", desc: "推理破解" },
              { title: "\"械\"逅寻宝", round: "第二轮", icon: Map, color: "from-red-500 to-red-600", desc: "校园寻宝" },
            ].map((game, i) => (
              <motion.div
                key={game.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="snap-start shrink-0 w-[200px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/80"
              >
                <div className={`bg-gradient-to-r ${game.color} p-3 flex items-center gap-2.5`}>
                  <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                    <game.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] text-white/80 bg-white/20 px-1.5 py-0.5 rounded-full">{game.round}</span>
                    <p className="text-sm font-bold text-white mt-0.5">{game.title}</p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-500">{game.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
