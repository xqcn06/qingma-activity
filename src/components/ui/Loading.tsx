export default function Loading({ size = "md", text }: { size?: "sm" | "md" | "lg"; text?: string }) {
  const sizeMap = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeMap[size]} border-2 border-gray-200 border-t-red-600 rounded-full animate-spin`} />
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}
