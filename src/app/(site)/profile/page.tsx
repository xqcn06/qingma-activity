"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Users,
  Trophy,
  QrCode,
  Calendar,
  Megaphone,
  LogOut,
  ChevronRight,
  Loader2,
  Shield,
  GraduationCap,
  User,
  Target,
  Map,
  Image as ImageIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "管理员",
  TEACHER: "教师",
  STUDENT: "学生",
  STAFF: "工作人员",
};

const fadeInUp = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myTeam, setMyTeam] = useState<any>(null);
  const [myCheckin, setMyCheckin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [teamRes, checkinRes] = await Promise.all([
        fetch("/api/my-team"),
        fetch("/api/checkin/status"),
      ]);
      if (teamRes.ok) setMyTeam(await teamRes.json());
      if (checkinRes.ok) setMyCheckin(await checkinRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (status === "loading" || loading) {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const userName = (session?.user as any)?.name || "";
  const userRole = (session?.user as any)?.role || "";
  const userGrade = (session?.user as any)?.grade || "";
  const userStudentId = (session?.user as any)?.studentId || "";

  const checkinStatusText = myCheckin?.status === "ON_TIME" ? "已签到" : myCheckin?.status === "LATE" ? "迟到" : "未签到";

  const stats = [
    {
      label: "所属队伍",
      value: myTeam ? myTeam.team?.name || "已分组" : "未分组",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "队伍角色",
      value: myTeam?.isCaptain ? "队长" : "队员",
      icon: Shield,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "签到状态",
      value: checkinStatusText,
      icon: QrCode,
      color: myCheckin?.status === "ON_TIME" ? "text-green-600" : myCheckin?.status === "LATE" ? "text-amber-600" : "text-gray-400",
      bg: myCheckin?.status === "ON_TIME" ? "bg-green-50" : myCheckin?.status === "LATE" ? "bg-amber-50" : "bg-gray-50",
    },
    {
      label: "我的积分",
      value: myTeam ? `${(myTeam.team?.totalScore || 0) + (myTeam.team?.treasureScore || 0)}` : "--",
      icon: Trophy,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "年级",
      value: userGrade ? `${userGrade}级` : "--",
      icon: GraduationCap,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "角色",
      value: ROLE_LABELS[userRole] || "学生",
      icon: User,
      color: "text-gray-600",
      bg: "bg-gray-50",
    },
  ];

  const myActivityLinks = [
    { href: "/my-team", label: "我的队伍", desc: "查看队伍和队友", icon: Users },
    { href: "/ranking", label: "积分排行", desc: "查看实时排名", icon: Trophy },
    { href: "/checkin", label: "签到打卡", desc: "GPS/二维码/验证码", icon: QrCode },
  ];

  const moreLinks = [
    { href: "/info", label: "活动信息", icon: Target },
    { href: "/schedule", label: "日程安排", icon: Calendar },
    { href: "/announcements", label: "通知公告", icon: Megaphone },
    { href: "/gallery", label: "活动相册", icon: ImageIcon },
    { href: "/activities", label: "活动环节", icon: Map },
  ];

  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 个人信息卡片 */}
        <div className="py-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              {/* 头像 */}
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center text-white text-xl lg:text-2xl font-bold shadow-sm">
                {userName.charAt(0)}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{userName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                    {ROLE_LABELS[userRole] || "学生"}
                  </span>
                  {userGrade && (
                    <span className="text-xs text-gray-400">{userGrade}级</span>
                  )}
                </div>
                {userStudentId && (
                  <p className="text-xs text-gray-400 mt-1 font-mono">{userStudentId}</p>
                )}
              </div>

              {/* 后台入口（ADMIN/TEACHER/STAFF） */}
              {(userRole === "ADMIN" || userRole === "TEACHER" || userRole === "STAFF") && (
                <Link href="/admin" className="p-2.5 bg-white rounded-xl border border-gray-100 active:bg-gray-50 transition-colors">
                  <Shield className="w-4 h-4 text-gray-600" />
                </Link>
              )}
            </div>
          </motion.div>
        </div>

        {/* 统计网格 3x2 */}
        <div className="pb-6">
          <div className="grid grid-cols-3 lg:grid-cols-3 gap-2.5">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04 }}
                className="bg-gray-50 rounded-xl p-3.5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`w-7 h-7 ${stat.bg} rounded-lg flex items-center justify-center mb-2`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <p className="text-sm font-bold text-gray-900 truncate">{stat.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="h-2 bg-gray-50" />

        {/* 我的活动 + 更多 两列布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-5">
          {/* 我的活动 */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">我的活动</h2>
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.whileInView}
              viewport={fadeInUp.viewport}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              {myActivityLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/80 active:bg-gray-100/80 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <link.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{link.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{link.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </motion.div>
          </div>

          {/* 更多 */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">更多</h2>
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.whileInView}
              viewport={fadeInUp.viewport}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50/80 active:bg-gray-100/80 transition-colors border-b border-gray-50 last:border-b-0"
                >
                  <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <link.icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-900">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </motion.div>
          </div>
        </div>

        {/* 退出登录 */}
        <div className="py-6">
          <motion.button
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            onClick={handleLogout}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </motion.button>
        </div>
      </div>
    </div>
  );
}
