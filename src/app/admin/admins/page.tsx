"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  UserPlus,
  Users,
  Loader2,
  MoreVertical,
  Ban,
  KeyRound,
  Shield,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

const ROLE_LABELS: Record<string, string> = {
  TEACHER: "老师",
  ADMIN: "管理员",
};

const ROLE_OPTIONS = [
  { value: "ALL", label: "全部角色" },
  { value: "ADMIN", label: "管理员" },
  { value: "TEACHER", label: "老师" },
];

export default function AdminAdmins() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [targetAdmin, setTargetAdmin] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    grade: "",
    className: "",
    role: "ADMIN",
    phone: "",
    email: "",
  });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterRole !== "ALL") params.set("role", filterRole);

      const res = await fetch(`/api/admin/admins?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      } else if (res.status === 403) {
        router.push("/admin");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAdmins();
    }
  }, [fetchAdmins, status]);

  const handleAdd = async () => {
    if (!formData.name || !formData.studentId || !formData.phone) {
      showError("姓名、学号、手机号为必填");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", studentId: "", grade: "", className: "", role: "ADMIN", phone: "", email: "" });
        success("管理员添加成功");
        fetchAdmins();
      } else {
        const data = await res.json();
        showError(data.error || "添加失败");
      }
    } catch {
      showError("添加失败");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      studentId: admin.studentId,
      grade: admin.grade?.toString() || "",
      className: admin.className || "",
      role: admin.role,
      phone: admin.phone,
      email: admin.email || "",
    });
    setShowEditModal(true);
    setShowActionMenu(null);
  };

  const handleEdit = async () => {
    if (!editingAdmin) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingAdmin.id, ...formData }),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingAdmin(null);
        success("编辑成功");
        fetchAdmins();
      } else {
        const data = await res.json();
        showError(data.error || "编辑失败");
      }
    } catch {
      showError("编辑失败");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (admin: any) => {
    setTargetAdmin(admin);
    setShowDeleteModal(true);
    setShowActionMenu(null);
  };

  const handleDelete = async () => {
    if (!targetAdmin) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetAdmin.id }),
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setTargetAdmin(null);
        success("已禁用");
        fetchAdmins();
      } else {
        const data = await res.json();
        showError(data.error || "操作失败");
      }
    } catch {
      showError("操作失败");
    } finally {
      setActionLoading(false);
    }
  };

  const openResetModal = (admin: any) => {
    setTargetAdmin(admin);
    setShowResetModal(true);
    setShowActionMenu(null);
  };

  const handleResetPassword = async () => {
    if (!targetAdmin) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetAdmin.id, resetPassword: true }),
      });
      if (res.ok) {
        setShowResetModal(false);
        setTargetAdmin(null);
        success("密码已重置为 123456");
        fetchAdmins();
      } else {
        const data = await res.json();
        showError(data.error || "重置失败");
      }
    } catch {
      showError("重置失败");
    } finally {
      setActionLoading(false);
    }
  };

  const isSuperAdmin = (admin: any) => {
    if (admin.role === "TEACHER") return true;
    return admin._count?.permissions > 0;
  };

  const stats = {
    total: admins.length,
    teachers: admins.filter((a) => a.role === "TEACHER").length,
    admins: admins.filter((a) => a.role === "ADMIN").length,
    fullPerms: admins.filter((a) => a.role === "TEACHER" || a._count?.permissions >= 14).length,
  };

  if (status === "loading") {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">管理员管理</h1>
          <p className="text-gray-500 mt-1">管理系统管理员和老师账号</p>
        </div>
        <Button onClick={() => {
          setFormData({ name: "", studentId: "", grade: "", className: "", role: "ADMIN", phone: "", email: "" });
          setShowAddModal(true);
        }}>
          <UserPlus className="w-4 h-4" />
          新增管理员
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "管理员总数", value: stats.total, icon: Shield, color: "bg-red-500" },
          { label: "老师", value: stats.teachers, icon: UserCheck, color: "bg-purple-500" },
          { label: "管理员", value: stats.admins, icon: Users, color: "bg-blue-500" },
          { label: "全权限管理员", value: stats.fullPerms, icon: ShieldCheck, color: "bg-emerald-500" },
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

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、学号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAdmins()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 focus:ring-1 focus:ring-red-600/20 outline-none"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : admins.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无管理员数据</div>
        ) : (
          <>
            {/* 桌面端表格 */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">学号</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">权限数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => (
                    <tr key={admin.id} className={`hover:bg-gray-50 ${admin.isDisabled ? "opacity-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600 shrink-0">
                            {admin.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                            <p className="text-xs text-gray-400">{admin.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{admin.studentId}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={admin.role === "TEACHER" ? "info" : "warning"}
                        >
                          {ROLE_LABELS[admin.role] || admin.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {admin.role === "TEACHER" ? (
                          <span className="text-green-600 font-medium">全部</span>
                        ) : (
                          admin._count?.permissions || 0
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {admin.isDisabled ? (
                          <Badge variant="default">已禁用</Badge>
                        ) : isSuperAdmin(admin) ? (
                          <Badge variant="success">超级管理员</Badge>
                        ) : (
                          <Badge variant="success">正常</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === admin.id ? null : admin.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {showActionMenu === admin.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                            <button
                              onClick={() => openEditModal(admin)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className="text-blue-600">编辑</span>
                            </button>
                            <button
                              onClick={() => openResetModal(admin)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-orange-600" />
                              <span className="text-orange-600">重置密码</span>
                            </button>
                            {!isSuperAdmin(admin) && (
                              <button
                                onClick={() => openDeleteModal(admin)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
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
              {admins.map((admin) => (
                <div key={admin.id} className={`p-4 ${admin.isDisabled ? "opacity-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-600 shrink-0">
                          {admin.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{admin.name}</span>
                        <Badge variant={admin.role === "TEACHER" ? "info" : "warning"}>
                          {ROLE_LABELS[admin.role] || admin.role}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                        <p><span className="text-gray-400">学号：</span>{admin.studentId}</p>
                        <p><span className="text-gray-400">手机：</span>{admin.phone}</p>
                        <p><span className="text-gray-400">权限：</span>{admin.role === "TEACHER" ? <span className="text-green-600 font-medium">全部</span> : admin._count?.permissions || 0}</p>
                        <p>
                          <span className="text-gray-400">状态：</span>
                          {admin.isDisabled ? (
                            <Badge variant="default">已禁用</Badge>
                          ) : isSuperAdmin(admin) ? (
                            <Badge variant="success">超级管理员</Badge>
                          ) : (
                            <Badge variant="success">正常</Badge>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => openEditModal(admin)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                        <button onClick={() => openResetModal(admin)} className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100">重置密码</button>
                        {!isSuperAdmin(admin) && (
                          <button onClick={() => openDeleteModal(admin)} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">禁用</button>
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

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="新增管理员" size="md">
        <div className="space-y-4">
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入姓名"
          />
          <Input
            label="学号/工号"
            value={formData.studentId}
            onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
            placeholder="请输入学号/工号"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              >
                <option value="">请选择</option>
                <option value="2024">2024级</option>
                <option value="2025">2025级</option>
              </select>
            </div>
            <Input
              label="班级"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              placeholder="如：机2401"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              >
                <option value="ADMIN">管理员</option>
                <option value="TEACHER">老师</option>
              </select>
            </div>
            <Input
              label="手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
            />
          </div>
          <Input
            label="邮箱（选填）"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="请输入邮箱"
          />
          <p className="text-xs text-gray-400">默认密码为 123456，首次登录需修改密码</p>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} fullWidth>取消</Button>
            <Button onClick={handleAdd} loading={actionLoading} fullWidth>确认添加</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingAdmin(null); }} title="编辑管理员" size="md">
        <div className="space-y-4">
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input label="学号/工号" value={formData.studentId} disabled />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              >
                <option value="">请选择</option>
                <option value="2024">2024级</option>
                <option value="2025">2025级</option>
              </select>
            </div>
            <Input
              label="班级"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              >
                <option value="ADMIN">管理员</option>
                <option value="TEACHER">老师</option>
              </select>
            </div>
            <Input
              label="手机号"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <Input
            label="邮箱（选填）"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setEditingAdmin(null); }} fullWidth>取消</Button>
            <Button onClick={handleEdit} loading={actionLoading} fullWidth>保存修改</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeleteModal} onClose={() => { setShowDeleteModal(false); setTargetAdmin(null); }} title="确认禁用" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确定要禁用管理员 <strong>{targetAdmin?.name}</strong> 吗？禁用后该账号将无法登录。
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setTargetAdmin(null); }} fullWidth>取消</Button>
            <Button variant="danger" onClick={handleDelete} loading={actionLoading} fullWidth>确认禁用</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showResetModal} onClose={() => { setShowResetModal(false); setTargetAdmin(null); }} title="重置密码" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            确定要将 <strong>{targetAdmin?.name}</strong> 的密码重置为 <strong>123456</strong> 吗？重置后该用户下次登录时需修改密码。
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowResetModal(false); setTargetAdmin(null); }} fullWidth>取消</Button>
            <Button onClick={handleResetPassword} loading={actionLoading} fullWidth>确认重置</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
