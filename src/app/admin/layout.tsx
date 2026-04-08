"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  Megaphone,
  Trophy,
  Package,
  MessageSquare,
  Settings,
  ArrowLeft,
  Shield,
  Repeat,
  Map,
  FileText,
  KeyRound,
  UserCog,
  LogOut,
  Menu,
  X,
  Home,
  FolderKanban,
  CalendarDays,
  Sliders,
  Edit3,
  User,
  ChevronRight,
  Database,
  Bell,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePermission } from "@/hooks/usePermission";
import { motion, AnimatePresence } from "framer-motion";
import SwipeTutorial from "@/components/ui/SwipeTutorial";

const manageItems = [
  { href: "/admin/import", label: "学生导入", icon: Users, permission: "MANAGE_TEAMS", color: "from-blue-500 to-blue-600" },
  { href: "/admin/students", label: "学生管理", icon: Users, permission: "MANAGE_TEAMS", color: "from-blue-400 to-blue-500" },
  { href: "/admin/registrations", label: "报名管理", icon: UserCheck, permission: "MANAGE_REGISTRATIONS", color: "from-green-500 to-green-600" },
  { href: "/admin/groups", label: "分组管理", icon: Users, permission: "MANAGE_TEAMS", color: "from-orange-500 to-orange-600" },
  { href: "/admin/staff", label: "工作人员", icon: UserPlus, permission: "MANAGE_STAFF", color: "from-purple-500 to-purple-600" },
];

const activityItems = [
  { href: "/admin/checkin", label: "签到管理", icon: UserCheck, permission: "MANAGE_SCHEDULE", color: "from-green-500 to-emerald-600" },
  { href: "/admin/schedule", label: "日程管理", icon: Calendar, permission: "MANAGE_SCHEDULE", color: "from-cyan-500 to-cyan-600" },
  { href: "/admin/announcements", label: "公告管理", icon: Megaphone, permission: "MANAGE_ANNOUNCEMENTS", color: "from-amber-500 to-amber-600" },
  { href: "/admin/scores", label: "积分管理", icon: Trophy, permission: "MANAGE_SCORES", color: "from-yellow-500 to-yellow-600" },
  { href: "/admin/materials", label: "物资管理", icon: Package, permission: "MANAGE_MATERIALS", color: "from-emerald-500 to-emerald-600" },
  { href: "/admin/rotation", label: "轮转排班", icon: Repeat, permission: "MANAGE_ROTATION", color: "from-indigo-500 to-indigo-600" },
  { href: "/admin/treasure", label: "寻宝管理", icon: Map, permission: "MANAGE_TREASURE", color: "from-red-500 to-red-600" },
];

const systemItems = [
  { href: "/admin/content", label: "内容管理", icon: Edit3, permission: "MANAGE_SETTINGS", color: "from-indigo-500 to-indigo-600" },
  { href: "/admin/feedbacks", label: "反馈管理", icon: MessageSquare, permission: "VIEW_FEEDBACKS", color: "from-teal-500 to-teal-600" },
  { href: "/admin/logs", label: "活动日志", icon: FileText, permission: "VIEW_LOGS", color: "from-slate-500 to-slate-600" },
  { href: "/admin/users", label: "用户权限", icon: Users, permission: "MANAGE_ADMINS", color: "from-violet-500 to-violet-600" },
  { href: "/admin/backup", label: "数据备份", icon: Database, permission: "MANAGE_SETTINGS", color: "from-cyan-600 to-cyan-700" },
  { href: "/admin/notifications", label: "通知发送", icon: Bell, permission: "MANAGE_ANNOUNCEMENTS", color: "from-rose-500 to-rose-600" },
  { href: "/admin/settings", label: "系统设置", icon: Settings, permission: "MANAGE_SETTINGS", color: "from-zinc-500 to-zinc-600" },
];

const adminTabs = [
  { id: "home", label: "首页", icon: Home },
  { id: "manage", label: "管理", icon: FolderKanban },
  { id: "activity", label: "活动", icon: CalendarDays },
  { id: "system", label: "系统", icon: Sliders },
  { id: "profile", label: "我的", icon: User },
];

const navGroups = [
  {
    label: "核心管理",
    items: [
      { href: "/admin", label: "仪表盘", icon: LayoutDashboard, permission: null },
      { href: "/admin/import", label: "学生导入", icon: Users, permission: "MANAGE_TEAMS" },
      { href: "/admin/students", label: "学生管理", icon: Users, permission: "MANAGE_TEAMS" },
      { href: "/admin/registrations", label: "报名管理", icon: UserCheck, permission: "MANAGE_REGISTRATIONS" },
      { href: "/admin/groups", label: "分组管理", icon: Users, permission: "MANAGE_TEAMS" },
      { href: "/admin/staff", label: "工作人员", icon: UserPlus, permission: "MANAGE_STAFF" },
    ],
  },
  {
    label: "活动管理",
    items: [
      { href: "/admin/checkin", label: "签到管理", icon: UserCheck, permission: "MANAGE_SCHEDULE" },
      { href: "/admin/schedule", label: "日程管理", icon: Calendar, permission: "MANAGE_SCHEDULE" },
      { href: "/admin/announcements", label: "公告管理", icon: Megaphone, permission: "MANAGE_ANNOUNCEMENTS" },
      { href: "/admin/scores", label: "积分管理", icon: Trophy, permission: "MANAGE_SCORES" },
      { href: "/admin/materials", label: "物资管理", icon: Package, permission: "MANAGE_MATERIALS" },
      { href: "/admin/rotation", label: "轮转排班", icon: Repeat, permission: "MANAGE_ROTATION" },
      { href: "/admin/treasure", label: "寻宝管理", icon: Map, permission: "MANAGE_TREASURE" },
    ],
  },
  {
    label: "系统管理",
    items: [
      { href: "/admin/content", label: "内容管理", icon: Edit3, permission: "MANAGE_SETTINGS" },
      { href: "/admin/feedbacks", label: "反馈管理", icon: MessageSquare, permission: "VIEW_FEEDBACKS" },
      { href: "/admin/logs", label: "活动日志", icon: FileText, permission: "VIEW_LOGS" },
      { href: "/admin/users", label: "用户权限", icon: Users, permission: "MANAGE_ADMINS" },
      { href: "/admin/backup", label: "数据备份", icon: Database, permission: "MANAGE_SETTINGS" },
      { href: "/admin/notifications", label: "通知发送", icon: Bell, permission: "MANAGE_ANNOUNCEMENTS" },
      { href: "/admin/settings", label: "系统设置", icon: Settings, permission: "MANAGE_SETTINGS" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [showTutorial, setShowTutorial] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { hasPermission, role } = usePermission();

  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  // Show tutorial on first visit to manage tab
  useEffect(() => {
    if (activeTab === "manage") {
      const seen = localStorage.getItem("admin-swipe-tutorial");
      if (!seen) {
        setShowTutorial(true);
      }
    }
  }, [activeTab]);

  const [stats, setStats] = useState<any>(null);

  // Fetch dashboard stats
  useEffect(() => {
    if (activeTab === "home") {
      fetch("/api/admin/dashboard/stats")
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(() => {});
    }
  }, [activeTab]);

  const roleLabel = role === "TEACHER" ? "老师" : role === "ADMIN" ? "管理员" : role === "STAFF" ? "工作人员" : "学生";
  const isSubPage = pathname !== "/admin" && pathname.startsWith("/admin");

  const filterByPermission = (items: typeof manageItems) =>
    items.filter((item) => !item.permission || hasPermission(item.permission));

  const visibleManage = filterByPermission(manageItems);
  const visibleActivity = filterByPermission(activityItems);
  const visibleSystem = filterByPermission(systemItems);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  // Auto-detect tab from pathname
  useEffect(() => {
    if (pathname === "/admin") {
      setActiveTab("home");
    } else if (manageItems.some((i) => pathname.startsWith(i.href))) {
      setActiveTab("manage");
    } else if (activityItems.some((i) => pathname.startsWith(i.href))) {
      setActiveTab("activity");
    } else if (systemItems.some((i) => pathname.startsWith(i.href))) {
      setActiveTab("system");
    } else {
      setActiveTab("profile");
    }
  }, [pathname]);

  const renderTabContent = () => {
    if (activeTab === "home") {
      return (
        <div className="space-y-5">
          {/* Quick stats placeholder */}
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold">数据概览</h2>
                  <p className="text-white/60 text-xs">实时活动数据</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold">{stats?.approvedRegistrations ?? "--"}</p>
                  <p className="text-[10px] text-white/60">报名</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold">{stats?.totalCheckins ?? "--"}</p>
                  <p className="text-[10px] text-white/60">签到</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-lg font-bold">{stats?.totalTeams ?? "--"}</p>
                  <p className="text-[10px] text-white/60">队伍</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">常用操作</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/admin/checkin", label: "签到管理", icon: UserCheck, color: "from-green-500 to-emerald-600" },
                { href: "/admin/scores", label: "录入积分", icon: Trophy, color: "from-amber-500 to-amber-600" },
                { href: "/admin/announcements", label: "发布公告", icon: Megaphone, color: "from-red-500 to-red-600" },
                { href: "/admin/groups", label: "管理分组", icon: Users, color: "from-blue-500 to-blue-600" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* All modules */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">全部模块</h3>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {[...visibleManage, ...visibleActivity, ...visibleSystem].map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/80 active:bg-gray-100/80 transition-colors ${
                    i > 0 ? "border-t border-gray-50" : ""
                  }`}
                >
                  <div className={`w-9 h-9 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "manage") {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">核心管理</h3>
            <div className="grid grid-cols-2 gap-3">
              {visibleManage.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform ${
                    isActive(item.href) ? "ring-2 ring-red-500/20 border-red-200" : ""
                  }`}
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "activity") {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">活动管理</h3>
            <div className="grid grid-cols-2 gap-3">
              {visibleActivity.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform ${
                    isActive(item.href) ? "ring-2 ring-red-500/20 border-red-200" : ""
                  }`}
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "system") {
      return (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-3 px-1">系统管理</h3>
            <div className="grid grid-cols-2 gap-3">
              {visibleSystem.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform ${
                    isActive(item.href) ? "ring-2 ring-red-500/20 border-red-200" : ""
                  }`}
                >
                  <div className={`w-11 h-11 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Profile tab
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center text-xl font-bold border border-white/10">
              {(session?.user as any)?.name?.charAt(0) || "用"}
            </div>
            <div>
              <h2 className="font-bold text-lg">{(session?.user as any)?.name || "用户"}</h2>
              <p className="text-white/60 text-sm">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/80 active:bg-gray-100/80 transition-colors border-b border-gray-50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-sm font-medium text-gray-700">返回前台</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-red-50/80 active:bg-red-100/80 transition-colors text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-sm font-medium text-left">退出登录</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">返回前台</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm">后台管理</h1>
              <p className="text-xs text-gray-500">青马工程活动</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((item) => !item.permission || hasPermission(item.permission));
            if (visibleItems.length === 0) return null;
            return (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive(item.href)
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-gray-800/50 rounded-xl">
            <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {(session?.user as any)?.name?.charAt(0) || "用"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{(session?.user as any)?.name || "用户"}</p>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white flex flex-col shadow-2xl"
          >
            <div className="p-5 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">返回前台</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-sm">后台管理</h1>
                  <p className="text-xs text-gray-500">青马工程活动</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter((item) => !item.permission || hasPermission(item.permission));
                if (visibleItems.length === 0) return null;
                return (
                  <div key={group.label}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                      {group.label}
                    </h3>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isActive(item.href)
                              ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          }`}
                        >
                          <item.icon className="w-5 h-5 shrink-0" />
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-3 px-3 py-2.5 mb-2 bg-gray-800/50 rounded-xl">
                <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {(session?.user as any)?.name?.charAt(0) || "用"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{(session?.user as any)?.name || "用户"}</p>
                  <p className="text-xs text-gray-500">{roleLabel}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          {isSubPage ? (
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors -ml-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h2 className="font-semibold text-gray-900">
            {isSubPage
              ? navGroups.flatMap(g => g.items).find(i => pathname.startsWith(i.href))?.label || "后台管理"
              : "后台管理"}
          </h2>
        </div>

        {/* Mobile: show children for sub-pages, tab content for home */}
        {isSubPage ? (
          <div className="lg:hidden p-4 pb-20">{children}</div>
        ) : (
          <div className="lg:hidden px-4 py-4 pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Desktop Content */}
        <div className="hidden lg:block p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Tab - only show on home tab */}
      {!isSubPage && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-100/80 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <div className="flex items-center h-16">
              {adminTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === "home") {
                        setActiveTab("home");
                        router.push("/admin");
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className="flex flex-col items-center justify-center flex-1 h-full relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="admin-tab-indicator"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative flex flex-col items-center gap-1">
                      {isActive && (
                        <motion.div
                          layoutId="admin-tab-glow"
                          className="absolute -inset-2 bg-red-50 rounded-xl -z-10"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <Icon
                        className={`w-5 h-5 transition-colors duration-200 ${
                          isActive ? "text-red-600" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-medium transition-colors duration-200 ${
                          isActive ? "text-red-600" : "text-gray-400"
                        }`}
                      >
                        {tab.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/95" />
          </div>
        </nav>
      )}

      {/* Swipe Tutorial */}
      <SwipeTutorial onComplete={handleTutorialComplete} />
    </div>
  );
}
