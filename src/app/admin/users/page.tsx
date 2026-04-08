"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Search, Shield, ShieldCheck, Loader2, AlertTriangle, UserCog, User, Users2, GraduationCap, Lock } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const ALL_PERMISSIONS = [
  { key: "MANAGE_REGISTRATIONS", label: "管理报名" },
  { key: "MANAGE_TEAMS", label: "管理分组" },
  { key: "MANAGE_STAFF", label: "管理工作人员" },
  { key: "MANAGE_SCHEDULE", label: "管理日程" },
  { key: "MANAGE_ANNOUNCEMENTS", label: "管理公告" },
  { key: "MANAGE_SCORES", label: "管理积分" },
  { key: "MANAGE_MATERIALS", label: "管理物资" },
  { key: "MANAGE_ROTATION", label: "管理轮转排班" },
  { key: "MANAGE_TREASURE", label: "管理寻宝" },
  { key: "VIEW_FEEDBACKS", label: "查看反馈" },
  { key: "MANAGE_SETTINGS", label: "系统设置" },
  { key: "VIEW_LOGS", label: "查看活动日志" },
  { key: "EXPORT_DATA", label: "导出数据" },
  { key: "MANAGE_ADMINS", label: "管理管理员" },
];

const ROLE_OPTIONS = [
  { value: "ALL", label: "全部用户", icon: Users },
  { value: "TEACHER", label: "老师", icon: ShieldCheck },
  { value: "ADMIN", label: "管理员", icon: Shield },
  { value: "STAFF", label: "工作人员", icon: UserCog },
  { value: "STUDENT", label: "学生", icon: GraduationCap },
];

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

interface UserInfo {
  id: string;
  name: string;
  studentId: string;
  role: string;
  grade: number | null;
  className: string | null;
  phone: string;
  permissions: string[];
  isSuperAdmin: boolean;
  teamCount: number;
  staffCount: number;
}

export default function UsersManagementPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [lockInfo, setLockInfo] = useState<{ locked: boolean; userName?: string; isSelf?: boolean } | null>(null);
  const [lockLoading, setLockLoading] = useState(false);
  const lockCheckRef = useRef<NodeJS.Timeout | null>(null);

  const checkLock = useCallback(async (targetId: string) => {
    try {
      const res = await fetch(`/api/admin/edit-lock?targetType=user&targetId=${targetId}`);
      const data = await res.json();
      setLockInfo(data);
      return data;
    } catch {
      return { locked: false };
    }
  }, []);

  const acquireLock = useCallback(async (targetId: string) => {
    setLockLoading(true);
    try {
      const res = await fetch("/api/admin/edit-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "user", targetId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLockInfo({ locked: true, userName: data.lockedBy });
        return false;
      }
      setLockInfo({ locked: true, isSelf: true });
      return true;
    } catch {
      return false;
    } finally {
      setLockLoading(false);
    }
  }, []);

  const releaseLock = useCallback(async (targetId: string, force = false) => {
    try {
      await fetch("/api/admin/edit-lock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "user", targetId, force }),
      });
    } catch {
      // ignore
    }
  }, []);

  const startLockCheck = useCallback((targetId: string) => {
    stopLockCheck();
    lockCheckRef.current = setInterval(() => {
      checkLock(targetId);
    }, 5000);
  }, [checkLock]);

  const stopLockCheck = useCallback(() => {
    if (lockCheckRef.current) {
      clearInterval(lockCheckRef.current);
      lockCheckRef.current = null;
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole !== "ALL") params.set("role", filterRole);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/permissions/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [filterRole, search]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    const perms = (session?.user as any)?.permissions || [];
    const role = (session?.user as any)?.role;
    if (role !== "TEACHER" && !perms.includes("MANAGE_ADMINS")) {
      router.push("/admin");
      return;
    }
    loadUsers();
  }, [status, session, router, loadUsers]);

  const filtered = users;

  const openModal = async (user: UserInfo) => {
    const canLock = await acquireLock(user.id);
    if (!canLock) {
      showError(`该用户正被 ${lockInfo?.userName} 编辑`);
      return;
    }
    setSelectedUser(user);
    setEditRole(user.role);
    setEditPerms([...user.permissions]);
    startLockCheck(user.id);
  };

  const closeModal = async () => {
    if (selectedUser) {
      await releaseLock(selectedUser.id);
      stopLockCheck();
    }
    setSelectedUser(null);
    setEditRole("");
    setEditPerms([]);
    setLockInfo(null);
  };

  const togglePerm = (key: string) => {
    setEditPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const payload: any = {};
      
      if (editRole !== selectedUser.role) {
        payload.role = editRole;
      }
      
      if (editRole === "ADMIN") {
        const permsChanged = JSON.stringify(editPerms.sort()) !== JSON.stringify([...selectedUser.permissions].sort());
        if (permsChanged) {
          payload.permissions = editPerms;
        }
      }

      if (Object.keys(payload).length === 0) {
        showError("没有修改内容");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/permissions/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        success("保存成功");
        loadUsers();
        await releaseLock(selectedUser.id);
        stopLockCheck();
        setTimeout(closeModal, 1000);
      } else {
        const data = await res.json();
        showError(data.error || "保存失败");
      }
    } catch {
      showError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/permissions/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });

      if (res.ok) {
        success("密码已重置为 123456");
      } else {
        const data = await res.json();
        showError(data.error || "重置失败");
      }
    } catch {
      showError("重置失败");
    } finally {
      setSaving(false);
    }
  };

  const getPermLabel = (key: string) => {
    return ALL_PERMISSIONS.find((p) => p.key === key)?.label || key;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-7 h-7 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">用户权限管理</h1>
        </div>
        <p className="text-gray-500">管理所有用户角色和权限分配</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、学号、班级..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadUsers()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((user) => (
          <div
            key={user.id}
            onClick={() => openModal(user)}
            className="bg-white rounded-xl shadow-sm p-5 border-2 border-transparent hover:border-red-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                user.role === "TEACHER" ? "bg-purple-600" :
                user.role === "ADMIN" ? "bg-blue-600" :
                user.role === "STAFF" ? "bg-orange-600" : "bg-green-600"
              }`}>
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  {user.role === "TEACHER" && <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />}
                  {user.isSuperAdmin && <Shield className="w-4 h-4 text-red-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 font-mono">{user.studentId}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
              <span className="text-xs text-gray-400">
                {user.permissions.length > 0 ? `${user.permissions.length}个权限` : "无额外权限"}
              </span>
            </div>

            {(user.grade || user.className) && (
              <p className="text-xs text-gray-400 mt-2">
                {user.grade ? `${user.grade}级` : ""}
                {user.className ? ` · ${user.className}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>没有找到匹配的用户</p>
        </div>
      )}

      <Modal open={!!selectedUser} onClose={closeModal} title="编辑用户" size="lg">
        {selectedUser && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                editRole === "TEACHER" ? "bg-purple-600" :
                editRole === "ADMIN" ? "bg-blue-600" :
                editRole === "STAFF" ? "bg-orange-600" : "bg-green-600"
              }`}>
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-xs text-gray-400 font-mono">{selectedUser.studentId}</p>
                <p className="text-xs text-gray-400">{selectedUser.phone}</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">角色</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                {ROLE_OPTIONS.filter(o => o.value !== "ALL").map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {editRole === "ADMIN" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">权限分配</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={editPerms.includes(perm.key)}
                        onChange={() => togglePerm(perm.key)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-600"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {editRole !== "ADMIN" && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-500">
                {editRole === "TEACHER" && "老师拥有所有权限，无需单独分配"}
                {editRole === "STAFF" && "工作人员角色可参与活动管理，但无管理权限"}
                {editRole === "STUDENT" && "学生角色只能查看和参与活动"}
              </div>
            )}

            {lockInfo?.locked && !lockInfo?.isSelf && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <Lock className="w-4 h-4" />
                <span className="text-sm">该用户正被 {lockInfo.userName} 编辑</span>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "保存中..." : "保存"}
              </Button>
              <Button variant="secondary" onClick={handleResetPassword} disabled={saving}>
                重置密码
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
