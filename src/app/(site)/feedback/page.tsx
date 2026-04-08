"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Star,
  Send,
  CheckCircle2,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function FeedbackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [ratings, setRatings] = useState({ overall: 0, content: 0, organization: 0 });
  const [hoveredRatings, setHoveredRatings] = useState({ overall: 0, content: 0, organization: 0 });
  const [suggestion, setSuggestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/feedback");
    }
  }, [sessionStatus, router]);

  const handleRating = (category: keyof typeof ratings, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    if (ratings.overall === 0 || ratings.content === 0 || ratings.organization === 0) {
      showError("请完成所有评分项");
      return;
    }
    if (!suggestion.trim()) {
      showError("请填写建议或感想");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallRating: ratings.overall,
          contentRating: ratings.content,
          organizationRating: ratings.organization,
          suggestion,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError("提交失败", err.error || "请重试");
        return;
      }

      setSubmitted(true);
      success("反馈提交成功");
    } catch {
      showError("网络错误", "请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sessionStatus === "loading" || sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-white to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-white to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center"
        >
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">反馈提交成功！</h2>
          <p className="text-gray-500 mb-6">
            感谢您的宝贵意见和建议，我们会认真考虑并持续改进！
          </p>
          <div className="bg-red-50 rounded-xl p-4 text-sm text-gray-600">
            <p>📊 您的评分已记录</p>
            <p>💬 您的建议将帮助我们把活动办得更好</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <section className="py-12 bg-transparent pt-16 lg:pt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-red-600" />
              活动评分
            </h2>

            <div className="space-y-6 mb-8 lg:space-y-4">
              {[
                { key: "overall" as const, label: "总体满意度", desc: "对本次活动的整体评价" },
                { key: "content" as const, label: "活动内容", desc: "活动环节的设计与丰富程度" },
                { key: "organization" as const, label: "组织安排", desc: "活动流程的组织与协调" },
              ].map((item) => (
                <div key={item.key} className="bg-gray-50 rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between lg:gap-4 mb-2">
                    <div className="lg:flex-1">
                      <div className="font-semibold text-gray-900">{item.label}</div>
                      <div className="text-xs text-gray-400">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4 mt-2 lg:mt-0">
                      <span className="text-lg font-bold text-red-600">
                        {ratings[item.key] > 0 ? `${ratings[item.key]}.0` : "--"}
                      </span>
                      <div className="flex gap-1 lg:gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(item.key, star)}
                            onMouseEnter={() =>
                              setHoveredRatings((prev) => ({ ...prev, [item.key]: star }))
                            }
                            onMouseLeave={() =>
                              setHoveredRatings((prev) => ({ ...prev, [item.key]: 0 }))
                            }
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-7 h-7 lg:w-8 lg:h-8 ${
                                star <= (hoveredRatings[item.key] || ratings[item.key])
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-red-600" />
              建议与感想
            </h2>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                建议或感想<span className="text-red-600">*</span>
              </label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                rows={5}
                placeholder="请分享您对本次活动的建议、感想或改进意见..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all resize-none"
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {suggestion.length} / 500
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full lg:w-auto lg:mx-auto lg:block bg-red-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-red-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  提交反馈
                </>
              )}
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
