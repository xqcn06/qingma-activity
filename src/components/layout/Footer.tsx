import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="hidden lg:block bg-white border-t border-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">© 2026 青马工程 · 大连交通大学机械工程学院</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/info" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">活动信息</Link>
            <Link href="/schedule" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">日程安排</Link>
            <Link href="/contact" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">联系我们</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
