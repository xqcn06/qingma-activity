"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Save,
  Eye,
  Trash2,
  Loader2,
  ChevronRight,
  ChevronDown,
  Layout,
  Type,
  Image as ImageIcon,
  Grid,
  List,
  Megaphone,
  Minus,
  Code,
  Edit3,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

const BLOCK_TYPES = [
  { value: "hero", label: "Hero 区域", icon: Layout },
  { value: "text", label: "文本块", icon: Type },
  { value: "image", label: "图片块", icon: ImageIcon },
  { value: "grid", label: "网格块", icon: Grid },
  { value: "list", label: "列表块", icon: List },
  { value: "cta", label: "CTA 块", icon: Megaphone },
  { value: "divider", label: "分割线", icon: Minus },
  { value: "html", label: "自定义 HTML", icon: Code },
];

interface PageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  isEnabled: boolean;
  sortOrder: number;
  _count: { blocks: number };
  blocks: BlockData[];
}

interface BlockData {
  id: string;
  pageId: string;
  type: string;
  key: string;
  title: string;
  isEnabled: boolean;
  sortOrder: number;
  config: Record<string, any>;
  content: any;
}

export default function ContentManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [saving, setSaving] = useState(false);

  // 新增内容块表单
  const [newBlock, setNewBlock] = useState({ type: "text", key: "", title: "", content: "", config: "{}" });

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/content/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPages();
    }
  }, [status, fetchPages]);

  const handleSaveBlock = async () => {
    if (!editingBlock) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/blocks/${editingBlock.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingBlock.title,
          content: typeof editingBlock.content === "string" ? editingBlock.content : JSON.stringify(editingBlock.content),
          config: JSON.stringify(editingBlock.config),
          isEnabled: editingBlock.isEnabled,
        }),
      });
      if (res.ok) {
        setEditingBlock(null);
        fetchPages();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = async () => {
    if (!selectedPage || !newBlock.key || !newBlock.title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: selectedPage.id,
          type: newBlock.type,
          key: newBlock.key,
          title: newBlock.title,
          content: newBlock.content,
          config: newBlock.config,
          sortOrder: selectedPage._count.blocks,
        }),
      });
      if (res.ok) {
        setShowAddBlock(false);
        setNewBlock({ type: "text", key: "", title: "", content: "", config: "{}" });
        fetchPages();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("确定删除此内容块？")) return;
    try {
      const res = await fetch(`/api/admin/content/blocks/${blockId}`, { method: "DELETE" });
      if (res.ok) {
        fetchPages();
      }
    } catch {
      // ignore
    }
  };

  const handleToggleBlock = async (block: BlockData) => {
    try {
      await fetch(`/api/admin/content/blocks/${block.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: !block.isEnabled }),
      });
      fetchPages();
    } catch {
      // ignore
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">内容管理</h1>
          <p className="text-gray-500 mt-1">编辑前台页面内容，支持实时预览</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧：页面列表 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">页面列表</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => { setSelectedPage(page); setEditingBlock(null); }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    selectedPage?.id === page.id ? "bg-red-50 text-red-600" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{page.title}</p>
                    <p className="text-xs text-gray-400">/{page.slug} · {page._count.blocks}个内容块</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：内容块编辑 */}
        <div className="lg:col-span-3">
          {selectedPage ? (
            <div className="space-y-4">
              {/* 页面信息 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-lg text-gray-900">{selectedPage.title}</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="w-4 h-4" />
                      预览
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowAddBlock(true)}
                    >
                      <Plus className="w-4 h-4" />
                      添加内容块
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">{selectedPage.description || "暂无描述"}</p>
              </div>

              {/* 内容块列表 */}
              {selectedPage.blocks.map((block) => {
                const BlockIcon = BLOCK_TYPES.find((t) => t.value === block.type)?.icon || Type;
                const isEditing = editingBlock?.id === block.id;

                return (
                  <div
                    key={block.id}
                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${
                      isEditing ? "border-red-200 ring-2 ring-red-100" : "border-gray-100"
                    } ${!block.isEnabled ? "opacity-50" : ""}`}
                  >
                    {/* 块头部 */}
                    <div className="p-4 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        block.isEnabled ? "bg-gray-100" : "bg-gray-50"
                      }`}>
                        <BlockIcon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{block.title}</p>
                          <Badge variant={block.isEnabled ? "success" : "default"} size="sm">
                            {block.isEnabled ? "启用" : "隐藏"}
                          </Badge>
                          <span className="text-xs text-gray-400 font-mono">{block.key}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {BLOCK_TYPES.find((t) => t.value === block.type)?.label} · {block.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleBlock(block)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title={block.isEnabled ? "隐藏" : "显示"}
                        >
                          {block.isEnabled ? <Eye className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-300" />}
                        </button>
                        <button
                          onClick={() => isEditing ? setEditingBlock(null) : setEditingBlock(block)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="编辑"
                        >
                          <Edit3 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* 编辑区域 */}
                    {isEditing && (
                      <div className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4">
                        <Input
                          label="标题"
                          value={editingBlock.title}
                          onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                        />

                        {/* 内容编辑 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">内容</label>
                          {block.type === "text" || block.type === "html" ? (
                            <textarea
                              value={typeof editingBlock.content === "string" ? editingBlock.content : JSON.stringify(editingBlock.content, null, 2)}
                              onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                              rows={6}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all text-sm font-mono"
                            />
                          ) : (
                            <textarea
                              value={typeof editingBlock.content === "string" ? editingBlock.content : JSON.stringify(editingBlock.content, null, 2)}
                              onChange={(e) => {
                                try {
                                  setEditingBlock({ ...editingBlock, content: JSON.parse(e.target.value) });
                                } catch {
                                  setEditingBlock({ ...editingBlock, content: e.target.value });
                                }
                              }}
                              rows={8}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all text-sm font-mono"
                              placeholder="JSON 格式内容"
                            />
                          )}
                        </div>

                        {/* 配置编辑 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">配置 (JSON)</label>
                          <textarea
                            value={JSON.stringify(editingBlock.config, null, 2)}
                            onChange={(e) => {
                              try {
                                setEditingBlock({ ...editingBlock, config: JSON.parse(e.target.value) });
                              } catch {
                                // ignore parse errors while typing
                              }
                            }}
                            rows={4}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all text-sm font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="primary" size="sm" onClick={handleSaveBlock} loading={saving}>
                            <Save className="w-4 h-4" />
                            保存
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditingBlock(null)}>
                            取消
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedPage.blocks.length === 0 && (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <Layout className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无内容块，点击右上角"添加内容块"</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Layout className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>请在左侧选择一个页面进行编辑</p>
            </div>
          )}
        </div>
      </div>

      {/* 预览弹窗 */}
      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="实时预览"
        size="lg"
      >
        <div className="h-[70vh]">
          <iframe
            src={`/${selectedPage?.slug || ""}`}
            className="w-full h-full rounded-xl border border-gray-200"
            title="页面预览"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          💡 这是实际前台页面，保存并发布后修改将在此显示
        </p>
      </Modal>

      {/* 添加内容块弹窗 */}
      <Modal
        open={showAddBlock}
        onClose={() => setShowAddBlock(false)}
        title="添加内容块"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">类型</label>
            <div className="grid grid-cols-4 gap-2">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setNewBlock({ ...newBlock, type: type.value })}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    newBlock.type === type.value
                      ? "border-red-600 bg-red-50 text-red-600"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <type.icon className="w-5 h-5" />
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Input
            label="标识 (Key)"
            value={newBlock.key}
            onChange={(e) => setNewBlock({ ...newBlock, key: e.target.value })}
            placeholder="如: hero.title"
          />
          <Input
            label="标题"
            value={newBlock.title}
            onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
            placeholder="管理后台显示的名称"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">内容</label>
            <textarea
              value={newBlock.content}
              onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all text-sm"
              placeholder="内容值"
            />
          </div>
          <Button variant="primary" fullWidth onClick={handleAddBlock} loading={saving}>
            <Plus className="w-4 h-4" />
            添加内容块
          </Button>
        </div>
      </Modal>
    </div>
  );
}
