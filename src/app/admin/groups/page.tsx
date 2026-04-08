"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Loader2,
  Crown,
  CheckCircle2,
  Shuffle,
  Send,
  Sparkles,
  Filter,
  AlertTriangle,
  Trash2,
  Edit2,
  X,
  Save,
} from "lucide-react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS as dndCSS } from "@dnd-kit/utilities";
import CaptainBadge from "@/components/features/CaptainBadge";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

function SortableMember({
  member,
  teamId,
  onRemove,
  onSetCaptain,
  isDragging,
}: {
  member: any;
  teamId: string;
  onRemove: (userId: string, teamId: string) => void;
  onSetCaptain: (userId: string, teamId: string) => void;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: `${teamId}-${member.userId}` });

  const style = {
    transform: dndCSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-gray-50 group ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="3" cy="2" r="1.5" />
            <circle cx="9" cy="2" r="1.5" />
            <circle cx="3" cy="6" r="1.5" />
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="3" cy="10" r="1.5" />
            <circle cx="9" cy="10" r="1.5" />
          </svg>
        </div>
        <span className="text-gray-700 font-medium">{member.user.name}</span>
        {member.isCaptain && <CaptainBadge size="sm" />}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetCaptain(member.userId, teamId);
          }}
          className="p-1 text-amber-500 hover:bg-amber-50 rounded"
          title="设为队长"
        >
          <Crown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(member.userId, teamId);
          }}
          className="p-1 text-red-500 hover:bg-red-50 rounded"
          title="移除成员"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function TeamCard({
  team,
  onRemoveMember,
  onSetCaptain,
  onDeleteTeam,
  onEditTeam,
}: {
  team: any;
  onRemoveMember: (userId: string, teamId: string) => void;
  onSetCaptain: (userId: string, teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  onEditTeam: (teamId: string, name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editName.trim() === team.name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (res.ok) {
        setIsEditing(false);
        window.location.reload();
      }
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `确定要删除"${team.name}"吗？这将同时删除所有成员关联。`
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/teams/${team.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch {}
  };

  const members = team.members || [];
  const captain = members.find((m: any) => m.isCaptain);

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg ${
              team.session === "FIRST" ? "bg-blue-600" : "bg-amber-600"
            }`}
          >
            {team.name.replace("第", "").replace("组", "")}
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-sm font-semibold border rounded px-2 py-0.5 w-24"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") {
                      setEditName(team.name);
                      setIsEditing(false);
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditName(team.name);
                    setIsEditing(false);
                  }}
                  className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  team.session === "FIRST"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {team.session === "FIRST" ? "第一场" : "第二场"}
              </span>
              {team.rotationOrder && (
                <Badge variant="info" size="sm">
                  轮转{team.rotationOrder}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {team.publishedAt && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> 已发布
            </span>
          )}
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="删除队伍"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {captain && (
        <div className="mb-2 text-xs text-gray-500">
          队长：{captain.user.name}
        </div>
      )}

      <div className="space-y-0.5 mb-4 min-h-[40px]">
        {members.map((member: any) => (
          <SortableMember
            key={member.userId}
            member={member}
            teamId={team.id}
            onRemove={onRemoveMember}
            onSetCaptain={onSetCaptain}
          />
        ))}
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {members.length} 人
        </span>
        {team.totalScore > 0 && (
          <span className="text-xs text-red-600 font-medium">
            {team.totalScore}分
          </span>
        )}
        {team.treasureScore > 0 && (
          <span className="text-xs text-purple-600 font-medium">
            寻宝{team.treasureScore}分
          </span>
        )}
      </div>
    </Card>
  );
}

export default function AdminGroups() {
  const { success, error: showError } = useToast();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSession, setFilterSession] = useState("ALL");
  const [isGrouping, setIsGrouping] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teams");
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleAutoGroup = async () => {
    setConfirmModal({
      open: true,
      title: "确认自动分组",
      message:
        "确定要自动分组吗？这将删除现有分组并按姓氏拼音重新分组（每队8-9人）。",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        setIsGrouping(true);
        try {
          const res = await fetch("/api/admin/teams/auto-group", {
            method: "POST",
          });
          if (res.ok) {
            const data = await res.json();
            success(`分组成功！共创建 ${data.teamCount} 个队伍`);
            fetchTeams();
          } else {
            const json = await res.json();
            showError(json.error || "分组失败");
          }
        } catch {
          showError("分组失败");
        } finally {
          setIsGrouping(false);
        }
      },
    });
  };

  const handlePublish = async () => {
    setConfirmModal({
      open: true,
      title: "确认发布",
      message: "确定要发布队伍名单吗？发布后学生才能看到自己的队伍。",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        setIsPublishing(true);
        try {
          const res = await fetch("/api/admin/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "publish" }),
          });
          if (res.ok) {
            success("发布成功！");
            fetchTeams();
          }
        } catch {
          showError("发布失败");
        } finally {
          setIsPublishing(false);
        }
      },
    });
  };

  const handleDrawLots = async () => {
    const sessionTeams = teams.filter(
      (t) => filterSession === "ALL" || t.session === filterSession
    );
    if (sessionTeams.length === 0) {
      showError("没有可抽签的队伍");
      return;
    }
    const session =
      filterSession === "ALL"
        ? sessionTeams[0]?.session
        : filterSession;
    setConfirmModal({
      open: true,
      title: "确认抽签",
      message: `确定要为${
        session === "FIRST" ? "第一场" : "第二场"
      }进行抽签对抗分组吗？这将随机配对队伍并分配轮转顺序。`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, open: false }));
        setIsDrawing(true);
        try {
          const res = await fetch("/api/admin/teams/draw-lots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session }),
          });
          if (res.ok) {
            const data = await res.json();
            success(`抽签成功！共创建 ${data.rotationCount} 组对抗，已分配轮转顺序`);
            fetchTeams();
          } else {
            const json = await res.json();
            showError(json.error || "抽签失败");
          }
        } catch {
          showError("抽签失败");
        } finally {
          setIsDrawing(false);
        }
      },
    });
  };

  const handleRemoveMember = async (userId: string, teamId: string) => {
    if (!confirm("确定要移除此成员吗？")) return;
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTeams();
      }
    } catch {}
  };

  const handleSetCaptain = async (userId: string, teamId: string) => {
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/captain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        fetchTeams();
      }
    } catch {}
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDragOverTeamId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    const [activeTeamId, activeUserId] = activeIdStr.split("-");
    const overTeamId = overIdStr.includes("-team-")
      ? overIdStr.split("-team-")[1]
      : overIdStr.split("-")[0];

    if (activeTeamId === overTeamId) return;

    try {
      const res = await fetch("/api/admin/teams/move-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          fromTeamId: activeTeamId,
          toTeamId: overTeamId,
        }),
      });
      if (res.ok) {
        fetchTeams();
      } else {
        const json = await res.json();
        showError(json.error || "移动失败");
      }
    } catch {
      showError("移动失败");
    }
  };

  const handleDragOver = (event: any) => {
    const { over } = event;
    if (over) {
      const overIdStr = over.id as string;
      const teamId = overIdStr.includes("-team-")
        ? overIdStr.split("-team-")[1]
        : overIdStr.split("-")[0];
      setDragOverTeamId(teamId);
    }
  };

  const filtered = teams.filter((t) => {
    const matchSearch =
      !search ||
      t.name.includes(search) ||
      t.members?.some((m: any) => m.user.name.includes(search));
    const matchSession =
      filterSession === "ALL" || t.session === filterSession;
    return matchSearch && matchSession;
  });

  const stats = {
    totalTeams: teams.length,
    totalMembers: teams.reduce(
      (sum, t) => sum + (t.members?.length || 0),
      0
    ),
    published: teams.some((t) => t.publishedAt),
    firstSession: teams.filter((t) => t.session === "FIRST").length,
    secondSession: teams.filter((t) => t.session === "SECOND").length,
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">分组管理</h1>
            <p className="text-gray-500 mt-1">
              管理活动分组、成员和对抗配对
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleDrawLots}
              disabled={isDrawing || teams.length === 0}
            >
              {isDrawing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shuffle className="w-4 h-4" />
              )}
              抽签对抗
            </Button>
            <Button
              variant="secondary"
              onClick={handlePublish}
              disabled={isPublishing || teams.length === 0}
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              发布名单
            </Button>
            <Button
              onClick={handleAutoGroup}
              disabled={isGrouping}
            >
              {isGrouping ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              自动分组
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">总队伍数</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalTeams}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">总成员数</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.totalMembers}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">第一场</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.firstSession} 队
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">第二场</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.secondSession} 队
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  stats.published ? "bg-green-100" : "bg-gray-100"
                }`}
              >
                {stats.published ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">发布状态</p>
                <p
                  className={`text-sm font-bold ${
                    stats.published ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {stats.published ? "已发布" : "未发布"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索队名、队员..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none"
              />
            </div>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
            >
              <option value="ALL">全部场次</option>
              <option value="FIRST">第一场</option>
              <option value="SECOND">第二场</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无分组数据，请先点击"自动分组"</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((team) => (
              <div
                key={team.id}
                className={`transition-all rounded-2xl ${
                  dragOverTeamId === team.id
                    ? "ring-2 ring-red-400 ring-offset-2"
                    : ""
                }`}
              >
                <TeamCard
                  team={team}
                  onRemoveMember={handleRemoveMember}
                  onSetCaptain={handleSetCaptain}
                  onDeleteTeam={(id) => {
                    if (
                      confirm(
                        `确定要删除"${team.name}"吗？`
                      )
                    ) {
                      fetch(`/api/admin/teams/${id}`, {
                        method: "DELETE",
                      }).then((res) => {
                        if (res.ok) fetchTeams();
                      });
                    }
                  }}
                  onEditTeam={(id, name) => {
                    fetch(`/api/admin/teams/${id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name }),
                    }).then((res) => {
                      if (res.ok) fetchTeams();
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <div className="bg-white rounded-xl shadow-lg p-4 opacity-90">
                <p className="text-sm text-gray-600">拖拽中...</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

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
            onClick={() =>
              setConfirmModal((prev) => ({ ...prev, open: false }))
            }
          >
            取消
          </Button>
          <Button onClick={confirmModal.onConfirm}>确认</Button>
        </div>
      </Modal>
    </div>
  );
}
