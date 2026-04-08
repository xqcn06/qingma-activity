"use client";

import { useState } from "react";
import { Download, Database, FileText, Users, Trophy, Package, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const EXPORT_OPTIONS = [
  { id: "students", label: "学生数据", desc: "导出所有学生信息", icon: Users, color: "text-blue-600", bg: "bg-blue-50", endpoint: "/api/admin/students/export" },
  { id: "registrations", label: "报名数据", desc: "导出所有报名记录", icon: FileText, color: "text-green-600", bg: "bg-green-50", endpoint: "/api/admin/registrations" },
  { id: "materials", label: "物资数据", desc: "导出物资清单", icon: Package, color: "text-pink-600", bg: "bg-pink-50", endpoint: "/api/admin/materials/export" },
  { id: "checkins", label: "签到数据", desc: "导出签到记录", icon: CheckCircle2, color: "text-amber-600", bg: "bg-amber-50", endpoint: "/api/admin/checkin/export" },
  { id: "feedbacks", label: "反馈数据", desc: "导出所有反馈记录", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50", endpoint: "/api/admin/feedbacks/export" },
];

export default function AdminBackup() {
  const { success, error: showError } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string[]>([]);

  const handleExport = async (id: string) => {
    const opt = EXPORT_OPTIONS.find((o) => o.id === id);
    if (!opt) return;

    setExporting(id);
    try {
      const body: any = {};
      if (id === "checkins") {
        body.exportMode = "all";
      }

      const res = await fetch(opt.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const disposition = res.headers.get("Content-Disposition");
        let fileName = `${opt.label}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        if (disposition) {
          const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
          if (match) fileName = decodeURIComponent(match[1].replace(/"/g, ""));
        }
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        setExported((prev) => [...prev, id]);
        success(`${opt.label}导出成功`);
      } else {
        const err = await res.json().catch(() => ({}));
        showError(`${opt.label}导出失败`, err.error || "未知错误");
      }
    } catch (e: any) {
      showError(`${opt.label}导出失败`, e.message);
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
          <p className="text-gray-500 mt-1">导出活动数据为 Excel 文件</p>
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
          {exporting ? "导出中..." : "全部导出"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isExporting = exporting === opt.id;
          const isExported = exported.includes(opt.id);

          return (
            <div
              key={opt.id}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 ${opt.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{opt.label}</h3>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </div>

              <button
                onClick={() => handleExport(opt.id)}
                disabled={isExporting}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isExported
                    ? "bg-green-50 text-green-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导出中...
                  </>
                ) : isExported ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    已导出
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    导出
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
