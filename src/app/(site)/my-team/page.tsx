"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, Clock, Map, Loader2, Crown, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CaptainBadge from "@/components/features/CaptainBadge";

export default function MyTeamPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/my-team");
      return;
    }
    if (sessionStatus === "authenticated") {
      fetchMyTeam();
    }
  }, [sessionStatus, router]);

  const fetchMyTeam = async () => {
    try {
      const res = await fetch("/api/teams/my");
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-white to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-white to-white flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">你还没有队伍</h2>
          <p className="text-gray-500">请等待管理员完成分组并发布名单</p>
        </motion.div>
      </div>
    );
  }

  const totalScore = team.totalScore + team.treasureScore;
  const isCaptain = team.members?.some((m: any) => m.userId === (session?.user as any)?.id && m.isCaptain);

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <section className="py-12 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <Trophy className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{totalScore}</p>
              <p className="text-sm text-gray-400">总积分</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{team.members?.length || 0}</p>
              <p className="text-sm text-gray-400">队员数</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <Clock className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{team.session === "FIRST" ? "第一场" : "第二场"}</p>
              <p className="text-sm text-gray-400">场次</p>
            </div>
          </div>

          {/* Main Grid: Team Info + Members on left, Scores + Rotation on right */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            {/* Left Column: Members */}
            <div className="mb-6 lg:mb-0">
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  队员名单
                  {isCaptain && <CaptainBadge size="md" />}
                </h3>
                <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-3 lg:space-y-0">
                  {team.members?.map((member: any) => {
                    const isMe = member.userId === (session?.user as any)?.id;
                    return (
                      <div
                        key={member.userId}
                        className={`flex items-center justify-between p-3 rounded-xl lg:flex lg:flex-col lg:items-center lg:text-center ${
                          isMe ? "bg-red-50 border border-red-200" : "bg-gray-50"
                        } hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${
                            member.isCaptain ? "bg-amber-500" : "bg-gray-400"
                          }`}>
                            {member.user.name.charAt(0)}
                          </div>
                          <div className="lg:mt-2">
                            <div className="flex items-center gap-2 lg:justify-center">
                              <span className="font-medium text-gray-900">{member.user.name}</span>
                              {member.isCaptain && <CaptainBadge size="sm" />}
                              {isMe && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">我</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{member.user.className}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Scores + Rotation */}
            <div className="space-y-6">
              {/* Treasure Map Link */}
              <Link href="/treasure-map" className="block bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Map className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">寻宝地图</h3>
                      <p className="text-xs text-white/70">查看线索卡和积分卡位置</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>

              {/* Scores */}
              {team.totalScore > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-red-600" />
                    积分详情
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">第一轮积分</span>
                      <span className="font-bold text-gray-900">{team.totalScore}分</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">寻宝赛积分</span>
                      <span className="font-bold text-gray-900">{team.treasureScore}分</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <span className="font-medium text-gray-900">总积分</span>
                      <span className="font-bold text-red-600 text-lg">{totalScore}分</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rotation Order */}
              {team.rotationOrder && (
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                    <Map className="w-5 h-5 text-red-600" />
                    轮转顺序
                  </h3>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-600">你的轮转顺序是：</p>
                    <p className="text-3xl font-bold text-blue-800">第 {team.rotationOrder} 轮</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
