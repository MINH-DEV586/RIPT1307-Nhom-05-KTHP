import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getUsers } from "@/lib/api";
import Loader from "@/components/global/Loader";
import { useNavigate } from "react-router";
import { useEffect, useMemo } from "react";
import type { Role, User } from "@/types";
import QuickActions from "@/components/dashboard/QuickActions";
import StatsCards from "@/components/global/StatsCards";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import ActiveAssignmentsBoard from "@/components/dashboard/ActiveAssignmentsBoard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  BedDouble, CalendarDays, Activity, ArrowRight, BarChart3,
  Users, Stethoscope, HeartPulse, TrendingUp,
} from "lucide-react";
import { Link } from "react-router";

export function meta() {
  return [{ title: "Bảng điều khiển | MedFlow AI" }];
}

const PATIENT_STATUS_COLORS: Record<string, { color: string; label: string }> = {
  admitted: { color: "#6366f1", label: "Nhập viện" },
  in_treatment: { color: "#3b82f6", label: "Đang điều trị" },
  observation: { color: "#f59e0b", label: "Theo dõi" },
  discharged: { color: "#10b981", label: "Xuất viện" },
  follow_up: { color: "#8b5cf6", label: "Tái khám" },
  active: { color: "#22c55e", label: "Hoạt động" },
};

export default function HMSDashboard() {
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const navigate = useNavigate();
  const user = session?.user;

  useEffect(() => {
    if (!isAuthLoading && user?.role === "patient") {
      navigate(`/profile/${user.id}`, { replace: true });
    }
  }, [isAuthLoading, user, navigate]);

  const { data: patientData, isLoading: patientLoading } = useQuery({
    queryKey: ["patients-dashboard"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });

  const { data: doctorData, isLoading: doctorLoading } = useQuery({
    queryKey: ["doctors-dashboard"],
    queryFn: () => getUsers({ role: "doctor", limit: 100 }),
    enabled: user?.role === "admin",
  });

  const { data: nurseData } = useQuery({
    queryKey: ["nurses-dashboard"],
    queryFn: () => getUsers({ role: "nurse", limit: 100 }),
    enabled: user?.role === "admin",
  });

  const patients = patientData?.res || [];
  const doctors = doctorData?.res || [];
  const nurses = nurseData?.res || [];

  const admitted = patients.filter((p: User) => p.status === "admitted").length;
  const inTreatment = patients.filter((p: User) => p.status === "in_treatment").length;
  const discharged = patients.filter((p: User) => p.status === "discharged").length;

  // Patient status pie data
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach((p: User) => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        name: PATIENT_STATUS_COLORS[status]?.label || status,
        value: count,
        color: PATIENT_STATUS_COLORS[status]?.color || "#94a3b8",
      }))
      .filter((d) => d.value > 0);
  }, [patients]);

  const isAdmin = user?.role === "admin";
  const isMedicalStaff = ["doctor", "nurse"].includes(user?.role || "");

  if (isAuthLoading || patientLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader label="Đang chuẩn bị bảng điều khiển..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome & Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            Bảng điều khiển MedFlow
          </h1>
          <p className="text-muted-foreground mt-1">
            Chào mừng trở lại, {user?.role === "doctor" ? "Bác sĩ " : ""}
            <span className="font-semibold text-foreground">{user?.name}</span>. Đây là những gì đang diễn ra hôm nay.
          </p>
        </div>
        <QuickActions role={user?.role as Role} />
      </div>

      {/* 2. Top Level Stats */}
      <StatsCards data={patients} />

      {/* 3. Admin: Quick summary row */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Bệnh nhân nhập viện",
              value: admitted,
              icon: HeartPulse,
              color: "text-indigo-600",
              bg: "bg-indigo-50 dark:bg-indigo-950/30",
              href: "/patients",
            },
            {
              label: "Đang điều trị",
              value: inTreatment,
              icon: Activity,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/30",
              href: "/patients",
            },
            {
              label: "Tổng bác sĩ",
              value: doctors.length,
              icon: Stethoscope,
              color: "text-emerald-600",
              bg: "bg-emerald-50 dark:bg-emerald-950/30",
              href: "/doctors",
            },
            {
              label: "Tổng điều dưỡng",
              value: nurses.length,
              icon: Users,
              color: "text-violet-600",
              bg: "bg-violet-50 dark:bg-violet-950/30",
              href: "/nurses",
            },
          ].map((s) => (
            <Link to={s.href} key={s.label}>
              <Card className="card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${s.bg} group-hover:scale-110 transition-transform`}>
                      <s.icon className={`w-5 h-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-black">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 4. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 units) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Admin: Revenue Chart */}
          {isAdmin && (
            <Card className="card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Tổng quan doanh thu
                  </CardTitle>
                  <CardDescription>Doanh thu theo tháng trong năm nay</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground gap-1">
                  <Link to="/reports">
                    Chi tiết <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>
          )}

          {/* Active Assignments Board */}
          <Card className="card shadow-sm p-6">
            <ActiveAssignmentsBoard />
          </Card>
        </div>

        {/* Right Column (4 units) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Patient Status Pie (Admin/Doctor) */}
          {(isAdmin || isMedicalStaff) && pieData.length > 0 && (
            <Card className="card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-violet-500" />
                  Phân bổ bệnh nhân
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--card-foreground)",
                        }}
                        formatter={(v: any) => [`${v} BN`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-1">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick links */}
          <Card className="card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: "/appointments", icon: CalendarDays, label: "Lịch hẹn hôm nay", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
                { href: "/bed-management", icon: BedDouble, label: "Sơ đồ giường bệnh", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                ...(isAdmin ? [{ href: "/reports", icon: BarChart3, label: "Báo cáo & Phân tích", color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" }] : []),
                { href: "/patients", icon: Users, label: "Quản lý bệnh nhân", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
              ].map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                  <div className={`p-2 rounded-lg ${link.bg}`}>
                    <link.icon className={`w-4 h-4 ${link.color}`} />
                  </div>
                  <span className="text-sm font-medium flex-1">{link.label}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity (Admin) */}
          {isAdmin && (
            <Card className="card shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  Hoạt động gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
