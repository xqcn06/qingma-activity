"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowRight,
  ChevronDown,
  Trophy,
  Sparkles,
  Target,
  Footprints,
  Brain,
  Map,
  Megaphone,
  Image as ImageIcon,
  UserPlus,
  MessageSquare,
  ArrowUpRight,
  Shield,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import CountdownTimer from "@/components/features/CountdownTimer";
import ParticleBackground from "@/components/features/ParticleBackground";

const ICON_MAP: Record<string, any> = {
  Calendar, MapPin, Users, Clock, ArrowRight, Trophy, Sparkles, Target, Footprints, Brain, Map, Megaphone, ImageIcon, UserPlus, MessageSquare, Shield, ChevronDown, ArrowUpRight,
};

function renderIcon(iconName: string, className: string = "w-5 h-5") {
  const Icon = ICON_MAP[iconName];
  return Icon ? <Icon className={className} /> : null;
}

const gameStations = [
  { title: "听我口令", desc: "考验反应力和注意力的指令游戏，参与者需根据指令快速做出反应", icon: Target, color: "from-blue-500 to-blue-600", round: "第一轮", detail: "反应力 · 注意力" },
  { title: "躲避球", desc: "团队协作的投掷躲避游戏，考验团队配合与策略", icon: Footprints, color: "from-purple-500 to-purple-600", round: "第一轮", detail: "协作 · 策略" },
  { title: "密码破译", desc: "推理与协作的密码破解挑战，需要团队智慧共同解谜", icon: Brain, color: "from-amber-500 to-amber-600", round: "第一轮", detail: "推理 · 解谜" },
  { title: "别碰地面", desc: "团队协作翻转地垫的挑战，考验沟通与执行力", icon: Footprints, color: "from-emerald-500 to-emerald-600", round: "第一轮", detail: "沟通 · 执行" },
  { title: "\"械\"逅寻宝", desc: "凭线索卡在校园指定区域寻找积分卡，探索校园的寻宝之旅", icon: Map, color: "from-red-500 to-red-600", round: "第二轮", detail: "探索 · 寻宝" },
];

const fadeInUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" } };

interface HomePageProps {
  hero: { title: string; subtitle: string; badge: string; org: string };
  announcement: { title: string; content: string; badge: string };
  features: Array<{ href?: string; link?: string; label: string; icon: string; color: string }>;
  overview: Array<{ icon: string; title: string; value: string; sub: string }>;
  cta: { title: string; desc: string };
}

export default function HomePageClient({ hero, announcement, features, overview, cta }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % 2);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="overflow-hidden bg-white">
      {/* ====== 手机端（品牌沉浸） ====== */}
      <section className="lg:hidden relative bg-gradient-to-b from-red-800 via-red-700 to-red-900">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-red-500/25 rounded-full blur-3xl" />
          <div className="absolute top-32 -left-16 w-48 h-48 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-0 w-40 h-40 bg-red-400/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-red-900/50 to-transparent" />
        </div>

        <div className="relative h-[65vh] overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            >
              {currentSlide === 0 ? (
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 mb-5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span className="text-white/90 text-xs font-medium">{hero.badge}</span>
                  </motion.div>
                  <motion.h1
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black text-white mb-2 leading-tight"
                    style={{ textShadow: "0 2px 20px rgba(0,0,0,0.3)" }}
                  >{hero.title}</motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-base text-yellow-300 font-semibold mb-3"
                    style={{ textShadow: "0 1px 10px rgba(0,0,0,0.2)" }}
                  >{hero.subtitle}</motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs text-white/50 mb-5"
                  >{hero.org}</motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-5"
                  >
                    <CountdownTimer targetDate="2026-04-19T13:00:00" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex gap-3 justify-center"
                  >
                    <Link href="/register" className="bg-white text-red-600 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg active:scale-95 transition-transform">确认报名</Link>
                    <Link href="/schedule" className="bg-white/15 backdrop-blur-md text-white border border-white/20 px-5 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform">查看日程</Link>
                  </motion.div>
                </div>
              ) : (
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 mb-6">
                    <Megaphone className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-xs font-medium">最新公告</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-4">{announcement.title}</h2>
                  <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto mb-6">{announcement.content}</p>
                  <Link href="/announcements" className="inline-flex items-center gap-1.5 text-white text-sm font-medium bg-white/15 px-5 py-2.5 rounded-xl active:bg-white/25 transition-all">
                    查看全部公告 <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {[0, 1].map((i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
            ))}
          </div>
        </div>

        <div className="relative z-10 px-4 pb-3">
          <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-3 border border-white/[0.08]">
            <div className="grid grid-cols-5 gap-0.5">
              {features.map((item, i) => (
                <Link key={item.href || item.link || item.label || i} href={item.href || item.link || "#"} className="flex flex-col items-center gap-1 py-1.5 active:scale-90 transition-transform">
                  <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-md`}>
                    {renderIcon(item.icon, "w-5 h-5 text-white")}
                  </motion.div>
                  <span className="text-[9px] text-white/60 font-medium text-center leading-tight">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 px-4 pb-24 pt-2 space-y-3">
          <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-0.5 h-3.5 bg-red-400 rounded-full" />
              <h2 className="text-sm font-bold text-white/90">活动概览</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {overview.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-white/5 rounded-xl p-3 border border-white/5"
                >
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mb-2 text-white/80">
                    {renderIcon(item.icon, "w-4 h-4")}
                  </div>
                  <h3 className="text-[10px] font-semibold text-white/40 mb-0.5">{item.title}</h3>
                  <p className="text-sm font-bold text-white">{item.value}</p>
                  <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">{item.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-4 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-0.5 h-3.5 bg-purple-400 rounded-full" />
              <h2 className="text-sm font-bold text-white/90">活动环节</h2>
              <Link href="/activities" className="ml-auto text-[10px] text-white/50 font-medium">查看全部</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {gameStations.map((station, i) => (
                <motion.div
                  key={station.title}
                  initial={{ opacity: 0, x: 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="snap-start shrink-0 w-[240px] bg-white/5 rounded-xl overflow-hidden border border-white/5"
                >
                  <div className={`bg-gradient-to-r ${station.color} p-3 flex items-center gap-2.5`}>
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <station.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="text-[9px] text-white/80 bg-white/20 px-1.5 py-0.5 rounded-full">{station.round}</span>
                      <p className="text-xs font-bold text-white mt-0.5">{station.title}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] text-white/50 leading-relaxed">{station.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.08] backdrop-blur-2xl rounded-2xl p-5 border border-white/[0.08] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-400">工作人员招募</span>
              </div>
              <p className="text-xs text-white/50 mb-3">加入我们工作团队，为活动保驾护航</p>
              <Link href="/staff" className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-blue-500/20 px-4 py-2 rounded-xl active:bg-blue-500/30 transition-colors">
                了解详情 <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 桌面端 Hero + 粒子背景 ====== */}
      <section className="hidden lg:flex relative min-h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-800 via-red-700 to-red-900" />
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" style={{ zIndex: 2 }} />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-6 py-3 mb-10"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white/90 text-sm font-medium tracking-wide">{hero.badge}</span>
          </motion.div>

          <h1
            className="text-6xl xl:text-8xl font-black text-white mb-5 leading-[1.1] tracking-tight"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.3), 0 8px 60px rgba(0,0,0,0.15)" }}
          >
            {hero.title}
            <br />
            <span className="text-yellow-300 text-4xl xl:text-5xl font-bold" style={{ textShadow: "0 2px 15px rgba(0,0,0,0.25)" }}>
              {hero.subtitle}
            </span>
          </h1>

          <p className="text-lg text-white/60 mb-12 tracking-wide" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.2)" }}>
            {hero.org}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-12"
          >
            <CountdownTimer targetDate="2026-04-19T13:00:00" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex gap-5 justify-center"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 bg-white text-red-600 px-9 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all hover:scale-105 hover:shadow-2xl shadow-xl shadow-black/20 active:scale-95"
            >
              确认报名
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md text-white border border-white/20 px-9 py-4 rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
            >
              查看日程
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/40"
          style={{ zIndex: 10 }}
        >
          <ChevronDown className="w-7 h-7" />
        </motion.div>
      </section>

      {/* ====== 桌面端 公告栏 ====== */}
      <section className="hidden lg:block py-3 bg-red-50/80 border-y border-red-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">最新</span>
            <p className="text-gray-600 text-sm truncate flex-1">{announcement.content}</p>
            <Link href="/announcements" className="text-red-600 text-xs font-medium whitespace-nowrap shrink-0">更多 <ArrowRight className="w-3 h-3 inline" /></Link>
          </div>
        </div>
      </section>

      {/* ====== 桌面端 活动概览 ====== */}
      <section className="hidden lg:block py-16 lg:py-24 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">活动概览</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">一场专为学生干部打造的素质拓展之旅</h2>
            <p className="text-gray-500 max-w-xl mx-auto">通过团队协作与挑战，提升领导力、沟通力和执行力</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {overview.map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeInUp}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-red-100 transition-all duration-300 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300 text-red-600 group-hover:text-white"
                >
                  {renderIcon(item.icon, "w-6 h-6")}
                </motion.div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">{item.title}</h3>
                <p className="text-xl font-bold text-gray-900 mb-1">{item.value}</p>
                <p className="text-xs text-gray-400">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 桌面端 活动环节 ====== */}
      <section className="hidden lg:block py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">活动环节</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">五大挑战环节</h2>
            <p className="text-gray-500 max-w-xl mx-auto">第一轮：4个游戏站同步轮转积分赛 → 第二轮："械"逅寻宝赛</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gameStations.map((station, i) => (
              <motion.div
                key={station.title}
                {...fadeInUp}
                transition={{ delay: i * 0.08 }}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100/80 hover:border-gray-200 hover:shadow-xl transition-all duration-500 cursor-pointer"
              >
                <div className={`bg-gradient-to-r ${station.color} p-6 flex items-center gap-4 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 relative z-10"
                  >
                    <station.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <span className="text-[10px] text-white/80 bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{station.round}</span>
                    <h3 className="font-bold text-white text-lg mt-1">{station.title}</h3>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 relative z-10" />
                </div>
                <div className="p-5">
                  <p className="text-gray-500 text-sm leading-relaxed mb-3">{station.desc}</p>
                  <div className="flex items-center gap-2">
                    {station.detail.split(" · ").map((tag) => (
                      <span key={tag} className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div {...fadeInUp} className="text-center mt-10">
            <Link href="/activities" className="inline-flex items-center gap-2 text-red-600 font-semibold hover:underline">
              查看全部环节详情 <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== 桌面端 排行预览 ====== */}
      <section className="hidden lg:block py-16 lg:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/8 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-600/8 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-white/5 text-yellow-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Trophy className="w-3.5 h-3.5" /> 实时排行
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">积分排行榜</h2>
            <p className="text-gray-400 max-w-xl mx-auto">活动开始后实时更新团队积分排名</p>
          </motion.div>
          <motion.div {...fadeInUp} className="text-center">
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6 mb-6">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div className="text-left">
                <p className="text-white font-semibold">活动尚未开始</p>
                <p className="text-gray-400 text-sm">积分排行将在活动当天公布</p>
              </div>
            </div>
            <div>
              <Link href="/ranking" className="inline-flex items-center gap-1.5 text-yellow-400 font-semibold hover:underline">
                查看完整排行 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== 桌面端 CTA ====== */}
      <section className="hidden lg:block py-16 lg:py-24 bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" style={{ textShadow: "0 2px 15px rgba(0,0,0,0.2)" }}>
              {cta.title}
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
              {cta.desc}
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2.5 bg-white text-red-600 px-9 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-50 transition-all hover:scale-105 hover:shadow-2xl shadow-xl active:scale-95"
            >
              立即登录
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== 极简 Footer ====== */}
      <footer className="hidden lg:block py-8 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">© 2026 青马工程 · 大连交通大学机械工程学院</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/info" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">活动信息</Link>
              <Link href="/schedule" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">日程安排</Link>
              <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">联系我们</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
