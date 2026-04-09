"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  QrCode,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Navigation,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

type CheckinMethod = "GPS" | "QR" | "CODE";
type SessionType = "FIRST" | "SECOND";

interface CheckinSessionInfo {
  id: string;
  name: string;
  startTime: string;
  endTime: string | null;
  checkedIn: boolean;
  record?: { id: string; method: string; status: string; checkinTime: string } | null;
  config?: { startTime: string; endTime: string | null; hasFence: boolean; fenceCenterLat: number | null; fenceCenterLng: number | null; fenceRadius: number | null };
}

interface CheckinStatus {
  sessions: CheckinSessionInfo[];
  allRecords: { id: string; checkinSessionId: string; checkinSessionName: string; method: string; status: string; checkinTime: string }[];
  config?: { startTime: string; endTime: string | null; hasFence: boolean; fenceCenterLat: number | null; fenceCenterLng: number | null; fenceRadius: number | null };
}

const SESSION_LABELS: Record<SessionType, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

const METHOD_LABELS: Record<CheckinMethod, string> = {
  GPS: "GPS签到",
  QR: "扫码签到",
  CODE: "验证码签到",
};

// 独立组件 - 防止重新渲染导致焦点丢失
interface GpsCheckinCardProps {
  gpsCoords: { lat: number; lng: number } | null;
  gpsLoading: boolean;
  gpsError: string | null;
  distance: number | null;
  inFence: boolean | null;
  submitting: boolean;
  selectedSessionDetail: CheckinSessionInfo | null;
  onDetectLocation: () => void;
  onCheckin: () => void;
}

function GpsCheckinCard({ gpsCoords, gpsLoading, gpsError, distance, inFence, submitting, selectedSessionDetail, onDetectLocation, onCheckin }: GpsCheckinCardProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <Navigation className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">GPS 定位签到</p>
          <p className="text-blue-600">
            系统会自动检测您的位置，确认在签到范围内即可签到
          </p>
        </div>
      </div>

      {gpsLoading && (
        <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          正在获取位置...
        </div>
      )}

      {gpsError && (
        <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="text-sm text-red-700 font-medium">{gpsError}</p>
            <button
              onClick={onDetectLocation}
              className="text-sm text-red-600 underline mt-1"
            >
              重新定位
            </button>
          </div>
        </div>
      )}

      {gpsCoords && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-gray-100 rounded-xl h-40 lg:h-64 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100" />
            <div className="relative flex flex-col items-center">
              <MapPin className="w-8 h-8 text-red-600" />
              <span className="text-xs text-gray-600 mt-1 font-mono">
                {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
              </span>
            </div>
            <div className="absolute w-16 h-16 border-2 border-red-400/30 rounded-full animate-ping" />
          </div>

          {distance !== null && (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
              <span className="text-sm text-gray-500">距签到中心</span>
              <span className="font-semibold text-gray-900">{distance} 米</span>
            </div>
          )}

          {!selectedSessionDetail ? (
            <Button variant="primary" size="lg" fullWidth disabled>请先选择签到活动</Button>
          ) : inFence === true ? (
            <Button variant="primary" size="lg" fullWidth loading={submitting} onClick={onCheckin}><CheckCircle2 className="w-5 h-5" />可以签到</Button>
          ) : inFence === false ? (
            <div className="bg-red-50 rounded-xl p-4 text-center"><AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" /><p className="text-red-700 font-semibold">不在签到范围内</p><p className="text-sm text-red-500 mt-1">请靠近签到地点后再试</p></div>
          ) : (
            <Button variant="primary" size="lg" fullWidth loading={submitting} onClick={onCheckin}><MapPin className="w-5 h-5" />立即签到</Button>
          )}
        </motion.div>
      )}
    </div>
  );
}

interface QrCheckinCardProps {
  qrToken: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

function QrCheckinCard({ qrToken, onChange, onSubmit, submitting }: QrCheckinCardProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <QrCode className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">扫码签到</p>
          <p className="text-blue-600">
            请扫描活动现场的动态二维码，或手动输入二维码中的 Token
          </p>
        </div>
      </div>

      <Input
        label="Token"
        placeholder="请输入二维码中的 Token"
        value={qrToken}
        onChange={(e) => onChange(e.target.value)}
        leftIcon={<QrCode className="w-5 h-5" />}
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={!qrToken.trim()}
        onClick={onSubmit}
      >
        <CheckCircle2 className="w-5 h-5" />
        确认签到
      </Button>
    </div>
  );
}

interface CodeCheckinCardProps {
  code: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}

function CodeCheckinCard({ code, onChange, onSubmit, submitting }: CodeCheckinCardProps) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">验证码签到</p>
          <p className="text-blue-600">
            请输入现场工作人员展示的验证码
          </p>
        </div>
      </div>

      <Input
        label="验证码"
        placeholder="请输入验证码"
        value={code}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        leftIcon={<ShieldCheck className="w-5 h-5" />}
        maxLength={8}
        className="uppercase tracking-widest text-center text-xl font-mono"
      />

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={submitting}
        disabled={!code.trim()}
        onClick={onSubmit}
      >
        <CheckCircle2 className="w-5 h-5" />
        确认签到
      </Button>
    </div>
  );
}

export default function CheckinPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [selectedSession, setSelectedSession] = useState<SessionType>("FIRST");
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<CheckinSessionInfo | null>(null);
  const [activeTab, setActiveTab] = useState<CheckinMethod>("GPS");
  const [status, setStatus] = useState<CheckinStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);

  // GPS state
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [inFence, setInFence] = useState<boolean | null>(null);

  // QR state
  const [qrToken, setQrToken] = useState("");

  // Code state
  const [code, setCode] = useState("");

  // Fetch status
  const fetchStatus = useCallback(() => {
    if (sessionStatus !== "authenticated") return;
    
    const sessionToFetch = selectedSession;
    setLoading(true);
    setSelectedSessionDetail(null);
    
    fetch(`/api/checkin?session=${sessionToFetch}`)
      .then(res => res.json())
      .then(data => {
        if (data.sessions) {
          setStatus(data);
          if (data.sessions.length > 0) {
            const unchecked = data.sessions.find((s: CheckinSessionInfo) => !s.checkedIn);
            setSelectedSessionDetail(unchecked || data.sessions[0]);
          }
        } else {
          setStatus({ sessions: [], allRecords: [] });
        }
      })
      .catch(e => console.error("fetchStatus error:", e))
      .finally(() => setLoading(false));
  }, [sessionStatus, selectedSession]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const haversineDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const detectLocation = useCallback(() => {
    setGpsLoading(true);
    setGpsError(null);
    setGpsCoords(null);
    setDistance(null);
    setInFence(null);

    if (!navigator.geolocation) {
      setGpsError("您的浏览器不支持地理定位");
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setGpsCoords({ lat: latitude, lng: longitude });
        setGpsLoading(false);

        // 使用配置中的围栏中心坐标计算距离
        if (status?.config?.hasFence && status.config.fenceCenterLat && status.config.fenceCenterLng) {
          const dist = haversineDistance(
            latitude,
            longitude,
            status.config.fenceCenterLat,
            status.config.fenceCenterLng
          );
          setDistance(Math.round(dist));
          const radius = status.config.fenceRadius || 200;
          setInFence(dist <= radius);
        }
      },
      () => {
        setGpsError("无法获取位置信息，请允许定位权限");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [status, haversineDistance]);

  useEffect(() => {
    if (activeTab === "GPS" && !gpsCoords && !gpsLoading) {
      detectLocation();
    }
  }, [activeTab, gpsCoords, gpsLoading, detectLocation]);

  const handleGpsCheckin = async () => {
    if (!gpsCoords || !selectedSessionDetail) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GPS", lat: gpsCoords.lat, lng: gpsCoords.lng, session: selectedSession, checkinSessionId: selectedSessionDetail.id }),
      });
      const json = await res.json();
      if (!res.ok) { showError("签到失败", json.error); return; }
      setSuccessState(true); success("签到成功"); fetchStatus();
    } catch { showError("签到失败", "请稍后重试"); } finally { setSubmitting(false); }
  };

  const handleQrCheckin = async () => {
    if (!qrToken.trim() || !selectedSessionDetail) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "QR", qrToken: qrToken.trim(), session: selectedSession, checkinSessionId: selectedSessionDetail.id }),
      });
      const json = await res.json();
      if (!res.ok) { showError("签到失败", json.error); return; }
      setSuccessState(true); success("签到成功"); fetchStatus();
    } catch { showError("签到失败", "请稍后重试"); } finally { setSubmitting(false); }
  };

  const handleCodeCheckin = async () => {
    if (!code.trim() || !selectedSessionDetail) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "CODE", code: code.trim(), session: selectedSession, checkinSessionId: selectedSessionDetail.id }),
      });
      const json = await res.json();
      if (!res.ok) { showError("签到失败", json.error); return; }
      setSuccessState(true); success("签到成功"); fetchStatus();
    } catch { showError("签到失败", "请稍后重试"); } finally { setSubmitting(false); }
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <section className="py-8 pt-24 lg:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-lg transition-all duration-300"
          >
            {/* Session selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择场次
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["FIRST", "SECOND"] as SessionType[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSelectedSession(s); setSelectedSessionDetail(null); setSuccessState(false); setGpsCoords(null); setQrToken(""); setCode(""); }}
                    className={`p-3 rounded-xl border-2 text-center transition-all font-semibold hover:shadow-lg hover:-translate-y-0.5 duration-300 ${selectedSession === s ? "border-red-600 bg-red-50 text-red-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {SESSION_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Session detail selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择签到活动</label>
              {status?.sessions?.length === 0 && <div className="bg-yellow-50 rounded-xl p-4 text-center text-yellow-700">当前场次暂无签到活动</div>}
              {status?.sessions?.length > 0 && (
                <div className="grid grid-cols-1 gap-3">
                  {status.sessions.map((s) => (
                    <button key={s.id} onClick={() => { setSelectedSessionDetail(s); setSuccessState(false); setGpsCoords(null); setQrToken(""); setCode(""); }}
                      className={`p-3 rounded-xl border-2 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 duration-300 ${selectedSessionDetail?.id === s.id ? "border-red-600 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${s.checkedIn ? "text-green-600" : "text-gray-900"}`}>{s.checkedIn ? "✓ " : ""}{s.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(s.startTime).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        {s.checkedIn && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Already checked in */}
            <AnimatePresence mode="wait">
              {successState && selectedSessionDetail?.record ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }}>
                    <CheckCircle className="w-20 h-20 lg:w-24 lg:h-24 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">签到成功！</h2>
                  <p className="text-gray-500 mb-4">{selectedSessionDetail.name}</p>
                  <div className="space-y-3 mt-6 text-left max-w-sm mx-auto">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-gray-500 text-sm">签到状态</span>
                      <Badge variant={selectedSessionDetail.record.status === "LATE" ? "warning" : "success"} size="md">{selectedSessionDetail.record.status === "LATE" ? "迟到" : "准时"}</Badge>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-gray-500 text-sm">签到时间</span>
                      <span className="font-mono font-semibold text-gray-900">{new Date(selectedSessionDetail.record.checkinTime).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-gray-500 text-sm">签到方式</span>
                      <span className="font-semibold text-gray-900">{METHOD_LABELS[selectedSessionDetail.record.method as CheckinMethod]}</span>
                    </div>
                  </div>
                  <Button variant="ghost" className="mt-6" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4" />返回首页</Button>
                </motion.div>
              ) : (
                <motion.div
                  key="tabs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {/* Tab selector - mobile only */}
                  <div className="flex rounded-xl bg-gray-100 p-1 mb-6 lg:hidden">
                    {(
                      [
                        { key: "GPS", icon: MapPin, label: "GPS" },
                        { key: "QR", icon: QrCode, label: "扫码" },
                        { key: "CODE", icon: ShieldCheck, label: "验证码" },
                      ] as { key: CheckinMethod; icon: React.ElementType; label: string }[]
                    ).map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.key
                              ? "bg-white text-red-600 shadow-sm"
                              : "text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile: tabbed view */}
                  <div className="lg:hidden">
                    {activeTab === "GPS" && (
                      <GpsCheckinCard
                        gpsCoords={gpsCoords}
                        gpsLoading={gpsLoading}
                        gpsError={gpsError}
                        distance={distance}
                        inFence={inFence}
                        submitting={submitting}
                        onDetectLocation={detectLocation}
                        onCheckin={handleGpsCheckin}
                      />
                    )}
                    {activeTab === "QR" && (
                      <QrCheckinCard
                        qrToken={qrToken}
                        onChange={setQrToken}
                        onSubmit={handleQrCheckin}
                        submitting={submitting}
                      />
                    )}
                    {activeTab === "CODE" && (
                      <CodeCheckinCard
                        code={code}
                        onChange={setCode}
                        onSubmit={handleCodeCheckin}
                        submitting={submitting}
                      />
                    )}
                  </div>

                  {/* Desktop: 3-column layout */}
                  <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <GpsCheckinCard
                        gpsCoords={gpsCoords}
                        gpsLoading={gpsLoading}
                        gpsError={gpsError}
                        distance={distance}
                        inFence={inFence}
                        submitting={submitting}
                        onDetectLocation={detectLocation}
                        onCheckin={handleGpsCheckin}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <QrCheckinCard
                        qrToken={qrToken}
                        onChange={setQrToken}
                        onSubmit={handleQrCheckin}
                        submitting={submitting}
                      />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                      <CodeCheckinCard
                        code={code}
                        onChange={setCode}
                        onSubmit={handleCodeCheckin}
                        submitting={submitting}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Status info card */}
          {!successState && status?.checkedIn && status?.record && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 mt-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                当前签到状态
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">状态</span>
                  <Badge
                    variant={status.record.status === "LATE" ? "warning" : "success"}
                    size="md"
                  >
                    {status.record.status === "LATE" ? "已签到（迟到）" : "已签到（准时）"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">签到时间</span>
                  <span className="font-mono font-medium text-gray-900">
                    {new Date(status.record.checkinTime).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">签到方式</span>
                  <span className="font-medium text-gray-900">
                    {METHOD_LABELS[status.record.method as CheckinMethod]}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {!successState && !status?.checkedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6 mt-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-3 text-gray-500">
                <Clock className="w-5 h-5" />
                <span className="text-sm">当前场次尚未签到，请选择上方方式完成签到</span>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
