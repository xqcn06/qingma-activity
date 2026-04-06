"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, CheckCircle2, XCircle, Clock, Download, Users, Loader2, Trash2, CheckCheck, X, FileText } from "lucide-react";
import Modal from "@/components/ui/Modal";

const POSITION_LABELS: Record<string, string> = {
  CLASS_MONITOR: "班长",
  LEAGUE_SECRETARY: "团支书",
  STUDY_COMMISSAR: "学习委员",
  LIFE_COMMISSAR: "生活委员",
  CULTURE_COMMISSAR: "文体委员",
  PROPAGANDA: "宣传委员",
  PSYCHOLOGY: "心理委员",
  ORGANIZATION: "组织委员",
  INFO: "信息委员",
  NONE: "无",
};

const SESSION_LABELS: Record<string, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterSession, setFilterSession] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "ALL") params.set("status", filterStatus);
      if (filterSession !== "ALL") params.set("session", filterSession);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/registrations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterSession, search]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "APPROVED" }),
      });
      if (res.ok) fetchRegistrations();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rejectModal, status: "REJECTED", rejectReason }),
      });
      if (res.ok) {
        setRejectModal(null);
        setRejectReason("");
        fetchRegistrations();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条报名记录吗？此操作不可恢复。")) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/registrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchRegistrations();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedIds.map((id) =>
        fetch("/api/admin/registrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "APPROVED" }),
        })
      ));
      setSelectedIds([]);
      fetchRegistrations();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) return;
    setRejectModal("BATCH");
  };

  const handleBatchRejectConfirm = async () => {
    setActionLoading(true);
    try {
      await Promise.all(selectedIds.map((id) =>
        fetch("/api/admin/registrations", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: "REJECTED", rejectReason }),
        })
      ));
      setRejectModal(null);
      setRejectReason("");
      setSelectedIds([]);
      fetchRegistrations();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const ids = selectedIds.length > 0 ? selectedIds : registrations.map((r) => r.id);
      const res = await fetch("/api/admin/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `报名数据_${new Date().toLocaleDateString()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    } finally {
      setExportLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === registrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrations.map((r) => r.id));
    }
  };

  const stats = {
    total: registrations.length,
    pending: registrations.filter((r) => r.status === "PENDING").length,
    approved: registrations.filter((r) => r.status === "APPROVED").length,
    rejected: registrations.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报名管理</h1>
          <p className="text-gray-500 mt-1">管理所有活动报名信息，支持审核、批量操作、导出</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {exportLoading ? "导出中..." : `导出${selectedIds.length > 0 ? `(${selectedIds.length}条)` : "全部"}`}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "总报名", value: stats.total, icon: Users, color: "bg-blue-500" },
          { label: "待审核", value: stats.pending, icon: Clock, color: "bg-yellow-500" },
          { label: "已通过", value: stats.approved, icon: CheckCircle2, color: "bg-green-500" },
          { label: "已拒绝", value: stats.rejected, icon: XCircle, color: "bg-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-700">已选择 <strong>{selectedIds.length}</strong> 项</span>
          <div className="flex gap-2">
            <button onClick={handleBatchApprove} disabled={actionLoading} className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">批量通过</button>
            <button onClick={handleBatchReject} disabled={actionLoading} className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">批量拒绝</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、学号、班级..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchRegistrations()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/20 outline-none"
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white">
            <option value="ALL">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已拒绝</option>
          </select>
          <select value={filterSession} onChange={(e) => setFilterSession(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white">
            <option value="ALL">全部场次</option>
            <option value="FIRST">第一场</option>
            <option value="SECOND">第二场</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无报名数据</div>
        ) : (
          <>
            {/* 桌面端表格 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={selectedIds.length === registrations.length && registrations.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班级</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">职务</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">场次</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(reg.id)} onChange={() => toggleSelect(reg.id)} className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{reg.user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{reg.user.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{reg.user.className}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {POSITION_LABELS[reg.primaryPosition] || reg.primaryPosition}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          reg.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {SESSION_LABELS[reg.session]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          reg.status === "APPROVED" ? "bg-green-100 text-green-700" :
                          reg.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {reg.status === "APPROVED" ? "已通过" : reg.status === "PENDING" ? "待审核" : "已拒绝"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          {reg.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(reg.id)}
                                disabled={actionLoading}
                                className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => { setRejectModal(reg.id); setRejectReason(""); }}
                                disabled={actionLoading}
                                className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                              >
                                拒绝
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(reg.id)}
                            disabled={actionLoading}
                            className="text-gray-400 hover:text-red-600 text-xs disabled:opacity-50"
                            title="删除报名"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
              {registrations.map((reg) => (
                <div key={reg.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedIds.includes(reg.id)} onChange={() => toggleSelect(reg.id)} className="mt-1 rounded border-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{reg.user.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          reg.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {SESSION_LABELS[reg.session]}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          reg.status === "APPROVED" ? "bg-green-100 text-green-700" :
                          reg.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {reg.status === "APPROVED" ? "已通过" : reg.status === "PENDING" ? "待审核" : "已拒绝"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <p><span className="text-gray-400">学号：</span>{reg.user.studentId}</p>
                        <p><span className="text-gray-400">班级：</span>{reg.user.className}</p>
                        <p><span className="text-gray-400">职务：</span>{POSITION_LABELS[reg.primaryPosition] || reg.primaryPosition}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {reg.status === "PENDING" && (
                          <>
                            <button onClick={() => handleApprove(reg.id)} disabled={actionLoading} className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50">通过</button>
                            <button onClick={() => { setRejectModal(reg.id); setRejectReason(""); }} disabled={actionLoading} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50">拒绝</button>
                          </>
                        )}
                        <button onClick={() => handleDelete(reg.id)} disabled={actionLoading} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50">删除</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={!!rejectModal} onClose={() => { setRejectModal(null); setRejectReason(""); }} title="拒绝报名" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">拒绝原因</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因（选填）"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/20 outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">取消</button>
            <button onClick={rejectModal === "BATCH" ? handleBatchRejectConfirm : handleReject} disabled={actionLoading} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50">确认拒绝</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
