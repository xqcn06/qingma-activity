"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Camera,
  Image,
  Sparkles,
  ArrowUp,
  Loader2,
  Images,
} from "lucide-react";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

export default function GalleryPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/albums");
      if (res.ok) {
        const data = await res.json();
        setAlbums(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const filtered = albums.filter((a) => filter === "all" || a.category === filter);

  const categories = [
    { id: "all", label: "全部" },
    { id: "开幕", label: "开幕仪式" },
    { id: "游戏", label: "游戏环节" },
    { id: "寻宝", label: "寻宝赛" },
    { id: "颁奖", label: "颁奖仪式" },
  ];

  const gradients = [
    "from-red-400 to-red-600",
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-amber-400 to-amber-600",
    "from-emerald-400 to-emerald-600",
    "from-pink-400 to-pink-600",
  ];

  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-24 pb-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === cat.id ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-100/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无照片，活动开始后将陆续上传</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((album, i) => (
              <motion.div
                key={album.id}
                {...fadeInUp}
                transition={{ delay: i * 0.05 }}
                className={`bg-gradient-to-br ${gradients[i % gradients.length]} rounded-2xl aspect-square flex items-center justify-center cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1`}
              >
                <div className="text-center text-white">
                  <Camera className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium">{album.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ScrollTop />
    </div>
  );
}

function ScrollTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-8 right-8 w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 z-50"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}
