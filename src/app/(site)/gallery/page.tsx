"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Camera,
  Image,
  ArrowUp,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const fadeInUp = { initial: { opacity: 0, y: 15 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" } };

export default function GalleryPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const openAlbum = (album: any) => {
    setSelectedAlbum(album);
    setCurrentImageIndex(0);
  };

  const closeAlbum = () => {
    setSelectedAlbum(null);
  };

  const prevImage = () => {
    if (selectedAlbum && selectedAlbum.images && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const nextImage = () => {
    if (selectedAlbum && selectedAlbum.images && currentImageIndex < selectedAlbum.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

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
                onClick={() => openAlbum(album)}
                className={`rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group relative ${
                  album.thumbnailUrl
                    ? ""
                    : `bg-gradient-to-br ${gradients[i % gradients.length]}`
                }`}
              >
                {album.thumbnailUrl ? (
                  <div className="relative aspect-square">
                    <img
                      src={album.thumbnailUrl}
                      alt={album.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.classList.add("bg-gradient-to-br", gradients[i % gradients.length]);
                          parent.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-white"><div class="text-center"><svg class="w-8 h-8 mx-auto mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg><p class="text-sm font-medium">${album.title}</p></div></div>`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ) : (
                  <div className="aspect-square flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-8 h-8 mx-auto mb-2 opacity-80" />
                      <p className="text-sm font-medium">{album.title}</p>
                    </div>
                  </div>
                )}
                {album._count?.images > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                    {album._count.images} 张
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Album detail modal */}
      <AnimatePresence>
        {selectedAlbum && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={closeAlbum}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeAlbum}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h3 className="text-white text-lg font-semibold mb-4 text-center">{selectedAlbum.title}</h3>

              {selectedAlbum.images && selectedAlbum.images.length > 0 ? (
                <div className="relative">
                  <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                    <img
                      src={selectedAlbum.images[currentImageIndex]?.url || selectedAlbum.images[currentImageIndex]?.imageUrl}
                      alt={selectedAlbum.title}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>

                  {selectedAlbum.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={currentImageIndex === selectedAlbum.images.length - 1}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {selectedAlbum.images.map((_: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              idx === currentImageIndex ? "bg-white w-4" : "bg-white/40"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gray-800 rounded-xl flex items-center justify-center text-gray-400">
                  <Image className="w-12 h-12 opacity-30" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
