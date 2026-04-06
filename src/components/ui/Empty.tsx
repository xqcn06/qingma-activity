import { Inbox, Users, FileText, Calendar, Trophy, Package, Search } from "lucide-react";

const iconMap: Record<string, any> = {
  inbox: Inbox,
  users: Users,
  file: FileText,
  calendar: Calendar,
  trophy: Trophy,
  package: Package,
  search: Search,
};

interface EmptyProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export default function Empty({ icon = "inbox", title = "暂无数据", description, action }: EmptyProps) {
  const Icon = iconMap[icon] || Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-400 text-center max-w-sm mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}
