"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SESSION_LABELS: Record<string, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "已通过",
  PENDING: "待审核",
  REJECTED: "已拒绝",
};

export default function StaffPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [hasRegistration, setHasRegistration] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [rolesRes] = await Promise.all([
        fetch("/api/admin/staff-roles"),
      ]);
      if (rolesRes.ok) {
        const roles = await rolesRes.json();
        setStaffRoles(roles);
      }

      if (session?.user) {
        const appsRes = await fetch(`/api/staff-applications/my`);
        if (appsRes.ok) {
          const data = await appsRes.json();
          setMyApplications(Array.isArray(data) ? data : data ? [data] : []);
        }

        const regRes = await fetch("/api/registrations");
        if (regRes.ok) {
          const regData = await regRes.json();
          setHasRegistration(!!regData);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancelApplication = async () => {
    if (!session) return;
    setIsSubmitting("cancel");
    try {
      const res = await fetch("/api/staff-applications/my", {
        method: "DELETE",
      });
      if (res.ok) {
        setMyApplications([]);
        showToast("已取消申请", "success");
      } else {
        showToast("取消失败", "error");
      }
    } catch {
      showToast("取消失败，请稍后重试", "error");
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleApply = async (roleId: string) => {
    if (!session) {
      router.push("/login?callbackUrl=/staff");
      return;
    }
    if (hasRegistration) {
      showToast("提示：您已报名参与活动，申请工作人员后将无法作为参与者参加", "error");
    }

    const existingApp = myApplications.find((a: any) => a.staffRoleId === roleId);
    if (existingApp) {
      showToast("您已申请过该岗位", "error");
      return;
    }

    setIsSubmitting(roleId);
    try {
      const res = await fetch("/api/staff-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffRoleId: roleId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMyApplications((prev) => [...prev, data]);
        showToast("申请成功，请等待审核", "success");
      } else {
        const json = await res.json();
        showToast(json.error || "申请失败", "error");
      }
    } catch {
      showToast("申请失败，请稍后重试", "error");
    } finally {
      setIsSubmitting(null);
    }
  };

  const totalSpots = staffRoles.reduce((sum, r) => sum + r.requiredCount, 0);
  const totalFilled = staffRoles.reduce((sum, r) => sum + (r._count?.assignments || 0), 0);

  const COLORS = [
    "from-blue-500 to-blue-600",
    "from-purple-500 to-purple-600",
    "from-amber-500 to-amber-600",
    "from-red-500 to-red-600",
    "from-emerald-500 to-emerald-600",
    "from-indigo-500 to-indigo-600",
    "from-pink-500 to-pink-600",
    "from-orange-500 to-orange-600",
    "from-teal-500 to-teal-600",
    "from-cyan-500 to-cyan-600",
  ];

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="pt-16 lg:pt-24 pb-24 lg:pb-12 bg-gray-50 min-h-screen">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-20 left-1/2 z-[100] px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.message}
        </motion.div>
      )}

      {/* 已申请提示 */}
      {session && myApplications.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    您已申请岗位：<strong>{myApplications[0]?.staffRole?.name}</strong>
                  </p>
                  <p className="text-xs text-green-600">
                    状态：{STATUS_LABELS[myApplications[0]?.status] || myApplications[0]?.status}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelApplication}
                disabled={isSubmitting === "cancel"}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0"
              >
                {isSubmitting === "cancel" ? "取消中..." : "取消申请"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 已报名参与者提示 */}
      {session && hasRegistration && myApplications.length === 0 && (
        <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  您已报名参与活动，不能同时申请工作人员
                </p>
                <p className="text-xs text-amber-600">如需申请工作人员，请先取消活动报名</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 岗位列表 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {staffRoles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无岗位信息</p>
          </div>
        ) : (
          <>
            {/* 统计 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{totalSpots}</p>
                <p className="text-xs text-gray-400">总名额</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-green-600">{totalFilled}</p>
                <p className="text-xs text-gray-400">已招募</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-amber-600">{totalSpots - totalFilled}</p>
                <p className="text-xs text-gray-400">剩余</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {staffRoles.map((role, i) => {
                const filled = role._count?.assignments || 0;
                const remaining = role.requiredCount - filled;
                const fillPercent = Math.min((filled / role.requiredCount) * 100, 100);
                const isFull = remaining <= 0;
                const color = COLORS[i % COLORS.length];
                const myApp = myApplications.find((a: any) => a.staffRoleId === role.id);

                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/80"
                  >
                    <div className={`bg-gradient-to-r ${color} p-4 flex items-center gap-3`}>
                      <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{role.name}</h3>
                        <span className="text-[10px] text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
                          {role.session ? SESSION_LABELS[role.session] : "两场通用"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-500 text-xs mb-3 leading-relaxed">{role.description || "暂无描述"}</p>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">招募进度</span>
                          <span className="text-gray-900 font-semibold">
                            {filled}/{role.requiredCount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`bg-gradient-to-r ${color} h-1.5 rounded-full transition-all`}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleApply(role.id)}
                        disabled={isFull || !!isSubmitting || !!myApp}
                        className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          myApp
                            ? "bg-green-100 text-green-700 cursor-default"
                            : isFull
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : isSubmitting === role.id
                            ? "bg-red-400 text-white cursor-wait"
                            : hasRegistration
                            ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
                            : "bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]"
                        }`}
                      >
                        {myApp ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 已申请
                          </span>
                        ) : isFull ? (
                          "已满员"
                        ) : isSubmitting === role.id ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> 申请中...
                          </span>
                        ) : hasRegistration ? (
                          "已报名·仍可申请"
                        ) : (
                          "立即申请"
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 工作人员须知 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 rounded-2xl p-5 border border-red-100/50">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            工作人员须知
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: Clock, title: "集合时间", desc: "活动当天 09:00" },
              { icon: MapPin, title: "集合地点", desc: "操场主席台左侧" },
              { icon: Users, title: "工作培训", desc: "活动前一天线上培训" },
              { icon: CheckCircle2, title: "工作证明", desc: "颁发志愿者证书" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 bg-white rounded-xl p-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                  <p className="text-[10px] text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
