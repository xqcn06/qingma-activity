"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Save,
  Bell,
  Calendar,
  Shield,
  Trophy,
  Map,
  Database,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

interface SettingItem {
  id?: string;
  key: string;
  value: string;
  category: string;
  description?: string;
}

const defaultSettings: Record<string, { value: string; category: string; description?: string }> = {
  activity_name: { value: "青马工程学生干部素质拓展活动", category: "basic", description: "活动名称" },
  activity_date: { value: "2026-05-15", category: "basic", description: "活动日期" },
  first_session_time: { value: "08:00", category: "basic", description: "第一场开始时间" },
  second_session_time: { value: "13:00", category: "basic", description: "第二场开始时间" },
  registration_open: { value: "true", category: "basic", description: "是否开放报名" },
  team_size: { value: "8", category: "basic", description: "每队人数（8或9）" },

  station_listen_command_score: { value: "100", category: "scoring", description: "听我口令满分" },
  station_dodgeball_score: { value: "100", category: "scoring", description: "躲避球满分" },
  station_code_break_score: { value: "100", category: "scoring", description: "密码破译满分" },
  station_no_touch_ground_score: { value: "100", category: "scoring", description: "别碰地面满分" },
  station_treasure_hunt_score: { value: "100", category: "scoring", description: "寻宝赛满分" },

  treasure_duration: { value: "40", category: "treasure", description: "寻宝赛时长（分钟）" },
  treasure_card_value_1: { value: "1", category: "treasure", description: "1分卡数量" },
  treasure_card_value_2: { value: "2", category: "treasure", description: "2分卡数量" },
  treasure_card_value_3: { value: "3", category: "treasure", description: "3分卡数量" },
  treasure_registration_deadline: { value: "2026-05-14", category: "treasure", description: "寻宝赛报名截止" },

  notify_on_announcement: { value: "true", category: "notification", description: "发布公告时通知学生" },
  notify_on_team_publish: { value: "true", category: "notification", description: "发布分组时通知学生" },
  notify_on_score_update: { value: "false", category: "notification", description: "积分更新时通知学生" },
  notify_on_schedule_change: { value: "true", category: "notification", description: "日程变更时通知学生" },
};

const sections = [
  { id: "basic", label: "基础设置", icon: Shield, color: "text-red-600" },
  { id: "scoring", label: "积分规则", icon: Trophy, color: "text-yellow-600" },
  { id: "treasure", label: "寻宝设置", icon: Map, color: "text-green-600" },
  { id: "notification", label: "通知设置", icon: Bell, color: "text-blue-600" },
  { id: "advanced", label: "高级设置", icon: Settings, color: "text-gray-600" },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    scoring: false,
    treasure: false,
    notification: false,
    advanced: false,
  });
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [globalSaving, setGlobalSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      // Use defaults if no settings exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSettingValue = (key: string): string => {
    const found = settings.find((s) => s.key === key);
    if (found) return found.value;
    const def = defaultSettings[key];
    return def ? def.value : "";
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => {
      const existing = prev.find((s) => s.key === key);
      if (existing) {
        return prev.map((s) => (s.key === key ? { ...s, value } : s));
      }
      const def = defaultSettings[key];
      return [...prev, { key, value, category: def?.category || "advanced", description: def?.description }];
    });
  };

  const saveSection = async (category: string) => {
    setSaving(category);
    const sectionSettings = settings
      .filter((s) => s.category === category)
      .map((s) => ({
        key: s.key,
        value: s.value,
        category: s.category,
        description: s.description,
      }));

    if (sectionSettings.length === 0) {
      setSaving(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: sectionSettings }),
      });
      if (res.ok) {
        setSavedFeedback(category);
        setTimeout(() => setSavedFeedback(null), 2000);
        fetchSettings();
      }
    } catch {
      // Error handled silently
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    setGlobalSaving(true);
    const allSettings = settings.map((s) => ({
      key: s.key,
      value: s.value,
      category: s.category,
      description: s.description,
    }));

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: allSettings }),
      });
      if (res.ok) {
        setSavedFeedback("all");
        setTimeout(() => setSavedFeedback(null), 2000);
        fetchSettings();
      }
    } catch {
      // Error handled silently
    } finally {
      setGlobalSaving(false);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleReset = async () => {
    if (resetConfirmText !== "确认重置") return;
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: Object.entries(defaultSettings).map(([key, def]) => ({
            key,
            value: def.value,
            category: def.category,
            description: def.description,
          })),
        }),
      });
      setResetModalOpen(false);
      setResetConfirmText("");
      fetchSettings();
    } catch {
      // Error handled silently
    }
  };

  const handleBackup = () => {
    const data = settings.map((s) => ({ key: s.key, value: s.value, category: s.category, description: s.description }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupModalOpen(false);
  };

  const handleRestore = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          await fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ settings: data }),
          });
          fetchSettings();
        }
      } catch {
        // Invalid file
      }
    };
    input.click();
  };

  const renderBasicSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">活动名称</label>
        <input
          type="text"
          value={getSettingValue("activity_name")}
          onChange={(e) => updateSetting("activity_name", e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">活动日期</label>
        <input
          type="date"
          value={getSettingValue("activity_date")}
          onChange={(e) => updateSetting("activity_date", e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">第一场开始时间</label>
          <input
            type="time"
            value={getSettingValue("first_session_time")}
            onChange={(e) => updateSetting("first_session_time", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">第二场开始时间</label>
          <input
            type="time"
            value={getSettingValue("second_session_time")}
            onChange={(e) => updateSetting("second_session_time", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="font-medium text-sm text-gray-900">报名开关</p>
          <p className="text-xs text-gray-500 mt-0.5">控制是否开放报名通道</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={getSettingValue("registration_open") === "true"}
            onChange={(e) => updateSetting("registration_open", e.target.checked ? "true" : "false")}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">每队人数</label>
        <select
          value={getSettingValue("team_size")}
          onChange={(e) => updateSetting("team_size", e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none bg-white"
        >
          <option value="8">8人/队</option>
          <option value="9">9人/队</option>
        </select>
      </div>
    </div>
  );

  const renderScoringSettings = () => {
    const stations = [
      { key: "station_listen_command_score", label: "听我口令" },
      { key: "station_dodgeball_score", label: "躲避球" },
      { key: "station_code_break_score", label: "密码破译" },
      { key: "station_no_touch_ground_score", label: "别碰地面" },
      { key: "station_treasure_hunt_score", label: "寻宝赛" },
    ];
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">设置各游戏站的满分分值</p>
        {stations.map((station) => (
          <div key={station.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{station.label} 满分</label>
            <input
              type="number"
              value={getSettingValue(station.key)}
              onChange={(e) => updateSetting(station.key, e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderTreasureSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">寻宝赛时长（分钟）</label>
        <input
          type="number"
          value={getSettingValue("treasure_duration")}
          onChange={(e) => updateSetting("treasure_duration", e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">1分卡数量</label>
          <input
            type="number"
            value={getSettingValue("treasure_card_value_1")}
            onChange={(e) => updateSetting("treasure_card_value_1", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">2分卡数量</label>
          <input
            type="number"
            value={getSettingValue("treasure_card_value_2")}
            onChange={(e) => updateSetting("treasure_card_value_2", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">3分卡数量</label>
          <input
            type="number"
            value={getSettingValue("treasure_card_value_3")}
            onChange={(e) => updateSetting("treasure_card_value_3", e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">寻宝赛报名截止</label>
        <input
          type="date"
          value={getSettingValue("treasure_registration_deadline")}
          onChange={(e) => updateSetting("treasure_registration_deadline", e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => {
    const notifications = [
      { key: "notify_on_announcement", label: "发布公告时通知学生", desc: "发布新公告时向学生发送通知" },
      { key: "notify_on_team_publish", label: "发布分组时通知学生", desc: "分组名单发布后通知相关学生" },
      { key: "notify_on_score_update", label: "积分更新时通知学生", desc: "积分录入或修改时通知" },
      { key: "notify_on_schedule_change", label: "日程变更时通知学生", desc: "日程有变动时通知" },
    ];
    return (
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-sm text-gray-900">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={getSettingValue(item.key) === "true"}
                onChange={(e) => updateSetting(item.key, e.target.checked ? "true" : "false")}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">数据管理</h3>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setBackupModalOpen(true)}>
            <Database className="w-4 h-4" /> 导出数据
          </Button>
          <Button variant="secondary" onClick={handleRestore}>
            <Database className="w-4 h-4" /> 导入数据
          </Button>
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">重置设置</h3>
        <p className="text-sm text-gray-500 mb-3">将所有设置恢复为默认值</p>
        <Button variant="danger" onClick={() => setResetModalOpen(true)}>
          <AlertTriangle className="w-4 h-4" /> 重置所有设置
        </Button>
      </div>
    </div>
  );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "basic":
        return renderBasicSettings();
      case "scoring":
        return renderScoringSettings();
      case "treasure":
        return renderTreasureSettings();
      case "notification":
        return renderNotificationSettings();
      case "advanced":
        return renderAdvancedSettings();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统设置</h1>
          <p className="text-gray-500 mt-1">管理活动基本信息和系统配置</p>
        </div>
        <Button onClick={saveAll} loading={globalSaving}>
          {savedFeedback === "all" ? (
            <>
              <Check className="w-4 h-4" /> 已保存全部
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> 保存全部
            </>
          )}
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections[section.id];
          return (
            <div key={section.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${section.color}`} />
                  <h2 className="font-semibold text-lg text-gray-900">{section.label}</h2>
                  {savedFeedback === section.id && (
                    <Badge variant="success">已保存</Badge>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {isExpanded && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  {renderSection(section.id)}
                  {section.id !== "advanced" && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={() => saveSection(section.id)}
                        loading={saving === section.id}
                      >
                        <Save className="w-4 h-4" /> 保存{section.label}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={resetModalOpen} onClose={() => { setResetModalOpen(false); setResetConfirmText(""); }} title="重置所有设置" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">此操作将把所有设置恢复为默认值，确定要继续吗？</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">请输入"确认重置"以继续</label>
            <input
              type="text"
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/20 outline-none"
              placeholder="确认重置"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setResetModalOpen(false); setResetConfirmText(""); }}>
              取消
            </Button>
            <Button variant="danger" onClick={handleReset} disabled={resetConfirmText !== "确认重置"}>
              确认重置
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={backupModalOpen} onClose={() => setBackupModalOpen(false)} title="导出设置数据" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">将当前所有设置导出为JSON文件，可用于备份或迁移。</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setBackupModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBackup}>
              <Database className="w-4 h-4" /> 导出
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
