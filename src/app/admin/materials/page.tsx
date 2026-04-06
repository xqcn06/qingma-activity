"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Loader2, Edit2, Trash2, Package, Download, Filter } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

const STATION_LABELS: Record<string, string> = {
  LISTEN_COMMAND: "听我口令",
  DODGEBALL: "躲避球",
  CODE_BREAK: "密码破译",
  NO_TOUCH_GROUND: "别碰地面",
  TREASURE_HUNT: "寻宝赛",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待采购",
  PURCHASED: "已采购",
  ALLOCATED: "已分配",
  USED: "已使用",
};

const STATUS_BADGE_VARIANT: Record<string, "warning" | "info" | "success" | "default"> = {
  PENDING: "warning",
  PURCHASED: "info",
  ALLOCATED: "success",
  USED: "default",
};

const CATEGORIES = ["游戏专属", "全场通用", "可借用", "可选"];

const EMPTY_FORM = {
  name: "",
  category: "",
  gameStation: "",
  quantity: "",
  unit: "",
  unitPrice: "",
  allocatedTo: "",
  session: "",
  status: "PENDING",
  description: "",
};

export default function AdminMaterials() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStation, setFilterStation] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/admin/materials");
      if (res.ok) setMaterials(await res.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (filterStation && m.gameStation !== filterStation) return false;
      if (filterCategory && m.category !== filterCategory) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (search && !m.name.includes(search)) return false;
      return true;
    });
  }, [materials, filterStation, filterCategory, filterStatus, search]);

  const stats = useMemo(() => {
    const totalItems = materials.length;
    const byStatus: Record<string, number> = {};
    materials.forEach((m) => {
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
    });
    const totalBudget = materials.reduce((sum, m) => sum + (m.totalPrice || 0), 0);
    return { totalItems, byStatus, totalBudget };
  }, [materials]);

  const handleAdd = async () => {
    if (!formData.name || !formData.quantity) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
          gameStation: formData.gameStation || null,
          category: formData.category || null,
          session: formData.session || null,
        }),
      });
      if (res.ok) {
        setAddModal(false);
        setFormData(EMPTY_FORM);
        fetchMaterials();
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editId || !formData.name || !formData.quantity) return;
    setFormLoading(true);
    try {
      const res = await fetch("/api/admin/materials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          ...formData,
          quantity: parseInt(formData.quantity),
          unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
          gameStation: formData.gameStation || null,
          category: formData.category || null,
          session: formData.session || null,
        }),
      });
      if (res.ok) {
        setEditModal(false);
        setFormData(EMPTY_FORM);
        setEditId("");
        fetchMaterials();
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个物资吗？")) return;
    const res = await fetch(`/api/admin/materials?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchMaterials();
  };

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setAddModal(true);
  };

  const openEdit = (m: any) => {
    setEditId(m.id);
    setFormData({
      name: m.name,
      category: m.category || "",
      gameStation: m.gameStation || "",
      quantity: String(m.quantity),
      unit: m.unit || "",
      unitPrice: m.unitPrice ? String(m.unitPrice) : "",
      allocatedTo: m.allocatedTo || "",
      session: m.session || "",
      status: m.status,
      description: m.description || "",
    });
    setEditModal(true);
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const body: any = {};
      if (filterStation) body.gameStation = filterStation;
      if (filterCategory) body.category = filterCategory;
      if (filterStatus) body.status = filterStatus;

      const res = await fetch("/api/admin/materials/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `物资清单_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantity" || field === "unitPrice") {
        const qty = field === "quantity" ? parseInt(value) : parseInt(prev.quantity);
        const price = field === "unitPrice" ? parseFloat(value) : prev.unitPrice ? parseFloat(prev.unitPrice) : null;
        if (qty && price) {
          next.unitPrice = String(price);
        }
      }
      return next;
    });
  };

  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">物资名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          placeholder="如：哨子、矿泉水"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select
            value={formData.category}
            onChange={(e) => updateField("category", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          >
            <option value="">选择分类</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">游戏站</label>
          <select
            value={formData.gameStation}
            onChange={(e) => updateField("gameStation", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          >
            <option value="">选择游戏站</option>
            {Object.entries(STATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">数量 *</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => updateField("quantity", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">单位</label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => updateField("unit", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            placeholder="个/卷/张"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">单价 (¥)</label>
          <input
            type="number"
            step="0.01"
            value={formData.unitPrice}
            onChange={(e) => updateField("unitPrice", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      {formData.quantity && formData.unitPrice && (
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <span className="text-sm text-blue-700">
            总价: ¥{(parseInt(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分配给</label>
          <input
            type="text"
            value={formData.allocatedTo}
            onChange={(e) => updateField("allocatedTo", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            placeholder="如：第一组、裁判A"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select
            value={formData.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          >
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none resize-none"
          rows={2}
          placeholder="补充说明..."
        />
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">物资管理</h1>
          <p className="text-gray-500 mt-1">管理活动所需物资清单</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm disabled:opacity-50"
          >
            {exportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            导出Excel
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> 添加物资
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
            <p className="text-xs text-gray-500">物资总数</p>
          </div>
        </div>
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.byStatus[key] || 0}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索物资名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          >
            <option value="">全部游戏站</option>
            {Object.entries(STATION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          >
            <option value="">全部分类</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm text-center py-12 text-gray-400">暂无物资数据</div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* 桌面端表格 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">物资名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">游戏站</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">单价</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总价</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分配给</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.category || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{STATION_LABELS[m.gameStation] || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.quantity}{m.unit || ""}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.unitPrice ? `¥${m.unitPrice.toFixed(2)}` : "-"}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{m.totalPrice ? `¥${m.totalPrice.toFixed(2)}` : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.allocatedTo || "-"}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE_VARIANT[m.status] || "default"}>
                          {STATUS_LABELS[m.status] || m.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(m)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(m.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 手机端卡片列表 */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filtered.map((m) => (
                <div key={m.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                        <Badge variant={STATUS_BADGE_VARIANT[m.status] || "default"}>
                          {STATUS_LABELS[m.status] || m.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <p><span className="text-gray-400">分类：</span>{m.category || "-"}</p>
                        <p><span className="text-gray-400">游戏站：</span>{STATION_LABELS[m.gameStation] || "-"}</p>
                        <p><span className="text-gray-400">数量：</span>{m.quantity}{m.unit || ""}</p>
                        <p><span className="text-gray-400">单价：</span>{m.unitPrice ? `¥${m.unitPrice.toFixed(2)}` : "-"}</p>
                        <p><span className="text-gray-400">总价：</span><span className="font-medium text-gray-700">{m.totalPrice ? `¥${m.totalPrice.toFixed(2)}` : "-"}</span></p>
                        <p><span className="text-gray-400">分配给：</span>{m.allocatedTo || "-"}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEdit(m)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                        <button onClick={() => handleDelete(m.id)} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="添加物资" size="lg">
        {formFields}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setAddModal(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            disabled={formLoading || !formData.name || !formData.quantity}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "添加"}
          </button>
        </div>
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="编辑物资" size="lg">
        {formFields}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setEditModal(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleEdit}
            disabled={formLoading || !formData.name || !formData.quantity}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
