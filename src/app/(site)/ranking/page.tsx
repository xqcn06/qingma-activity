"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Trophy, Medal, Loader2, Search, BarChart3, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const SESSION_LABELS: Record<string, string> = { ALL: "全部", FIRST: "第一场", SECOND: "第二场" };

type SortKey = "rank" | "name" | "total" | "round1" | "treasure";
type SortDir = "asc" | "desc";

export default function RankingPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSession, setFilterSession] = useState<"ALL" | "FIRST" | "SECOND">("ALL");
  const [viewMode, setViewMode] = useState<"chart" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = teams.filter((t) => filterSession === "ALL" || t.session === filterSession);
  const sorted = [...filtered].sort((a, b) => (b.totalScore + b.treasureScore) - (a.totalScore + a.treasureScore));
  const maxScore = sorted.length > 0 ? sorted[0].totalScore + sorted[0].treasureScore : 1;

  const searched = searchQuery
    ? sorted.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "asc");
    }
  };

  const getSortedList = () => {
    const list = [...searched];
    list.sort((a, b) => {
      const aTotal = a.totalScore + a.treasureScore;
      const bTotal = b.totalScore + b.treasureScore;
      let cmp = 0;
      if (sortKey === "rank") cmp = aTotal - bTotal;
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name, "zh");
      else if (sortKey === "total") cmp = aTotal - bTotal;
      else if (sortKey === "round1") cmp = (a.totalScore || 0) - (b.totalScore || 0);
      else if (sortKey === "treasure") cmp = (a.treasureScore || 0) - (b.treasureScore || 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  };

  const displayList = getSortedList();

  const chartData = sorted.slice(0, 10).map((t) => ({
    name: t.name,
    round1: t.totalScore || 0,
    treasure: t.treasureScore || 0,
  }));

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5 ml-1" /> : <ArrowDown className="w-3.5 h-3.5 ml-1" />;
  };

  if (loading) {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 lg:pt-24">
        {/* Session Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5 mb-4 flex gap-1"
        >
          {(["ALL", "FIRST", "SECOND"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterSession(s)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filterSession === s
                  ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {SESSION_LABELS[s]}
            </button>
          ))}
        </motion.div>

        {/* Search + View Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索队伍名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all"
            />
          </div>
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-red-50 text-red-600" : "text-gray-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("chart")}
              className={`p-2 rounded-lg transition-all ${viewMode === "chart" ? "bg-red-50 text-red-600" : "text-gray-400"}`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top 3 Podium */}
        {sorted.length >= 3 && viewMode === "list" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end justify-center gap-3 lg:gap-6 mb-5 py-4 lg:py-6"
          >
            {/* 2nd */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white lg:text-2xl font-bold shadow-lg mb-2 text-lg">
                🥈
              </div>
              <p className="text-xs lg:text-sm font-semibold text-gray-700 text-center max-w-[80px] lg:max-w-[120px] truncate">{sorted[1]?.name}</p>
              <p className="text-xs lg:text-sm text-gray-400">{sorted[1]?.totalScore + sorted[1]?.treasureScore}分</p>
              <div className="w-16 lg:w-20 h-16 lg:h-20 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl mt-2 flex items-center justify-center">
                <span className="text-2xl lg:text-3xl font-bold text-gray-400">2</span>
              </div>
            </motion.div>

            {/* 1st */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white lg:text-3xl font-bold shadow-lg shadow-yellow-400/30 mb-2 text-xl">
                🥇
              </div>
              <p className="text-xs lg:text-sm font-bold text-gray-900 text-center max-w-[90px] lg:max-w-[140px] truncate">{sorted[0]?.name}</p>
              <p className="text-xs lg:text-sm text-amber-600 font-semibold">{sorted[0]?.totalScore + sorted[0]?.treasureScore}分</p>
              <div className="w-16 lg:w-20 h-20 lg:h-24 bg-gradient-to-t from-yellow-300 to-yellow-200 rounded-t-xl mt-2 flex items-center justify-center">
                <span className="text-3xl lg:text-4xl font-bold text-yellow-600">1</span>
              </div>
            </motion.div>

            {/* 3rd */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center text-white lg:text-2xl font-bold shadow-lg mb-2 text-lg">
                🥉
              </div>
              <p className="text-xs lg:text-sm font-semibold text-gray-700 text-center max-w-[80px] lg:max-w-[120px] truncate">{sorted[2]?.name}</p>
              <p className="text-xs lg:text-sm text-gray-400">{sorted[2]?.totalScore + sorted[2]?.treasureScore}分</p>
              <div className="w-16 lg:w-20 h-12 lg:h-16 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-xl mt-2 flex items-center justify-center">
                <span className="text-xl lg:text-2xl font-bold text-amber-600">3</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Desktop: Chart + List side by side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          {/* Chart */}
          {sorted.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 10 积分对比</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData} barGap={2}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                    labelStyle={{ fontSize: "12px", fontWeight: 600 }}
                  />
                  <Bar dataKey="round1" name="第一轮" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={`round1-${i}`} fill={i < 3 ? ["#f59e0b", "#ef4444", "#f97316"][i] : "#ef4444"} />
                    ))}
                  </Bar>
                  <Bar dataKey="treasure" name="寻宝赛" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Desktop List with sortable columns */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <button onClick={() => handleSort("rank")} className="col-span-2 flex items-center hover:text-gray-700 transition-colors">
                  排名 <SortIcon col="rank" />
                </button>
                <button onClick={() => handleSort("name")} className="col-span-4 flex items-center hover:text-gray-700 transition-colors">
                  队伍 <SortIcon col="name" />
                </button>
                <button onClick={() => handleSort("round1")} className="col-span-2 flex items-center hover:text-gray-700 transition-colors">
                  第一轮 <SortIcon col="round1" />
                </button>
                <button onClick={() => handleSort("treasure")} className="col-span-2 flex items-center hover:text-gray-700 transition-colors">
                  寻宝 <SortIcon col="treasure" />
                </button>
                <button onClick={() => handleSort("total")} className="col-span-2 flex items-center hover:text-gray-700 transition-colors">
                  总分 <SortIcon col="total" />
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
              {displayList.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无排行数据</p>
                </div>
              ) : (
                displayList.map((team, i) => {
                  const totalScore = team.totalScore + team.treasureScore;
                  const originalRank = sorted.findIndex((t) => t.id === team.id);
                  const rankColors = ["bg-yellow-50", "bg-gray-50", "bg-amber-50"];
                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4) }}
                      className={`px-5 py-3 grid grid-cols-12 gap-2 items-center transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
                        originalRank < 3 ? rankColors[originalRank] : "hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="col-span-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          originalRank === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                          originalRank === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                          originalRank === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                          {originalRank + 1}
                        </div>
                      </div>
                      <div className="col-span-4 min-w-0">
                        <span className="font-semibold text-gray-900 text-sm truncate block">{team.name}</span>
                      </div>
                      <div className="col-span-2 text-sm text-gray-600">{team.totalScore || 0}</div>
                      <div className="col-span-2 text-sm text-gray-600">{team.treasureScore || 0}</div>
                      <div className="col-span-2">
                        <span className="font-bold text-red-600 text-sm">{totalScore}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Chart + List toggle (original layout) */}
        <div className="lg:hidden">
          {/* Chart View */}
          <AnimatePresence mode="wait">
            {viewMode === "chart" && sorted.length > 0 && (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 10 积分对比</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} barGap={2}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: "#e5e7eb" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                      labelStyle={{ fontSize: "12px", fontWeight: 600 }}
                    />
                    <Bar dataKey="round1" name="第一轮" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={`round1-${i}`} fill={i < 3 ? ["#f59e0b", "#ef4444", "#f97316"][i] : "#ef4444"} />
                      ))}
                    </Bar>
                    <Bar dataKey="treasure" name="寻宝赛" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-2.5">
              {searched.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">暂无排行数据</p>
                </div>
              ) : (
                searched.map((team, i) => {
                  const totalScore = team.totalScore + team.treasureScore;
                  const rankColors = ["bg-yellow-50 border-yellow-200", "bg-gray-50 border-gray-200", "bg-amber-50 border-amber-200"];
                  return (
                    <motion.div
                      key={team.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.04, 0.5) }}
                      className={`rounded-2xl p-4 flex items-center gap-3 border ${
                        i < 3 ? rankColors[i] : "bg-white border-gray-100"
                      } shadow-sm`}
                    >
                      {/* Rank */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        i === 0 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white" :
                        i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                        i === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {i + 1}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-gray-900 text-sm truncate">{team.name}</span>
                          <span className="font-bold text-red-600 text-sm ml-2">{totalScore}分</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(totalScore / maxScore) * 100}%` }}
                            transition={{ duration: 0.8, delay: Math.min(i * 0.04, 0.5) }}
                            className={`h-1.5 rounded-full ${
                              i === 0 ? "bg-gradient-to-r from-yellow-400 to-amber-500" :
                              i === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400" :
                              i === 2 ? "bg-gradient-to-r from-amber-600 to-amber-700" :
                              "bg-gradient-to-r from-red-500 to-red-600"
                            }`}
                          />
                        </div>
                        {team.totalScore > 0 && (
                          <div className="flex gap-3 mt-1.5">
                            <span className="text-[10px] text-gray-400">第一轮 {team.totalScore}分</span>
                            {team.treasureScore > 0 && <span className="text-[10px] text-gray-400">寻宝 {team.treasureScore}分</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
