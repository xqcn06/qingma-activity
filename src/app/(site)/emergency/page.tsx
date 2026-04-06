"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  CloudRain,
  Sun,
  CloudLightning,
  Snowflake,
  Thermometer,
  Shield,
  Phone,
  AlertTriangle,
  Bandage,
  MapPin,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Heart,
  Ambulance,
} from "lucide-react";

const weatherPlans = [
  {
    id: "rain",
    title: "雨天预案",
    icon: CloudRain,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    conditions: "活动当天降雨概率超过60%",
    measures: [
      "户外活动转移至室内体育馆进行",
      "调整活动顺序，将室内项目优先进行",
      "准备雨具和防滑垫，确保通道安全",
      "通知所有参与者携带雨具",
      "安排专人关注天气变化，及时调整",
    ],
  },
  {
    id: "storm",
    title: "暴雨/雷电预案",
    icon: CloudLightning,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    conditions: "发布暴雨或雷电预警",
    measures: [
      "立即停止所有户外活动",
      "组织人员有序撤离至室内安全区域",
      "远离高大树木、电线杆等危险物",
      "清点人数，确保所有人员安全",
      "活动延期，另行安排时间",
    ],
  },
  {
    id: "heat",
    title: "高温预案",
    icon: Sun,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    conditions: "气温超过32°C",
    measures: [
      "增加休息时间和频次",
      "提供充足的饮用水和防暑用品",
      "安排阴凉休息区域",
      "减少高强度户外项目时长",
      "医疗组加强巡查，关注中暑症状",
    ],
  },
  {
    id: "cold",
    title: "低温预案",
    icon: Snowflake,
    color: "from-cyan-500 to-blue-500",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    conditions: "气温低于10°C",
    measures: [
      "通知参与者注意保暖，穿着适当",
      "准备热饮和暖宝宝",
      "缩短户外活动时间",
      "增加热身环节，防止运动损伤",
      "关注体弱同学，必要时安排室内活动",
    ],
  },
];

const injuryProcedures = [
  {
    id: "minor",
    title: "轻伤处理",
    icon: Bandage,
    color: "from-green-500 to-emerald-500",
    examples: ["擦伤", "轻微扭伤", "小伤口"],
    steps: [
      "立即停止活动，到医疗点处理",
      "医疗人员进行伤口清洁和包扎",
      "记录受伤情况，通知带队老师",
      "根据情况决定是否继续参与活动",
    ],
  },
  {
    id: "moderate",
    title: "中度伤害",
    icon: Shield,
    color: "from-amber-500 to-amber-600",
    examples: ["关节扭伤", "肌肉拉伤", "轻度中暑"],
    steps: [
      "立即停止活动，保持伤者舒适体位",
      "医疗人员进行初步处理和评估",
      "通知带队老师和活动负责人",
      "安排车辆送往校医院或附近医院",
      "安排专人陪同就医",
    ],
  },
  {
    id: "severe",
    title: "严重伤害",
    icon: Ambulance,
    color: "from-red-500 to-red-600",
    examples: ["骨折", "昏迷", "严重过敏"],
    steps: [
      "立即拨打120急救电话",
      "医疗人员进行紧急救护（CPR等）",
      "疏散周围人员，保持现场秩序",
      "通知学校领导和伤者家属",
      "安排专人在校门口引导救护车",
      "保护现场，配合后续调查",
    ],
  },
];

const emergencyContacts = [
  { name: "活动总负责人", phone: "138-0000-0001", role: "统筹协调" },
  { name: "医疗组负责人", phone: "138-0000-0002", role: "医疗保障" },
  { name: "安全组负责人", phone: "138-0000-0003", role: "安全巡查" },
  { name: "后勤保障组", phone: "138-0000-0004", role: "物资调配" },
  { name: "校医院", phone: "0411-0000-0001", role: "医疗救助" },
  { name: "保卫处", phone: "0411-0000-0002", role: "安全保卫" },
  { name: "急救电话", phone: "120", role: "紧急救援" },
  { name: "报警电话", phone: "110", role: "公安报警" },
];

export default function EmergencyPage() {
  const [expandedWeather, setExpandedWeather] = useState<string | null>(null);
  const [expandedInjury, setExpandedInjury] = useState<string | null>(null);

  return (
    <div className="bg-gray-50 min-h-screen pb-24 lg:pb-12">
      {/* Weather Plans */}
      <section className="py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Thermometer className="w-6 h-6 text-primary" />
              天气应急预案
            </h2>
            <p className="text-text-secondary mt-1">针对不同天气情况的应对措施</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {weatherPlans.map((plan, i) => {
              const Icon = plan.icon;
              const isExpanded = expandedWeather === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`rounded-xl overflow-hidden border ${plan.borderColor} bg-white`}
                >
                  <button
                    onClick={() => setExpandedWeather(isExpanded ? null : plan.id)}
                    className="w-full p-5 flex items-start gap-3 text-left"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-text-primary">{plan.title}</h3>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-1">触发条件：{plan.conditions}</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`px-5 pb-5 ${plan.bgColor} rounded-b-xl`}
                    >
                      <h4 className="text-sm font-semibold text-text-primary mb-2">应对措施：</h4>
                      <ul className="space-y-1.5">
                        {plan.measures.map((measure, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                            {measure}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Injury Procedures */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              伤害处理流程
            </h2>
            <p className="text-text-secondary mt-1">不同伤害程度的标准处理流程</p>
          </motion.div>

          <div className="space-y-4">
            {injuryProcedures.map((procedure, i) => {
              const Icon = procedure.icon;
              const isExpanded = expandedInjury === procedure.id;
              return (
                <motion.div
                  key={procedure.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-bg rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedInjury(isExpanded ? null : procedure.id)}
                    className="w-full p-5 flex items-start gap-3 text-left"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${procedure.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-text-primary">{procedure.title}</h3>
                          <div className="flex gap-2 mt-1">
                            {procedure.examples.map((example, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-white px-2 py-0.5 rounded-full text-text-muted"
                              >
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-text-muted" />
                        )}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="px-5 pb-5"
                    >
                      <div className="bg-white rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-3">处理步骤：</h4>
                        <div className="space-y-3">
                          {procedure.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-text-secondary pt-0.5">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="py-12 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Phone className="w-6 h-6 text-primary" />
              紧急联系方式
            </h2>
            <p className="text-text-secondary mt-1">关键时刻，快速联系相关负责人</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {emergencyContacts.map((contact, i) => (
              <motion.div
                key={contact.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all ${
                  contact.phone === "120" || contact.phone === "110"
                    ? "border-2 border-red-200 bg-red-50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      contact.phone === "120" || contact.phone === "110"
                        ? "bg-red-100"
                        : "bg-primary-light"
                    }`}
                  >
                    <Phone
                      className={`w-5 h-5 ${
                        contact.phone === "120" || contact.phone === "110"
                          ? "text-red-600"
                          : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-text-primary">{contact.name}</div>
                    <div className="text-xs text-text-muted">{contact.role}</div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  <a
                    href={`tel:${contact.phone.replace(/-/g, "")}`}
                    className={`text-lg font-bold font-mono ${
                      contact.phone === "120" || contact.phone === "110"
                        ? "text-red-600"
                        : "text-primary"
                    }`}
                  >
                    {contact.phone}
                  </a>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-700 mb-1">重要提示</h4>
              <p className="text-sm text-red-600">
                如遇紧急情况，请第一时间联系现场工作人员或拨打相应紧急电话。活动全程配备医疗人员，医疗点设在操场主席台右侧。
                请所有参与者注意安全，遵守活动规则，切勿擅自行动。
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
