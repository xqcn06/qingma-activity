"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  ArrowLeft,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ImportResult {
  totalRows: number;
  successRows: Array<{
    rowNumber: number;
    name: string;
    studentId: string;
    className: string;
    grade: number | null;
    primaryPosition: string;
    secondaryPositions: string;
    phone: string;
    rawPosition: string;
  }>;
  failedRows: Array<{
    rowNumber: number;
    name: string;
    studentId: string;
    className: string;
    position: string;
    error: string;
  }>;
}

interface ImportBatch {
  id: string;
  fileName: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdAt: string;
  importer: { name: string };
}

const POSITION_LABELS: Record<string, string> = {
  CLASS_MONITOR: "班长",
  LEAGUE_SECRETARY: "团支书",
  STUDY_COMMISSAR: "学习委员",
  LIFE_COMMISSAR: "生活委员",
  CULTURE_COMMISSAR: "文体委员",
  NONE: "无",
};

export default function ImportPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<{
    batchId: string;
    totalRows: number;
    successRows: number;
    failedRows: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/admin/import/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch {
      // ignore
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls"))) {
      setFile(droppedFile);
      setError("");
      setPreviewResult(null);
      setImportResult(null);
    } else {
      setError("请上传 .xlsx 或 .xls 格式的文件");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setPreviewResult(null);
      setImportResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsPreviewing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("preview", "true");

      const res = await fetch("/api/admin/import/students", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "解析失败");
        return;
      }

      const data = await res.json();
      setPreviewResult(data);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/import/students", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "导入失败");
        return;
      }

      const data = await res.json();
      setImportResult(data);
      setFile(null);
      setPreviewResult(null);
      fetchBatches();
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewResult(null);
    setImportResult(null);
    setError("");
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生导入</h1>
          <p className="text-gray-500 mt-1">上传 Excel 表格批量导入学生信息</p>
        </div>
        <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft className="w-4 h-4" />
          返回仪表盘
        </Link>
      </div>

      {/* Import Result */}
      {importResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-semibold text-lg text-gray-900">导入完成</h3>
              <p className="text-sm text-gray-500">共处理 {importResult.totalRows} 条数据</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{importResult.successRows}</p>
              <p className="text-sm text-green-600">成功导入</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{importResult.failedRows}</p>
              <p className="text-sm text-red-600">导入失败</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{importResult.totalRows}</p>
              <p className="text-sm text-blue-600">总行数</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium"
            >
              继续导入
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium"
            >
              查看导入历史
            </button>
          </div>
        </motion.div>
      )}

      {/* Upload Area */}
      {!importResult && (
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging
                ? "border-red-400 bg-red-50"
                : file
                ? "border-green-300 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {file ? (
              <div>
                <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <button
                  onClick={resetForm}
                  className="text-sm text-red-600 hover:underline mt-2"
                >
                  重新选择文件
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">
                  拖拽 Excel 文件到此处，或
                  <label className="text-red-600 hover:underline cursor-pointer ml-1">
                    点击选择
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  支持 .xlsx / .xls 格式
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-4 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Preview Result */}
          {previewResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              <h3 className="font-semibold text-gray-900 mb-3">预览结果</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{previewResult.successRows.length}</p>
                  <p className="text-sm text-green-600">可导入</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{previewResult.failedRows.length}</p>
                  <p className="text-sm text-red-600">失败</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{previewResult.totalRows}</p>
                  <p className="text-sm text-blue-600">总行数</p>
                </div>
              </div>

              {/* Failed rows */}
              {previewResult.failedRows.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> 失败行详情
                  </h4>
                  <div className="bg-red-50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-3 py-2 text-left">行号</th>
                          <th className="px-3 py-2 text-left">姓名</th>
                          <th className="px-3 py-2 text-left">学号</th>
                          <th className="px-3 py-2 text-left">原因</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.failedRows.map((row) => (
                          <tr key={row.rowNumber} className="border-t border-red-200">
                            <td className="px-3 py-2">{row.rowNumber}</td>
                            <td className="px-3 py-2">{row.name || "-"}</td>
                            <td className="px-3 py-2 font-mono">{row.studentId || "-"}</td>
                            <td className="px-3 py-2 text-red-600">{row.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Success rows preview */}
              {previewResult.successRows.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> 成功行预览（前5条）
                  </h4>
                  <div className="bg-green-50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="px-3 py-2 text-left">姓名</th>
                          <th className="px-3 py-2 text-left">学号</th>
                          <th className="px-3 py-2 text-left">班级</th>
                          <th className="px-3 py-2 text-left">职务</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.successRows.slice(0, 5).map((row) => (
                          <tr key={row.rowNumber} className="border-t border-green-200">
                            <td className="px-3 py-2">{row.name}</td>
                            <td className="px-3 py-2 font-mono">{row.studentId}</td>
                            <td className="px-3 py-2">{row.className}</td>
                            <td className="px-3 py-2">
                              {POSITION_LABELS[row.primaryPosition] || row.primaryPosition}
                              {row.secondaryPositions && (
                                <span className="text-gray-400 text-xs ml-1">
                                  +{row.secondaryPositions.split(",").length}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setPreviewResult(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium"
                >
                  返回
                </button>
                <button
                  onClick={handleImport}
                  disabled={isUploading || previewResult.successRows.length === 0}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      确认导入（{previewResult.successRows.length} 条）
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          {file && !previewResult && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handlePreview}
                disabled={isPreviewing}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPreviewing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    预览数据
                  </>
                )}
              </button>
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    直接导入
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import History */}
      {batches.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              导入历史
            </h3>
            <span className="text-sm text-gray-400">
              {showHistory ? "收起" : "展开"}
            </span>
          </button>

          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{batch.fileName}</p>
                        <p className="text-xs text-gray-400">
                          {batch.importer.name} · {new Date(batch.createdAt).toLocaleString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-600 font-medium">{batch.successRows} 成功</span>
                      <span className="text-red-600 font-medium">{batch.failedRows} 失败</span>
                      <span className="text-gray-400">共 {batch.totalRows} 条</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
