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
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

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
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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

  // Group assignments by user for multi-role display
  const getUserAssignments = () => {
    const approvedApps = applications.filter((a) => a.status === "APPROVED");
    const userMap = new Map();
    for (const app of approvedApps) {
      const key = app.userId;
      if (!userMap.has(key)) {
        userMap.set(key, {
          id: app.id,
          userId: app.userId,
          user: app.user,
          session: app.session,
          roles: [],
        });
      }
      userMap.get(key).roles.push({
        assignmentId: app.id,
        roleId: app.staffRoleId,
        roleName: app.staffRole.name,
      });
    }
    return Array.from(userMap.values());
  };

  const userAssignments = getUserAssignments();

  const handleCreateRole = async () => {
    if (!roleFormData.name || !roleFormData.requiredCount) {
      showError("岗位名称和所需人数为必填");
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
        success("岗位创建成功");
      } else {
        const data = await res.json();
        showError("创建失败", data.error);
      }
    } catch {
      showError("创建失败");
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
        success("岗位更新成功");
      } else {
        const data = await res.json();
        showError("编辑失败", data.error);
      }
    } catch {
      showError("编辑失败");
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/staff-roles?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(null);
        fetchData();
        success("岗位已删除");
      } else {
        const data = await res.json();
        showError("删除失败", data.error);
      }
    } catch {
      showError("删除失败");
    }
  };

  const handleApplicationAction = async (id: string, status: string, staffRoleId?: string) => {
    setProcessingId(id);
    try {
      const body: Record<string, any> = { id, status };
      if (staffRoleId) body.staffRoleId = staffRoleId;
      const res = await fetch("/api/admin/staff-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        success(status === "APPROVED" ? "已通过" : status === "REJECTED" ? "已拒绝" : "已重置");
        fetchData();
      } else {
        const data = await res.json();
        showError("操作失败", data.error);
      }
    } catch {
      showError("操作失败");
    } finally {
      setProcessingId(null);
    }
  };

  const openAssignModal = (item: any) => {
    setAssigningItem(item);
    // Pre-select current roles
    const currentRoles = item.roles ? item.roles.map((r: any) => r.roleId) : [item.staffRoleId];
    setSelectedRoles(currentRoles);
    setShowAssignModal(true);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleMultiAssign = async () => {
    if (!assigningItem || selectedRoles.length === 0) {
      showError("请至少选择一个岗位");
      return;
    }
    setProcessingId(assigningItem.id);
    try {
      const res = await fetch("/api/admin/staff-applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: assigningItem.id, staffRoleIds: selectedRoles }),
      });
      if (res.ok) {
        success("岗位分配成功");
        setShowAssignModal(false);
        setAssigningItem(null);
        setSelectedRoles([]);
        fetchData();
      } else {
        const data = await res.json();
        showError("分配失败", data.error);
      }
    } catch {
      showError("分配失败");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveRole = async (assignmentId: string, roleName: string) => {
    if (!confirm(`确定移除 "${roleName}" 岗位？`)) return;
    try {
      const res = await fetch(`/api/admin/staff-applications?id=${assignmentId}`, { method: "DELETE" });
      if (res.ok) {
        success("已移除岗位");
        fetchData();
      } else {
        showError("移除失败");
      }
    } catch {
      showError("移除失败");
    }
  };

  const handleRemoveAllRoles = async (userId: string, userName: string) => {
    if (!confirm(`确定取消 "${userName}" 的所有工作人员岗位？`)) return;
    const user = userAssignments.find((ua) => ua.userId === userId);
    if (!user) return;
    try {
      await Promise.all(
        user.roles.map((role: any) =>
          fetch(`/api/admin/staff-applications?id=${role.assignmentId}`, { method: "DELETE" })
        )
      );
      success(`已取消 "${userName}" 的所有工作人员岗位`);
      fetchData();
    } catch {
      showError("操作失败");
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

  const filteredApplications = applications.filter((a) =>
    !search ||
    a.user.name.includes(search) ||
    a.user.studentId.includes(search)
  );

  const filteredUserAssignments = userAssignments.filter((ua) =>
    !search ||
    ua.user.name.includes(search) ||
    ua.user.studentId.includes(search)
  );

  const stats = {
    totalRoles: staffRoles.length,
    totalAssignments: userAssignments.length,
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
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-600">{app.user.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{app.user.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{app.user.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{app.staffRole.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      app.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {SESSION_LABELS[app.session]}
                    </span>
                    <Badge variant={app.status === "APPROVED" ? "success" : app.status === "PENDING" ? "warning" : "danger"} size="sm">
                      {STATUS_LABELS[app.status]}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {app.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApplicationAction(app.id, "APPROVED")}
                          disabled={processingId === app.id}
                          className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 font-medium"
                        >
                          {processingId === app.id ? "..." : "通过"}
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, "REJECTED")}
                          disabled={processingId === app.id}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 font-medium"
                        >
                          {processingId === app.id ? "..." : "拒绝"}
                        </button>
                      </>
                    )}
                    {app.status === "APPROVED" && (
                      <button
                        onClick={() => openAssignModal(app)}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                      >
                        调整岗位
                      </button>
                    )}
                    {app.status === "REJECTED" && (
                      <button
                        onClick={() => handleApplicationAction(app.id, "PENDING")}
                        disabled={processingId === app.id}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
                      >
                        <RefreshCw className="w-3 h-3 inline mr-1" />
                        重新审核
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <div>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
            </div>
          ) : filteredUserAssignments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">暂无已分配人员</div>
          ) : (
            <div className="space-y-3">
              {filteredUserAssignments.map((ua) => (
                <div key={ua.userId} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">{ua.user.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ua.user.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{ua.user.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ua.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {SESSION_LABELS[ua.session]}
                      </span>
                      <button
                        onClick={() => openAssignModal(ua)}
                        className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                      >
                        调整岗位
                      </button>
                      <button
                        onClick={() => handleRemoveAllRoles(ua.userId, ua.user.name)}
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                        title="取消所有工作人员岗位"
                      >
                        取消工作人员
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ua.roles.map((role: any) => (
                      <div key={role.assignmentId} className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">{role.roleName}</span>
                        <button
                          onClick={() => handleRemoveRole(role.assignmentId, role.roleName)}
                          className="ml-1 p-0.5 hover:bg-gray-200 rounded transition-colors"
                          title="移除此岗位"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Role Modal */}
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

      {/* Multi-Role Assign Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssigningItem(null); setSelectedRoles([]); }}
        title="调整岗位分配"
        size="md"
      >
        {assigningItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{assigningItem.user.name}</span>
                <span className="text-gray-500 ml-2">({assigningItem.user.studentId})</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {SESSION_LABELS[assigningItem.session]} · 已分配 {assigningItem.roles?.length || 1} 个岗位
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择岗位（可多选）</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {staffRoles.map((role) => {
                  const isChecked = selectedRoles.includes(role.id);
                  return (
                    <label
                      key={role.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRole(role.id)}
                        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        <p className="text-xs text-gray-400">
                          {role._count?.assignments || 0} / {role.requiredCount} 人
                        </p>
                      </div>
                      {role.session && (
                        <Badge variant="info" size="sm">{SESSION_LABELS[role.session]}</Badge>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">已选择 {selectedRoles.length} 个岗位</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => { setShowAssignModal(false); setAssigningItem(null); setSelectedRoles([]); }} fullWidth>取消</Button>
              <Button onClick={handleMultiAssign} loading={processingId === assigningItem.id} fullWidth>
                <CheckCircle2 className="w-4 h-4" />
                确认分配
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
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
