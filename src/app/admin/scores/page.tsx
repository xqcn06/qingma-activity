"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trophy, Search, BarChart3, Loader2, Edit2, Trash2, AlertCircle, ClipboardList, History, Users } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

const SESSION_LABELS: Record<string, string> = {
  FIRST: "第一场（大一）",
  SECOND: "第二场（大二）",
};

const STATION_LABELS: Record<string, string> = {
  LISTEN_COMMAND: "听我口令",
  DODGEBALL: "躲避球",
  CODE_BREAK: "密码破译",
  NO_TOUCH_GROUND: "别碰地面",
  TREASURE_HUNT: "寻宝赛",
};

const STATION_SCORING_RULES: Record<string, string[]> = {
  LISTEN_COMMAND: [
    "胜方：+3分",
    "负方：0分",
    "平局：各+1分",
  ],
  DODGEBALL: [
    "胜方：+1分",
    "负方：0分",
    "注：小分不计入总分",
  ],
  CODE_BREAK: [
    "完成3个段落：+2分",
    "全部完成：+1分",
    "最先完成：+3分",
  ],
  NO_TOUCH_GROUND: [
    "第一名：+2分",
    "第二名：0分",
    "平局：加赛决胜负",
  ],
};

const ROUNDS = [1, 2, 3, 4];

export default function AdminScores() {
  const [activeTab, setActiveTab] = useState<"entry" | "ranking" | "history">("entry");
  const [scores, setScores] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [rotation, setRotation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  const [entrySession, setEntrySession] = useState("");
  const [entryStation, setEntryStation] = useState("");
  const [entryRound, setEntryRound] = useState("");
  const [entryScoreA, setEntryScoreA] = useState("");
  const [entryScoreB, setEntryScoreB] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [entryLoading, setEntryLoading] = useState(false);

  const [rankingSession, setRankingSession] = useState("");

  const [historySession, setHistorySession] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editScore, setEditScore] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scoresRes, teamsRes, rotationRes] = await Promise.all([
        fetch("/api/admin/scores"),
        fetch("/api/admin/teams"),
        fetch("/api/admin/rotation"),
      ]);
      if (scoresRes.ok) setScores(await scoresRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
      if (rotationRes.ok) setRotation(await rotationRes.json());
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const sessionFilteredRotation = useMemo(() => {
    if (!entrySession) return rotation;
    return rotation.filter((r: any) => r.session === entrySession);
  }, [rotation, entrySession]);

  const competingTeams = useMemo(() => {
    if (!entrySession || !entryStation || !entryRound) return null;
    const match = sessionFilteredRotation.find(
      (r: any) => r.station === entryStation && r.round === parseInt(entryRound)
    );
    if (!match) return null;
    return {
      teamA: match.teamA,
      teamB: match.teamB,
    };
  }, [entrySession, entryStation, entryRound, sessionFilteredRotation]);

  const ranking = useMemo(() => {
    let filteredTeams = teams;
    if (rankingSession) {
      filteredTeams = teams.filter((t) => t.session === rankingSession);
    }
    return filteredTeams
      .map((t) => ({
        id: t.id,
        name: t.name,
        session: t.session,
        totalScore: t.totalScore + t.treasureScore,
        stationBreakdown: {} as Record<string, number>,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [teams, rankingSession]);

  const stationBreakdown = useMemo(() => {
    const breakdown: Record<string, Record<string, number>> = {};
    scores.forEach((s) => {
      if (!breakdown[s.teamId]) breakdown[s.teamId] = {};
      if (!breakdown[s.teamId][s.station]) breakdown[s.teamId][s.station] = 0;
      breakdown[s.teamId][s.station] += s.score;
    });
    return breakdown;
  }, [scores]);

  const filteredHistory = useMemo(() => {
    return scores.filter((s) => {
      if (historySession && s.team?.session !== historySession) return false;
      if (!search) return true;
      return s.team.name.includes(search);
    });
  }, [scores, search, historySession]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return filteredHistory.slice(start, start + HISTORY_PAGE_SIZE);
  }, [filteredHistory, historyPage]);

  const totalHistoryPages = Math.ceil(filteredHistory.length / HISTORY_PAGE_SIZE);

  const stats = useMemo(() => {
    const completedStations = new Set(scores.map((s) => `${s.station}-${s.round}`)).size;
    const topTeam = ranking.length > 0 ? ranking[0] : null;
    return {
      totalEntries: scores.length,
      topTeam,
      completedStations,
    };
  }, [scores, ranking]);

  const handleEntrySubmit = async () => {
    if (!competingTeams || !entryStation) return;
    setEntryLoading(true);
    try {
      const scoreA = parseInt(entryScoreA);
      const scoreB = parseInt(entryScoreB);

      const resA = await fetch("/api/admin/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: competingTeams.teamA.id,
          station: entryStation,
          round: parseInt(entryRound),
          score: isNaN(scoreA) ? 0 : scoreA,
          reason: entryReason || undefined,
        }),
      });

      const resB = await fetch("/api/admin/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: competingTeams.teamB.id,
          station: entryStation,
          round: parseInt(entryRound),
          score: isNaN(scoreB) ? 0 : scoreB,
          reason: entryReason || undefined,
        }),
      });

      if (resA.ok && resB.ok) {
        setEntryScoreA("");
        setEntryScoreB("");
        setEntryReason("");
        fetchData();
      }
    } finally {
      setEntryLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editData) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editData.id,
          score: parseInt(editScore),
          reason: editReason || null,
        }),
      });
      if (res.ok) {
        setEditModal(false);
        fetchData();
      }
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条积分记录吗？")) return;
    const res = await fetch(`/api/admin/scores?id=${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const openEdit = (score: any) => {
    setEditData(score);
    setEditScore(String(score.score));
    setEditReason(score.reason || "");
    setEditModal(true);
  };

  const tabs = [
    { key: "entry" as const, label: "积分录入", icon: ClipboardList },
    { key: "ranking" as const, label: "积分排行", icon: Trophy },
    { key: "history" as const, label: "录入历史", icon: History },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">积分管理</h1>
        <p className="text-gray-500 mt-1">录入和管理各队积分</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
            <p className="text-xs text-gray-500">总录入条数</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.topTeam?.name || "-"}</p>
            <p className="text-xs text-gray-500">当前领先 ({stats.topTeam?.totalScore || 0}分)</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedStations}</p>
            <p className="text-xs text-gray-500">已完成场次</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-red-600 text-red-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : (
        <>
          {activeTab === "entry" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-900 mb-4">录入积分</h2>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">场次</label>
                    <select
                      value={entrySession}
                      onChange={(e) => { setEntrySession(e.target.value); setEntryStation(""); setEntryRound(""); setEntryScoreA(""); setEntryScoreB(""); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                    >
                      <option value="">选择场次</option>
                      {Object.entries(SESSION_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">游戏站</label>
                    <select
                      value={entryStation}
                      onChange={(e) => { setEntryStation(e.target.value); setEntryRound(""); setEntryScoreA(""); setEntryScoreB(""); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                      disabled={!entrySession}
                    >
                      <option value="">选择游戏站</option>
                      {Object.entries(STATION_LABELS).filter(([k]) => k !== "TREASURE_HUNT").map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">轮次</label>
                    <select
                      value={entryRound}
                      onChange={(e) => { setEntryRound(e.target.value); setEntryScoreA(""); setEntryScoreB(""); }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                      disabled={!entryStation}
                    >
                      <option value="">选择轮次</option>
                      {ROUNDS.map((r) => (
                        <option key={r} value={r}>第{r}轮</option>
                      ))}
                    </select>
                  </div>
                </div>

                {competingTeams ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="info" size="sm">
                          {SESSION_LABELS[entrySession] || entrySession}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {STATION_LABELS[entryStation]} - 第{entryRound}轮
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-2">队伍 A</p>
                          <p className="text-lg font-bold text-blue-900">{competingTeams.teamA.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-2">队伍 B</p>
                          <p className="text-lg font-bold text-blue-900">{competingTeams.teamB.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{competingTeams.teamA.name} 得分</label>
                        <input
                          type="number"
                          value={entryScoreA}
                          onChange={(e) => setEntryScoreA(e.target.value)}
                          placeholder="输入分数"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{competingTeams.teamB.name} 得分</label>
                        <input
                          type="number"
                          value={entryScoreB}
                          onChange={(e) => setEntryScoreB(e.target.value)}
                          placeholder="输入分数"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">备注（可选）</label>
                      <input
                        type="text"
                        value={entryReason}
                        onChange={(e) => setEntryReason(e.target.value)}
                        placeholder="如：胜方、最先完成等"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                      />
                    </div>

                    <button
                      onClick={handleEntrySubmit}
                      disabled={entryLoading || !entryScoreA && !entryScoreB}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {entryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      提交录入
                    </button>
                  </div>
                ) : entrySession && entryStation && entryRound ? (
                  <div className="text-center py-8 text-gray-400 flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    未找到{SESSION_LABELS[entrySession]}该游戏站第{entryRound}轮的对抗队伍，请先配置轮转排班
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">请先选择场次、游戏站和轮次</div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> 计分规则
                </h2>
                {entryStation && entryStation !== "TREASURE_HUNT" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">{STATION_LABELS[entryStation]}</p>
                    <ul className="space-y-1">
                      {(STATION_SCORING_RULES[entryStation] || []).map((rule, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 shrink-0" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">选择游戏站后显示计分规则</div>
                )}
              </div>
            </div>
          )}

          {activeTab === "ranking" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" /> 实时排行榜
                </h2>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setRankingSession("")}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      !rankingSession ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(SESSION_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setRankingSession(k)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        rankingSession === k ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              {ranking.length === 0 ? (
                <div className="text-center py-8 text-gray-400">暂无排行数据</div>
              ) : (
                <div className="space-y-3">
                  {ranking.map((team, i) => (
                    <div
                      key={team.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        i < 3 ? "bg-gradient-to-r from-yellow-50 to-orange-50" : "bg-gray-50"
                      }`}
                    >
                      <span className="text-xl w-10 text-center font-bold">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{team.name}</span>
                            <Badge variant={team.session === "FIRST" ? "info" : "warning"} size="sm">
                              {SESSION_LABELS[team.session] || team.session}
                            </Badge>
                          </div>
                          <span className="font-bold text-red-600">{team.totalScore}分</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {Object.entries(stationBreakdown[team.id] || {}).map(([station, score]) => (
                            <Badge key={station} variant="info" size="sm">
                              {STATION_LABELS[station] || station}: {score}分
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">录入历史</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => { setHistorySession(""); setHistoryPage(1); }}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        !historySession ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      全部
                    </button>
                    {Object.entries(SESSION_LABELS).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => { setHistorySession(k); setHistoryPage(1); }}
                        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                          historySession === k ? "bg-white shadow text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索队伍..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setHistoryPage(1); }}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {paginatedHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">暂无录入记录</div>
              ) : (
                <>
                  <>
                    {/* 桌面端表格 */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">队伍</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">场次</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">游戏站</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">轮次</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分数</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">备注</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">录入人</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">时间</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedHistory.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.team.name}</td>
                              <td className="px-4 py-3 text-sm">
                                <Badge variant={s.team?.session === "FIRST" ? "info" : "warning"} size="sm">
                                  {SESSION_LABELS[s.team?.session] || s.team?.session || "-"}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500">{STATION_LABELS[s.station] || s.station}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{s.round ? `第${s.round}轮` : "-"}</td>
                              <td className="px-4 py-3 text-sm font-bold text-red-600">{s.score}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{s.reason || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{s.recorder?.name || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{new Date(s.createdAt).toLocaleString("zh-CN")}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => openEdit(s)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(s.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 手机端卡片列表 */}
                    <div className="lg:hidden divide-y divide-gray-100">
                      {paginatedHistory.map((s) => (
                        <div key={s.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900">{s.team.name}</span>
                                <Badge variant={s.team?.session === "FIRST" ? "info" : "warning"} size="sm">
                                  {SESSION_LABELS[s.team?.session] || s.team?.session || "-"}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
                                <p><span className="text-gray-400">游戏站：</span>{STATION_LABELS[s.station] || s.station}</p>
                                <p><span className="text-gray-400">轮次：</span>{s.round ? `第${s.round}轮` : "-"}</p>
                                <p><span className="text-gray-400">分数：</span><span className="font-bold text-red-600">{s.score}</span></p>
                                <p><span className="text-gray-400">录入人：</span>{s.recorder?.name || "-"}</p>
                                <p className="col-span-2"><span className="text-gray-400">时间：</span>{new Date(s.createdAt).toLocaleString("zh-CN")}</p>
                                {s.reason && <p className="col-span-2"><span className="text-gray-400">备注：</span>{s.reason}</p>}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => openEdit(s)} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                                <button onClick={() => handleDelete(s.id)} className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">删除</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>

                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-500">共 {filteredHistory.length} 条记录</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                        >
                          上一页
                        </button>
                        {Array.from({ length: totalHistoryPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => setHistoryPage(page)}
                            className={`px-3 py-1 text-sm rounded-lg ${
                              page === historyPage
                                ? "bg-red-600 text-white"
                                : "border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                          disabled={historyPage === totalHistoryPages}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
                        >
                          下一页
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      <Modal open={editModal} onClose={() => setEditModal(false)} title="编辑积分记录" size="sm">
        {editData && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {editData.team.name} - {SESSION_LABELS[editData.team?.session] || editData.team?.session || ""}
                {" - "}{STATION_LABELS[editData.station] || editData.station}
                {editData.round ? ` 第${editData.round}轮` : ""}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分数</label>
              <input
                type="number"
                value={editScore}
                onChange={(e) => setEditScore(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
