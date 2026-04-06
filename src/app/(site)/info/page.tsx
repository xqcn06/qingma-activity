"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Users,
  Target,
  Heart,
  BookOpen,
  Award,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";

const orgStructure = [
  { role: "主办单位", name: "机械工程学院团委" },
  { role: "承办单位", name: "学生会组织部" },
  { role: "协办单位", name: "青年志愿者协会" },
];

const highlights = [
  { icon: Shield, title: "政治素养提升", desc: "通过理论学习与实践相结合，提升学生干部的政治觉悟和理论素养", color: "from-red-500 to-red-600" },
  { icon: Users, title: "团队协作能力", desc: "通过团队挑战项目，培养团队协作精神和组织协调能力", color: "from-blue-500 to-blue-600" },
  { icon: Target, title: "领导力培养", desc: "在情景模拟和任务挑战中锻炼决策能力和领导才能", color: "from-purple-500 to-purple-600" },
  { icon: Heart, title: "服务意识增强", desc: "强化学生干部的服务意识，提升为同学服务的能力和水平", color: "from-pink-500 to-pink-600" },
  { icon: BookOpen, title: "知识储备拓展", desc: "通过知识竞赛环节，检验和拓展学生干部的知识面", color: "from-amber-500 to-amber-600" },
  { icon: Award, title: "综合素质评价", desc: "全方位评价体系，记录每位参与者的成长与进步", color: "from-emerald-500 to-emerald-600" },
];

const notices = [
  "请穿着运动服装和运动鞋参加活动",
  "活动当天请携带学生证",
  "如有身体不适请提前告知负责人",
  "活动期间请服从工作人员安排",
  "注意个人财物安全",
  "活动期间保持手机畅通",
];

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

export default function InfoPage() {
  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 活动背景 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-0.5 h-3.5 bg-red-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">活动背景与目的</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            为深入学习贯彻习近平新时代中国特色社会主义思想，落实立德树人根本任务，
            培养造就一批政治坚定、能力突出、素质优良的学生骨干队伍，
            机械工程学院团委特举办"青马工程"学生干部素质拓展活动。
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mt-2">
            本次活动面向大一、大二两个学年所有班级班委，通过一系列精心设计的素质拓展环节，
            全面提升学生干部的政治素养、团队协作能力、组织领导能力和服务意识。
          </p>
        </motion.div>

        {/* 时间与地点 + 参与对象 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 时间与地点 */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-0.5 h-3.5 bg-blue-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-900">时间与地点</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-700">活动时间</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p><span className="font-medium text-gray-700">日期：</span>5月15日</p>
                  <p><span className="font-medium text-gray-700">第一场：</span>12:30-15:20</p>
                  <p><span className="font-medium text-gray-700">第二场：</span>15:35-18:00</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold text-gray-700">活动地点</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <p><span className="font-medium text-gray-700">游戏区：</span>操场</p>
                  <p><span className="font-medium text-gray-700">寻宝区：</span>楼宇周边+绿化区</p>
                  <p><span className="font-medium text-gray-700">集合地：</span>操场主席台</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 参与对象 */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-0.5 h-3.5 bg-amber-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-900">参与对象</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">第一场</span>
                <h3 className="text-sm font-bold text-gray-900 mt-2">大一学生干部</h3>
                <p className="text-xs text-gray-500 mt-1">144人 · 16支队伍 · 每队9人</p>
              </div>
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">第二场</span>
                <h3 className="text-sm font-bold text-gray-900 mt-2">大二学生干部</h3>
                <p className="text-xs text-gray-500 mt-1">136人 · 16支队伍 · 每队8-9人</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 组织架构 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-0.5 h-3.5 bg-purple-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">组织架构</h2>
          </div>
          <div className="space-y-2.5">
            {orgStructure.map((item, i) => (
              <motion.div
                key={item.role}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
              >
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-600">{item.role.slice(0, 2)}</span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">{item.role}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 活动亮点 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-0.5 h-3.5 bg-emerald-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">活动亮点</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {highlights.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-gray-50 rounded-xl p-3"
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center mb-2 shadow-sm`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xs font-bold text-gray-900 mb-0.5">{item.title}</h3>
                <p className="text-[10px] text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 注意事项 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-0.5 h-3.5 bg-orange-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">注意事项</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2.5">
            {notices.map((notice, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 leading-relaxed">{notice}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
