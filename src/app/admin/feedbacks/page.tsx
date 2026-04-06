"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Star, BarChart3, Download, Loader2 } from "lucide-react";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-4 h-4 ${i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
      ))}
    </div>
  );
}

export default function AdminFeedbacks() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/admin/feedbacks");
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const validFeedbacks = feedbacks.filter((f) => f.overallRating);
  const avgOverall = validFeedbacks.length > 0
    ? (validFeedbacks.reduce((sum, f) => sum + f.overallRating, 0) / validFeedbacks.length).toFixed(1)
    : "0.0";
  const avgContent = validFeedbacks.length > 0
    ? (validFeedbacks.reduce((sum, f) => sum + (f.contentRating || 0), 0) / validFeedbacks.length).toFixed(1)
    : "0.0";
  const avgOrg = validFeedbacks.length > 0
    ? (validFeedbacks.reduce((sum, f) => sum + (f.organizationRating || 0), 0) / validFeedbacks.length).toFixed(1)
    : "0.0";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">反馈管理</h1>
          <p className="text-gray-500 mt-1">查看活动反馈和满意度统计</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors text-sm">
          <Download className="w-4 h-4" /> 导出数据
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "总体评分", value: avgOverall, color: "bg-red-600" },
              { label: "内容评分", value: avgContent, color: "bg-blue-500" },
              { label: "组织评分", value: avgOrg, color: "bg-green-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 text-center">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white mx-auto mb-3`}>
                  <Star className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">反馈详情</h2>
            </div>
            {feedbacks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无反馈数据</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {feedbacks.map((f) => (
                  <div key={f.id} className="p-5 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {f.user?.name || "匿名"}{" "}
                          <span className="text-sm text-gray-500 font-normal">· {f.user?.className || ""}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(f.createdAt).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                      {f.overallRating && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">总体</p>
                          <StarRating rating={f.overallRating} />
                        </div>
                      )}
                    </div>
                    {f.contentRating && f.organizationRating && (
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">内容质量</p>
                          <StarRating rating={f.contentRating} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">组织安排</p>
                          <StarRating rating={f.organizationRating} />
                        </div>
                      </div>
                    )}
                    {f.suggestion && (
                      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                        <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
                        {f.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
