"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  MapPin,
  Trophy,
  Sparkles,
  X,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

interface TreasureMapClientProps {
  treasureCards: Array<{
    id: string;
    value: number;
    location: string;
    imageX: number | null;
    imageY: number | null;
    imageW: number | null;
    imageH: number | null;
    found: boolean;
  }>;
  mapImageUrl: string | null;
  teamName: string;
  teamTreasureScore: number;
  clueCards: Array<{
    id: string;
    tier: string;
    content: string;
  }>;
}

export default function TreasureMapClient({
  treasureCards,
  mapImageUrl,
  teamName,
  teamTreasureScore,
  clueCards,
}: TreasureMapClientProps) {
  const { success, error: showError } = useToast();
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showClues, setShowClues] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [foundCards, setFoundCards] = useState<string[]>([]);
  const [currentScore, setCurrentScore] = useState(teamTreasureScore);

  const handleFoundCard = async (cardId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/treasure/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });

      if (res.ok) {
        const data = await res.json();
        setFoundCards((prev) => [...prev, cardId]);
        setCurrentScore(data.newTeamScore);
        setSelectedCard(null);
        success(`找到 ${data.cardValue} 分积分卡！当前总分：${data.newTeamScore}`);
      } else {
        const err = await res.json().catch(() => ({}));
        showError("提交失败", err.error || "未知错误");
      }
    } catch {
      showError("提交失败", "请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const valueColor = (value: number) => {
    if (value === 3) return "bg-red-500";
    if (value === 2) return "bg-amber-500";
    return "bg-blue-500";
  };

  const tierColor = (tier: string) => {
    if (tier === "A") return "bg-red-100 text-red-700";
    if (tier === "B") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="bg-gradient-to-br from-red-50/30 via-white to-white min-h-screen pb-24 lg:pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/my-team" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Map className="w-5 h-5 text-red-600" />
                寻宝地图
              </h1>
              <p className="text-sm text-gray-500">{teamName} · 寻宝积分：{teamTreasureScore}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClues(!showClues)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              线索卡 ({clueCards.length})
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">总积分卡</p>
            <p className="text-2xl font-bold text-gray-900">{treasureCards.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">已找到</p>
            <p className="text-2xl font-bold text-green-600">{treasureCards.filter(c => c.found).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">剩余</p>
            <p className="text-2xl font-bold text-gray-900">{treasureCards.filter(c => !c.found).length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">寻宝积分</p>
            <p className="text-2xl font-bold text-red-600">{currentScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            {!mapImageUrl ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">地图尚未上传，请联系管理员</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="relative bg-gray-100 select-none">
                  <img
                    src={mapImageUrl}
                    alt="校园地图"
                    className="w-full h-auto"
                    draggable={false}
                  />
                  {/* Treasure card markers */}
                  {showMap &&
                    treasureCards
                      .filter((card) => card.imageX != null && card.imageY != null)
                      .map((card) => (
                        <button
                          key={card.id}
                          onClick={() => !card.found && setSelectedCard(card)}
                          disabled={card.found}
                          className={`absolute group ${card.found ? 'cursor-default' : 'cursor-pointer'}`}
                          style={{
                            top: `${card.imageY}%`,
                            left: `${card.imageX}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          <div
                            className={`w-8 h-8 ${valueColor(card.value)} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white group-hover:scale-110 transition-transform ${
                              card.found ? 'opacity-40' : ''
                            }`}
                          >
                            {card.value}
                          </div>
                          {!card.found && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              {card.location}
                            </div>
                          )}
                          {card.found && (
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              已找到
                            </div>
                          )}
                        </button>
                      ))}
                </div>
                <div className="p-3 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 1分
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 2分
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 3分
                    </span>
                  </div>
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {showMap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {showMap ? "隐藏标记" : "显示标记"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Clue cards */}
            <AnimatePresence>
              {showClues && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      线索卡
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {clueCards.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">暂无线索卡</p>
                    ) : (
                      clueCards.map((card) => (
                        <div key={card.id} className="bg-gray-50 rounded-xl p-3">
                          <Badge variant={card.tier === "A" ? "danger" : card.tier === "B" ? "warning" : "default"} size="sm">
                            {card.tier}级线索
                          </Badge>
                          <p className="text-sm text-gray-700 mt-2">{card.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remaining cards list */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  待寻找积分卡
                </h3>
              </div>
              <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                {treasureCards.filter((c) => !foundCards.includes(c.id)).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">所有积分卡已找到！</p>
                ) : (
                  treasureCards
                    .filter((card) => !foundCards.includes(card.id))
                    .map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="w-full text-left bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${valueColor(card.value)}`}>
                          {card.value}分
                        </span>
                        <span className="text-xs text-gray-500">{card.location}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card detail modal */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-lg font-bold px-3 py-1 rounded-full text-white ${valueColor(selectedCard.value)}`}>
                  {selectedCard.value}分积分卡
                </span>
                <button onClick={() => setSelectedCard(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">位置描述</p>
                  <p className="text-sm font-medium text-gray-900">{selectedCard.location}</p>
                </div>
                {selectedCard.imageX != null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">地图坐标</p>
                    <p className="text-xs font-mono text-gray-600">
                      X: {selectedCard.imageX.toFixed(1)}%, Y: {selectedCard.imageY.toFixed(1)}%
                    </p>
                  </div>
                )}
                <button
                  onClick={() => handleFoundCard(selectedCard.id)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      确认找到此积分卡
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
