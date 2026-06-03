import { Users, Activity, UserPlus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const formatTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return { value: current > 0 ? "+100%" : "0%", isUp: current > 0 };
  }
  const percentage = ((current - previous) / previous) * 100;
  const isUp = percentage >= 0;
  return {
    value: `${isUp ? "+" : ""}${percentage.toFixed(1)}%`,
    isUp,
  };
};

const StatsCards = ({ data }: { data: User[] }) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const totalCurrent = data.length;
  const totalPrevious = data.filter((u) => new Date(u.createdAt) < thirtyDaysAgo).length;
  const totalTrend = formatTrend(totalCurrent, totalPrevious);

  const activeStatuses = ["admitted", "in_treatment", "observation", "active"];
  const activeCurrent = data.filter((u) =>
    activeStatuses.includes(u.status?.toLowerCase() || "")
  ).length;
  const activePrevious = data.filter(
    (u) =>
      activeStatuses.includes(u.status?.toLowerCase() || "") &&
      new Date(u.createdAt) < thirtyDaysAgo
  ).length;
  const activeTrend = formatTrend(activeCurrent, activePrevious);

  const newCurrent = data.filter((u) => new Date(u.createdAt) >= thirtyDaysAgo).length;
  const newPrevious = data.filter((u) => {
    const date = new Date(u.createdAt);
    return date >= sixtyDaysAgo && date < thirtyDaysAgo;
  }).length;
  const newTrend = formatTrend(newCurrent, newPrevious);

  const isPatient = data[0]?.role === "patient";
  const dischargedCurrent = data.filter((u) => u.status?.toLowerCase() === "discharged").length;
  const dischargedPrevious = data.filter(
    (u) =>
      u.status?.toLowerCase() === "discharged" &&
      new Date(u.createdAt) < thirtyDaysAgo
  ).length;

  let rateValue = "0%";
  let rateLabel = "Bệnh nhân hài lòng";
  let rateTrend = { value: "+0%", isUp: true };

  if (totalCurrent > 0) {
    if (isPatient) {
      rateLabel = "Tỷ lệ xuất viện";
      rateValue = `${Math.round((dischargedCurrent / totalCurrent) * 100)}%`;
      rateTrend = formatTrend(dischargedCurrent, dischargedPrevious);
    } else {
      rateLabel = "Tỷ lệ nhân viên đang làm việc";
      rateValue = `${Math.round((activeCurrent / totalCurrent) * 100)}%`;
      rateTrend = activeTrend;
    }
  }

  const statsData = [
    {
      label: isPatient ? "Tổng số bệnh nhân" : "Tổng số nhân viên",
      value: totalCurrent.toLocaleString(),
      trend: totalTrend.value,
      trendUp: totalTrend.isUp,
      icon: Users,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
      borderColor: "border-l-blue-500",
      bg: "bg-blue-50/40",
    },
    {
      label: isPatient ? "Bệnh nhân hoạt động" : "Đang làm việc",
      value: activeCurrent.toLocaleString(),
      trend: activeTrend.value,
      trendUp: activeTrend.isUp,
      icon: Activity,
      iconColor: "text-teal-600",
      iconBg: "bg-teal-100",
      borderColor: "border-l-teal-500",
      bg: "bg-teal-50/40",
    },
    {
      label: "Mới trong tháng này",
      value: newCurrent.toLocaleString(),
      trend: newTrend.value,
      trendUp: newTrend.isUp,
      icon: UserPlus,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-100",
      borderColor: "border-l-sky-500",
      bg: "bg-sky-50/40",
    },
    {
      label: rateLabel,
      value: rateValue,
      trend: rateTrend.value,
      trendUp: rateTrend.isUp,
      icon: UserCheck,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
      borderColor: "border-l-green-500",
      bg: "bg-green-50/40",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "rounded-xl border border-slate-200 border-l-4 shadow-sm p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
            stat.borderColor,
            stat.bg
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2.5 rounded-lg", stat.iconBg)}>
              <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
            </div>
            <span
              className={cn(
                "text-xs font-semibold px-2 py-0.5 rounded-full",
                stat.trendUp
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              )}
            >
              {stat.trend}
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
