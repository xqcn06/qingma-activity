"use client";

import { useState, useEffect, useCallback } from "react";
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
  Loader2,
  ChevronDown,
  HardHat,
  Plus,
  Play,
  Square,
  Calendar,
  ChevronRight,
  X,
  ArrowLeft,
  Eye,
  FileDown,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type Session = "FIRST" | "SECOND";
type CheckinType = "student" | "staff";

interface CheckinSessionData {
  id: string;
  name: string;
  session: Session;
  userType: string;
  startTime: string;
  endTime: string | null;
  status: string;
  fenceCenterLat: number | null;
  fenceCenterLng: number | null;
  fenceRadius: number | null;
  verificationCode: string | null;
  createdAt: string;
  _count: { records: number };
}

const SESSION_LABELS: Record<Session, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

export default function AdminCheckin() {
  const { success, error: showError } = useToast();
  const [checkinType, setCheckinType] = useState<CheckinType>("student");
  const [session, setSession] = useState<Session>("FIRST");
  const [loading, setLoading] = useState(true);

  // Checkin sessions
  const [checkinSessions, setCheckinSessions] = useState<CheckinSessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<CheckinSessionData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // New session form
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionStartTime, setNewSessionStartTime] = useState("");
  const [newSessionEndTime, setNewSessionEndTime] = useState("");
  const [newSessionFenceLat, setNewSessionFenceLat] = useState("");
  const [newSessionFenceLng, setNewSessionFenceLng] = useState("");
  const [newSessionFenceRadius, setNewSessionFenceRadius] = useState("200");
  const [newSessionVerifyCode, setNewSessionVerifyCode] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);

  // Detail modal data
  const [detailRecords, setDetailRecords] = useState<any[]>([]);
  const [detailStats, setDetailStats] = useState<any>(null);
  const [detailUnchecked, setDetailUnchecked] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  // QR Code
  const [qrCode, setQrCode] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(0);

  // Search in detail
  const [detailSearch, setDetailSearch] = useState("");

  const userType = checkinType === "student" ? "STUDENT" : "STAFF";

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/checkin/sessions?session=${session}&userType=${userType}`);
      if (res.ok) {
        const data = await res.json();
        setCheckinSessions(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session, userType]);

  useEffect(() => {
    setLoading(true);
    fetchSessions();
  }, [fetchSessions]);

  // Fetch last config for auto-fill
  const fetchLastConfig = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/checkin/sessions?session=${session}&userType=${userType}&lastConfig=1`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.fenceCenterLat) setNewSessionFenceLat(String(data.fenceCenterLat));
          if (data.fenceCenterLng) setNewSessionFenceLng(String(data.fenceCenterLng));
          if (data.fenceRadius) setNewSessionFenceRadius(String(data.fenceRadius));
          if (data.verificationCode) setNewSessionVerifyCode(data.verificationCode);
        }
      }
    } catch {
      // ignore
    }
  }, [session, userType]);

  // Fetch detail data
  const fetchDetailData = useCallback(async (checkinSessionId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/checkin/records?session=${session}&checkinSessionId=${checkinSessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (checkinType === "student") {
          setDetailRecords(data.studentRecords || []);
          setDetailStats(data.studentStats || null);
          setDetailUnchecked(data.uncheckedStudents || []);
        } else {
          setDetailRecords(data.staffRecords || []);
          setDetailStats(data.staffStats || null);
          setDetailUnchecked(data.uncheckedStaff || []);
        }
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  }, [session, checkinType]);

  // Open detail modal
  const openDetail = async (cs: CheckinSessionData) => {
    setSelectedSession(cs);
    setShowDetailModal(true);
    await fetchDetailData(cs.id);
    generateQRCode(cs.id);
  };

  // Delete checkin record
  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("确定删除此签到记录？")) return;
    try {
      const res = await fetch(`/api/admin/checkin/records?id=${recordId}`, { method: "DELETE" });
      if (res.ok) {
        success("签到记录已删除");
        if (selectedSession) fetchDetailData(selectedSession.id);
      } else {
        const err = await res.json();
        showError("删除失败", err.error);
      }
    } catch { showError("删除失败"); }
  };

  // Delete checkin session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("确定删除此签到活动？所有相关签到记录也会被删除。")) return;
    try {
      const res = await fetch(`/api/admin/checkin/sessions?id=${sessionId}`, { method: "DELETE" });
      if (res.ok) {
        success("签到活动已删除");
        fetchSessions();
      } else {
        const err = await res.json();
        showError("删除失败", err.error);
      }
    } catch { showError("删除失败"); }
  };

  // Create session
  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      showError("请输入签到活动名称");
      return;
    }
    if (!newSessionStartTime) {
      showError("请选择签到开始时间");
      return;
    }
    setCreatingSession(true);
    try {
      const res = await fetch("/api/admin/checkin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSessionName.trim(),
          session,
          userType,
          startTime: newSessionStartTime,
          endTime: newSessionEndTime || null,
          fenceCenterLat: newSessionFenceLat ? parseFloat(newSessionFenceLat) : null,
          fenceCenterLng: newSessionFenceLng ? parseFloat(newSessionFenceLng) : null,
          fenceRadius: newSessionFenceRadius ? parseInt(newSessionFenceRadius) : null,
          verificationCode: newSessionVerifyCode || null,
        }),
      });
      if (res.ok) {
        success("签到活动已创建");
        setShowNewSessionModal(false);
        resetNewSessionForm();
        fetchSessions();
      } else {
        const err = await res.json();
        showError("创建失败", err.error);
      }
    } catch {
      showError("创建失败");
    } finally {
      setCreatingSession(false);
    }
  };

  const resetNewSessionForm = () => {
    setNewSessionName("");
    setNewSessionStartTime("");
    setNewSessionEndTime("");
    setNewSessionFenceLat("");
    setNewSessionFenceLng("");
    setNewSessionFenceRadius("200");
    setNewSessionVerifyCode("");
  };

  const openNewSessionModal = () => {
    resetNewSessionForm();
    fetchLastConfig();
    setShowNewSessionModal(true);
  };

  // End session
  const handleEndSession = async (id: string) => {
    try {
      const res = await fetch("/api/admin/checkin/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ENDED", endTime: new Date().toISOString() }),
      });
      if (res.ok) {
        success("签到活动已结束");
        fetchSessions();
        if (selectedSession?.id === id) {
          setShowDetailModal(false);
          setSelectedSession(null);
        }
      }
    } catch {
      showError("操作失败");
    }
  };

  // Manual checkin
  const handleManualCheckin = async () => {
    if (!manualId.trim() || !selectedSession) return;
    setManualLoading(true);
    try {
      const res = await fetch("/api/admin/checkin/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: manualId.trim(),
          session,
          checkinSessionId: selectedSession.id,
        }),
      });
      if (res.ok) {
        success("签到成功");
        setManualId("");
        fetchDetailData(selectedSession.id);
        fetchSessions();
      } else {
        const json = await res.json();
        showError("签到失败", json.error);
      }
    } catch {
      showError("签到失败");
    } finally {
      setManualLoading(false);
    }
  };

  // QR Code
  const generateQRCode = async (checkinSessionId?: string) => {
    setQrLoading(true);
    try {
      const res = await fetch("/api/admin/checkin/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          userType,
          checkinSessionId: checkinSessionId || selectedSession?.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setQrCode(data.data);
        setQrCountdown(data.data.countdown || 60);
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
    } else if (qrCode && qrCountdown === 0 && showDetailModal) {
      generateQRCode(selectedSession?.id);
    }
  }, [qrCountdown, qrCode, showDetailModal, selectedSession]);

  // Export
  const handleExport = async (mode: string = "current") => {
    try {
      const res = await fetch("/api/admin/checkin/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          userType: checkinType === "student" ? "STUDENT" : "STAFF",
          checkinSessionId: mode === "current" ? selectedSession?.id : null,
          exportMode: mode,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Read filename from Content-Disposition header if available
        const disposition = res.headers.get("Content-Disposition");
        let fileName = `签到记录_${checkinType === "student" ? "学生" : "工作人员"}_${SESSION_LABELS[session]}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        if (disposition) {
          const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
          if (match) fileName = decodeURIComponent(match[1].replace(/"/g, ""));
        }
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
        success("导出成功");
      } else {
        const err = await res.json().catch(() => ({}));
        showError("导出失败", err.error || "未知错误");
      }
    } catch (e: any) {
      showError("导出失败", e.message);
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    const svg = document.getElementById("checkin-qrcode");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `签到二维码_${selectedSession?.name || ""}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Filter records in detail
  const filteredRecords = detailRecords.filter((r) => {
    if (!detailSearch) return true;
    const name = r.user?.name || "";
    const studentId = r.user?.studentId || "";
    return name.includes(detailSearch) || studentId.includes(detailSearch);
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">签到管理</h1>
          <p className="text-gray-500 mt-1">发起签到活动、查看签到记录、导出签到数据</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSession(session === "FIRST" ? "SECOND" : "FIRST")}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            {SESSION_LABELS[session]}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
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
              学生
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
              工作人员
            </button>
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-gray-900">
              {SESSION_LABELS[session]} · {checkinType === "student" ? "学生" : "工作人员"}签到活动
            </h2>
            <p className="text-sm text-gray-500 mt-1">点击签到活动查看详情</p>
          </div>
          <Button onClick={openNewSessionModal}>
            <Plus className="w-4 h-4" />
            发起新签到
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : checkinSessions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            暂无签到活动，点击上方按钮发起
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {checkinSessions.map((cs) => (
              <div
                key={cs.id}
                onClick={() => openDetail(cs)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    cs.status === "ACTIVE" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {cs.status === "ACTIVE" ? <Play className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cs.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(cs.startTime).toLocaleString("zh-CN")} · {cs._count.records}人已签到
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cs.verificationCode && (
                    <Badge variant="info" size="sm">验证码: {cs.verificationCode}</Badge>
                  )}
                  <Badge variant={cs.status === "ACTIVE" ? "success" : "default"} size="sm">
                    {cs.status === "ACTIVE" ? "进行中" : "已结束"}
                  </Badge>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(cs.id); }} className="text-red-500 hover:text-red-700 text-sm">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Session Modal */}
      <Modal
        open={showNewSessionModal}
        onClose={() => { setShowNewSessionModal(false); resetNewSessionForm(); }}
        title="发起新签到"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              场次：{SESSION_LABELS[session]} · 类型：{checkinType === "student" ? "学生" : "工作人员"}
            </p>
          </div>

          <Input
            label="签到活动名称"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="如：上午签到、下午签到、开幕式签到"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="签到开始时间"
              type="datetime-local"
              value={newSessionStartTime}
              onChange={(e) => setNewSessionStartTime(e.target.value)}
            />
            <Input
              label="签到结束时间（可选）"
              type="datetime-local"
              value={newSessionEndTime}
              onChange={(e) => setNewSessionEndTime(e.target.value)}
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">签到规则配置</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="围栏中心纬度"
                type="number"
                step="0.000001"
                value={newSessionFenceLat}
                onChange={(e) => setNewSessionFenceLat(e.target.value)}
                placeholder="如：38.912345"
              />
              <Input
                label="围栏中心经度"
                type="number"
                step="0.000001"
                value={newSessionFenceLng}
                onChange={(e) => setNewSessionFenceLng(e.target.value)}
                placeholder="如：121.512345"
              />
            </div>
            <div className="mt-3">
              <Input
                label="围栏半径（米）"
                type="number"
                value={newSessionFenceRadius}
                onChange={(e) => setNewSessionFenceRadius(e.target.value)}
                placeholder="建议 100-500 米"
              />
            </div>
            <div className="mt-3">
              <Input
                label="签到验证码（可选）"
                value={newSessionVerifyCode}
                onChange={(e) => setNewSessionVerifyCode(e.target.value)}
                placeholder="留空则不使用验证码"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowNewSessionModal(false); resetNewSessionForm(); }} fullWidth>取消</Button>
            <Button onClick={handleCreateSession} loading={creatingSession} fullWidth>
              <Play className="w-4 h-4" />
              发起签到
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedSession(null); setQrCode(null); }}
        title=""
        size="xl"
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedSession.name}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {SESSION_LABELS[selectedSession.session]} · {checkinType === "student" ? "学生" : "工作人员"} · {new Date(selectedSession.startTime).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSession.status === "ACTIVE" && (
                  <Button variant="danger" size="sm" onClick={() => handleEndSession(selectedSession.id)}>
                    <Square className="w-3.5 h-3.5" />
                    结束签到
                  </Button>
                )}
                <div className="relative group">
                  <Button variant="secondary" size="sm">
                    <Download className="w-3.5 h-3.5" />
                    导出
                  </Button>
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden hidden group-hover:block">
                    <button onClick={() => handleExport("current")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700">当前活动记录</button>
                    <button onClick={() => handleExport("session")} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700">本场次全部</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {detailStats && (
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: "总人数", value: detailStats.total, icon: Users, color: "bg-blue-50 text-blue-600" },
                  { label: "已签到", value: detailStats.checked, icon: UserCheck, color: "bg-green-50 text-green-600" },
                  { label: "准时", value: detailStats.onTime, icon: Clock, color: "bg-emerald-50 text-emerald-600" },
                  { label: "迟到", value: detailStats.late, icon: AlertTriangle, color: "bg-yellow-50 text-yellow-600" },
                  { label: "缺勤", value: detailStats.absent, icon: UserX, color: "bg-red-50 text-red-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Checkin */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleManualCheckin()}
                  placeholder="输入学号手动签到"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none"
                />
              </div>
              <Button size="sm" onClick={handleManualCheckin} loading={manualLoading}>
                <UserCheck className="w-4 h-4" />
                签到
              </Button>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                {qrCode ? (
                  <QRCodeSVG
                    id="checkin-qrcode"
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/checkin?token=${qrCode.token}&session=${session}&userType=${userType}&checkinSessionId=${selectedSession.id}`}
                    size={120}
                    level="H"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] flex items-center justify-center text-gray-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className={`w-4 h-4 ${qrCountdown > 0 ? "animate-spin" : ""}`} />
                  <span className="text-sm text-gray-600">{qrCountdown}秒后自动刷新</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">扫码签到 · 60秒有效</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => generateQRCode(selectedSession.id)} loading={qrLoading}>
                    刷新二维码
                  </Button>
                  <Button size="sm" variant="secondary" onClick={downloadQRCode}>
                    <FileDown className="w-3.5 h-3.5" />
                    下载
                  </Button>
                </div>
              </div>
            </div>

            {/* Records Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">签到记录 ({filteredRecords.length}人)</h3>
                <input
                  type="text"
                  value={detailSearch}
                  onChange={(e) => setDetailSearch(e.target.value)}
                  placeholder="搜索姓名/学号"
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none w-48"
                />
              </div>
              {detailLoading ? (
                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" /></div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">暂无签到记录</div>
              ) : (
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">姓名</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">学号</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          {checkinType === "student" ? "班级" : "岗位"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">签到时间</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">状态</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredRecords.map((record: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50/50">
                          <td className="px-3 py-2 text-sm text-gray-900">{record.user?.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500 font-mono">{record.user?.studentId}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {checkinType === "student" ? record.user?.className : record.user?.phone}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {new Date(record.checkedAt).toLocaleTimeString("zh-CN")}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={record.status === "ON_TIME" ? "success" : record.status === "LATE" ? "warning" : "danger"} size="sm">
                              {record.status === "ON_TIME" ? "准时" : record.status === "LATE" ? "迟到" : "缺勤"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => handleDeleteRecord(record.id)} className="text-red-500 hover:text-red-700 text-sm">删除</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unchecked List */}
            {detailUnchecked.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  未签到人员 ({detailUnchecked.length}人)
                </h3>
                <div className="overflow-x-auto max-h-40 overflow-y-auto bg-gray-50 rounded-xl">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">姓名</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">学号</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                          {checkinType === "student" ? "班级" : "岗位"}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {detailUnchecked.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                          <td className="px-3 py-2 text-sm text-gray-500 font-mono">{item.studentId}</td>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {checkinType === "student" ? item.className : item.roleName}
                          </td>
                          <td className="px-3 py-2">
                            <button onClick={() => { setManualId(item.studentId); handleManualCheckin(); }} className="text-blue-500 hover:text-blue-700 text-sm">签到</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
