"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, QrCode, Trophy, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const tabs = [
  { href: "/", label: "首页", icon: Home },
  { href: "/mobile/activities", label: "活动", icon: CalendarDays },
  { href: "/checkin", label: "签到", icon: QrCode },
  { href: "/ranking", label: "排行", icon: Trophy },
  { href: "/profile", label: "我的", icon: User },
];

export default function BottomTab() {
  const pathname = usePathname();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const isAdminPath = pathname.startsWith("/admin");
  if (isAdminPath) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
      {/* Tab栏主体 */}
      <div className="relative">
        {/* 顶部柔和渐变 */}
        <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-white/90 via-white/50 to-transparent pointer-events-none" />
        
        {/* 导航条 */}
        <div className="relative bg-white/[0.92] backdrop-blur-2xl border-t border-gray-200/50">
          {/* 顶部柔和阴影 */}
          <div className="absolute -top-3 left-0 right-0 h-3 bg-gradient-to-t from-black/[0.02] to-transparent pointer-events-none" />
          
          <div className="flex items-center h-16 safe-area-bottom">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;

              if (tab.href === "/checkin" && !isLoggedIn) {
                return (
                  <Link
                    key={tab.href}
                    href="/login?callbackUrl=/checkin"
                    className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative"
                  >
                    <Icon className="w-5 h-5 text-gray-300" />
                    <span className="text-[10px] text-gray-300 font-medium">{tab.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center justify-center flex-1 h-full relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}

                  <div className="relative flex flex-col items-center gap-0.5">
                    {isActive && (
                      <motion.div
                        layoutId="tab-glow"
                        className="absolute -inset-x-3 -inset-y-1 bg-red-50/60 rounded-lg -z-10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    
                    <motion.div
                      animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <Icon
                        className={`w-[22px] h-[22px] transition-colors duration-200 ${
                          isActive ? "text-red-600" : "text-gray-400"
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </motion.div>
                    
                    <span
                      className={`text-[10px] font-medium transition-colors duration-200 ${
                        isActive ? "text-red-600" : "text-gray-400"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/[0.92]" />
        </div>
      </div>
    </nav>
  );
}
