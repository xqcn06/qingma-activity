"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Plus,
  Clock,
  MapPin,
  Loader2,
  Edit2,
  Trash2,
  X,
  Save,
  GripVertical,
  BarChart3,
  Filter,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS as dndCSS } from "@dnd-kit/utilities";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

const PHASE_LABELS: Record<string, string> = {
  赛前准备: "赛前准备",
  开幕: "开幕仪式",
  轮转积分赛: "第一轮：轮转积分赛",
  中场休整: "中场休整",
  寻宝赛: "第二轮：寻宝赛",
  闭幕: "闭幕",
  场间转场: "场间转场",
};

const PHASE_OPTIONS = Object.keys(PHASE_LABELS);

const SESSION_LABELS: Record<string, string> = {
  FIRST: "第一场",
  SECOND: "第二场",
};

function SortableScheduleItem({
  item,
  onEdit,
  onDelete,
}: {
  item: any;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: dndCSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-all group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-gray-900">{item.title}</span>
          {item.phase && (
            <Badge variant="info" size="sm">
              {PHASE_LABELS[item.phase] || item.phase}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(item.startTime)} - {formatTime(item.endTime)}
          </span>
          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {item.location}
            </span>
          )}
          <span
            className={`px-1.5 py-0.5 rounded ${
              item.session === "FIRST"
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {SESSION_LABELS[item.session]}
          </span>
        </div>
        {item.description && (
          <p className="text-xs text-gray-400 mt-1 truncate">{item.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ScheduleFormModal({
  open,
  onClose,
  onSave,
  editingItem,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingItem: any | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [session, setSession] = useState("FIRST");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [phase, setPhase] = useState("");

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setDescription(editingItem.description || "");
      setSession(editingItem.session);
      setStartTime(editingItem.startTime.slice(0, 16));
      setEndTime(editingItem.endTime.slice(0, 16));
      setLocation(editingItem.location || "");
      setPhase(editingItem.phase || "");
    } else {
      setTitle("");
      setDescription("");
      setSession("FIRST");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setPhase("");
    }
  }, [editingItem, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      session,
      startTime,
      endTime,
      location: location.trim() || null,
      phase: phase || null,
      sortOrder: editingItem?.sortOrder ?? 0,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editingItem ? "编辑日程" : "添加日程"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入日程标题"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="可选描述"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">场次</label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-600 bg-white"
            >
              <option value="FIRST">第一场</option>
              <option value="SECOND">第二场</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">阶段</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm focus:border-red-600 bg-white"
            >
              <option value="">无</option>
              {PHASE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="开始时间"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
          <Input
            label="结束时间"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
        <Input
          label="地点"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="可选地点"
        />
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4" />
            {editingItem ? "保存" : "创建"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSession, setFilterSession] = useState("ALL");
  const [filterPhase, setFilterPhase] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/schedule?session=${filterSession}`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [filterSession]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      if (editingItem) {
        const res = await fetch("/api/admin/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingItem.id, ...data }),
        });
        if (res.ok) {
          setModalOpen(false);
          setEditingItem(null);
          fetchSchedule();
        }
      } else {
        const res = await fetch("/api/admin/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchSchedule();
        }
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除此日程吗？")) return;
    try {
      const res = await fetch(`/api/admin/schedule?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchSchedule();
    } catch {}
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = schedules.findIndex((s) => s.id === active.id);
    const newIndex = schedules.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(schedules, oldIndex, newIndex);
    setSchedules(reordered);

    try {
      await Promise.all(
        reordered.map((item, idx) =>
          fetch("/api/admin/schedule", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, sortOrder: idx }),
          })
        )
      );
    } catch {}
  };

  const filtered = schedules.filter((s) => {
    if (filterPhase !== "ALL" && s.phase !== filterPhase) return false;
    return true;
  });

  const groupedBySession = filtered.reduce((acc, item) => {
    const key = item.session;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const groupedByPhase = filtered.reduce((acc, item) => {
    const key = item.phase || "未分类";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = {
    total: schedules.length,
    firstSession: schedules.filter((s) => s.session === "FIRST").length,
    secondSession: schedules.filter((s) => s.session === "SECOND").length,
    byPhase: PHASE_OPTIONS.reduce((acc, p) => {
      acc[p] = schedules.filter((s) => s.phase === p).length;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日程管理</h1>
          <p className="text-gray-500 mt-1">管理活动日程安排，拖拽可调整顺序</p>
        </div>
        <Button onClick={() => { setEditingItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" /> 添加日程
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">总日程</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">第一场</p>
            <p className="text-xl font-bold text-gray-900">{stats.firstSession}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">第二场</p>
            <p className="text-xl font-bold text-gray-900">{stats.secondSession}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">已分阶段</p>
            <p className="text-xl font-bold text-gray-900">
              {Object.values(stats.byPhase).reduce((a, b) => a + b, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            {(["ALL", "FIRST", "SECOND"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSession(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterSession === s
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "ALL" ? "全部" : s === "FIRST" ? "第一场" : "第二场"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-red-600 outline-none bg-white"
            >
              <option value="ALL">全部阶段</option>
              {PHASE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PHASE_LABELS[p]}
                </option>
              ))}
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
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>暂无日程数据</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {(Object.entries(groupedBySession) as [string, any[]][]).map(([sessionKey, items]) => {
              const sessionItems: any[] =
                filterPhase !== "ALL"
                  ? (items as any[]).filter((i: any) => i.phase === filterPhase)
                  : items;
              if (sessionItems.length === 0) return null;

              const sessionGrouped = (sessionItems as any[]).reduce((acc: Record<string, any[]>, item: any) => {
                const key = item.phase || "未分类";
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {} as Record<string, any[]>);

              return (
                <div key={sessionKey}>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        sessionKey === "FIRST" ? "bg-blue-500" : "bg-amber-500"
                      }`}
                    />
                    {SESSION_LABELS[sessionKey]}
                    <span className="text-sm font-normal text-gray-400">
                      ({sessionItems.length}项)
                    </span>
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(sessionGrouped).map(([phaseKey, phaseItems]: [string, any[]]) => (
                      <div key={phaseKey}>
                        {phaseKey !== "未分类" && (
                          <h3 className="text-sm font-medium text-gray-500 mb-2 ml-1">
                            {PHASE_LABELS[phaseKey] || phaseKey}
                          </h3>
                        )}
                        <SortableContext
                          items={phaseItems.map((i: any) => i.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {phaseItems.map((item: any) => (
                              <SortableScheduleItem
                                key={item.id}
                                item={item}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </DndContext>
      )}

      <ScheduleFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        editingItem={editingItem}
      />
    </div>
  );
}
