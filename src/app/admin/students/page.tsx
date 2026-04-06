"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, UserPlus, Download, Users, Loader2, MoreVertical, Ban, CheckCircle2, KeyRound, Trash2, Filter } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "老师",
  ADMIN: "管理员",
  STAFF: "工作人员",
  STUDENT: "学生",
};

const ROLE_COLORS: Record<string, string> = {
  TEACHER: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  STAFF: "bg-orange-100 text-orange-700",
  STUDENT: "bg-green-100 text-green-700",
};

const GRADE_OPTIONS = [
  { value: "ALL", label: "全部年级" },
  { value: "2024", label: "2024级" },
  { value: "2025", label: "2025级" },
];

const ROLE_OPTIONS = [
  { value: "ALL", label: "全部角色" },
  { value: "TEACHER", label: "老师" },
  { value: "ADMIN", label: "管理员" },
  { value: "STAFF", label: "工作人员" },
  { value: "STUDENT", label: "学生" },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "全部状态" },
  { value: "ACTIVE", label: "正常" },
  { value: "DISABLED", label: "已禁用" },
];

export default function AdminStudents() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [filterGrade, setFilterGrade] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterClassName, setFilterClassName] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uniqueClasses, setUniqueClasses] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    grade: "",
    className: "",
    role: "STUDENT",
    phone: "",
    email: "",
    password: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterRole !== "ALL") params.set("role", filterRole);
      if (filterGrade !== "ALL") params.set("grade", filterGrade);
      if (filterClassName !== "ALL") params.set("className", filterClassName);
      if (filterStatus !== "ALL") params.set("status", filterStatus);

      const res = await fetch(`/api/admin/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        const classes = [...new Set(data.map((u: any) => u.className).filter(Boolean))] as string[];
        setUniqueClasses(classes);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterGrade, filterClassName, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!formData.name || !formData.studentId || !formData.phone) {
      alert("姓名、学号、手机号为必填");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", studentId: "", grade: "", className: "", role: "STUDENT", phone: "", email: "", password: "" });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "添加失败");
      }
    } catch {
      alert("添加失败");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingUser.id, ...formData }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "编辑失败");
      }
    } catch {
      alert("编辑失败");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      studentId: user.studentId,
      grade: user.grade?.toString() || "",
      className: user.className || "",
      role: user.role,
      phone: user.phone,
      email: user.email || "",
      password: "",
    });
    setShowEditModal(true);
  };

  const handleDisable = async (id: string) => {
    setActionLoading(true);
    try {
      await fetch("/api/admin/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
      setShowActionMenu(null);
    }
  };

  const handleEnable = async (id: string) => {
    setActionLoading(true);
    try {
      await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isDisabled: false }),
      });
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
      setShowActionMenu(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    setActionLoading(true);
    try {
      await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
      setShowActionMenu(null);
    }
  };

  const handleBatchAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await fetch("/api/admin/students/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, action }),
      });
      setSelectedIds([]);
      fetchUsers();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/students/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: users.map((u) => u.id) }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `学生数据_${new Date().toLocaleDateString()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.isDisabled).length,
    disabled: users.filter((u) => u.isDisabled).length,
    students: users.filter((u) => u.role === "STUDENT").length,
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 mt-1">管理所有学生账号，支持增删改查、批量操作</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="w-4 h-4" />
            导出
          </Button>
          <Button onClick={() => {
            setFormData({ name: "", studentId: "", grade: "", className: "", role: "STUDENT", phone: "", email: "", password: "" });
            setShowAddModal(true);
          }}>
            <UserPlus className="w-4 h-4" />
            新增学生
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "总人数", value: stats.total, icon: Users, color: "bg-blue-500" },
          { label: "正常", value: stats.active, icon: CheckCircle2, color: "bg-green-500" },
          { label: "已禁用", value: stats.disabled, icon: Ban, color: "bg-gray-500" },
          { label: "学生", value: stats.students, icon: Users, color: "bg-emerald-500" },
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
            <button onClick={() => handleBatchAction("enable")} className="text-xs px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">批量启用</button>
            <button onClick={() => handleBatchAction("disable")} className="text-xs px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700">批量禁用</button>
            <button onClick={() => handleBatchAction("reset-password")} className="text-xs px-3 py-1 bg-orange-600 text-white rounded-lg hover:bg-orange-700">批量重置密码</button>
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
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/20 outline-none"
            />
          </div>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white">
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white">
            {GRADE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filterClassName} onChange={(e) => setFilterClassName(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white">
            <option value="ALL">全部班级</option>
            {uniqueClasses.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无学生数据</div>
        ) : (
          <>
            {/* 桌面端表格 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleSelectAll} className="rounded border-gray-300" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">年级</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班级</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">手机号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${user.isDisabled ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-gray-300" />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{user.studentId}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.grade ? `${user.grade}级` : "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.className || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.phone}</td>
                      <td className="px-4 py-3">
                        {user.isDisabled ? (
                          <Badge variant="default">已禁用</Badge>
                        ) : (
                          <Badge variant="success">正常</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 relative">
                        <button onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)} className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {showActionMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                            <button onClick={() => { openEditModal(user); setShowActionMenu(null); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                              <span className="text-blue-600">编辑</span>
                            </button>
                            <button onClick={() => { handleResetPassword(user.id); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                              <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                              <span className="text-orange-600">重置密码</span>
                            </button>
                            {user.isDisabled ? (
                              <button onClick={() => handleEnable(user.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-green-600">启用</span>
                              </button>
                            ) : (
                              <button onClick={() => handleDisable(user.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2">
                                <Ban className="w-3.5 h-3.5 text-gray-600" />
                                <span className="text-gray-600">禁用</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 手机端卡片列表 */}
            <div className="lg:hidden divide-y divide-gray-100">
              {users.map((user) => (
                <div key={user.id} className={`p-4 ${user.isDisabled ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="mt-1 rounded border-gray-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-700"}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                        {user.isDisabled ? (
                          <Badge variant="default">已禁用</Badge>
                        ) : (
                          <Badge variant="success">正常</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <p><span className="text-gray-400">学号：</span>{user.studentId}</p>
                        <p><span className="text-gray-400">班级：</span>{user.className || "-"}</p>
                        <p><span className="text-gray-400">年级：</span>{user.grade ? `${user.grade}级` : "-"}</p>
                        <p><span className="text-gray-400">手机：</span>{user.phone}</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEditModal(user)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                        <button onClick={() => handleResetPassword(user.id)} className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100">重置密码</button>
                        {user.isDisabled ? (
                          <button onClick={() => handleEnable(user.id)} className="text-xs px-2.5 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">启用</button>
                        ) : (
                          <button onClick={() => handleDisable(user.id)} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">禁用</button>
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

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新增学生" size="md">
        <div className="space-y-4">
          <Input label="姓名" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="请输入姓名" />
          <Input label="学号/工号" value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} placeholder="请输入学号" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
              <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none">
                <option value="">请选择</option>
                <option value="2024">2024级</option>
                <option value="2025">2025级</option>
              </select>
            </div>
            <Input label="班级" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} placeholder="如：机2401" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none">
                <option value="STUDENT">学生</option>
                <option value="STAFF">工作人员</option>
                <option value="ADMIN">管理员</option>
                <option value="TEACHER">老师</option>
              </select>
            </div>
            <Input label="手机号" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="请输入手机号" />
          </div>
          <Input label="邮箱（选填）" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="请输入邮箱" />
          <Input label="密码（默认123456）" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="留空则使用默认密码" />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} fullWidth>取消</Button>
            <Button onClick={handleAddUser} loading={actionLoading} fullWidth>确认添加</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingUser(null); }} title="编辑学生" size="md">
        <div className="space-y-4">
          <Input label="姓名" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="学号/工号" value={formData.studentId} disabled />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
              <select value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none">
                <option value="">请选择</option>
                <option value="2024">2024级</option>
                <option value="2025">2025级</option>
              </select>
            </div>
            <Input label="班级" value={formData.className} onChange={(e) => setFormData({ ...formData, className: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none">
                <option value="STUDENT">学生</option>
                <option value="STAFF">工作人员</option>
                <option value="ADMIN">管理员</option>
                <option value="TEACHER">老师</option>
              </select>
            </div>
            <Input label="手机号" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <Input label="邮箱（选填）" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <Input label="重置密码（留空不修改）" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="输入新密码" />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingUser(null); }} fullWidth>取消</Button>
            <Button onClick={handleEditUser} loading={actionLoading} fullWidth>保存修改</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
