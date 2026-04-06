"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Pin,
  Loader2,
  Megaphone,
} from "lucide-react";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

const typeConfig: Record<string, { label: string; icon: any; bg: string; text: string; border: string; badge: string }> = {
  URGENT: {
    label: "紧急",
    icon: AlertTriangle,
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-200",
    badge: "bg-red-500",
  },
  NORMAL: {
    label: "普通",
    icon: Info,
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-200",
    badge: "bg-blue-500",
  },
  REMINDER: {
    label: "提醒",
    icon: Bell,
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-200",
    badge: "bg-amber-500",
  },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
        if (data.length > 0) setExpandedId(data[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(
    (a) => filter === "all" || a.type === filter
  );

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned);
  const normalAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned);

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6">
        <div className="flex flex-wrap gap-2 mb-6 lg:mb-8">
          {(["all", "URGENT", "NORMAL", "REMINDER"] as const).map((f) => {
            const config = f !== "all" ? typeConfig[f] : null;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 hover:shadow-lg hover:-translate-y-0.5 duration-300 ${
                  filter === f
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100/80"
                }`}
              >
                {config && <config.icon className="w-3.5 h-3.5" />}
                {f === "all" ? "全部" : config?.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : (
          <>
            {pinnedAnnouncements.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-1.5">
                  <Pin className="w-4 h-4 text-red-600" />
                  置顶公告
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  {pinnedAnnouncements.map((announcement, i) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      isExpanded={expandedId === announcement.id}
                      onToggle={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                      index={i}
                      isPinned
                    />
                  ))}
                </div>
              </div>
            )}

            {normalAnnouncements.length > 0 && (
              <div>
                {pinnedAnnouncements.length > 0 && (
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 lg:mb-4">其他公告</h3>
                )}
                <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                  {normalAnnouncements.map((announcement, i) => (
                    <AnnouncementCard
                      key={announcement.id}
                      announcement={announcement}
                      isExpanded={expandedId === announcement.id}
                      onToggle={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                      index={i + pinnedAnnouncements.length}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredAnnouncements.length === 0 && (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">暂无公告</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({
  announcement,
  isExpanded,
  onToggle,
  index,
  isPinned,
}: {
  announcement: any;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  isPinned?: boolean;
}) {
  const config = typeConfig[announcement.type] || typeConfig.NORMAL;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isPinned
          ? "border-red-300 lg:col-span-2"
          : "border-gray-100/80"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-start gap-3 hover:bg-gray-50/50 transition-all text-left"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}>
          <Icon className={`w-5 h-5 ${config.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${config.badge}`}>
                  {config.label}
                </span>
                {isPinned && (
                  <span className="text-xs font-medium text-red-600 flex items-center gap-0.5">
                    <Pin className="w-3 h-3" /> 置顶
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(announcement.publishedAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 sm:px-5 pb-5"
        >
          <div className={`rounded-lg p-4 ${config.bg}`}>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {announcement.content}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
