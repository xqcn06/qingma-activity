"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Calendar,
  Users,
  Trophy,
  Megaphone,
  Image as ImageIcon,
  Info,
  Target,
  ClipboardList,
  UserPlus,
  Clock,
  LogIn,
  Shield,
  LogOut,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/info", label: "活动信息" },
  { href: "/schedule", label: "日程安排" },
  { href: "/activities", label: "活动环节" },
  { href: "/groups", label: "分组查询" },
  { href: "/ranking", label: "积分排行" },
  { href: "/announcements", label: "通知公告" },
  { href: "/gallery", label: "相册" },
];

const userLinks = [
  { href: "/register", label: "活动报名", icon: ClipboardList, desc: "确认参与信息" },
  { href: "/staff", label: "工作人员招募", icon: UserPlus, desc: "加入工作团队" },
  { href: "/checkin", label: "签到打卡", icon: Clock, desc: "现场签到" },
];

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = status === "authenticated";
  const userName = (session?.user as any)?.name || "";
  const userRole = (session?.user as any)?.role || "";

  const pageTitles: Record<string, string> = {
    "/info": "活动信息",
    "/schedule": "日程安排",
    "/activities": "活动环节",
    "/groups": "分组查询",
    "/ranking": "积分排行",
    "/announcements": "通知公告",
    "/gallery": "活动相册",
    "/register": "活动报名",
    "/staff": "工作人员",
    "/feedback": "意见反馈",
    "/checkin": "签到打卡",
    "/my-team": "我的队伍",
    "/profile": "我的",
    "/mobile/activities": "活动中心",
    "/login": "登录",
  };

  const isHome = pathname === "/";
  const isSubPage = !isHome && !isAdmin && pageTitles[pathname] !== undefined;
  const pageTitle = pageTitles[pathname] || "";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (isAdmin) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isHome && !scrolled
          ? "bg-transparent"
          : "bg-white/90 backdrop-blur-2xl shadow-sm shadow-black/[0.03]"
      }`}
    >
      {/* 顶部微妙分割线 */}
      {!(isHome && !scrolled) && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent" />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo Area */}
          <div className="flex items-center gap-3">
            {/* Desktop: Always show logo + text on all pages */}
            <Link href="/" className="hidden lg:flex items-center gap-3 group">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isHome && !scrolled
                    ? "bg-white/15 backdrop-blur-sm"
                    : "bg-red-50 group-hover:bg-red-100"
                }`}
              >
                <Shield className={`w-5 h-5 transition-colors duration-300 ${
                  isHome && !scrolled ? "text-white" : "text-red-600"
                }`} />
              </motion.div>
              <div>
                <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${
                  isHome && !scrolled ? "text-white" : "text-gray-900"
                }`}>
                  青马工程
                </span>
                <span className={`block text-[9px] tracking-[0.2em] uppercase transition-colors duration-300 ${
                  isHome && !scrolled ? "text-white/50" : "text-gray-400"
                }`}>
                  机械工程学院
                </span>
              </div>
            </Link>

            {/* Mobile: Homepage shows logo+text, sub-pages show back button */}
            {isSubPage ? (
              <button
                onClick={() => router.back()}
                className="lg:hidden flex items-center gap-2 group"
              >
                <motion.div
                  whileHover={{ x: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isHome && !scrolled
                      ? "bg-white/15 backdrop-blur-sm"
                      : "bg-gray-100 group-hover:bg-gray-200"
                  }`}
                >
                  <ArrowLeft className={`w-4 h-4 transition-colors duration-300 ${
                    isHome && !scrolled ? "text-white" : "text-gray-500"
                  }`} />
                </motion.div>
                <span className={`font-semibold text-sm tracking-tight transition-colors duration-300 ${
                  isHome && !scrolled ? "text-white" : "text-gray-900"
                }`}>
                  {pageTitle}
                </span>
              </button>
            ) : (
              <Link href="/" className="lg:hidden flex items-center gap-2.5 group">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isHome && !scrolled
                      ? "bg-white/15 backdrop-blur-sm"
                      : "bg-red-50 group-hover:bg-red-100"
                  }`}
                >
                  <Shield className={`w-5 h-5 transition-colors duration-300 ${
                    isHome && !scrolled ? "text-white" : "text-red-600"
                  }`} />
                </motion.div>
                <div>
                  <span className={`font-bold text-sm tracking-tight transition-colors duration-300 ${
                    isHome && !scrolled ? "text-white" : "text-gray-900"
                  }`}>
                    青马工程
                  </span>
                  <span className={`block text-[9px] tracking-[0.2em] uppercase transition-colors duration-300 ${
                    isHome && !scrolled ? "text-white/50" : "text-gray-400"
                  }`}>
                    机械工程学院
                  </span>
                </div>
              </Link>
            )}
          </div>

          {/* Desktop Nav - 精致导航链接 */}
          <nav className="hidden lg:flex items-center">
            {navLinks.map((link, i) => {
              const isActive = pathname === link.href;
              const isDarkMode = isHome && !scrolled;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 group ${
                    isActive
                      ? isDarkMode
                        ? "text-white"
                        : "text-red-600"
                      : isDarkMode
                      ? "text-white/60 hover:text-white"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                  {/* 底部指示线动画 */}
                  {isActive ? (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-current rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : (
                    <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 rounded-full transition-all duration-300 group-hover:w-3 ${
                      isDarkMode ? "bg-white/50" : "bg-red-400/50"
                    }`} />
                  )}
                  {/* 分隔点 */}
                  {i < navLinks.length - 1 && (
                    <span className={`absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 ${
                      isDarkMode ? "bg-white/10" : "bg-gray-200/80"
                    }`} />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User */}
          <div className="hidden lg:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isHome && !scrolled
                      ? "text-white/90 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-red-500/20">
                    {userName.charAt(0)}
                  </div>
                  <span>{userName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl shadow-black/[0.08] border border-gray-100/80 overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100/80">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shadow-red-500/20">
                            {userName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{userName}</p>
                            <p className="text-xs text-gray-400">
                              {userRole === "ADMIN" ? "管理员" : userRole === "TEACHER" ? "老师" : userRole === "STAFF" ? "工作人员" : "学生"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-2">
                        {userLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                              <link.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{link.label}</p>
                              <p className="text-[10px] text-gray-400">{link.desc}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                          </Link>
                        ))}
                      </div>

                      <div className="mx-3 border-t border-gray-100/80" />

                      <div className="p-2">
                        {(userRole === "ADMIN" || userRole === "TEACHER") && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
                          >
                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                              <Shield className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-medium">后台管理</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="font-medium">退出登录</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isHome && !scrolled
                    ? "bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 border border-white/20"
                    : "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/20"
                }`}
              >
                <LogIn className="w-4 h-4" />
                登录
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              isHome && !scrolled ? "text-white" : "text-gray-900"
            }`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            {/* Glass Panel */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:hidden absolute top-full right-4 z-50 w-[280px] bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/[0.08] border border-white/50 overflow-hidden"
            >
              <div className="p-3 space-y-0.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      pathname === link.href
                        ? "text-red-600 bg-red-50/80"
                        : "text-gray-600 hover:bg-white/60"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                <div className="pt-2 mt-2 border-t border-gray-200/50">
                  {isLoggedIn ? (
                    <>
                      <div className="px-3.5 py-2.5 flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{userName}</p>
                          <p className="text-[10px] text-gray-400">
                            {userRole === "ADMIN" ? "管理员" : userRole === "TEACHER" ? "老师" : userRole === "STAFF" ? "工作人员" : "学生"}
                          </p>
                        </div>
                      </div>
                      {userLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="block px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-white/60 transition-all"
                        >
                          {link.label}
                        </Link>
                      ))}
                      {(userRole === "ADMIN" || userRole === "TEACHER") && (
                        <Link
                          href="/admin"
                          onClick={() => setIsOpen(false)}
                          className="block px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-white/60 transition-all"
                        >
                          后台管理
                        </Link>
                      )}
                      <button
                        onClick={() => { setIsOpen(false); handleLogout(); }}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50/50 transition-all"
                      >
                        退出登录
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="block mx-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 text-center transition-all active:scale-[0.98]"
                    >
                      登录
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
