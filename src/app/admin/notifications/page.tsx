"use client";

import { useState } from "react";
import { Megaphone, Send, Users, Loader2, CheckCircle2 } from "lucide-react";

const NOTIFICATION_TYPES = [
  { value: "审核结果", label: "报名审核结果" },
  { value: "活动公告", label: "活动公告发布" },
  { value: "分组结果", label: "队伍分组结果" },
  { value: "活动提醒", label: "活动开始提醒" },
];

const TARGET_OPTIONS = [
  { value: "all", label: "全部学生" },
  { value: "first", label: "第一场学生" },
  { value: "second", label: "第二场学生" },
  { value: "pending", label: "待审核学生" },
  { value: "approved", label: "已通过学生" },
];

export default function AdminNotifications() {
  const [type, setType] = useState("审核结果");
  const [target, setTarget] = useState("all");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setIsSending(true);
    try {
      // Mock send
      await new Promise((r) => setTimeout(r, 1000));
      const record = {
        id: Date.now(),
        type,
        target,
        content,
        time: new Date().toLocaleString("zh-CN"),
        count: 100,
      };
      setHistory([record, ...history]);
      setContent("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      // ignore
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">消息通知</h1>
        <p className="text-gray-500 mt-1">发送站内消息和通知</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Send Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-red-600" />
            发送通知
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">通知类型</label>
              <div className="grid grid-cols-2 gap-2">
                {NOTIFICATION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`p-3 rounded-xl border text-left text-sm transition-all ${
                      type === t.value
                        ? "border-red-600 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">发送对象</label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none bg-white"
              >
                {TARGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">通知内容</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="输入通知内容..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none resize-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isSending || !content.trim()}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : sent ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sent ? "发送成功" : "发送通知"}
            </button>
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            发送历史
          </h2>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Megaphone className="w-12 h-12 mb-3 opacity-30" />
              <p>暂无发送记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400">{item.time}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                  <p className="text-xs text-gray-400">发送至: {item.target} · {item.count}人</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
