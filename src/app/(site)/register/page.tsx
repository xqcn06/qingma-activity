"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  User,
  Clock,
  Phone,
  Mail,
  ClipboardEdit,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

const registerSchema = z.object({
  session: z.enum(["FIRST", "SECOND"], { required_error: "请选择场次" }),
  primaryPosition: z.enum([
    "CLASS_MONITOR", "LEAGUE_SECRETARY", "STUDY_COMMISSAR",
    "LIFE_COMMISSAR", "CULTURE_COMMISSAR", "PROPAGANDA",
    "PSYCHOLOGY", "ORGANIZATION", "INFO", "NONE",
  ], { required_error: "请选择主职务" }),
  secondaryPositions: z.array(z.string()).optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
  email: z.string().email("请输入正确的邮箱").optional().or(z.literal("")),
  remark: z.string().max(500, "备注最多500个字").optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

const PRIMARY_POSITIONS = [
  { value: "CLASS_MONITOR", label: "班长" },
  { value: "LEAGUE_SECRETARY", label: "团支书" },
  { value: "STUDY_COMMISSAR", label: "学习委员" },
  { value: "LIFE_COMMISSAR", label: "生活班长" },
  { value: "CULTURE_COMMISSAR", label: "文体委员" },
  { value: "PROPAGANDA", label: "宣传委员" },
  { value: "PSYCHOLOGY", label: "心理委员" },
  { value: "ORGANIZATION", label: "组织委员" },
  { value: "INFO", label: "信息委员" },
  { value: "NONE", label: "其他班委" },
];

const SECONDARY_POSITIONS = [
  { value: "CLASS_MONITOR", label: "班长" },
  { value: "LEAGUE_SECRETARY", label: "团支书" },
  { value: "STUDY_COMMISSAR", label: "学习委员" },
  { value: "LIFE_COMMISSAR", label: "生活班长" },
  { value: "CULTURE_COMMISSAR", label: "文体委员" },
  { value: "PROPAGANDA", label: "宣传委员" },
  { value: "PSYCHOLOGY", label: "心理委员" },
  { value: "ORGANIZATION", label: "组织委员" },
  { value: "INFO", label: "信息委员" },
];

const POSITION_LABELS: Record<string, string> = {
  CLASS_MONITOR: "班长",
  LEAGUE_SECRETARY: "团支书",
  STUDY_COMMISSAR: "学习委员",
  LIFE_COMMISSAR: "生活班长",
  CULTURE_COMMISSAR: "文体委员",
  PROPAGANDA: "宣传委员",
  PSYCHOLOGY: "心理委员",
  ORGANIZATION: "组织委员",
  INFO: "信息委员",
  NONE: "其他班委",
};

const SESSION_OPTIONS = [
  { value: "FIRST", label: "第一场", time: "12:30 - 15:20" },
  { value: "SECOND", label: "第二场", time: "15:35 - 18:00" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "待审核", color: "text-amber-600 bg-amber-100" },
  APPROVED: { label: "已通过", color: "text-green-600 bg-green-100" },
  REJECTED: { label: "已拒绝", color: "text-red-600 bg-red-100" },
};

export default function RegisterPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterForm>({
    defaultValues: {
      session: undefined,
      primaryPosition: undefined,
      secondaryPositions: [],
      phone: "",
      email: "",
      remark: "",
    },
  });

  const selectedSession = watch("session");
  const selectedPosition = watch("primaryPosition");

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/register");
      return;
    }
    if (sessionStatus === "authenticated") {
      fetchRegistration();
    }
  }, [sessionStatus, router]);

  const fetchRegistration = async () => {
    try {
      const res = await fetch("/api/registrations");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setExistingRegistration(data);
          setSubmitted(true);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        showError("提交失败", json.error || "提交失败");
        return;
      }

      setSubmitted(true);
      fetchRegistration();
    } catch {
      showError("提交失败", "请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen bg-gradient-to-br from-red-50/30 via-white to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (submitted && existingRegistration) {
    const statusConfig = STATUS_LABELS[existingRegistration.status] || STATUS_LABELS.PENDING;
    return (
      <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen flex items-center justify-center px-4 pb-24 lg:pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 border border-gray-100/80 max-w-md w-full text-center shadow-sm"
        >
          {existingRegistration.status === "APPROVED" ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : existingRegistration.status === "REJECTED" ? (
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          ) : (
            <Clock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {existingRegistration.status === "APPROVED"
              ? "报名已通过"
              : existingRegistration.status === "REJECTED"
              ? "报名被拒绝"
              : "报名已提交"}
          </h2>
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color} mb-4`}>
            {statusConfig.label}
          </div>
          {existingRegistration.status === "REJECTED" && existingRegistration.rejectReason && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mb-4">
              拒绝原因：{existingRegistration.rejectReason}
            </p>
          )}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2 text-left">
            <p>📅 场次：{existingRegistration.session === "FIRST" ? "第一场（12:30-15:20）" : "第二场（15:35-18:00）"}</p>
            <p>👤 职务：{POSITION_LABELS[existingRegistration.primaryPosition] || existingRegistration.primaryPosition}</p>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            请等待管理员审核，审核结果将在网站上公布。
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
            >
              返回首页
            </button>
            <button
              onClick={() => router.push("/groups")}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300"
            >
              查看分组
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6 space-y-6">
        <motion.div
          {...fadeInUp}
          className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> 预填信息（来自导入表格）
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-600">姓名：</span>
              <span className="font-medium text-gray-900">{user?.name || "-"}</span>
            </div>
            <div>
              <span className="text-blue-600">学号：</span>
              <span className="font-medium text-gray-900 font-mono">{user?.studentId || "-"}</span>
            </div>
            <div>
              <span className="text-blue-600">班级：</span>
              <span className="font-medium text-gray-900">{user?.className || "-"}</span>
            </div>
            <div>
              <span className="text-blue-600">年级：</span>
              <span className="font-medium text-gray-900">{user?.grade || "-"}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          {...fadeInUp}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 border border-gray-100/80 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-red-600" /> 补充报名信息
          </h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择场次 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SESSION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("session", opt.value as "FIRST" | "SECOND")}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                      selectedSession === opt.value
                        ? "border-red-600 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{opt.label}</p>
                    <p className="text-sm text-gray-500">{opt.time}</p>
                  </button>
                ))}
              </div>
              {errors.session && (
                <p className="text-red-600 text-sm mt-1">{errors.session.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                主职务 <span className="text-red-600">*</span>
              </label>
              <select
                {...register("primaryPosition")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all bg-white"
              >
                <option value="">请选择主职务</option>
                {PRIMARY_POSITIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.primaryPosition && (
                <p className="text-red-600 text-sm mt-1">{errors.primaryPosition.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                兼任职务（可选，可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {SECONDARY_POSITIONS.filter((p) => p.value !== selectedPosition).map((opt) => {
                  const secondary = watch("secondaryPositions") || [];
                  const isChecked = secondary.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                        isChecked
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const current = watch("secondaryPositions") || [];
                          if (e.target.checked) {
                            setValue("secondaryPositions", [...current, opt.value]);
                          } else {
                            setValue("secondaryPositions", current.filter((v: string) => v !== opt.value));
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Phone + Email: 2-column on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  手机号 <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register("phone")}
                    type="tel"
                    placeholder="请输入手机号"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all pl-12"
                  />
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  邮箱（选填）
                </label>
                <div className="relative">
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="请输入邮箱"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all pl-12"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                备注（选填）
              </label>
              <textarea
                {...register("remark")}
                rows={3}
                placeholder="如有特殊情况请说明"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all resize-none"
              />
              {errors.remark && (
                <p className="text-red-600 text-sm mt-1">{errors.remark.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                "提交报名"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
