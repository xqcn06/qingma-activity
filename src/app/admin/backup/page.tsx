"use client";

import { useState } from "react";
import { Download, Database, FileText, Users, Trophy, Package, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";

const EXPORT_OPTIONS = [
  { id: "students", label: "学生数据", desc: "导出所有学生信息", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
  { id: "registrations", label: "报名数据", desc: "导出所有报名记录", icon: FileText, color: "text-green-600", bg: "bg-green-50" },
  { id: "teams", label: "分组数据", desc: "导出队伍和成员信息", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  { id: "scores", label: "积分数据", desc: "导出所有积分记录", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
  { id: "materials", label: "物资数据", desc: "导出物资清单", icon: Package, color: "text-pink-600", bg: "bg-pink-50" },
  { id: "feedbacks", label: "反馈数据", desc: "导出所有反馈记录", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
];

export default function AdminBackup() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string[]>([]);

  const handleExport = async (id: string) => {
    setExporting(id);
    try {
      // Mock export
      await new Promise((r) => setTimeout(r, 1500));
      setExported((prev) => [...prev, id]);
    } catch {
      // ignore
    } finally {
      setExporting(null);
    }
  };

  const handleExportAll = async () => {
    for (const opt of EXPORT_OPTIONS) {
      await handleExport(opt.id);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据备份</h1>
          <p className="text-gray-500 mt-1">导出和备份活动数据</p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={exporting !== null}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4" />
          )}
          一键导出全部
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((opt) => {
          const isExporting = exporting === opt.id;
          const isExported = exported.includes(opt.id);
          const Icon = opt.icon;

          return (
            <div
              key={opt.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 ${opt.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${opt.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{opt.label}</h3>
                  <p className="text-sm text-gray-400">{opt.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleExport(opt.id)}
                disabled={isExporting}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isExported
                    ? "bg-green-100 text-green-700"
                    : isExporting
                    ? "bg-gray-100 text-gray-400"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isExported ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isExported ? "已导出" : isExporting ? "导出中..." : "导出 Excel"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
