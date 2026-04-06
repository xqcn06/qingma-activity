"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, LogIn, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

const loginSchema = z.object({
  studentId: z.string().min(1, "请输入学号或工号"),
  password: z.string().min(1, "请输入密码"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const callbackUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("callbackUrl") || "" : "";
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        studentId: data.studentId,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("学号/工号或密码错误，请重试");
        return;
      }

      if (result?.ok) {
        const targetUrl = callbackUrl || "/";
        router.push(targetUrl);
        router.refresh();
      }
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">登录</h1>
              <p className="text-gray-500 text-sm mt-1">青马工程活动管理系统</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  学号 / 工号
                </label>
                <input
                  {...register("studentId")}
                  type="text"
                  placeholder="请输入学号或工号"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all"
                />
                {errors.studentId && (
                  <p className="text-red-600 text-sm mt-1">{errors.studentId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="请输入密码"
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
                {errors.password && (
                  <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
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
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    登录
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
            <a href="/" className="text-sm text-gray-500 hover:text-red-600 transition-colors">
              ← 返回首页
            </a>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-6">
          忘记密码？请联系管理员重置
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginFormContent />;
}
