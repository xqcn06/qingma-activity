"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  UserPlus,
  Trophy,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowRight,
  FileText,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b"];
const PIE_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6"];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-400">加载失败，请重试</p>
      </div>
    );
  }

  const { stats, sessions, sessionComparison, scoreDistribution, feedbackStats, feedbackDistribution, recentRegistrations } = data;

  const statCards = [
    { label: "总报名", value: stats.totalRegistrations, icon: Users, color: "bg-blue-500", bgLight: "bg-blue-50", textColor: "text-blue-600" },
    { label: "待审核", value: stats.pendingCount, icon: Clock, color: "bg-amber-500", bgLight: "bg-amber-50", textColor: "text-amber-600" },
    { label: "已通过", value: stats.approvedCount, icon: CheckCircle2, color: "bg-green-500", bgLight: "bg-green-50", textColor: "text-green-600" },
    { label: "已拒绝", value: stats.rejectedCount, icon: XCircle, color: "bg-red-500", bgLight: "bg-red-50", textColor: "text-red-600" },
  ];

  const quickActions = [
    { label: "学生导入", desc: "批量导入学生信息", href: "/admin/import", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "审核报名", desc: "审核学生报名申请", href: "/admin/registrations", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "管理分组", desc: "自动分组与调整", href: "/admin/groups", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "录入积分", desc: "录入各游戏站得分", href: "/admin/scores", icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const sessionColors: Record<string, string> = { FIRST: "bg-blue-600", SECOND: "bg-amber-600" };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>
          <p className="text-gray-500 mt-1">青马工程活动管理概览</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bgLight} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Session Comparison Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">场次对比</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sessionComparison}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="first" name="第一场" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="second" name="第二场" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback Distribution Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">反馈评分分布</h2>
          {feedbackStats.total > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={feedbackDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {feedbackDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">总体评分</span>
                  <span className="font-semibold text-gray-900">{feedbackStats.overallAvg.toFixed(1)} / 5.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">内容评分</span>
                  <span className="font-semibold text-gray-900">{feedbackStats.contentAvg.toFixed(1)} / 5.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">组织评分</span>
                  <span className="font-semibold text-gray-900">{feedbackStats.organizationAvg.toFixed(1)} / 5.0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">反馈总数</span>
                  <span className="font-semibold text-gray-900">{feedbackStats.total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
              暂无反馈数据
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions + Session Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">快捷操作</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 ${action.bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-red-600 transition-colors">{action.label}</p>
                  <p className="text-xs text-gray-400 truncate">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Session Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">场次统计</h2>
          <div className="space-y-5">
            {[
              { key: "FIRST", label: "第一场（大一）", target: 144 },
              { key: "SECOND", label: "第二场（大二）", target: 136 },
            ].map(({ key, label, target }) => {
              const count = sessions[key.toLowerCase() as keyof typeof sessions] || 0;
              const percent = target > 0 ? Math.min((count / target) * 100, 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-900 font-semibold">{count} / {target}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${sessionColors[key]} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">已完成 {Math.round(percent)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      {scoreDistribution.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="font-semibold text-lg text-gray-900 mb-4">队伍积分分布（Top 10）</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
              <Tooltip />
              <Legend />
              <Bar dataKey="round1" name="第一轮" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="treasure" name="寻宝赛" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Registrations */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-lg text-gray-900">最近报名</h2>
          <Link href="/admin/registrations" className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
            查看全部 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-400">暂无报名数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">学号</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">班级</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">场次</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentRegistrations.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm font-medium text-gray-900">{reg.user.name}</td>
                    <td className="px-5 py-4 text-sm text-gray-500 font-mono">{reg.user.studentId}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{reg.user.className}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        reg.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {reg.session === "FIRST" ? "第一场" : "第二场"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        reg.status === "APPROVED" ? "bg-green-100 text-green-700" :
                        reg.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {reg.status === "APPROVED" ? <CheckCircle2 className="w-3 h-3" /> :
                         reg.status === "PENDING" ? <Clock className="w-3 h-3" /> :
                         <XCircle className="w-3 h-3" />}
                        {reg.status === "APPROVED" ? "已通过" : reg.status === "PENDING" ? "待审核" : "已拒绝"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">
                      {new Date(reg.createdAt).toLocaleString("zh-CN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
