"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Repeat,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  Edit2,
  Save,
  X,
  Trash2,
  ChevronRight,
  Filter,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

const STATION_LABELS: Record<string, string> = {
  LISTEN_COMMAND: "听我口令",
  DODGEBALL: "躲避球",
  CODE_BREAK: "密码破译",
  NO_TOUCH_GROUND: "别碰地面",
};

const STATION_COLORS: Record<string, string> = {
  LISTEN_COMMAND: "bg-blue-50 border-blue-200",
  DODGEBALL: "bg-amber-50 border-amber-200",
  CODE_BREAK: "bg-purple-50 border-purple-200",
  NO_TOUCH_GROUND: "bg-green-50 border-green-200",
};

export default function RotationPage() {
  const [activeTab, setActiveTab] = useState<"schedule" | "generate" | "adjust">("schedule");
  const [session, setSession] = useState<string>("FIRST");
  const [schedules, setSchedules] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{ round: number; station: string } | null>(null);
  const [editTeamA, setEditTeamA] = useState("");
  const [editTeamB, setEditTeamB] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });
  const [swapping, setSwapping] = useState<{
    from: { round: number; station: string } | null;
  }>({ from: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/rotation?session=${session}`),
        fetch("/api/teams"),
      ]);
      if (schedRes.ok) setSchedules(await schedRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
    } catch {
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sessionTeams = teams.filter((t) => t.session === session);
  const rounds = [1, 2, 3, 4];
  const stations = Object.keys(STATION_LABELS);

  const getCellData = (round: number, station: string) => {
    return schedules.find(
      (s) => s.round === round && s.station === station
    );
  };

  const stats = {
    total: schedules.length,
    completed: schedules.filter((s) => s.completed).length,
    rounds: rounds.length,
    completedRounds: rounds.filter((r) =>
      schedules.filter((s) => s.round === r).every((s) => s.completed)
    ).length,
    stationsReady: stations.filter((st) =>
      schedules.filter((s) => s.station === st).every((s) => s.completed)
    ).length,
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/rotation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session }),
      });
      const data = await res.json();
      if (res.ok) {
        setPreview(data.schedules);
        setActiveTab("schedule");
        fetchData();
      } else {
        alert(data.error || "生成失败");
      }
    } catch {
      alert("生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleComplete = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/rotation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !current }),
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const handleDeleteSchedule = async (id: string) => {
    setConfirmModal({
      open: true,
      title: "确认删除",
      message: "确定要删除该场次的所有排班吗？此操作不可恢复。",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        try {
          const toDelete = schedules.filter((s) => s.session === session);
          await Promise.all(
            toDelete.map((s) =>
              fetch(`/api/admin/rotation?id=${s.id}`, { method: "DELETE" })
            )
          );
          fetchData();
        } catch {}
      },
    });
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    const cell = getCellData(editingCell.round, editingCell.station);
    if (!cell) return;

    try {
      const res = await fetch("/api/admin/rotation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cell.id,
          teamAId: editTeamA,
          teamBId: editTeamB,
        }),
      });
      if (res.ok) {
        setEditingCell(null);
        fetchData();
      }
    } catch {}
  };

  const handleSwapStart = (round: number, station: string) => {
    if (!swapping.from) {
      setSwapping({ from: { round, station } });
    } else {
      if (
        swapping.from.round === round &&
        swapping.from.station === station
      ) {
        setSwapping({ from: null });
        return;
      }

      const cellA = getCellData(swapping.from.round, swapping.from.station);
      const cellB = getCellData(round, station);

      if (!cellA || !cellB) {
        setSwapping({ from: null });
        return;
      }

      Promise.all([
        fetch("/api/admin/rotation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cellA.id,
            teamAId: cellB.teamAId,
            teamBId: cellB.teamBId,
          }),
        }),
        fetch("/api/admin/rotation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: cellB.id,
            teamAId: cellA.teamAId,
            teamBId: cellA.teamBId,
          }),
        }),
      ]).then(() => {
        setSwapping({ from: null });
        fetchData();
      });
    }
  };

  const startEdit = (round: number, station: string) => {
    const cell = getCellData(round, station);
    if (!cell) return;
    setEditingCell({ round, station });
    setEditTeamA(cell.teamAId);
    setEditTeamB(cell.teamBId);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">轮转排班</h1>
        <p className="text-gray-500 mt-1">管理4个游戏站的轮转顺序和对抗配对</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">总排班数</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已完成</p>
              <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <span className="text-sm font-bold text-purple-600">{stats.completedRounds}/{stats.rounds}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">完成轮次</p>
              <p className="text-sm font-bold text-gray-900">{stats.completedRounds} 轮</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-sm font-bold text-amber-600">{stats.stationsReady}/{stations.length}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">就绪站点</p>
              <p className="text-sm font-bold text-gray-900">{stats.stationsReady} 个</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600">{sessionTeams.length}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">参赛队伍</p>
              <p className="text-sm font-bold text-gray-900">{sessionTeams.length} 支</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex gap-1">
            {[
              { key: "schedule" as const, label: "排班表" },
              { key: "generate" as const, label: "生成排班" },
              { key: "adjust" as const, label: "手动调整" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-red-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                <option value="FIRST">第一场</option>
                <option value="SECOND">第二场</option>
              </select>
            </div>
            {schedules.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteSchedule("")}
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空排班
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : activeTab === "schedule" ? (
          <div className="p-4">
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无排班数据，请切换到"生成排班"选项卡</p>
              </div>
            ) : (
              <>
                {/* 桌面端表格 */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                          轮次
                        </th>
                        {stations.map((st) => (
                          <th key={st} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {STATION_LABELS[st]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rounds.map((round) => (
                        <tr key={round} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <Badge
                              variant={
                                schedules
                                  .filter((s) => s.round === round)
                                  .every((s) => s.completed)
                                  ? "success"
                                  : "default"
                              }
                            >
                              第{round}轮
                            </Badge>
                          </td>
                          {stations.map((station) => {
                            const cell = getCellData(round, station);
                            const isEditing =
                              editingCell?.round === round &&
                              editingCell?.station === station;
                            const isSwapSource =
                              swapping.from?.round === round &&
                              swapping.from?.station === station;

                            return (
                              <td
                                key={station}
                                className={`px-4 py-4 ${STATION_COLORS[station]} border rounded-lg m-1`}
                              >
                                {cell ? (
                                  <div className="space-y-2">
                                    {isEditing ? (
                                      <div className="space-y-2">
                                        <select
                                          value={editTeamA}
                                          onChange={(e) => setEditTeamA(e.target.value)}
                                          className="w-full text-xs px-2 py-1 rounded border border-gray-200"
                                        >
                                          {sessionTeams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                              {t.name}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="text-center text-xs text-gray-400">VS</div>
                                        <select
                                          value={editTeamB}
                                          onChange={(e) => setEditTeamB(e.target.value)}
                                          className="w-full text-xs px-2 py-1 rounded border border-gray-200"
                                        >
                                          {sessionTeams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                              {t.name}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="flex gap-1">
                                          <button
                                            onClick={handleSaveEdit}
                                            className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700"
                                          >
                                            <Save className="w-3 h-3 inline mr-1" />
                                            保存
                                          </button>
                                          <button
                                            onClick={() => setEditingCell(null)}
                                            className="flex-1 text-xs bg-gray-200 text-gray-600 py-1 rounded hover:bg-gray-300"
                                          >
                                            <X className="w-3 h-3 inline mr-1" />
                                            取消
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <div className="text-xs font-medium text-gray-900">
                                            {cell.teamA?.name || "未知"}
                                          </div>
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() =>
                                                startEdit(round, station)
                                              }
                                              className="p-0.5 text-gray-400 hover:text-blue-600"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleSwapStart(round, station)
                                              }
                                              className={`p-0.5 ${
                                                isSwapSource
                                                  ? "text-red-600"
                                                  : "text-gray-400 hover:text-amber-600"
                                              }`}
                                            >
                                              <Repeat className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="text-center text-xs text-gray-400 font-medium">
                                          VS
                                        </div>
                                        <div className="text-xs font-medium text-gray-900">
                                          {cell.teamB?.name || "未知"}
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleToggleComplete(
                                              cell.id,
                                              cell.completed
                                            )
                                          }
                                          className={`w-full text-xs py-1 rounded-full flex items-center justify-center gap-1 ${
                                            cell.completed
                                              ? "bg-green-100 text-green-700"
                                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                          }`}
                                        >
                                          {cell.completed ? (
                                            <>
                                              <CheckCircle2 className="w-3 h-3" />
                                              已完成
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="w-3 h-3" />
                                              未完成
                                            </>
                                          )}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-gray-400 py-4">
                                    未排班
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 手机端卡片列表 */}
                <div className="lg:hidden space-y-4">
                  {rounds.map((round) => (
                    <div key={round} className="bg-white rounded-xl shadow-sm p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant={
                            schedules
                              .filter((s) => s.round === round)
                              .every((s) => s.completed)
                              ? "success"
                              : "default"
                          }
                        >
                          第{round}轮
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {stations.map((station) => {
                          const cell = getCellData(round, station);
                          const isEditing =
                            editingCell?.round === round &&
                            editingCell?.station === station;
                          const isSwapSource =
                            swapping.from?.round === round &&
                            swapping.from?.station === station;

                          return (
                            <div key={station} className={`${STATION_COLORS[station]} border rounded-lg p-3`}>
                              <p className="text-xs font-medium text-gray-700 mb-2">{STATION_LABELS[station]}</p>
                              {cell ? (
                                isEditing ? (
                                  <div className="space-y-2">
                                    <select
                                      value={editTeamA}
                                      onChange={(e) => setEditTeamA(e.target.value)}
                                      className="w-full text-xs px-2 py-1 rounded border border-gray-200"
                                    >
                                      {sessionTeams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                    <div className="text-center text-xs text-gray-400">VS</div>
                                    <select
                                      value={editTeamB}
                                      onChange={(e) => setEditTeamB(e.target.value)}
                                      className="w-full text-xs px-2 py-1 rounded border border-gray-200"
                                    >
                                      {sessionTeams.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                      ))}
                                    </select>
                                    <div className="flex gap-1">
                                      <button onClick={handleSaveEdit} className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700"><Save className="w-3 h-3 inline mr-1" />保存</button>
                                      <button onClick={() => setEditingCell(null)} className="flex-1 text-xs bg-gray-200 text-gray-600 py-1 rounded hover:bg-gray-300"><X className="w-3 h-3 inline mr-1" />取消</button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="text-xs font-medium text-gray-900">{cell.teamA?.name || "未知"}</div>
                                    <div className="text-center text-xs text-gray-400">VS</div>
                                    <div className="text-xs font-medium text-gray-900">{cell.teamB?.name || "未知"}</div>
                                    <div className="flex gap-2 mt-2">
                                      <button onClick={() => startEdit(round, station)} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit2 className="w-3 h-3 inline mr-1" />编辑</button>
                                      <button onClick={() => handleSwapStart(round, station)} className={`text-xs px-2 py-1 rounded ${isSwapSource ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600 hover:bg-amber-100"}`}>
                                        <Repeat className="w-3 h-3 inline mr-1" />{isSwapSource ? "已选中" : "交换"}
                                      </button>
                                      <button onClick={() => handleToggleComplete(cell.id, cell.completed)} className={`flex-1 text-xs py-1 rounded-full flex items-center justify-center gap-1 ${cell.completed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                        {cell.completed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {cell.completed ? "已完成" : "未完成"}
                                      </button>
                                    </div>
                                  </>
                                )
                              ) : (
                                <div className="text-center text-xs text-gray-400 py-2">未排班</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : activeTab === "generate" ? (
          <div className="p-6">
            {schedules.length > 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                <p className="text-gray-600 mb-4">
                  该场次已有排班数据，如需重新生成请先清空现有排班
                </p>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteSchedule("")}
                >
                  <Trash2 className="w-4 h-4" />
                  清空现有排班
                </Button>
              </div>
            ) : sessionTeams.length !== 8 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                <p className="text-gray-600 mb-2">
                  当前场次有 {sessionTeams.length} 支队伍，需要 8 支队伍才能生成排班
                </p>
                <p className="text-sm text-gray-400">
                  请先完成分组和抽签对抗
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-red-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  自动生成排班
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  将为 {session === "FIRST" ? "第一场" : "第二场"} 的
                  {sessionTeams.length} 支队伍生成 4 轮 × 4 站点的完整排班表
                </p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      生成排班
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            {schedules.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Repeat className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无排班数据，请先生成排班</p>
              </div>
            ) : (
              <div>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  点击"交换"按钮选择第一个单元格，再点击另一个单元格完成交换
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                          轮次
                        </th>
                        {stations.map((st) => (
                          <th key={st} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {STATION_LABELS[st]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rounds.map((round) => (
                        <tr key={round}>
                          <td className="px-4 py-4">
                            <Badge>第{round}轮</Badge>
                          </td>
                          {stations.map((station) => {
                            const cell = getCellData(round, station);
                            const isSwapSource =
                              swapping.from?.round === round &&
                              swapping.from?.station === station;

                            return (
                              <td
                                key={station}
                                className={`px-4 py-4 ${STATION_COLORS[station]} border rounded-lg m-1 ${
                                  isSwapSource ? "ring-2 ring-red-400" : ""
                                }`}
                              >
                                {cell ? (
                                  <div className="space-y-2">
                                    <div className="text-xs font-medium text-gray-900">
                                      {cell.teamA?.name || "未知"}
                                    </div>
                                    <div className="text-center text-xs text-gray-400">VS</div>
                                    <div className="text-xs font-medium text-gray-900">
                                      {cell.teamB?.name || "未知"}
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleSwapStart(round, station)
                                      }
                                      className={`w-full text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-colors ${
                                        isSwapSource
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-700"
                                      }`}
                                    >
                                      <Repeat className="w-3 h-3" />
                                      {isSwapSource ? "已选中" : "交换"}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-gray-400 py-4">
                                    未排班
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        title={confirmModal.title}
        size="sm"
      >
        <p className="text-gray-600 mb-6">{confirmModal.message}</p>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
          >
            取消
          </Button>
          <Button variant="danger" onClick={confirmModal.onConfirm}>
            确认
          </Button>
        </div>
      </Modal>
    </div>
  );
}
