"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  UserX,
  Search,
  Download,
  QrCode,
  RefreshCw,
  MapPin,
  Save,
  Loader2,
  ChevronDown,
  HardHat,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

type Session = "FIRST" | "SECOND";
type Tab = "dashboard" | "settings";
type CheckinType = "student" | "staff";

interface SessionConfig {
  id?: string;
  session: Session;
  startTime: string;
  endTime: string;
  fenceCenterLat: number;
  fenceCenterLng: number;
  fenceRadius: number;
  verificationCode: string;
}

interface QRCodeData {
  code: string;
  expiresAt: string;
  countdown: number;
}

const SESSION_LABELS: Record<Session, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

export default function AdminCheckin() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [checkinType, setCheckinType] = useState<CheckinType>("student");
  const [session, setSession] = useState<Session>("FIRST");
  const [loading, setLoading] = useState(true);

  // Student data
  const [studentRecords, setStudentRecords] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [uncheckedStudents, setUncheckedStudents] = useState<any[]>([]);

  // Staff data
  const [staffRecords, setStaffRecords] = useState<any[]>([]);
  const [staffStats, setStaffStats] = useState<any>(null);
  const [uncheckedStaff, setUncheckedStaff] = useState<any[]>([]);

  // Manual checkin
  const [manualId, setManualId] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualResult, setManualResult] = useState<any>(null);

  // Export
  const [exportLoading, setExportLoading] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);

  // Settings
  const [configs, setConfigs] = useState<Record<Session, SessionConfig>>({
    FIRST: { session: "FIRST", startTime: "", endTime: "", fenceCenterLat: 0, fenceCenterLng: 0, fenceRadius: 100, verificationCode: "" },
    SECOND: { session: "SECOND", startTime: "", endTime: "", fenceCenterLat: 0, fenceCenterLng: 0, fenceRadius: 100, verificationCode: "" },
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stats = checkinType === "student" ? studentStats : staffStats;
  const uncheckedList = checkinType === "student" ? uncheckedStudents : uncheckedStaff;

  // Fetch records
  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/checkin/records?session=${session}`);
      if (res.ok) {
        const data = await res.json();
        setStudentRecords(data.studentRecords || []);
        setStudentStats(data.studentStats || null);
        setUncheckedStudents(data.uncheckedStudents || []);
        setStaffRecords(data.staffRecords || []);
        setStaffStats(data.staffStats || null);
        setUncheckedStaff(data.uncheckedStaff || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    setLoading(true);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  // Fetch config
  const fetchConfig = useCallback(async (sess: Session) => {
    try {
      const res = await fetch(`/api/admin/checkin/config?session=${sess}`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setConfigs((prev) => ({ ...prev, [sess]: data }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchConfig(session);
  }, [session, fetchConfig]);

  // Manual checkin
  const handleManualCheckin = async () => {
    if (!manualId.trim()) return;
    setManualLoading(true);
    setManualResult(null);
    try {
      const res = await fetch("/api/admin/checkin/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: manualId.trim(), session }),
      });
      if (res.ok) {
        const data = await res.json();
        setManualResult(data.data);
        fetchRecords();
      } else {
        const json = await res.json();
        setManualResult({ error: json.error });
      }
    } catch {
      setManualResult({ error: "签到失败" });
    } finally {
      setManualLoading(false);
    }
  };

  // Export
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/admin/checkin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session, userType: checkinType }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${checkinType === "student" ? "学生" : "工作人员"}签到记录_${session}_${new Date().toLocaleDateString()}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // ignore
    } finally {
      setExportLoading(false);
    }
  };

  // QR Code
  const generateQRCode = async () => {
    setQrLoading(true);
    try {
      const res = await fetch("/api/admin/checkin/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data);
        setQrCountdown(data.countdown || 60);
      }
    } catch {
      // ignore
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (qrCountdown > 0) {
      const timer = setTimeout(() => setQrCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (qrCode && qrCountdown === 0) {
      generateQRCode();
    }
  }, [qrCountdown, qrCode]);

  const updateConfig = (field: keyof SessionConfig, value: string | number) => {
    setConfigs((prev) => ({ ...prev, [session]: { ...prev[session], [field]: value } }));
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/admin/checkin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configs[session]),
      });
      if (res.ok) {
        alert("保存成功");
      } else {
        alert("保存失败");
      }
    } catch {
      alert("保存失败");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">签到管理</h1>
          <p className="text-gray-500 mt-1">管理参赛人员签到、设置签到规则</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Session Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSessionDropdown(!showSessionDropdown)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
            >
              {SESSION_LABELS[session]}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showSessionDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[120px] overflow-hidden">
                {(["FIRST", "SECOND"] as Session[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSession(s); setShowSessionDropdown(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${s === session ? "bg-red-50 text-red-600 font-medium" : "text-gray-700"}`}
                  >
                    {SESSION_LABELS[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={handleExport} loading={exportLoading}>
            <Download className="w-4 h-4" />
            导出
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "dashboard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          签到看板
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "settings" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          签到设置
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setCheckinType("student")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                checkinType === "student"
                  ? "bg-red-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Users className="w-4 h-4" />
              学生签到
            </button>
            <button
              onClick={() => setCheckinType("staff")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                checkinType === "staff"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <HardHat className="w-4 h-4" />
              工作人员签到
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">总人数</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.checked}</p>
                    <p className="text-xs text-gray-500">已签到</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.onTime}</p>
                    <p className="text-xs text-gray-500">准时</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.late}</p>
                    <p className="text-xs text-gray-500">迟到</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <UserX className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                    <p className="text-xs text-gray-500">缺勤</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Manual Checkin */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-lg text-gray-900 mb-4">手动签到</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => { setManualId(e.target.value); setManualResult(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleManualCheckin()}
                  placeholder={`输入${checkinType === "student" ? "学号" : "学号/手机号"}进行手动签到`}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 outline-none transition-all text-sm"
                />
              </div>
              <Button onClick={handleManualCheckin} loading={manualLoading}>
                <UserCheck className="w-4 h-4" />
                签到
              </Button>
            </div>
            {manualResult && (
              <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${manualResult.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
                {manualResult.error ? (
                  <UserX className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-medium ${manualResult.error ? "text-red-900" : "text-green-900"}`}>
                    {manualResult.error || `${manualResult.user?.name} - ${manualResult.user?.studentId}`}
                  </p>
                  {!manualResult.error && (
                    <p className="text-sm text-green-700">
                      {manualResult.user?.className || ""} · 签到成功
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* QR Code Generator */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-lg text-gray-900 mb-4">动态二维码</h2>
            <div className="flex items-center gap-4">
              <Button onClick={generateQRCode} loading={qrLoading}>
                <QrCode className="w-4 h-4" />
                生成二维码
              </Button>
              {qrCode && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RefreshCw className={`w-4 h-4 ${qrCountdown > 0 ? "animate-spin" : ""}`} />
                  <span>{qrCountdown}秒后刷新</span>
                </div>
              )}
            </div>
            {qrCode && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-2">二维码Token（30秒有效）</p>
                <p className="text-sm font-mono bg-white p-3 rounded-lg border border-gray-200 break-all">{qrCode.code}</p>
              </div>
            )}
          </div>

          {/* Team/Role Breakdown */}
          {stats && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-lg text-gray-900">
                  {checkinType === "student" ? "各队签到进度" : "各岗位签到进度"}
                </h2>
              </div>
              {loading ? (
                <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                          {checkinType === "student" ? "队伍名称" : "岗位名称"}
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">签到进度</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">已签到/总人数</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">完成率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(checkinType === "student" ? stats.teamBreakdown : stats.roleBreakdown || []).map((item: any, i: number) => {
                        const pct = item.total > 0 ? Math.round((item.checked / item.total) * 100) : 0;
                        return (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="px-5 py-4 text-sm font-medium text-gray-900">{item.teamName || item.roleName}</td>
                            <td className="px-5 py-4">
                              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : pct > 0 ? "bg-yellow-500" : "bg-gray-300"}`} style={{ width: `${pct}%` }} />
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-gray-600">{item.checked} / {item.total}</td>
                            <td className="px-5 py-4">
                              <Badge variant={pct === 100 ? "success" : pct >= 50 ? "info" : pct > 0 ? "warning" : "default"}>
                                {pct}%
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Unchecked List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg text-gray-900">
                未签到{checkinType === "student" ? "学生" : "工作人员"}
              </h2>
              <Badge variant="danger" size="md">{uncheckedList.length} 人</Badge>
            </div>
            {uncheckedList.length === 0 ? (
              <div className="p-12 text-center text-gray-400">全部已签到</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">姓名</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">学号</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {checkinType === "student" ? "班级" : "岗位"}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {uncheckedList.map((record: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4 text-sm font-medium text-gray-900">{record.name}</td>
                        <td className="px-5 py-4 text-sm text-gray-500 font-mono">{record.studentId}</td>
                        <td className="px-5 py-4 text-sm text-gray-500">
                          {checkinType === "student" ? record.className : record.roleName}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="default">未签到</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Config */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-lg text-gray-900">签到配置</h2>
              <p className="text-sm text-gray-500 mt-1">设置签到时间、GPS围栏、验证码</p>
            </div>
            <div className="p-5 space-y-4">
              <Input
                label="签到开始时间"
                type="datetime-local"
                value={configs[session].startTime}
                onChange={(e) => updateConfig("startTime", e.target.value)}
              />
              <Input
                label="签到结束时间"
                type="datetime-local"
                value={configs[session].endTime}
                onChange={(e) => updateConfig("endTime", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="围栏中心纬度"
                  type="number"
                  step="0.000001"
                  value={configs[session].fenceCenterLat || ""}
                  onChange={(e) => updateConfig("fenceCenterLat", parseFloat(e.target.value) || 0)}
                />
                <Input
                  label="围栏中心经度"
                  type="number"
                  step="0.000001"
                  value={configs[session].fenceCenterLng || ""}
                  onChange={(e) => updateConfig("fenceCenterLng", parseFloat(e.target.value) || 0)}
                />
              </div>
              <Input
                label="围栏半径（米）"
                type="number"
                value={configs[session].fenceRadius || ""}
                onChange={(e) => updateConfig("fenceRadius", parseInt(e.target.value) || 0)}
              />
              <Input
                label="签到验证码"
                value={configs[session].verificationCode}
                onChange={(e) => updateConfig("verificationCode", e.target.value)}
                placeholder="留空则不使用验证码签到"
              />
              <Button onClick={saveConfig} loading={savingConfig} fullWidth>
                <Save className="w-4 h-4" />
                保存配置
              </Button>
            </div>
          </div>

          {/* GPS Helper */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h2 className="font-semibold text-lg text-gray-900">GPS围栏帮助</h2>
              <p className="text-sm text-gray-500 mt-1">如何获取GPS坐标</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">获取GPS坐标方法</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      1. 打开手机地图App（如高德地图）<br />
                      2. 长按签到地点标记位置<br />
                      3. 复制显示的经纬度坐标<br />
                      4. 粘贴到上方对应输入框
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">注意事项</p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      - 围栏半径建议设置为 100-500 米<br />
                      - 验证码建议使用 4-6 位数字<br />
                      - 签到时间需提前于活动开始时间
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
