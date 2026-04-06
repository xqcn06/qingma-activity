"use client";

import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  Users,
  Sparkles,
  Calendar,
  Globe,
  MessageSquare,
  QrCode,
  ArrowRight,
} from "lucide-react";

const organizers = [
  {
    name: "机械工程学院团委",
    role: "主办单位",
    contact: "0411-84106001",
    email: "jxgcxy@djtu.edu.cn",
    description: "负责活动整体策划与统筹协调",
  },
  {
    name: "学生会组织部",
    role: "承办单位",
    contact: "0411-84106002",
    email: "xshzzb@djtu.edu.cn",
    description: "负责活动具体执行与现场管理",
  },
  {
    name: "青年志愿者协会",
    role: "协办单位",
    contact: "0411-84106003",
    email: "qnzyz@djtu.edu.cn",
    description: "负责志愿服务与后勤保障",
  },
];

const keyContacts = [
  { name: "李老师", title: "团委书记", phone: "138-0000-0001", email: "li@djtu.edu.cn" },
  { name: "王老师", title: "团委副书记", phone: "138-0000-0002", email: "wang@djtu.edu.cn" },
  { name: "张同学", title: "学生会主席", phone: "138-0000-0003", email: "zhang@student.djtu.edu.cn" },
  { name: "刘同学", title: "组织部部长", phone: "138-0000-0004", email: "liu@student.djtu.edu.cn" },
];

const officeHours = [
  { day: "周一至周五", time: "08:00 - 11:30", period: "上午" },
  { day: "周一至周五", time: "13:30 - 17:00", period: "下午" },
  { day: "周六", time: "09:00 - 11:00", period: "上午（值班）" },
  { day: "周日", time: "休息", period: "" },
];

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-12">
      {/* Organizers */}
      <section className="py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              组织机构
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {organizers.map((org, i) => (
              <motion.div
                key={org.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full">
                      {org.role}
                    </span>
                    <h3 className="font-bold text-text-primary mt-0.5">{org.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-text-secondary mb-4">{org.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Phone className="w-4 h-4 text-primary" />
                    {org.contact}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Mail className="w-4 h-4 text-primary" />
                    {org.email}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Contacts */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold text-text-primary flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              主要联系人
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {keyContacts.map((contact, i) => (
              <motion.div
                key={contact.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-bg rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-text-primary">{contact.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{contact.title}</p>
                <div className="space-y-1.5">
                  <a
                    href={`tel:${contact.phone.replace(/-/g, "")}`}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                  </a>
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {contact.email}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Hours & Location */}
      <section className="py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                办公时间
              </h3>

              <div className="space-y-3">
                {officeHours.map((schedule, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-bg rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-text-primary text-sm">{schedule.day}</div>
                      {schedule.period && (
                        <div className="text-xs text-text-muted">{schedule.period}</div>
                      )}
                    </div>
                    <div
                      className={`font-semibold text-sm ${
                        schedule.time === "休息" ? "text-text-muted" : "text-text-primary"
                      }`}
                    >
                      {schedule.time}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-primary-light rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>活动期间（5月15日）全天有人值班</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                办公地点
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">机械工程学院办公楼</div>
                    <div className="text-sm text-text-secondary">大连市沙河口区黄河路794号</div>
                    <div className="text-sm text-text-secondary">大连交通大学 机械工程学院</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">团委办公室</div>
                    <div className="text-sm text-text-secondary">机械楼 A座 302室</div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-48 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-20 h-20 border-2 border-gray-400 rounded" />
                  <div className="absolute top-8 right-8 w-32 h-16 border-2 border-gray-400 rounded" />
                  <div className="absolute bottom-6 left-12 w-24 h-24 border-2 border-gray-400 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-gray-400" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-px bg-gray-400" />
                </div>
                <div className="text-center relative z-10">
                  <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">地图加载中...</p>
                  <p className="text-xs text-text-muted mt-1">大连市沙河口区黄河路794号</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-primary to-red-700 rounded-2xl p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-4">快速联系</h3>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              扫描下方二维码关注机械工程学院团委公众号，获取最新活动资讯
            </p>
            <div className="inline-flex items-center gap-6 flex-wrap justify-center">
              <a
                href="tel:0411-84106001"
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl hover:bg-white/30 transition-all"
              >
                <Phone className="w-5 h-5" />
                电话咨询
              </a>
              <a
                href="mailto:jxgcxy@djtu.edu.cn"
                className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl hover:bg-white/30 transition-all"
              >
                <Mail className="w-5 h-5" />
                邮件咨询
              </a>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl">
                <QrCode className="w-5 h-5" />
                微信公众号
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
