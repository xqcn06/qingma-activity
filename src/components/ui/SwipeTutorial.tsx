"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { X, ArrowLeft, Check, Hand } from "lucide-react";

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
      desc: "我们为你准备了简单的操作指引，只需几步就能上手",
      icon: Hand,
    },
    {
      title: "左滑显示操作按钮",
      desc: "在管理列表中，向左滑动卡片可以显示编辑、删除等操作按钮",
      icon: ArrowLeft,
    },
    {
      title: "开始使用吧！",
      desc: "点击下方按钮，开始管理你的活动",
      icon: Check,
    },
  ];

  if (dismissed) return null;

  const StepIcon = steps[step].icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          {/* 进度指示器 */}
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  i === step ? "bg-red-500" : i < step ? "bg-red-300" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {/* 图标 */}
          <motion.div
            key={step}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-red-500/20"
          >
            <StepIcon className="w-8 h-8 text-white" />
          </motion.div>

          {/* 内容 */}
          <motion.div
            key={`text-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">{steps[step].title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{steps[step].desc}</p>
          </motion.div>

          {/* 演示动画 */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 bg-gray-50 rounded-2xl p-4 overflow-hidden"
            >
              <div className="relative h-16 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <motion.div
                  animate={{ x: [-8, -60, -8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-white flex items-center px-4"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                  <div className="ml-3 flex-1">
                    <div className="w-20 h-2.5 bg-gray-200 rounded-full mb-1.5" />
                    <div className="w-12 h-2 bg-gray-100 rounded-full" />
                  </div>
                </motion.div>
                <motion.div
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity, times: [0, 0.3, 0.7, 1] }}
                  className="absolute right-0 top-0 bottom-0 flex items-center"
                >
                  <div className="flex">
                    <div className="w-12 h-16 bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">编辑</span>
                    </div>
                    <div className="w-12 h-16 bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">删除</span>
                    </div>
                  </div>
                </motion.div>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">← 向左滑动</p>
            </motion.div>
          )}

          {/* 按钮 */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                上一步
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
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md shadow-red-500/20 active:scale-[0.97]"
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
