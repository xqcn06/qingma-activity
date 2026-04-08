"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  X, ArrowLeft, Check, Hand, Users, UserPlus, UserCheck, 
  Calendar, Megaphone, Trophy, Package, Repeat, Map,
  MessageSquare, FileText, KeyRound, Database, Bell, Settings,
  ChevronRight, LayoutDashboard, Search
} from "lucide-react";

interface TutorialProps {
  onComplete: () => void;
}

export default function SwipeTutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("admin-swipe-tutorial");
    if (seen) {
      setDismissed(true);
      onComplete();
    }
  }, [onComplete]);

  const handleDismiss = () => {
    localStorage.setItem("admin-swipe-tutorial", "1");
    setDismissed(true);
    onComplete();
  };

  const steps = [
    {
      title: "欢迎使用后台管理",
      desc: "青马工程活动管理系统提供完整的后台管理功能，让我们一起来了解吧",
      icon: LayoutDashboard,
      color: "from-red-500 to-red-600",
    },
    {
      title: "核心管理",
      desc: "学生导入：批量导入学生数据；学生管理：查看/编辑/禁用学生账号；报名管理：审核学生报名；分组管理：创建/分配队伍",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      items: [
        { icon: Users, label: "学生导入" },
        { icon: UserPlus, label: "学生管理" },
        { icon: UserCheck, label: "报名管理" },
      ]
    },
    {
      title: "活动管理",
      desc: "签到管理：现场签到记录；日程管理：活动流程安排；公告管理：发布通知公告；积分管理：录入比赛成绩；物资管理：活动物料领用；轮转排班：游戏站轮转安排；寻宝管理：寻宝赛积分卡和线索卡",
      icon: Calendar,
      color: "from-green-500 to-green-600",
      items: [
        { icon: UserCheck, label: "签到管理" },
        { icon: Calendar, label: "日程管理" },
        { icon: Megaphone, label: "公告管理" },
        { icon: Trophy, label: "积分管理" },
        { icon: Package, label: "物资管理" },
        { icon: Repeat, label: "轮转排班" },
        { icon: Map, label: "寻宝管理" },
      ]
    },
    {
      title: "系统管理",
      desc: "内容管理：编辑首页和活动介绍内容；反馈管理：查看学生反馈；活动日志：操作记录审计；用户权限：管理用户角色和权限；数据备份：导出活动数据；通知发送：推送消息给学生；系统设置：活动基本配置",
      icon: Settings,
      color: "from-purple-500 to-purple-600",
      items: [
        { icon: MessageSquare, label: "反馈管理" },
        { icon: FileText, label: "活动日志" },
        { icon: KeyRound, label: "用户权限" },
        { icon: Database, label: "数据备份" },
        { icon: Bell, label: "通知发送" },
        { icon: Settings, label: "系统设置" },
      ]
    },
    {
      title: "列表操作技巧",
      desc: "列表页支持搜索筛选；点击卡片可查看详情；部分列表支持左滑显示编辑/删除按钮",
      icon: Search,
      color: "from-amber-500 to-amber-600",
      highlight: true,
    },
    {
      title: "开始使用",
      desc: "点击下方按钮进入后台，开始管理你的活动吧！",
      icon: Check,
      color: "from-green-500 to-green-600",
    },
  ];

  if (dismissed) return null;

  const StepIcon = steps[step].icon;
  const currentStep = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex gap-1.5 mb-5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i === step ? "bg-red-500" : i < step ? "bg-red-300" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br ${currentStep.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
          >
            <StepIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </motion.div>

          <motion.div
            key={`text-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">{currentStep.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{currentStep.desc}</p>
          </motion.div>

          {currentStep.items && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              <div className="grid grid-cols-2 gap-2">
                {currentStep.items.map((item: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <item.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep.highlight && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 bg-amber-50 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <ChevronRight className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">💡 操作提示</p>
                  <p>列表中的搜索框支持多条件筛选，可以快速定位目标记录</p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex gap-3">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                上一步
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                跳过
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md shadow-red-500/20 active:scale-[0.97]"
              >
                下一步
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md shadow-green-500/20 active:scale-[0.97]"
              >
                开始使用
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
