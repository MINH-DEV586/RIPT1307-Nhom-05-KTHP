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
import { 
  getPatientLabResults, 
  getPatientMedicalRecords, 
  getTelemedicineSessions, 
  getAllPrescriptionsList 
} from "@/lib/api";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { FlaskConical, ClipboardList, Pill, FileText, CheckCircle2, User as UserIcon } from "lucide-react";
import { getDoctorSchedule } from "@/lib/api";
import { ScheduleOverview } from "@/components/appointments/ScheduleOverview";

export function meta() {
  return [{ title: "Bảng điều khiển | MedFlow AI" }];
}

const PATIENT_STATUS_COLORS: Record<string, { color: string; label: string }> = {
  admitted: { color: "#1d4ed8", label: "Nhập viện" },
  in_treatment: { color: "#3b82f6", label: "Đang điều trị" },
  observation: { color: "#f59e0b", label: "Theo dõi" },
  discharged: { color: "#10b981", label: "Xuất viện" },
  follow_up: { color: "#0ea5e9", label: "Tái khám" },
  active: { color: "#22c55e", label: "Hoạt động" },
};

function PatientDashboardView({ user }: { user: any }) {
  const { data: medicalRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ["patient-medical-records", user.id],
    queryFn: () => getPatientMedicalRecords(user.id),
  });

  const { data: labResults, isLoading: labLoading } = useQuery({
    queryKey: ["patient-lab-results", user.id],
    queryFn: () => getPatientLabResults(user.id),
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["patient-sessions", user.id],
    queryFn: () => getTelemedicineSessions(),
  });

  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["patient-prescriptions", user.id],
    queryFn: () => getAllPrescriptionsList({ patientId: user.id }),
  });

  const upcomingSession = useMemo(() => {
    if (!sessions) return null;
    return sessions
      .filter((s: any) => s.status === "scheduled" && new Date(s.startTime) > new Date())
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  }, [sessions]);

  if (recordsLoading || labLoading || sessionsLoading || prescriptionsLoading) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải dữ liệu của bạn..." /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-primary">
          Chào mừng trở lại, {user.name} 👋
        </h1>
        <p className="text-muted-foreground text-lg">
          Dưới đây là tóm tắt tình trạng sức khỏe và lịch trình khám bệnh của bạn.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card shadow-md border-l-4 border-l-indigo-500 bg-blue-50/30 dark:bg-blue-950/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600/80 font-bold uppercase tracking-wider">Lịch hẹn sắp tới</p>
                <p className="text-lg font-black">
                  {upcomingSession 
                    ? format(new Date(upcomingSession.startTime), "HH:mm, dd/MM", { locale: vi })
                    : "Chưa có lịch hẹn"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-md border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Pill className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-600/80 font-bold uppercase tracking-wider">Đơn thuốc</p>
                <p className="text-lg font-black">{prescriptions?.length || 0} đơn thuốc</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card shadow-md border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <FlaskConical className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600/80 font-bold uppercase tracking-wider">Kết quả xét nghiệm</p>
                <p className="text-lg font-black">{labResults?.length || 0} kết quả mới</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Medical Records */}
        <Card className="card shadow-xl overflow-hidden border-none bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                Lịch sử khám gần đây
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-blue-600 font-bold hover:bg-blue-500/10">
              <Link to="/patient/medical-records">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {medicalRecords && medicalRecords.length > 0 ? (
              <div className="divide-y divide-border/50">
                {medicalRecords.slice(0, 3).map((record: any) => (
                  <div key={record._id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{record.diagnosis}</h4>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">{format(new Date(record.date), "dd/MM/yyyy")}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{record.symptoms}</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span>Bác sĩ: {record.doctor?.name || "Bác sĩ hệ thống"}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <FileText className="w-10 h-10 opacity-20" />
                <p>Chưa có lịch sử khám bệnh.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Lab Results */}
        <Card className="card shadow-xl overflow-hidden border-none bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-500" />
                Kết quả xét nghiệm mới nhất
              </CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-emerald-600 font-bold hover:bg-emerald-500/10">
              <Link to="/patient/test-results">Xem tất cả <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {labResults && labResults.length > 0 ? (
              <div className="divide-y divide-border/50">
                {labResults.slice(0, 3).map((result: any) => (
                  <div key={result._id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{result.testType}</h4>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">Hoàn thành</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {format(new Date(result.createdAt), "dd/MM/yyyy")}</span>
                      {result.bodyPart && <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {result.bodyPart}</span>}
                    </div>
                    {result.aiAnalysis && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed">{result.aiAnalysis}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <FlaskConical className="w-10 h-10 opacity-20" />
                <p>Chưa có kết quả xét nghiệm.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card className="card shadow-2xl bg-linear-to-r from-primary/10 via-background to-background border-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-2xl font-black">Cần tư vấn từ bác sĩ?</h3>
            <p className="text-muted-foreground">Đặt lịch khám trực tuyến với các bác sĩ chuyên khoa ngay bây giờ.</p>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/20 font-bold" asChild>
              <Link to="/appointments">
                <CalendarDays className="w-5 h-5" />
                Đặt lịch khám mới
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="gap-2 font-bold bg-background/50 backdrop-blur-sm" asChild>
              <Link to="/patient/medical-records">
                <UserIcon className="w-5 h-5" />
                Hồ sơ sức khỏe
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function HMSDashboard() {
  const { data: session, isPending: isAuthLoading } = authClient.useSession();
  const navigate = useNavigate();
  const user = session?.user;

  useEffect(() => {
    // No longer redirecting patients, they get their own dashboard view
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

  const { data: doctorSchedule } = useQuery({
    queryKey: ["doctor-schedule", user?.id],
    queryFn: () => getDoctorSchedule(user!.id),
    enabled: user?.role === "doctor",
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

  if (user?.role === "patient") {
    return <PatientDashboardView user={user} />;
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

      {/* Doctor Schedule Overview */}
      {user?.role === "doctor" && doctorSchedule && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
             <StatsCards data={patients} />
          </div>
          <div className="md:col-span-1">
            <ScheduleOverview schedule={doctorSchedule} title="Lịch làm việc của tôi" />
          </div>
        </div>
      )}

      {/* 2. Top Level Stats (Non-doctors or fallback) */}
      {user?.role !== "doctor" && <StatsCards data={patients} />}

      {/* 3. Admin: Quick summary row */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Bệnh nhân nhập viện",
              value: admitted,
              icon: HeartPulse,
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/30",
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
              color: "text-blue-600",
              bg: "bg-blue-50 dark:bg-blue-950/30",
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
                    <BarChart3 className="w-5 h-5 text-blue-500" />
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
                  <Activity className="w-4 h-4 text-blue-500" />
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
                { href: "/appointments", icon: CalendarDays, label: "Lịch hẹn hôm nay", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                { href: "/bed-management", icon: BedDouble, label: "Sơ đồ giường bệnh", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
                ...(isAdmin ? [{ href: "/reports", icon: BarChart3, label: "Báo cáo & Phân tích", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" }] : []),
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
