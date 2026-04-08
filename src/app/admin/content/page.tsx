"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Eye,
  Trash2,
  Loader2,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  FileText,
  Calendar,
  Home,
  Settings,
  List,
  Grid,
  Megaphone,
  History,
  Send,
  X,
  Users,
  Trophy,
  Plus,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

const PAGE_TYPES: Record<string, { label: string; icon: any; color: string }> = {
  home: { label: "首页", icon: Home, color: "text-red-600" },
  info: { label: "活动信息", icon: FileText, color: "text-blue-600" },
  schedule: { label: "日程安排", icon: Calendar, color: "text-purple-600" },
  activities: { label: "活动环节", icon: Trophy, color: "text-amber-600" },
  settings: { label: "全局设置", icon: Settings, color: "text-gray-600" },
};

const PHASE_COLORS = [
  { value: "bg-blue-600", label: "蓝色" },
  { value: "bg-yellow-500", label: "黄色" },
  { value: "bg-purple-600", label: "紫色" },
  { value: "bg-red-600", label: "红色" },
  { value: "bg-green-600", label: "绿色" },
  { value: "bg-orange-500", label: "橙色" },
  { value: "bg-gray-500", label: "灰色" },
  { value: "bg-pink-600", label: "粉色" },
  { value: "bg-indigo-600", label: "靛蓝" },
];

function parseJson<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try { return JSON.parse(str) as T; } catch { return fallback; }
}

export default function ContentManagementPage() {
  const { success, error: showError } = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content/pages");
      if (res.ok) setPages(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchBlocks = useCallback(async (pageId: string) => {
    try {
      const res = await fetch(`/api/admin/content/blocks?pageId=${pageId}`);
      if (res.ok) {
        const data = await res.json();
        const parsed = data.map((b: any) => ({
          ...b,
          config: parseJson<Record<string, any>>(b.config, {}),
          content: (() => {
            try { return JSON.parse(b.content); } catch { return b.content; }
          })(),
        }));
        setBlocks(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchVersions = useCallback(async (pageId: string) => {
    try {
      const res = await fetch(`/api/admin/content/versions?pageId=${pageId}`);
      if (res.ok) setVersions(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const selectPage = async (page: any) => {
    setSelectedPage(page);
    await fetchBlocks(page.id);
  };

  const handleSaveDraft = async () => {
    if (!selectedPage) return;
    setSaving(true);
    try {
      // Separate existing blocks and new blocks
      const existingBlocks = blocks.filter(b => !b.id.startsWith("new-"));
      const newBlocks = blocks.filter(b => b.id.startsWith("new-"));

      // Serialize existing blocks
      const serializedBlocks = existingBlocks.map(b => ({
        id: b.id,
        type: b.type,
        key: b.key,
        title: b.title,
        sortOrder: b.sortOrder,
        config: typeof b.config === "string" ? b.config : JSON.stringify(b.config || {}),
        content: typeof b.content === "string" ? b.content : JSON.stringify(b.content || ""),
      }));

      // Save existing blocks
      const res = await fetch("/api/admin/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPage.id, blocks: serializedBlocks }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "保存失败");
      }

      // Create new blocks
      for (const nb of newBlocks) {
        await fetch("/api/admin/content/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageId: selectedPage.id,
            type: nb.type,
            key: nb.key,
            title: nb.title,
            sortOrder: nb.sortOrder,
            config: typeof nb.config === "string" ? nb.config : JSON.stringify(nb.config || {}),
            content: typeof nb.content === "string" ? nb.content : JSON.stringify(nb.content || ""),
          }),
        });
      }

      success("草稿已保存");
      fetchPages();
      selectPage(selectedPage);
    } catch (e: any) {
      showError("保存失败", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedPage) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/content/save", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPage.id }),
      });
      if (res.ok) {
        success("页面已发布");
        fetchPages();
        selectPage(selectedPage);
      } else {
        const err = await res.json();
        showError("发布失败", err.error);
      }
    } catch { showError("发布失败"); }
    finally { setPublishing(false); }
  };

  const handleRollback = async (versionId: string) => {
    if (!selectedPage || !confirm("确定回滚到此版本？当前未保存的修改将丢失。")) return;
    try {
      const res = await fetch("/api/admin/content/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: selectedPage.id, versionId }),
      });
      if (res.ok) {
        success("已回滚到历史版本");
        setShowVersions(false);
        fetchBlocks(selectedPage.id);
        fetchPages();
      } else {
        const err = await res.json();
        showError("回滚失败", err.error);
      }
    } catch { showError("回滚失败"); }
  };

  const moveBlock = (idx: number, dir: "up" | "down") => {
    const newIdx = dir === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[idx].sortOrder;
    newBlocks[idx] = { ...newBlocks[idx], sortOrder: newBlocks[newIdx].sortOrder };
    newBlocks[newIdx] = { ...newBlocks[newIdx], sortOrder: temp };
    setBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const getPreviewUrl = () => {
    if (!selectedPage) return "/";
    if (selectedPage.slug === "home") return "/";
    if (selectedPage.slug === "info") return "/info";
    if (selectedPage.slug === "schedule") return "/schedule";
    return `/p/${selectedPage.slug}`;
  };

  const renderScheduleEditor = () => {
    const phases = blocks.filter((b: any) => b.type === "schedule-phase").sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    return (
      <div className="space-y-4">
        {phases.map((phase: any, phaseIdx: number) => {
          const items = Array.isArray(phase.content) ? phase.content : [];
          const color = phase.config?.color || "bg-gray-500";
          return (
            <div key={phase.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 flex items-center gap-3 bg-gray-50">
                <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center`}>
                  <span className="text-xs font-bold text-white">{phaseIdx + 1}</span>
                </div>
                <input
                  value={phase.title}
                  onChange={(e) => {
                    const newBlocks = [...blocks];
                    const b = newBlocks.find((bl: any) => bl.id === phase.id);
                    if (b) b.title = e.target.value;
                    setBlocks(newBlocks);
                  }}
                  className="flex-1 text-sm font-semibold bg-transparent border-none outline-none"
                />
                <select
                  value={color}
                  onChange={(e) => {
                    const newBlocks = [...blocks];
                    const b = newBlocks.find((bl: any) => bl.id === phase.id);
                    if (b) b.config = { ...b.config, color: e.target.value };
                    setBlocks(newBlocks);
                  }}
                  className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white"
                >
                  {PHASE_COLORS.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <div className="flex gap-1">
                  <button onClick={() => moveBlock(phaseIdx, "up")} className="p-1 hover:bg-gray-200 rounded"><ArrowUp className="w-3.5 h-3.5 text-gray-400" /></button>
                  <button onClick={() => moveBlock(phaseIdx, "down")} className="p-1 hover:bg-gray-200 rounded"><ArrowDown className="w-3.5 h-3.5 text-gray-400" /></button>
                  <button onClick={() => removeBlock(phase.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {items.map((item: any, itemIdx: number) => (
                  <div key={itemIdx} className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                    <input
                      value={item.time}
                      onChange={(e) => {
                        const newBlocks = [...blocks];
                        const b = newBlocks.find((bl: any) => bl.id === phase.id);
                        if (b && Array.isArray(b.content)) b.content[itemIdx] = { ...b.content[itemIdx], time: e.target.value };
                        setBlocks(newBlocks);
                      }}
                      className="w-28 text-xs font-mono font-bold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600"
                    />
                    <input
                      value={item.title}
                      onChange={(e) => {
                        const newBlocks = [...blocks];
                        const b = newBlocks.find((bl: any) => bl.id === phase.id);
                        if (b && Array.isArray(b.content)) b.content[itemIdx] = { ...b.content[itemIdx], title: e.target.value };
                        setBlocks(newBlocks);
                      }}
                      className="flex-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600"
                    />
                    <input
                      value={item.location}
                      onChange={(e) => {
                        const newBlocks = [...blocks];
                        const b = newBlocks.find((bl: any) => bl.id === phase.id);
                        if (b && Array.isArray(b.content)) b.content[itemIdx] = { ...b.content[itemIdx], location: e.target.value };
                        setBlocks(newBlocks);
                      }}
                      className="w-24 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600"
                      placeholder="地点"
                    />
                    <button
                      onClick={() => {
                        const newBlocks = [...blocks];
                        const b = newBlocks.find((bl: any) => bl.id === phase.id);
                        if (b && Array.isArray(b.content)) {
                          b.content.splice(itemIdx, 1);
                          setBlocks(newBlocks);
                        }
                      }}
                      className="p-1 hover:bg-red-50 rounded"
                    >
                      <X className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newBlocks = [...blocks];
                    const b = newBlocks.find((bl: any) => bl.id === phase.id);
                    if (b) {
                      if (!Array.isArray(b.content)) b.content = [];
                      b.content.push({ time: "", title: "新环节", location: "", desc: "" });
                      setBlocks(newBlocks);
                    }
                  }}
                  className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors"
                >
                  + 添加环节
                </button>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => {
            const newBlock = {
              id: `new-${Date.now()}`,
              type: "schedule-phase",
              key: `schedule.phase.${Date.now()}`,
              title: "新阶段",
              sortOrder: blocks.length,
              config: { color: "bg-blue-600" },
              content: [],
            };
            setBlocks([...blocks, newBlock]);
          }}
          className="w-full py-3 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-2xl hover:border-red-400 hover:text-red-600 transition-colors"
        >
          + 添加阶段
        </button>
      </div>
    );
  };

  const renderInfoEditor = () => {
    const getBlock = (key: string) => blocks.find((b: any) => b.key === key);
    const backgroundBlock = getBlock("info.background");
    const timeLocationBlock = getBlock("info.timeLocation");
    const participantsBlock = getBlock("info.participants");
    const organizationBlock = getBlock("info.organization");
    const highlightsBlock = getBlock("info.highlights");
    const noticesBlock = getBlock("info.notices");

    const backgroundContent = backgroundBlock ? (typeof backgroundBlock.content === "string" ? backgroundBlock.content : "") : "";
    const timeLocationItems = timeLocationBlock ? (Array.isArray(timeLocationBlock.content) ? timeLocationBlock.content : []) : [];
    const participantsItems = participantsBlock ? (Array.isArray(participantsBlock.content) ? participantsBlock.content : []) : [];
    const organizationItems = organizationBlock ? (Array.isArray(organizationBlock.content) ? organizationBlock.content : []) : [];
    const highlightsItems = highlightsBlock ? (Array.isArray(highlightsBlock.content) ? highlightsBlock.content : []) : [];
    const noticesItems = noticesBlock ? (Array.isArray(noticesBlock.content) ? noticesBlock.content : []) : [];

    return (
      <div className="space-y-4">
        {/* 活动背景 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-red-600" /></div>
            <span className="text-sm font-semibold text-gray-900">活动背景与目的</span>
          </div>
          <div className="p-4">
            <textarea value={backgroundContent} onChange={(e) => { if (backgroundBlock) { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === backgroundBlock.id); if (b) b.content = e.target.value; setBlocks(newBlocks); } }} rows={5} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-600 resize-none" placeholder="输入活动背景与目的..." />
          </div>
        </div>

        {/* 时间与地点 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Calendar className="w-4 h-4 text-blue-600" /></div>
            <span className="text-sm font-semibold text-gray-900">时间与地点</span>
          </div>
          <div className="p-4 space-y-3">
            {timeLocationItems.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={item.title || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], title: e.target.value }; setBlocks(newBlocks); }} className="text-sm font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="标题" />
                  <input value={item.icon || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], icon: e.target.value }; setBlocks(newBlocks); }} className="w-24 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="图标" />
                  <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b && Array.isArray(b.content)) { b.content.splice(idx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
                {(item.items || []).map((sub: string, subIdx: number) => (
                  <div key={subIdx} className="flex items-center gap-2 ml-2">
                    <input value={sub} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b && Array.isArray(b.content) && Array.isArray(b.content[idx].items)) { b.content[idx].items[subIdx] = e.target.value; setBlocks(newBlocks); } }} className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" />
                    <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b && Array.isArray(b.content) && Array.isArray(b.content[idx].items)) { b.content[idx].items.splice(subIdx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3 h-3 text-red-400" /></button>
                  </div>
                ))}
                <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b) { if (!Array.isArray(b.content)) b.content = []; b.content[idx] = { ...b.content[idx], items: [...(b.content[idx].items || []), "新内容"] }; setBlocks(newBlocks); } }} className="text-xs text-gray-500 hover:text-red-600 ml-2">+ 添加内容</button>
              </div>
            ))}
            <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === timeLocationBlock?.id); if (b) { if (!Array.isArray(b.content)) b.content = []; b.content.push({ title: "新卡片", icon: "", items: [] }); setBlocks(newBlocks); } }} className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors">+ 添加卡片</button>
          </div>
        </div>

        {/* 参与对象 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-amber-600" /></div>
            <span className="text-sm font-semibold text-gray-900">参与对象</span>
          </div>
          <div className="p-4 space-y-3">
            {participantsItems.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={item.title || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === participantsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], title: e.target.value }; setBlocks(newBlocks); }} className="w-20 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="场次" />
                  <input value={item.subtitle || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === participantsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], subtitle: e.target.value }; setBlocks(newBlocks); }} className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="对象" />
                  <input value={item.desc || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === participantsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], desc: e.target.value }; setBlocks(newBlocks); }} className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="描述" />
                  <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === participantsBlock?.id); if (b && Array.isArray(b.content)) { b.content.splice(idx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
            ))}
            <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === participantsBlock?.id); if (b) { if (!Array.isArray(b.content)) b.content = []; b.content.push({ title: "", subtitle: "", desc: "" }); setBlocks(newBlocks); } }} className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors">+ 添加对象</button>
          </div>
        </div>

        {/* 组织架构 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><List className="w-4 h-4 text-purple-600" /></div>
            <span className="text-sm font-semibold text-gray-900">组织架构</span>
          </div>
          <div className="p-4 space-y-2">
            {organizationItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                <input value={item.text || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === organizationBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { text: e.target.value }; setBlocks(newBlocks); }} className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="如：主办单位：XXX" />
                <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === organizationBlock?.id); if (b && Array.isArray(b.content)) { b.content.splice(idx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}
            <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === organizationBlock?.id); if (b) { if (!Array.isArray(b.content)) b.content = []; b.content.push({ text: "" }); setBlocks(newBlocks); } }} className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors">+ 添加组织</button>
          </div>
        </div>

        {/* 活动亮点 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center"><Grid className="w-4 h-4 text-emerald-600" /></div>
            <span className="text-sm font-semibold text-gray-900">活动亮点</span>
          </div>
          <div className="p-4 space-y-3">
            {highlightsItems.map((item: any, idx: number) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input value={item.icon || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === highlightsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], icon: e.target.value }; setBlocks(newBlocks); }} className="w-24 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="图标名" />
                  <input value={item.title || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === highlightsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], title: e.target.value }; setBlocks(newBlocks); }} className="flex-1 text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="标题" />
                  <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === highlightsBlock?.id); if (b && Array.isArray(b.content)) { b.content.splice(idx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
                <textarea value={item.desc || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === highlightsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], desc: e.target.value }; setBlocks(newBlocks); }} rows={2} className="w-full text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600 resize-none" placeholder="描述" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">颜色：</span>
                  <select value={item.color || "from-red-500 to-red-600"} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === highlightsBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { ...b.content[idx], color: e.target.value }; setBlocks(newBlocks); }} className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white">
                    <option value="from-red-500 to-red-600">红色</option>
                    <option value="from-blue-500 to-blue-600">蓝色</option>
                    <option value="from-purple-500 to-purple-600">紫色</option>
                    <option value="from-pink-500 to-pink-600">粉色</option>
                    <option value="from-amber-500 to-amber-600">琥珀</option>
                    <option value="from-emerald-500 to-emerald-600">翠绿</option>
                    <option value="from-green-500 to-green-600">绿色</option>
                    <option value="from-orange-500 to-orange-600">橙色</option>
                  </select>
                </div>
              </div>
            ))}
            <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === highlightsBlock?.id); if (b) { if (!Array.isArray(b.content)) b.content = []; b.content.push({ icon: "", title: "", desc: "", color: "from-red-500 to-red-600" }); setBlocks(newBlocks); } }} className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors">+ 添加亮点</button>
          </div>
        </div>

        {/* 注意事项 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center"><List className="w-4 h-4 text-orange-600" /></div>
            <span className="text-sm font-semibold text-gray-900">注意事项</span>
          </div>
          <div className="p-4 space-y-2">
            {noticesItems.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                <input value={item.text || ""} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === noticesBlock?.id); if (b && Array.isArray(b.content)) b.content[idx] = { text: e.target.value }; setBlocks(newBlocks); }} className="flex-1 text-sm bg-white border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-600" placeholder="注意事项内容" />
                <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === noticesBlock?.id); if (b && Array.isArray(b.content)) { b.content.splice(idx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            ))}
            <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === noticesBlock?.id); if (b) { if (!Array.isArray(b.content)) b.content = []; b.content.push({ text: "" }); setBlocks(newBlocks); } }} className="w-full py-2 text-xs text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:text-red-600 transition-colors">+ 添加注意事项</button>
          </div>
        </div>
      </div>
    );
  };

  const renderActivitiesEditor = () => {
    const stations = blocks.filter((b: any) => b.type === "game-station").sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    const treasureBlock = blocks.find((b: any) => b.type === "treasure-hunt");

    const updateStationField = (stationIdx: number, field: string, value: any) => {
      const newBlocks = [...blocks];
      const b = newBlocks.find((bl: any) => bl.id === stations[stationIdx]?.id);
      if (b) {
        const content = Array.isArray(b.content) ? b.content : [];
        content[field] = value;
        b.content = content;
        setBlocks(newBlocks);
      }
    };

    const updateStationArrayItem = (stationIdx: number, field: string, itemIdx: number, value: string) => {
      const newBlocks = [...blocks];
      const b = newBlocks.find((bl: any) => bl.id === stations[stationIdx]?.id);
      if (b && Array.isArray(b.content[field])) {
        b.content[field][itemIdx] = value;
        setBlocks(newBlocks);
      }
    };

    const addStationArrayItem = (stationIdx: number, field: string) => {
      const newBlocks = [...blocks];
      const b = newBlocks.find((bl: any) => bl.id === stations[stationIdx]?.id);
      if (b) {
        if (!Array.isArray(b.content[field])) b.content[field] = [];
        b.content[field].push("");
        setBlocks(newBlocks);
      }
    };

    const removeStationArrayItem = (stationIdx: number, field: string, itemIdx: number) => {
      const newBlocks = [...blocks];
      const b = newBlocks.find((bl: any) => bl.id === stations[stationIdx]?.id);
      if (b && Array.isArray(b.content[field])) {
        b.content[field].splice(itemIdx, 1);
        setBlocks(newBlocks);
      }
    };

    const updateTreasureField = (field: string, value: any) => {
      const newBlocks = [...blocks];
      const b = newBlocks.find((bl: any) => bl.id === treasureBlock?.id);
      if (b) {
        const content = b.content || {};
        content[field] = value;
        b.content = content;
        setBlocks(newBlocks);
      }
    };

    const STATION_COLORS = [
      { value: "from-blue-500 to-blue-600", label: "蓝色" },
      { value: "from-purple-500 to-purple-600", label: "紫色" },
      { value: "from-amber-500 to-amber-600", label: "琥珀" },
      { value: "from-emerald-500 to-emerald-600", label: "翠绿" },
      { value: "from-red-500 to-red-600", label: "红色" },
      { value: "from-pink-500 to-pink-600", label: "粉色" },
      { value: "from-indigo-500 to-indigo-600", label: "靛蓝" },
      { value: "from-teal-500 to-teal-600", label: "青色" },
    ];

    const STATION_ICONS = [
      { value: "Target", label: "靶心" },
      { value: "Footprints", label: "脚印" },
      { value: "Brain", label: "大脑" },
      { value: "Map", label: "地图" },
    ];

    return (
      <div className="space-y-4">
        {/* 游戏站 */}
        {stations.map((station: any, stationIdx: number) => {
          const content = station.content || {};
          return (
            <div key={station.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-3 flex items-center gap-3 bg-gray-50">
                <Trophy className="w-5 h-5 text-amber-600" />
                <input
                  value={content.title || ""}
                  onChange={(e) => updateStationField(stationIdx, "title", e.target.value)}
                  className="flex-1 text-sm font-semibold bg-transparent border-none outline-none"
                  placeholder="游戏站名称"
                />
                <div className="flex gap-1">
                  <button onClick={() => moveBlock(stationIdx, "up")} className="p-1 hover:bg-gray-200 rounded"><ArrowUp className="w-3.5 h-3.5 text-gray-400" /></button>
                  <button onClick={() => moveBlock(stationIdx, "down")} className="p-1 hover:bg-gray-200 rounded"><ArrowDown className="w-3.5 h-3.5 text-gray-400" /></button>
                  <button onClick={() => removeBlock(station.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">图标</label>
                    <select value={content.icon || "Target"} onChange={(e) => updateStationField(stationIdx, "icon", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                      {STATION_ICONS.map((ic: any) => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">颜色</label>
                    <select value={content.color || "from-blue-500 to-blue-600"} onChange={(e) => updateStationField(stationIdx, "color", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                      {STATION_COLORS.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input value={content.duration || ""} onChange={(e) => updateStationField(stationIdx, "duration", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="时长" />
                  <input value={content.maxScore || ""} onChange={(e) => updateStationField(stationIdx, "maxScore", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="最高分" />
                  <input value={content.staffCount || ""} onChange={(e) => updateStationField(stationIdx, "staffCount", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="工作人员" />
                </div>
                <input value={content.description || ""} onChange={(e) => updateStationField(stationIdx, "description", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="描述" />
                <input value={content.groupRule || ""} onChange={(e) => updateStationField(stationIdx, "groupRule", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="分组规则" />
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">游戏规则</label>
                  {(content.rules || []).map((rule: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                      <input value={rule} onChange={(e) => updateStationArrayItem(stationIdx, "rules", idx, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                      <button onClick={() => removeStationArrayItem(stationIdx, "rules", idx)} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  ))}
                  <button onClick={() => addStationArrayItem(stationIdx, "rules")} className="text-xs text-gray-500 hover:text-red-600">+ 添加规则</button>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">积分规则</label>
                  {(content.scoringRules || []).map((rule: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 mb-1">
                      <input value={rule} onChange={(e) => updateStationArrayItem(stationIdx, "scoringRules", idx, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                      <button onClick={() => removeStationArrayItem(stationIdx, "scoringRules", idx)} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
                    </div>
                  ))}
                  <button onClick={() => addStationArrayItem(stationIdx, "scoringRules")} className="text-xs text-gray-500 hover:text-red-600">+ 添加积分规则</button>
                </div>
                <input value={content.materials || ""} onChange={(e) => updateStationField(stationIdx, "materials", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="所需物料" />
              </div>
            </div>
          );
        })}

        <button
          onClick={() => {
            const newBlock = {
              id: `new-${Date.now()}`,
              type: "game-station",
              key: `activities.station.${Date.now()}`,
              title: "新游戏站",
              sortOrder: blocks.length,
              content: { title: "新游戏站", icon: "Target", color: "from-blue-500 to-blue-600", duration: "", maxScore: "", staffCount: "", description: "", groupRule: "", rules: [], scoringRules: [], materials: "" },
            };
            setBlocks([...blocks, newBlock]);
          }}
          className="w-full py-3 text-sm text-gray-500 border-2 border-dashed border-gray-300 rounded-2xl hover:border-red-400 hover:text-red-600 transition-colors"
        >
          <Plus className="w-4 h-4 inline mr-1" /> 添加游戏站
        </button>

        {/* 寻宝赛 */}
        {treasureBlock && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="p-3 flex items-center gap-3 bg-gray-50">
              <Map className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-gray-900">寻宝赛</span>
            </div>
            <div className="p-4 space-y-3">
              {(() => {
                const tc = treasureBlock.content || {};
                return (
                  <>
                    <input value={tc.title || ""} onChange={(e) => updateTreasureField("title", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold" placeholder="标题" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={tc.duration || ""} onChange={(e) => updateTreasureField("duration", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="时长" />
                      <input value={tc.groupRule || ""} onChange={(e) => updateTreasureField("groupRule", e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="参与方式" />
                    </div>
                    <input value={tc.description || ""} onChange={(e) => updateTreasureField("description", e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="描述" />
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">游戏规则</label>
                      {(tc.rules || []).map((rule: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 mb-1">
                          <input value={rule} onChange={(e) => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === treasureBlock.id); if (b) { b.content.rules[idx] = e.target.value; setBlocks(newBlocks); } }} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                          <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === treasureBlock.id); if (b) { b.content.rules.splice(idx, 1); setBlocks(newBlocks); } }} className="p-1 hover:bg-red-50 rounded"><X className="w-3.5 h-3.5 text-red-400" /></button>
                        </div>
                      ))}
                      <button onClick={() => { const newBlocks = [...blocks]; const b = newBlocks.find((bl: any) => bl.id === treasureBlock.id); if (b) { if (!Array.isArray(b.content.rules)) b.content.rules = []; b.content.rules.push(""); setBlocks(newBlocks); } }} className="text-xs text-gray-500 hover:text-red-600">+ 添加规则</button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGenericEditor = () => (
    <div className="space-y-4">
      {blocks.sort((a: any, b: any) => a.sortOrder - b.sortOrder).map((block: any, idx: number) => (
        <div key={block.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-3 flex items-center gap-3 bg-gray-50">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              {block.type === "text" ? <FileText className="w-4 h-4 text-gray-400" /> :
               block.type === "grid" ? <Grid className="w-4 h-4 text-gray-400" /> :
               block.type === "list" ? <List className="w-4 h-4 text-gray-400" /> :
               block.type === "cta" ? <Megaphone className="w-4 h-4 text-gray-400" /> :
               <FileText className="w-4 h-4 text-gray-400" />}
            </div>
            <input
              value={block.title}
              onChange={(e) => {
                const newBlocks = [...blocks];
                const b = newBlocks.find((bl: any) => bl.id === block.id);
                if (b) b.title = e.target.value;
                setBlocks(newBlocks);
              }}
              className="flex-1 text-sm font-medium bg-transparent border-none outline-none"
            />
            <div className="flex gap-1">
              <button onClick={() => moveBlock(idx, "up")} className="p-1 hover:bg-gray-200 rounded"><ArrowUp className="w-3.5 h-3.5 text-gray-400" /></button>
              <button onClick={() => moveBlock(idx, "down")} className="p-1 hover:bg-gray-200 rounded"><ArrowDown className="w-3.5 h-3.5 text-gray-400" /></button>
              <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
            </div>
          </div>
          <div className="p-4">
            {typeof block.content === "string" ? (
              <textarea
                value={block.content}
                onChange={(e) => {
                  const newBlocks = [...blocks];
                  const b = newBlocks.find((bl: any) => bl.id === block.id);
                  if (b) b.content = e.target.value;
                  setBlocks(newBlocks);
                }}
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-600 resize-none"
              />
            ) : (
              <textarea
                value={JSON.stringify(block.content, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    const newBlocks = [...blocks];
                    const b = newBlocks.find((bl: any) => bl.id === block.id);
                    if (b) b.content = parsed;
                    setBlocks(newBlocks);
                  } catch { /* ignore invalid JSON */ }
                }}
                rows={6}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono outline-none focus:border-red-600 resize-none"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
          <p className="text-gray-500 mt-1">编辑前台页面内容，保存草稿后可预览再发布</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">页面列表</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pages.map((page) => {
                const PageIcon = PAGE_TYPES[page.type]?.icon || FileText;
                const PageColor = PAGE_TYPES[page.type]?.color || "text-gray-600";
                return (
                  <button
                    key={page.id}
                    onClick={() => selectPage(page)}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      selectedPage?.id === page.id ? "bg-red-50 text-red-600" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <PageIcon className={`w-5 h-5 ${PageColor}`} />
                      <div>
                        <p className="text-sm font-medium">{page.title}</p>
                        <p className="text-xs text-gray-400">/{page.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={page.status === "published" ? "success" : "default"} size="sm">
                        {page.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedPage ? (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-lg text-gray-900">{selectedPage.title}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedPage.status === "published" && selectedPage.publishedAt
                      ? `已发布于 ${new Date(selectedPage.publishedAt).toLocaleString("zh-CN")}`
                      : "草稿状态，未发布"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setShowVersions(true); fetchVersions(selectedPage.id); }}>
                    <History className="w-4 h-4" />
                    历史版本
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowPreview(true)}>
                    <Eye className="w-4 h-4" />
                    预览
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleSaveDraft} loading={saving}>
                    <Save className="w-4 h-4" />
                    保存草稿
                  </Button>
                  <Button variant="primary" size="sm" onClick={handlePublish} loading={publishing}>
                    <Send className="w-4 h-4" />
                    发布
                  </Button>
                </div>
              </div>

              {selectedPage.type === "schedule" ? renderScheduleEditor() : selectedPage.type === "info" ? renderInfoEditor() : selectedPage.type === "activities" ? renderActivitiesEditor() : renderGenericEditor()}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>请在左侧选择一个页面进行编辑</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="页面预览" size="lg">
        <div className="h-[70vh]">
          <iframe src={getPreviewUrl()} className="w-full h-full rounded-xl border border-gray-200" title="页面预览" />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          预览显示的是已发布的内容。如需查看草稿效果，请先保存草稿再发布。
        </p>
      </Modal>

      <Modal open={showVersions} onClose={() => setShowVersions(false)} title="历史版本" size="md">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">暂无历史版本</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium">版本 {v.version}</p>
                  <p className="text-xs text-gray-400">
                    {v.status === "published" ? "已发布" : "草稿"} · {v.createdBy} · {new Date(v.createdAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => handleRollback(v.id)}>
                  回滚到此版本
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
