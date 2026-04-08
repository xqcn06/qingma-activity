"use client";

import { Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, Trophy, Sparkles, Target, Footprints, Brain, Map, Megaphone, Image as ImageIcon, UserPlus, MessageSquare, Shield, Heart, BookOpen, Award, Check } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const ICON_MAP: Record<string, any> = {
  Calendar, MapPin, Users, Clock, ArrowRight, ChevronDown, Trophy, Sparkles, Target, Footprints, Brain, Map, Megaphone, ImageIcon, UserPlus, MessageSquare, Shield, Heart, BookOpen, Award, Check,
};

function renderIcon(iconName: string, className: string = "w-5 h-5") {
  const Icon = ICON_MAP[iconName];
  return Icon ? <Icon className={className} /> : null;
}

function parseJson<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

const fadeInUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-50px" } };

interface BlockRendererProps {
  block: {
    type: string;
    key: string;
    title: string;
    content: string;
    config: string;
  };
}

export default function BlockRenderer({ block }: BlockRendererProps) {
  const config = parseJson<Record<string, any>>(block.config, {});

  switch (block.type) {
    case "hero":
      return <HeroBlock content={block.content} config={config} />;
    case "text":
      return <TextBlock content={block.content} config={config} />;
    case "image":
      return <ImageBlock content={block.content} config={config} />;
    case "grid":
      return <GridBlock content={block.content} config={config} />;
    case "list":
      return <ListBlock content={block.content} config={config} />;
    case "cta":
      return <CtaBlock content={block.content} config={config} />;
    case "divider":
      return <DividerBlock config={config} />;
    case "html":
      return <HtmlBlock content={block.content} />;
    default:
      return null;
  }
}

function HeroBlock({ content, config }: { content: string; config: Record<string, any> }) {
  const data = parseJson(content, { title: "", subtitle: "", badge: "", org: "" });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-red-800 via-red-700 to-red-900">
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center px-4 max-w-5xl mx-auto"
      >
        {data.badge && (
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-6 py-3 mb-10">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-white/90 text-sm font-medium tracking-wide">{data.badge}</span>
          </div>
        )}
        <h1
          className="text-6xl xl:text-8xl font-black text-white mb-5 leading-[1.1] tracking-tight"
          style={{ textShadow: "0 4px 30px rgba(0,0,0,0.3)" }}
        >
          {data.title}
          {data.subtitle && (
            <>
              <br />
              <span className="text-yellow-300 text-4xl xl:text-5xl font-bold">{data.subtitle}</span>
            </>
          )}
        </h1>
        {data.org && (
          <p className="text-lg text-white/60 mb-12 tracking-wide">{data.org}</p>
        )}
        {config.buttons && Array.isArray(config.buttons) && (
          <div className="flex gap-5 justify-center">
            {config.buttons.map((btn: any, i: number) => (
              <Link
                key={i}
                href={btn.link || "#"}
                className={`inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 active:scale-95 ${
                  btn.variant === "primary"
                    ? "bg-white text-red-600 hover:bg-gray-50 shadow-xl"
                    : "bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20"
                }`}
              >
                {btn.text}
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}

function TextBlock({ content, config }: { content: string; config: Record<string, any> }) {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp}>
          <div className="prose prose-lg max-w-none">
            {content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-gray-600 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ImageBlock({ content, config }: { content: string; config: Record<string, any> }) {
  const data = parseJson<{ url?: string; alt?: string; caption?: string }>(content, {});
  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp} className="rounded-2xl overflow-hidden shadow-lg">
          {data.url && <img src={data.url} alt={data.alt || ""} className="w-full h-auto" />}
          {data.caption && <p className="text-sm text-gray-500 text-center py-3">{data.caption}</p>}
        </motion.div>
      </div>
    </section>
  );
}

function GridBlock({ content, config }: { content: string; config: Record<string, any> }) {
  const items = parseJson<any[]>(content, []);
  const columns = config.columns || 3;
  const gap = config.gap === "sm" ? "gap-3" : config.gap === "lg" ? "gap-8" : "gap-5";

  return (
    <section className="py-16 lg:py-24 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 lg:grid-cols-${Math.min(columns, 4)} ${gap}`}>
          {items.map((item: any, i: number) => (
            <motion.div
              key={i}
              {...fadeInUp}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 hover:shadow-lg transition-all duration-300 group"
            >
              {item.icon && (
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-600 transition-colors duration-300 text-red-600 group-hover:text-white">
                  {renderIcon(item.icon, "w-6 h-6")}
                </div>
              )}
              {item.title && <h3 className="text-sm font-semibold text-gray-500 mb-1">{item.title}</h3>}
              {item.value && <p className="text-xl font-bold text-gray-900 mb-1">{item.value}</p>}
              {item.sub && <p className="text-xs text-gray-400">{item.sub}</p>}
              {item.desc && <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>}
              {item.items && Array.isArray(item.items) && (
                <ul className="space-y-1">
                  {item.items.map((sub: string, j: number) => (
                    <li key={j} className="text-sm text-gray-600">{sub}</li>
                  ))}
                </ul>
              )}
              {item.label && item.link && (
                <Link href={item.link} className={`inline-flex items-center gap-1.5 mt-3 text-sm font-medium bg-gradient-to-r ${item.color || "from-red-500 to-red-600"} text-white px-4 py-2 rounded-xl`}>
                  {item.label}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ListBlock({ content, config }: { content: string; config: Record<string, any> }) {
  const items = parseJson<{ text: string; icon?: string }[]>(content, []);
  const style = config.style || "check";

  return (
    <section className="py-12 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeInUp}>
          <ul className="space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-600">
                <span className="shrink-0 mt-0.5">
                  {style === "check" ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : item.icon ? (
                    renderIcon(item.icon, "w-5 h-5 text-red-500")
                  ) : (
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 inline-block" />
                  )}
                </span>
                <span className="text-sm leading-relaxed">{item.text}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

function CtaBlock({ content, config }: { content: string; config: Record<string, any> }) {
  const data = parseJson<{ title: string; desc: string }>(content, { title: "", desc: "" });

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-red-600 via-red-500 to-red-700 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div {...fadeInUp}>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">{data.title}</h2>
          {data.desc && <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">{data.desc}</p>}
          {config.buttons && Array.isArray(config.buttons) && (
            <div className="flex gap-4 justify-center">
              {config.buttons.map((btn: any, i: number) => (
                <Link
                  key={i}
                  href={btn.link || "#"}
                  className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 ${
                    btn.variant === "primary"
                      ? "bg-white text-red-600 hover:bg-gray-50 shadow-lg"
                      : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  }`}
                >
                  {btn.text}
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function DividerBlock({ config }: { config: Record<string, any> }) {
  const color = config.color || "gray";
  const style = config.style || "line";

  if (style === "spacer") {
    return <div className="py-8" />;
  }

  return (
    <div className="py-4">
      <div className={`max-w-4xl mx-auto border-t border-${color}-200`} />
    </div>
  );
}

function HtmlBlock({ content }: { content: string }) {
  return (
    <section className="py-8 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </section>
  );
}
