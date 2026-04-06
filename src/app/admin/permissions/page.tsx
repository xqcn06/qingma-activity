"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { KeyRound, Search, Shield, ShieldCheck, Loader2, AlertTriangle, Check, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

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

const TEMPLATES = [
  { name: "积分录入员", icon: "📊", permissions: ["MANAGE_SCORES"] },
  { name: "报名管理员", icon: "📝", permissions: ["MANAGE_REGISTRATIONS", "MANAGE_TEAMS"] },
  { name: "日程管理员", icon: "📅", permissions: ["MANAGE_SCHEDULE", "MANAGE_ANNOUNCEMENTS"] },
  { name: "物资管理员", icon: "📦", permissions: ["MANAGE_MATERIALS"] },
  { name: "全能管理员", icon: "⭐", permissions: ALL_PERMISSIONS.map((p) => p.key).filter((k) => k !== "MANAGE_ADMINS") },
  { name: "超级管理员", icon: "👑", permissions: ALL_PERMISSIONS.map((p) => p.key) },
];

interface AdminUser {
  id: string;
  name: string;
  studentId: string;
  role: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export default function PermissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fetchError, setFetchError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/permissions/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "加载失败" }));
        setFetchError(data.error || "加载失败");
        return;
      }
      const data = await res.json();
      setUsers(data);
      setFetchError("");
    } catch {
      setFetchError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.includes(search) ||
      u.studentId.includes(search)
  );

  const openModal = (user: AdminUser) => {
    if (user.isSuperAdmin && user.role !== "TEACHER") return;
    setSelectedUser(user);
    setSelectedPerms([...user.permissions]);
    setError("");
    setSuccess("");
  };

  const closeModal = () => {
    setSelectedUser(null);
    setSelectedPerms([]);
    setError("");
    setSuccess("");
  };

  const togglePerm = (key: string) => {
    setSelectedPerms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    setSelectedPerms([...template.permissions]);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/permissions/users/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPerms }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      setSuccess("权限已更新");
      await loadUsers();
      setTimeout(closeModal, 1200);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const getPermLabel = (key: string) => {
    return ALL_PERMISSIONS.find((p) => p.key === key)?.label || key;
  };

  const getPermVariant = (key: string): "default" | "success" | "warning" | "danger" | "info" => {
    const map: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
      MANAGE_REGISTRATIONS: "info",
      MANAGE_TEAMS: "info",
      MANAGE_STAFF: "info",
      MANAGE_SCHEDULE: "success",
      MANAGE_ANNOUNCEMENTS: "success",
      MANAGE_SCORES: "warning",
      MANAGE_MATERIALS: "default",
      MANAGE_ROTATION: "default",
      MANAGE_TREASURE: "warning",
      VIEW_FEEDBACKS: "info",
      MANAGE_SETTINGS: "danger",
      VIEW_LOGS: "default",
      EXPORT_DATA: "default",
      MANAGE_ADMINS: "danger",
    };
    return map[key] || "default";
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-gray-600">{fetchError}</p>
        <Button onClick={loadUsers} variant="secondary">
          重试
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <KeyRound className="w-7 h-7 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">权限管理</h1>
        </div>
        <p className="text-gray-500">管理管理员权限分配，点击用户可修改其权限</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索管理员..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            onClick={() => openModal(user)}
            className={`bg-white rounded-xl shadow-sm p-5 border-2 transition-all cursor-pointer ${
              user.isSuperAdmin && user.role !== "TEACHER"
                ? "border-gray-100 opacity-60 cursor-not-allowed"
                : "border-transparent hover:border-red-200 hover:shadow-md"
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  {user.role === "TEACHER" && (
                    <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
                  )}
                  {user.isSuperAdmin && (
                    <Shield className="w-4 h-4 text-red-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono">{user.studentId}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {user.permissions.slice(0, 5).map((perm) => (
                <Badge key={perm} variant={getPermVariant(perm)} size="sm">
                  {getPermLabel(perm)}
                </Badge>
              ))}
              {user.permissions.length > 5 && (
                <Badge variant="default" size="sm">
                  +{user.permissions.length - 5}
                </Badge>
              )}
              {user.permissions.length === 0 && (
                <span className="text-xs text-gray-400">暂无权限</span>
              )}
            </div>

            {user.isSuperAdmin && user.role !== "TEACHER" && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                超级管理员，不可修改
              </p>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p>没有找到匹配的管理员</p>
        </div>
      )}

      <Modal open={!!selectedUser} onClose={closeModal} title="分配权限" size="lg">
        {selectedUser && (
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{selectedUser.name}</p>
                <p className="text-xs text-gray-400 font-mono">{selectedUser.studentId}</p>
              </div>
              <Badge variant={selectedUser.role === "TEACHER" ? "info" : "default"} className="ml-auto">
                {selectedUser.role === "TEACHER" ? "老师" : "管理员"}
              </Badge>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">快捷模板</h4>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => applyTemplate(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      JSON.stringify([...selectedPerms].sort()) === JSON.stringify([...t.permissions].sort())
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600"
                    }`}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                详细权限 ({selectedPerms.length}/{ALL_PERMISSIONS.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((perm) => {
                  const checked = selectedPerms.includes(perm.key);
                  return (
                    <label
                      key={perm.key}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                        checked
                          ? "bg-red-50 border-red-200"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          checked ? "bg-red-600 border-red-600" : "border-gray-300"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => togglePerm(perm.key)}
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <X className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={closeModal} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} loading={saving}>
                保存权限
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
