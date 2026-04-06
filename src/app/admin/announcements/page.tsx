"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Pin,
  Clock,
  AlertTriangle,
  Bell,
  Info,
  Loader2,
  Filter,
  Save,
  X,
  BarChart3,
  Send,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; badgeVariant: "default" | "success" | "warning" | "danger" | "info" }> = {
  URGENT: { label: "紧急", icon: AlertTriangle, color: "text-red-600 bg-red-100", badgeVariant: "danger" },
  NORMAL: { label: "普通", icon: Info, color: "text-blue-600 bg-blue-100", badgeVariant: "info" },
  REMINDER: { label: "提醒", icon: Bell, color: "text-amber-600 bg-amber-100", badgeVariant: "warning" },
};

function AnnouncementFormModal({
  open,
  onClose,
  onSave,
  editingItem,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingItem: any | null;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("NORMAL");
  const [isPinned, setIsPinned] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setContent(editingItem.content);
      setType(editingItem.type);
      setIsPinned(editingItem.isPinned);
      setPublished(!!editingItem.publishedAt);
    } else {
      setTitle("");
      setContent("");
      setType("NORMAL");
      setIsPinned(false);
      setPublished(false);
    }
  }, [editingItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      title: title.trim(),
      content: content.trim(),
      type,
      isPinned,
      published,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editingItem ? "编辑公告" : "发布公告"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入公告标题"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入公告内容"
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all resize-none"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">类型</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-600 bg-white"
            >
              <option value="NORMAL">普通</option>
              <option value="URGENT">紧急</option>
              <option value="REMINDER">提醒</option>
            </select>
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-600"
              />
              <span className="text-sm text-gray-700">置顶</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-600"
              />
              <span className="text-sm text-gray-700">立即发布</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4" />
            {editingItem ? "保存" : "创建"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/announcements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (editingItem) {
        const res = await fetch("/api/admin/announcements", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...data }),
        });
        if (res.ok) {
          setModalOpen(false);
          setEditingItem(null);
          fetchAnnouncements();
        }
      } else {
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchAnnouncements();
        }
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此公告吗？")) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchAnnouncements();
    } catch {}
  };

  const handleTogglePin = async (item: any) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isPinned: !item.isPinned }),
      });
      if (res.ok) fetchAnnouncements();
    } catch {}
  };

  const handleTogglePublish = async (item: any) => {
    const isPublished = !!item.publishedAt;
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, published: !isPublished }),
      });
      if (res.ok) fetchAnnouncements();
    } catch {}
  };

  const filtered = announcements.filter((a) => {
    const matchType = filterType === "ALL" || a.type === filterType;
    const isPublished = !!a.publishedAt;
    const matchStatus =
      filterStatus === "ALL" ||
      (filterStatus === "published" && isPublished) ||
      (filterStatus === "draft" && !isPublished);
    return matchType && matchStatus;
  });

  const stats = {
    total: announcements.length,
    published: announcements.filter((a) => !!a.publishedAt).length,
    draft: announcements.filter((a) => !a.publishedAt).length,
    pinned: announcements.filter((a) => a.isPinned).length,
    byType: {
      NORMAL: announcements.filter((a) => a.type === "NORMAL").length,
      URGENT: announcements.filter((a) => a.type === "URGENT").length,
      REMINDER: announcements.filter((a) => a.type === "REMINDER").length,
    },
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
          <p className="text-gray-500 mt-1">发布和管理通知公告</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> 发布公告
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">总公告</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Send className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">已发布</p>
            <p className="text-xl font-bold text-gray-900">{stats.published}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Pin className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">已置顶</p>
            <p className="text-xl font-bold text-gray-900">{stats.pinned}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">普通</p>
            <p className="text-xl font-bold text-gray-900">{stats.byType.NORMAL}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">紧急</p>
            <p className="text-xl font-bold text-gray-900">{stats.byType.URGENT}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            {(["ALL", "NORMAL", "URGENT", "REMINDER"] as const).map((t) => {
              const config = t !== "ALL" ? TYPE_CONFIG[t] : null;
              return (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    filterType === t
                      ? "bg-red-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {config && <config.icon className="w-3.5 h-3.5" />}
                  {t === "ALL" ? "全部" : config?.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
            >
              <option value="ALL">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无公告数据</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ann) => {
            const config = TYPE_CONFIG[ann.type] || TYPE_CONFIG.NORMAL;
            const Icon = config.icon;
            const isPublished = !!ann.publishedAt;
            return (
              <div
                key={ann.id}
                className={`bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all group ${
                  ann.isPinned ? "ring-1 ring-red-200" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {ann.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-gray-900">{ann.title}</span>
                      <Badge variant={config.badgeVariant} size="sm">
                        <Icon className="w-3 h-3 mr-0.5" />
                        {config.label}
                      </Badge>
                      <Badge
                        variant={isPublished ? "success" : "default"}
                        size="sm"
                      >
                        {isPublished ? "已发布" : "草稿"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {ann.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        创建: {new Date(ann.createdAt).toLocaleString("zh-CN")}
                      </span>
                      {ann.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          发布: {new Date(ann.publishedAt).toLocaleString("zh-CN")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => handleTogglePin(ann)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        ann.isPinned
                          ? "text-red-600 hover:bg-red-50"
                          : "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                      }`}
                      title={ann.isPinned ? "取消置顶" : "置顶"}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleTogglePublish(ann)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPublished
                          ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                          : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                      }`}
                      title={isPublished ? "撤回发布" : "发布"}
                    >
                      {isPublished ? <Clock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleEdit(ann)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnnouncementFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
      />
    </div>
  );
}
