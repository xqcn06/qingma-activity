"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Map,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Trash2,
  Edit2,
  X,
  Save,
  Filter,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function TreasurePage() {
  const { success, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState<"treasure" | "clue" | "map">("treasure");
  const [session, setSession] = useState<string>("FIRST");

  const [treasureCards, setTreasureCards] = useState<any[]>([]);
  const [clueCards, setClueCards] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("ALL");
  const [filterFound, setFilterFound] = useState("ALL");

  const [showCreateTreasure, setShowCreateTreasure] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const [batchValue, setBatchValue] = useState(1);
  const [batchLocation, setBatchLocation] = useState("");

  const [showCreateClue, setShowCreateClue] = useState(false);
  const [clueTier, setClueTier] = useState("A");
  const [clueContent, setClueContent] = useState("");

  const [editingCard, setEditingCard] = useState<any>(null);
  const [editValue, setEditValue] = useState(1);
  const [editLocation, setEditLocation] = useState("");

  const [mapImage, setMapImage] = useState<string | null>(null);
  const [showLocations, setShowLocations] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const [pendingRect, setPendingRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pendingValue, setPendingValue] = useState(1);
  const [pendingLocation, setPendingLocation] = useState("");

  const [editingMapCard, setEditingMapCard] = useState<any>(null);
  const [editMapValue, setEditMapValue] = useState(1);
  const [editMapLocation, setEditMapLocation] = useState("");

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const [distributing, setDistributing] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tcRes, ccRes, teamsRes] = await Promise.all([
        fetch(`/api/admin/treasure-cards?session=${session}`),
        fetch(`/api/admin/clue-cards?session=${session}`),
        fetch("/api/teams"),
      ]);
      if (tcRes.ok) setTreasureCards(await tcRes.json());
      if (ccRes.ok) setClueCards(await ccRes.json());
      if (teamsRes.ok) setTeams(await teamsRes.json());
      try {
        const settingsRes = await fetch("/api/admin/settings?key=treasure_map_image");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings?.value && !mapImage) {
            setMapImage(settings.value);
          }
        }
      } catch {
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [session, mapImage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sessionTeams = teams.filter((t) => t.session === session);

  const filteredTreasureCards = treasureCards.filter((card) => {
    const matchSearch =
      !search || card.location.includes(search);
    const matchValue = filterValue === "ALL" || card.value.toString() === filterValue;
    const matchFound =
      filterFound === "ALL" ||
      (filterFound === "FOUND" && card.found) ||
      (filterFound === "UNFOUND" && !card.found);
    return matchSearch && matchValue && matchFound;
  });

  const filteredClueCards = clueCards;

  const treasureStats = {
    total: treasureCards.length,
    found: treasureCards.filter((c) => c.found).length,
    remaining: treasureCards.filter((c) => !c.found).length,
    byValue: {
      1: treasureCards.filter((c) => c.value === 1).length,
      2: treasureCards.filter((c) => c.value === 2).length,
      3: treasureCards.filter((c) => c.value === 3).length,
    },
  };

  const clueStats = {
    total: clueCards.length,
    distributed: clueCards.filter((c) => c.distributed).length,
    pending: clueCards.filter((c) => !c.distributed).length,
    byTier: {
      A: clueCards.filter((c) => c.tier === "A").length,
      B: clueCards.filter((c) => c.tier === "B").length,
      C: clueCards.filter((c) => c.tier === "C").length,
    },
  };

  const handleBatchCreateTreasure = async () => {
    if (!batchLocation || batchCount < 1) {
      showError("请填写位置描述和数量");
      return;
    }
    try {
      const res = await fetch("/api/admin/treasure-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch: {
            count: batchCount,
            session,
            value: batchValue,
            location: batchLocation,
          },
        }),
      });
      if (res.ok) {
        setShowCreateTreasure(false);
        setBatchCount(5);
        setBatchLocation("");
        success(`成功创建 ${batchCount} 张积分卡`);
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "创建失败");
      }
    } catch {
      showError("创建失败");
    }
  };

  const handleCreateTreasure = async () => {
    if (!batchLocation) {
      showError("请填写位置描述");
      return;
    }
    try {
      const res = await fetch("/api/admin/treasure-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          value: batchValue,
          location: batchLocation,
        }),
      });
      if (res.ok) {
        setShowCreateTreasure(false);
        setBatchLocation("");
        success("积分卡创建成功");
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "创建失败");
      }
    } catch {
      showError("创建失败");
    }
  };

  const handleToggleFound = async (id: string, current: boolean) => {
    try {
      const res = await fetch("/api/admin/treasure-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, found: !current }),
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const handleDeleteTreasure = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/treasure-cards?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const handleSaveEdit = async () => {
    if (!editingCard) return;
    try {
      const res = await fetch("/api/admin/treasure-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCard.id,
          value: editValue,
          location: editLocation,
        }),
      });
      if (res.ok) {
        setEditingCard(null);
        fetchData();
      }
    } catch {}
  };

  const handleCreateClue = async () => {
    if (!clueContent) {
      showError("请填写线索内容");
      return;
    }
    try {
      const res = await fetch("/api/admin/clue-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          tier: clueTier,
          content: clueContent,
        }),
      });
      if (res.ok) {
        setShowCreateClue(false);
        setClueContent("");
        success("线索卡创建成功");
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "创建失败");
      }
    } catch {
      showError("创建失败");
    }
  };

  const handleDistributeClues = async () => {
    if (clueStats.pending === 0) {
      showError("没有待分配的线索卡");
      return;
    }
    setConfirmModal({
      open: true,
      title: "确认分配线索卡",
      message: `将根据第一轮积分排名分配 ${clueStats.pending} 张线索卡。积分高的队伍将获得更优线索（A级）。`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        setDistributing(true);
        try {
          const res = await fetch("/api/admin/clue-cards/distribute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session }),
          });
          const data = await res.json();
          if (res.ok) {
            success(`分配成功！共分配 ${data.distributed} 张线索卡（A级${data.breakdown.tierA}，B级${data.breakdown.tierB}，C级${data.breakdown.tierC}）`);
            fetchData();
          } else {
            showError(data.error || "分配失败");
          }
        } catch {
          showError("分配失败");
        } finally {
          setDistributing(false);
        }
      },
    });
  };

  const handleResetCards = async () => {
    setConfirmModal({
      open: true,
      title: "确认重置积分卡",
      message: `确定要重置${
        session === "FIRST" ? "第一场" : "第二场"
      }的所有积分卡吗？所有卡片将标记为未找到。`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        setResetting(true);
        try {
          const res = await fetch("/api/admin/treasure-cards/reset", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session }),
          });
          if (res.ok) {
            success("重置成功！");
            fetchData();
          } else {
            const data = await res.json();
            showError(data.error || "重置失败");
          }
        } catch {
          showError("重置失败");
        } finally {
          setResetting(false);
        }
      },
    });
  };

  const handleMapMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDragging(true);
    setDragStart({ x, y });
    setDragRect({ x, y, w: 0, h: 0 });
  };

  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const w = Math.abs(currentX - dragStart.x);
    const h = Math.abs(currentY - dragStart.y);
    setDragRect({ x, y, w, h });
  };

  const handleMapMouseUp = () => {
    if (!dragRect || dragRect.w < 1 || dragRect.h < 1) {
      setIsDragging(false);
      setDragStart(null);
      setDragRect(null);
      return;
    }
    setPendingRect({ ...dragRect });
    setPendingValue(1);
    setPendingLocation("");
    setIsDragging(false);
    setDragStart(null);
    setDragRect(null);
  };

  const handleCreateMapCard = async () => {
    if (!pendingRect || !pendingLocation) {
      showError("请填写位置描述");
      return;
    }
    try {
      const res = await fetch("/api/admin/treasure-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session,
          value: pendingValue,
          location: pendingLocation,
          imageX: parseFloat(pendingRect.x.toFixed(2)),
          imageY: parseFloat(pendingRect.y.toFixed(2)),
          imageW: parseFloat(pendingRect.w.toFixed(2)),
          imageH: parseFloat(pendingRect.h.toFixed(2)),
        }),
      });
      if (res.ok) {
        setPendingRect(null);
        success("地图标记创建成功");
        fetchData();
      } else {
        const data = await res.json();
        showError(data.error || "创建失败");
      }
    } catch {
      showError("创建失败");
    }
  };

  const handleSaveMapCardEdit = async () => {
    if (!editingMapCard) return;
    try {
      const res = await fetch("/api/admin/treasure-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingMapCard.id,
          value: editMapValue,
          location: editMapLocation,
        }),
      });
      if (res.ok) {
        setEditingMapCard(null);
        fetchData();
      }
    } catch {}
  };

  const handleDeleteMapCard = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/treasure-cards?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setMapImage(dataUrl);
      try {
        await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "treasure_map_image", value: dataUrl, category: "treasure" }),
        });
      } catch {
      }
    };
    reader.readAsDataURL(file);
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return null;
    const team = teams.find((t) => t.id === teamId);
    return team?.name || null;
  };

  const valueColor = (value: number) => {
    if (value === 3) return "bg-red-100 text-red-700";
    if (value === 2) return "bg-amber-100 text-amber-700";
    return "bg-blue-100 text-blue-700";
  };

  const tierColor = (tier: string) => {
    if (tier === "A") return "bg-red-100 text-red-700";
    if (tier === "B") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">寻宝管理</h1>
        <p className="text-gray-500 mt-1">管理寻宝赛积分卡、线索卡和地图标记</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Map className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">积分卡总数</p>
              <p className="text-xl font-bold text-gray-900">{treasureStats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">已找到</p>
              <p className="text-xl font-bold text-gray-900">{treasureStats.found}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">线索卡</p>
              <p className="text-xl font-bold text-gray-900">{clueStats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-sm font-bold text-amber-600">{clueStats.distributed}</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">已分配线索</p>
              <p className="text-sm font-bold text-gray-900">{clueStats.distributed} 张</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex gap-1">
            {[
              { key: "treasure" as const, label: "积分卡管理" },
              { key: "clue" as const, label: "线索卡管理" },
              { key: "map" as const, label: "地图标记" },
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
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : activeTab === "treasure" ? (
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索位置..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
                />
              </div>
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                <option value="ALL">全部分值</option>
                <option value="1">1分</option>
                <option value="2">2分</option>
                <option value="3">3分</option>
              </select>
              <select
                value={filterFound}
                onChange={(e) => setFilterFound(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
              >
                <option value="ALL">全部状态</option>
                <option value="FOUND">已找到</option>
                <option value="UNFOUND">未找到</option>
              </select>
              <Button onClick={() => setShowCreateTreasure(true)} size="sm">
                <Plus className="w-4 h-4" />
                批量创建
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetCards}
                disabled={resetting}
              >
                {resetting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                重置卡片
              </Button>
            </div>

            {filteredTreasureCards.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无积分卡数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">编号</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">分值</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">位置</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">找到队伍</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTreasureCards.map((card) => (
                      <tr key={card.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-500">#{card.id.slice(-4)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${valueColor(card.value)}`}>
                            {card.value}分
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{card.location}</td>
                        <td className="px-4 py-3">
                          {card.found ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 已找到
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> 未找到
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {card.foundBy ? getTeamName(card.foundBy) || "未知" : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleFound(card.id, card.found)}
                              className={`p-1.5 rounded ${
                                card.found
                                  ? "text-gray-400 hover:bg-gray-100"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={card.found ? "标记为未找到" : "标记为已找到"}
                            >
                              {card.found ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCard(card);
                                setEditValue(card.value);
                                setEditLocation(card.location);
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="编辑"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTreasure(card.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === "clue" ? (
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1" />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDistributeClues}
                disabled={distributing || clueStats.pending === 0}
              >
                {distributing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                按积分分配
              </Button>
              <Button onClick={() => setShowCreateClue(true)} size="sm">
                <Plus className="w-4 h-4" />
                创建线索卡
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {(["A", "B", "C"] as const).map((tier) => {
                const tierCards = filteredClueCards.filter((c) => c.tier === tier);
                const distCount = tierCards.filter((c) => c.distributed).length;
                return (
                  <div key={tier} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={tier === "A" ? "danger" : tier === "B" ? "warning" : "default"} size="md">
                        {tier}级线索
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {distCount}/{tierCards.length} 已分配
                      </span>
                    </div>
                    {tierCards.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">暂无线索卡</p>
                    ) : (
                      <div className="space-y-2">
                        {tierCards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-white rounded-lg p-3 text-sm"
                          >
                            <p className="text-gray-700 mb-1">{card.content}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-400">
                                {card.distributed
                                  ? `已分配 → ${getTeamName(card.distributedTo) || "未知"}`
                                  : "未分配"}
                              </span>
                              {card.distributed && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4">
            {!mapImage ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-4">上传校园地图以标记积分卡位置</p>
                <label className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors text-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  选择图片
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMapUpload}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowLocations(!showLocations)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      {showLocations ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                      {showLocations ? "隐藏标记" : "显示标记"}
                    </button>
                    <span className="text-xs text-gray-400">在地图上拖拽框选区域来标记积分卡位置</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> 1分
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block ml-2" /> 2分
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block ml-2" /> 3分
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      更换图片
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMapUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div
                  className="relative bg-gray-100 rounded-xl overflow-hidden select-none cursor-crosshair"
                  onMouseDown={handleMapMouseDown}
                  onMouseMove={handleMapMouseMove}
                  onMouseUp={handleMapMouseUp}
                  onMouseLeave={() => {
                    if (isDragging) {
                      setIsDragging(false);
                      setDragStart(null);
                      setDragRect(null);
                    }
                  }}
                >
                  <img
                    src={mapImage}
                    alt="校园地图"
                    className="w-full h-auto pointer-events-none"
                    draggable={false}
                  />
                  {showLocations &&
                    treasureCards
                      .filter((card) => card.imageX != null && card.imageY != null && card.imageW != null && card.imageH != null)
                      .map((card) => {
                        const rectColor =
                          card.value === 3
                            ? "border-red-500 bg-red-500/20"
                            : card.value === 2
                            ? "border-amber-500 bg-amber-500/20"
                            : "border-blue-500 bg-blue-500/20";
                        const badgeBg =
                          card.value === 3
                            ? "bg-red-500"
                            : card.value === 2
                            ? "bg-amber-500"
                            : "bg-blue-500";

                        return (
                          <div
                            key={card.id}
                            className={`absolute border-2 rounded-md ${rectColor} group cursor-pointer`}
                            style={{
                              top: `${card.imageY}%`,
                              left: `${card.imageX}%`,
                              width: `${card.imageW}%`,
                              height: `${card.imageH}%`,
                            }}
                          >
                            <div
                              className={`absolute -top-5 left-1/2 -translate-x-1/2 ${badgeBg} text-white text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap`}
                            >
                              {card.value}分 {card.found ? "已找到" : "未找到"}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap z-10 shadow-lg">
                              <p className="font-medium mb-1">{card.location}</p>
                              <p className="text-gray-300">
                                {card.found ? "已找到" : "未找到"}
                                {card.foundBy ? ` → ${getTeamName(card.foundBy) || "未知"}` : ""}
                              </p>
                              <div className="flex gap-2 mt-1.5 pt-1.5 border-t border-gray-700">
                                <button
                                  className="text-blue-400 hover:text-blue-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMapCard(card);
                                    setEditMapValue(card.value);
                                    setEditMapLocation(card.location);
                                  }}
                                >
                                  编辑
                                </button>
                                <button
                                  className="text-red-400 hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMapCard(card.id);
                                  }}
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  {dragRect && dragRect.w > 0 && dragRect.h > 0 && (
                    <div
                      className="absolute border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none"
                      style={{
                        top: `${dragRect.y}%`,
                        left: `${dragRect.x}%`,
                        width: `${dragRect.w}%`,
                        height: `${dragRect.h}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showCreateTreasure}
        onClose={() => setShowCreateTreasure(false)}
        title="批量创建积分卡"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              场次
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
            >
              <option value="FIRST">第一场</option>
              <option value="SECOND">第二场</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分值
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setBatchValue(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    batchValue === v
                      ? valueColor(v) + " ring-2 ring-offset-1 ring-current"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {v}分
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              数量
            </label>
            <input
              type="number"
              min={1}
              value={batchCount}
              onChange={(e) => setBatchCount(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              位置描述
            </label>
            <input
              type="text"
              value={batchLocation}
              onChange={(e) => setBatchLocation(e.target.value)}
              placeholder="例如：教学楼A座北侧花坛"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button
            variant="ghost"
            onClick={() => setShowCreateTreasure(false)}
          >
            取消
          </Button>
          <Button onClick={handleBatchCreateTreasure}>
            <Plus className="w-4 h-4" />
            创建 {batchCount} 张
          </Button>
        </div>
      </Modal>

      <Modal
        open={showCreateClue}
        onClose={() => setShowCreateClue(false)}
        title="创建线索卡"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              线索等级
            </label>
            <div className="flex gap-2">
              {(["A", "B", "C"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setClueTier(tier)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    clueTier === tier
                      ? tierColor(tier) + " ring-2 ring-offset-1 ring-current"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tier}级
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              线索内容
            </label>
            <textarea
              value={clueContent}
              onChange={(e) => setClueContent(e.target.value)}
              placeholder="输入线索内容..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={() => setShowCreateClue(false)}>
            取消
          </Button>
          <Button onClick={handleCreateClue}>
            <Plus className="w-4 h-4" />
            创建
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        title="编辑积分卡"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分值
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setEditValue(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editValue === v
                      ? valueColor(v) + " ring-2 ring-offset-1 ring-current"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {v}分
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              位置描述
            </label>
            <input
              type="text"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={() => setEditingCard(null)}>
            取消
          </Button>
          <Button onClick={handleSaveEdit}>
            <Save className="w-4 h-4" />
            保存
          </Button>
        </div>
      </Modal>

      <Modal
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        title={confirmModal.title}
        size="sm"
      >
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-gray-600">{confirmModal.message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
          >
            取消
          </Button>
          <Button onClick={confirmModal.onConfirm}>确认</Button>
        </div>
      </Modal>

      <Modal
        open={!!pendingRect}
        onClose={() => setPendingRect(null)}
        title="新建地图标记"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分值
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setPendingValue(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pendingValue === v
                      ? valueColor(v) + " ring-2 ring-offset-1 ring-current"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {v}分
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              位置描述
            </label>
            <input
              type="text"
              value={pendingLocation}
              onChange={(e) => setPendingLocation(e.target.value)}
              placeholder="例如：教学楼A座北侧花坛"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
          {pendingRect && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p>选区坐标：X: {pendingRect.x.toFixed(1)}%, Y: {pendingRect.y.toFixed(1)}%, W: {pendingRect.w.toFixed(1)}%, H: {pendingRect.h.toFixed(1)}%</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={() => setPendingRect(null)}>
            取消
          </Button>
          <Button onClick={handleCreateMapCard}>
            <Plus className="w-4 h-4" />
            创建
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!editingMapCard}
        onClose={() => setEditingMapCard(null)}
        title="编辑地图标记"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              分值
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((v) => (
                <button
                  key={v}
                  onClick={() => setEditMapValue(v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editMapValue === v
                      ? valueColor(v) + " ring-2 ring-offset-1 ring-current"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {v}分
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              位置描述
            </label>
            <input
              type="text"
              value={editMapLocation}
              onChange={(e) => setEditMapLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-red-600 outline-none"
            />
          </div>
          {editingMapCard && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
              <p>坐标：X: {editingMapCard.imageX?.toFixed(1)}%, Y: {editingMapCard.imageY?.toFixed(1)}%, W: {editingMapCard.imageW?.toFixed(1)}%, H: {editingMapCard.imageH?.toFixed(1)}%</p>
            </div>
          )}
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <Button variant="ghost" onClick={() => setEditingMapCard(null)}>
            取消
          </Button>
          <Button onClick={handleSaveMapCardEdit}>
            <Save className="w-4 h-4" />
            保存
          </Button>
        </div>
      </Modal>
    </div>
  );
}
