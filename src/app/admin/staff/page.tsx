"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Loader2,
  Briefcase,
  ClipboardList,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Filter,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

const PRESET_ROLES = [
  { name: "主裁判", description: "负责比赛整体裁判工作", requiredCount: 2 },
  { name: "积分裁判", description: "负责各站点积分记录", requiredCount: 5 },
  { name: "辅助裁判", description: "协助主裁判工作", requiredCount: 4 },
  { name: "道具裁判", description: "负责道具管理和发放", requiredCount: 3 },
  { name: "总控负责人", description: "负责活动总控调度", requiredCount: 1 },
  { name: "计时登记员", description: "负责计时和成绩登记", requiredCount: 3 },
  { name: "现场巡查员", description: "负责现场秩序巡查", requiredCount: 4 },
];

const SESSION_LABELS: Record<string, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
  ALL: "全部场次",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
};

const SESSION_OPTIONS = [
  { value: "ALL", label: "全部场次" },
  { value: "FIRST", label: "第一场" },
  { value: "SECOND", label: "第二场" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "全部状态" },
  { value: "PENDING", label: "待审核" },
  { value: "APPROVED", label: "已通过" },
  { value: "REJECTED", label: "已拒绝" },
];

export default function AdminStaff() {
  const [activeTab, setActiveTab] = useState("roles");
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleFormData, setRoleFormData] = useState({ name: "", description: "", requiredCount: "", session: "" });

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningItem, setAssigningItem] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, appsRes] = await Promise.all([
        fetch("/api/admin/staff-roles"),
        fetch(`/api/admin/staff-applications?status=${statusFilter}&session=${sessionFilter}`),
      ]);
      if (rolesRes.ok) setStaffRoles(await rolesRes.json());
      if (appsRes.ok) {
        const data = await appsRes.json();
        setApplications(data);
        setAssignments(data.filter((a: any) => a.status === "APPROVED"));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [sessionFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRole = async () => {
    if (!roleFormData.name || !roleFormData.requiredCount) {
      alert("岗位名称和所需人数为必填");
      return;
    }
    try {
      const res = await fetch("/api/admin/staff-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...roleFormData,
          requiredCount: parseInt(roleFormData.requiredCount),
          session: roleFormData.session || null,
        }),
      });
      if (res.ok) {
        setShowRoleModal(false);
        setRoleFormData({ name: "", description: "", requiredCount: "", session: "" });
        setEditingRole(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "创建失败");
      }
    } catch {
      alert("创建失败");
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || !roleFormData.name || !roleFormData.requiredCount) return;
    try {
      const res = await fetch("/api/admin/staff-roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRole.id,
          ...roleFormData,
          requiredCount: parseInt(roleFormData.requiredCount),
          session: roleFormData.session || null,
        }),
      });
      if (res.ok) {
        setShowRoleModal(false);
        setRoleFormData({ name: "", description: "", requiredCount: "", session: "" });
        setEditingRole(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "编辑失败");
      }
    } catch {
      alert("编辑失败");
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/staff-roles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch {
      alert("删除失败");
    }
  };

  const handleApplicationAction = async (id: string, status: string, staffRoleId?: string) => {
    setProcessingId(id);
    try {
      const body: Record<string, string> = { id, status };
      if (staffRoleId) body.staffRoleId = staffRoleId;
      const res = await fetch("/api/admin/staff-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) fetchData();
    } catch {
      // ignore
    } finally {
      setProcessingId(null);
    }
  };

  const openEditRole = (role: any) => {
    setEditingRole(role);
    setRoleFormData({
      name: role.name,
      description: role.description || "",
      requiredCount: role.requiredCount.toString(),
      session: role.session || "",
    });
    setShowRoleModal(true);
  };

  const openAssignModal = (item: any) => {
    setAssigningItem(item);
    setShowAssignModal(true);
  };

  const handleReassign = async (staffRoleId: string) => {
    if (!assigningItem) return;
    setProcessingId(assigningItem.id);
    try {
      const res = await fetch("/api/admin/staff-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assigningItem.id, staffRoleId }),
      });
      if (res.ok) {
        setShowAssignModal(false);
        setAssigningItem(null);
        fetchData();
      }
    } catch {
      // ignore
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = applications.filter((a) =>
    !search ||
    a.user.name.includes(search) ||
    a.user.studentId.includes(search)
  );

  const filteredAssignments = assignments.filter((a) =>
    !search ||
    a.user.name.includes(search) ||
    a.user.studentId.includes(search)
  );

  const stats = {
    totalRoles: staffRoles.length,
    totalAssignments: staffRoles.reduce((sum, r) => sum + (r._count?.assignments || 0), 0),
    pendingApps: applications.filter((a) => a.status === "PENDING").length,
    approvedApps: applications.filter((a) => a.status === "APPROVED").length,
  };

  const tabs = [
    { id: "roles", label: "岗位管理", icon: Briefcase },
    { id: "applications", label: "申请审核", icon: ClipboardList },
    { id: "assignments", label: "人员分配", icon: UserCheck },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">工作人员管理</h1>
        <p className="text-gray-500 mt-1">管理工作人员岗位、申请审核和人员分配</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "岗位总数", value: stats.totalRoles, icon: Briefcase, color: "bg-blue-500" },
          { label: "已分配人数", value: stats.totalAssignments, icon: UserCheck, color: "bg-green-500" },
          { label: "待审核申请", value: stats.pendingApps, icon: Clock, color: "bg-yellow-500" },
          { label: "已通过", value: stats.approvedApps, icon: CheckCircle2, color: "bg-emerald-500" },
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

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索姓名、学号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/20 outline-none"
          />
        </div>
        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
        >
          {SESSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {activeTab === "applications" && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
      </div>

      {activeTab === "roles" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">岗位列表</h2>
            <Button onClick={() => {
              setEditingRole(null);
              setRoleFormData({ name: "", description: "", requiredCount: "", session: "" });
              setShowRoleModal(true);
            }}>
              <Plus className="w-4 h-4" />
              新增岗位
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : staffRoles.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
              暂无岗位数据，点击上方按钮添加预设岗位
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffRoles.map((role) => {
                const count = role._count?.assignments || 0;
                const pct = Math.min((count / role.requiredCount) * 100, 100);
                const isFull = count >= role.requiredCount;
                return (
                  <div key={role.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{role.name}</h3>
                        {role.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditRole(role)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(role.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isFull ? "bg-green-500" : "bg-red-600"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">{count} / {role.requiredCount} 人</p>
                      <div className="flex items-center gap-2">
                        {role.session && (
                          <Badge variant="info">{SESSION_LABELS[role.session]}</Badge>
                        )}
                        {isFull ? (
                          <Badge variant="success">已满</Badge>
                        ) : (
                          <Badge variant="warning">招募中</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "applications" && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">暂无申请数据</div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">申请岗位</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">场次</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{app.user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{app.user.studentId}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{app.staffRole.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            app.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {SESSION_LABELS[app.session]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            app.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {app.status === "APPROVED" ? <CheckCircle2 className="w-3 h-3" /> :
                             app.status === "PENDING" ? <Clock className="w-3 h-3" /> :
                             <XCircle className="w-3 h-3" />}
                            {STATUS_LABELS[app.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {app.status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApplicationAction(app.id, "APPROVED")}
                                disabled={processingId === app.id}
                                className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                              >
                                {processingId === app.id ? "..." : "通过"}
                              </button>
                              <button
                                onClick={() => handleApplicationAction(app.id, "REJECTED")}
                                disabled={processingId === app.id}
                                className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50"
                              >
                                {processingId === app.id ? "..." : "拒绝"}
                              </button>
                            </div>
                          )}
                          {app.status === "APPROVED" && (
                            <button
                              onClick={() => openAssignModal(app)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              重新分配
                            </button>
                          )}
                          {app.status === "REJECTED" && (
                            <button
                              onClick={() => handleApplicationAction(app.id, "PENDING")}
                              disabled={processingId === app.id}
                              className="text-gray-500 hover:text-gray-700 text-xs font-medium disabled:opacity-50"
                            >
                              <RefreshCw className="w-3 h-3 inline mr-1" />
                              重新审核
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 手机端卡片列表 */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredApplications.map((app) => (
                  <div key={app.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{app.user.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            app.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {SESSION_LABELS[app.session]}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            app.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            app.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {STATUS_LABELS[app.status]}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                          <p><span className="text-gray-400">学号：</span>{app.user.studentId}</p>
                          <p><span className="text-gray-400">申请岗位：</span>{app.staffRole.name}</p>
                        </div>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {app.status === "PENDING" && (
                            <>
                              <button onClick={() => handleApplicationAction(app.id, "APPROVED")} disabled={processingId === app.id} className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50">{processingId === app.id ? "..." : "通过"}</button>
                              <button onClick={() => handleApplicationAction(app.id, "REJECTED")} disabled={processingId === app.id} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50">{processingId === app.id ? "..." : "拒绝"}</button>
                            </>
                          )}
                          {app.status === "APPROVED" && (
                            <button onClick={() => openAssignModal(app)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">重新分配</button>
                          )}
                          {app.status === "REJECTED" && (
                            <button onClick={() => handleApplicationAction(app.id, "PENDING")} disabled={processingId === app.id} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50"><RefreshCw className="w-3 h-3 inline mr-1" />重新审核</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">暂无已分配人员</div>
          ) : (
            <>
              {/* 桌面端表格 */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">岗位</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">场次</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAssignments.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{item.user.studentId}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.staffRole.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {SESSION_LABELS[item.session]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openAssignModal(item)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            调整岗位
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 手机端卡片列表 */}
              <div className="lg:hidden divide-y divide-gray-100">
                {filteredAssignments.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-gray-900">{item.user.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {SESSION_LABELS[item.session]}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                          <p><span className="text-gray-400">学号：</span>{item.user.studentId}</p>
                          <p><span className="text-gray-400">岗位：</span>{item.staffRole.name}</p>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => openAssignModal(item)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">调整岗位</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Modal
        open={showRoleModal}
        onClose={() => { setShowRoleModal(false); setEditingRole(null); }}
        title={editingRole ? "编辑岗位" : "新增岗位"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="岗位名称"
            value={roleFormData.name}
            onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
            placeholder="如：主裁判"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={roleFormData.description}
              onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              placeholder="岗位职责描述"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none resize-none"
            />
          </div>
          <Input
            label="所需人数"
            type="number"
            value={roleFormData.requiredCount}
            onChange={(e) => setRoleFormData({ ...roleFormData, requiredCount: e.target.value })}
            placeholder="如：4"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">适用场次</label>
            <select
              value={roleFormData.session}
              onChange={(e) => setRoleFormData({ ...roleFormData, session: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
            >
              <option value="">两场通用</option>
              <option value="FIRST">第一场</option>
              <option value="SECOND">第二场</option>
            </select>
          </div>
          {!editingRole && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">快速添加预设岗位：</p>
              <div className="flex flex-wrap gap-1">
                {PRESET_ROLES.filter((p) => !staffRoles.some((r) => r.name === p.name)).map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setRoleFormData({
                      name: preset.name,
                      description: preset.description,
                      requiredCount: preset.requiredCount.toString(),
                      session: "",
                    })}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full hover:border-red-600 hover:text-red-600 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowRoleModal(false); setEditingRole(null); }} fullWidth>取消</Button>
            <Button onClick={editingRole ? handleEditRole : handleCreateRole} fullWidth>
              {editingRole ? "保存修改" : "确认添加"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssigningItem(null); }}
        title="调整岗位分配"
        size="sm"
      >
        {assigningItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{assigningItem.user.name}</span>
                <span className="text-gray-500 ml-2">({assigningItem.user.studentId})</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                当前岗位：{assigningItem.staffRole.name} · {SESSION_LABELS[assigningItem.session]}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择新岗位</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
                onChange={(e) => handleReassign(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>请选择岗位</option>
                {staffRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name} ({role._count?.assignments || 0}/{role.requiredCount})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="确认删除"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">删除后不可恢复，且该岗位不能有已分配人员。</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} fullWidth>取消</Button>
            <Button variant="danger" onClick={() => showDeleteConfirm && handleDeleteRole(showDeleteConfirm)} fullWidth>确认删除</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
