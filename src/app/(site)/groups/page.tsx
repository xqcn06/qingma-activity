"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, UserCheck, Loader2, Crown, UsersRound } from "lucide-react";
import CaptainBadge from "@/components/features/CaptainBadge";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

export default function GroupsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSession, setFilterSession] = useState<"ALL" | "FIRST" | "SECOND">("ALL");
  const [published, setPublished] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        setPublished(data.length > 0 && data.some((t: any) => t.publishedAt));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = teams.filter((t) => {
    const matchSearch = !search || t.name.includes(search) || t.members?.some((m: any) => m.user.name.includes(search));
    const matchSession = filterSession === "ALL" || t.session === filterSession;
    return matchSearch && matchSession;
  });

  if (loading) {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!published) {
    return (
      <div className="pt-16 lg:pt-24 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">队伍名单尚未公布</h2>
          <p className="text-gray-500">请等待管理员完成分组并发布名单</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索队名或姓名..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-blue-600 outline-none bg-white"
            />
          </div>
          <div className="flex gap-2">
            {(["ALL", "FIRST", "SECOND"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSession(s)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filterSession === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100/80"
                }`}
              >
                {s === "ALL" ? "全部" : s === "FIRST" ? "第一场" : "第二场"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((team, i) => (
            <motion.div
              key={team.id}
              {...fadeInUp}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 border border-gray-100/80"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg ${
                  team.session === "FIRST" ? "bg-blue-600" : "bg-amber-600"
                }`}>
                  {team.name.replace("第一场", "").replace("第二场", "")}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{team.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    team.session === "FIRST" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {team.session === "FIRST" ? "第一场" : "第二场"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                {team.members?.map((member: any) => (
                  <div key={member.userId} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{member.user.name}</span>
                      {member.isCaptain && <CaptainBadge size="sm" />}
                    </div>
                    <span className="text-gray-400 text-xs">{member.user.className}</span>
                  </div>
                ))}
              </div>

              {team.totalScore > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                  <span className="text-gray-400">积分</span>
                  <span className="font-bold text-red-600">{team.totalScore}分</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>未找到匹配的队伍</p>
          </div>
        )}
      </div>
    </div>
  );
}
