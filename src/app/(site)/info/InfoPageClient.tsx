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

const ICON_MAP: Record<string, any> = {
  Shield, Users, Target, Heart, BookOpen, Award, CheckCircle2, Calendar, MapPin, Clock,
};

function renderIcon(iconName: string, className: string = "w-5 h-5") {
  const Icon = ICON_MAP[iconName];
  return Icon ? <Icon className={className} /> : null;
}

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

interface InfoPageProps {
  background: { content: string };
  timeLocation: any[];
  participants: any[];
  organization: { text: string }[];
  highlights: any[];
  notices: { text: string }[];
}

export default function InfoPageClient({ background, timeLocation, participants, organization, highlights, notices }: InfoPageProps) {
  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 活动背景 */}
        <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-0.5 h-3.5 bg-red-600 rounded-full" />
            <h2 className="text-sm font-bold text-gray-900">活动背景与目的</h2>
          </div>
          {background.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm text-gray-500 leading-relaxed mb-2 last:mb-0">{paragraph}</p>
          ))}
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
              {timeLocation.map((section, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {renderIcon(section.icon, "w-4 h-4 text-blue-600")}
                    <span className="text-xs font-semibold text-gray-700">{section.title}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-500">
                    {section.items.map((item: string, j: number) => {
                      const [label, value] = item.split("：");
                      return (
                        <p key={j}>
                          <span className="font-medium text-gray-700">{label}：</span>
                          {value}
                        </p>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 参与对象 */}
          <motion.div {...fadeInUp} className="bg-white rounded-2xl p-5 border border-gray-100/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-0.5 h-3.5 bg-amber-600 rounded-full" />
              <h2 className="text-sm font-bold text-gray-900">参与对象</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {participants.map((item, i) => (
                <div key={i} className={`${i === 0 ? "bg-blue-50/50 border-blue-100/50" : "bg-amber-50/50 border-amber-100/50"} rounded-xl p-4 border`}>
                  <span className={`text-[10px] font-semibold ${i === 0 ? "text-blue-600 bg-blue-100" : "text-amber-600 bg-amber-100"} px-2 py-0.5 rounded-full`}>{item.title}</span>
                  <h3 className="text-sm font-bold text-gray-900 mt-2">{item.subtitle}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
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
            {organization.map((item, i) => {
              const [role, name] = item.text.split("：");
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-600">{role.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">{role}</p>
                    <p className="text-sm font-semibold text-gray-900">{name}</p>
                  </div>
                </motion.div>
              );
            })}
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
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-gray-50 rounded-xl p-3"
              >
                <div className={`w-8 h-8 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center mb-2 shadow-sm`}>
                  {renderIcon(item.icon, "w-4 h-4 text-white")}
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
                <p className="text-xs text-gray-500 leading-relaxed">{notice.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
