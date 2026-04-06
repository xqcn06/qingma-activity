"use client";

import { useState, useEffect } from "react";

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    const target = new Date(targetDate).getTime();
    const timer = setInterval(() => {
      const diff = target - new Date().getTime();
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const units = [
    { label: "天", value: timeLeft.days },
    { label: "时", value: timeLeft.hours },
    { label: "分", value: timeLeft.minutes },
    { label: "秒", value: timeLeft.seconds },
  ];

  // 客户端挂载前渲染占位符（与服务端一致，避免hydration不匹配）
  if (!mounted) {
    return (
      <div className="flex gap-3 sm:gap-4 justify-center">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 sm:px-6 sm:py-4 min-w-[70px] sm:min-w-[90px]"
          >
            <div className="text-3xl sm:text-4xl font-bold text-white font-mono">00</div>
            <div className="text-xs sm:text-sm text-white/70 text-center mt-1">{unit.label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 sm:gap-4 justify-center">
      {units.map((unit) => (
        <div
          key={unit.label}
          className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3 sm:px-6 sm:py-4 min-w-[70px] sm:min-w-[90px]"
        >
          <div className="text-3xl sm:text-4xl font-bold text-white font-mono">
            {String(unit.value).padStart(2, "0")}
          </div>
          <div className="text-xs sm:text-sm text-white/70 text-center mt-1">{unit.label}</div>
        </div>
      ))}
    </div>
  );
}

export default CountdownTimer;
