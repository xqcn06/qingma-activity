import { Crown } from "lucide-react";

export default function CaptainBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeMap = { sm: "w-4 h-4", md: "w-5 h-5" };
  return (
    <span className="inline-flex items-center gap-1 text-amber-600" title="队长">
      <Crown className={sizeMap[size]} />
      <span className={`font-medium ${size === "sm" ? "text-xs" : "text-sm"}`}>队长</span>
    </span>
  );
}
