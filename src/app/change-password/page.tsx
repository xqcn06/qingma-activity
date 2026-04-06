"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, KeyRound, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

const passwordSchema = z.object({
  newPassword: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次密码输入不一致",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordForm) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: data.newPassword }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "修改失败，请重试");
        return;
      }

      setSuccess(true);
      setTimeout(async () => {
        const { signOut } = await import("next-auth/react");
        await signOut({ redirect: false });
        router.push("/login");
      }, 1500);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-red-800 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">密码修改成功</h2>
          <p className="text-gray-500">正在跳转...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 via-red-600 to-red-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">修改密码</h1>
              <p className="text-gray-500 text-sm mt-1">首次登录，请修改初始密码</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              为保障账号安全，首次登录必须修改密码。新密码至少6位。
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">新密码</label>
                <div className="relative">
                  <input
                    {...register("newPassword")}
                    type={showPassword ? "text" : "password"}
                    placeholder="至少6位"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认新密码</label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    placeholder="再次输入新密码"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white py-3.5 rounded-xl font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    修改中...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    确认修改
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
