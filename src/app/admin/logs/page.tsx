"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Clock,
  Search,
  Filter,
  Plus,
  Loader2,
  Calendar,
  BarChart3,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

interface LogEntry {
  id: string;
  session: string;
  phase: string;
  action: string;
  operator: string;
  timestamp: string;
}

interface LogStats {
  total: number;
  bySession: Record<string, number>;
  byPhase: Record<string, number>;
}

const SESSION_LABELS: Record<string, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

const PHASES = ["全部阶段", "赛前准备", "开幕", "轮转积分赛", "中场休息", "寻宝赛", "闭幕", "赛后"];

const SESSION_LABELS_SHORT: Record<string, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats>({ total: 0, bySession: {}, byPhase: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSession, setFilterSession] = useState("ALL");
  const [filterPhase, setFilterPhase] = useState("全部阶段");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newLog, setNewLog] = useState({
    session: "FIRST",
    phase: "赛前准备",
    action: "",
    operator: "",
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSession !== "ALL") params.set("session", filterSession);
    if (filterPhase !== "全部阶段") params.set("phase", filterPhase);
    if (dateFrom) params.set("startDate", dateFrom);
    if (dateTo) params.set("endDate", dateTo);
    if (search) params.set("search", search);
    params.set("page", page.toString());
    params.set("pageSize", "20");

    try {
      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      }
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [filterSession, filterPhase, dateFrom, dateTo, search, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCreateLog = async () => {
    if (!newLog.action) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLog),
      });
      if (res.ok) {
        setCreateModalOpen(false);
        setNewLog({ session: "FIRST", phase: "赛前准备", action: "", operator: "" });
        fetchLogs();
      }
    } catch {
      // Error handled silently
    } finally {
      setCreating(false);
    }
  };

  const resetFilters = () => {
    setFilterSession("ALL");
    setFilterPhase("全部阶段");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPhaseBadgeVariant = (phase: string): "default" | "info" | "success" | "warning" | "danger" => {
    const variants: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
      "赛前准备": "info",
      "开幕": "success",
      "轮转积分赛": "warning",
      "中场休息": "default",
      "寻宝赛": "danger",
      "闭幕": "info",
      "赛后": "default",
    };
    return variants[phase] || "default";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">活动日志</h1>
        <p className="text-gray-500 mt-1">记录活动各环节时间节点和操作</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">总日志数</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.bySession.FIRST || 0}</p>
              <p className="text-xs text-gray-500">第一场</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.bySession.SECOND || 0}</p>
              <p className="text-xs text-gray-500">第二场</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{Object.keys(stats.byPhase).length}</p>
              <p className="text-xs text-gray-500">涉及阶段</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索操作内容或操作人..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
          <select
            value={filterSession}
            onChange={(e) => { setFilterSession(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
          >
            <option value="ALL">全部场次</option>
            <option value="FIRST">第一场</option>
            <option value="SECOND">第二场</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" /> 更多筛选
          </button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4" /> 手动记录
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">阶段</label>
              <select
                value={filterPhase}
                onChange={(e) => { setFilterPhase(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                {PHASES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <Button variant="ghost" onClick={resetFilters}>重置筛选</Button>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无日志记录</p>
          </div>
        ) : (
          <div className="relative">
            {logs.map((log, index) => (
              <div key={log.id} className="flex gap-4 pb-6 last:pb-0 relative">
                {/* Timeline line */}
                {index < logs.length - 1 && (
                  <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-gray-200" />
                )}
                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-red-100 border-2 border-red-600 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={getPhaseBadgeVariant(log.phase)}>{log.phase}</Badge>
                    <Badge variant="info">{SESSION_LABELS_SHORT[log.session] || log.session}</Badge>
                  </div>
                  <p className="text-sm text-gray-700">{log.action}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{log.operator}</span>
                    <span className="text-xs text-gray-400 font-mono">{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">第 {page} / {totalPages} 页</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create log modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="手动记录日志">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">场次</label>
              <select
                value={newLog.session}
                onChange={(e) => setNewLog((prev) => ({ ...prev, session: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                <option value="FIRST">第一场</option>
                <option value="SECOND">第二场</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">阶段</label>
              <select
                value={newLog.phase}
                onChange={(e) => setNewLog((prev) => ({ ...prev, phase: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                {PHASES.filter((p) => p !== "全部阶段").map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作内容</label>
            <textarea
              value={newLog.action}
              onChange={(e) => setNewLog((prev) => ({ ...prev, action: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none resize-none"
              placeholder="描述本次操作..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作人（可选）</label>
            <input
              type="text"
              value={newLog.operator}
              onChange={(e) => setNewLog((prev) => ({ ...prev, operator: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              placeholder="默认为当前登录用户"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateLog} loading={creating} disabled={!newLog.action}>
              <FileText className="w-4 h-4" /> 记录
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
