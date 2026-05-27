import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllInvoices, getUsers } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Download,
  BarChart3,
  FileText,
  Calendar,
  Loader2,
} from "lucide-react";
import Loader from "@/components/global/Loader";
import type { User } from "@/types";

export function meta() {
  return [{ title: "Báo cáo & Phân tích | MedFlow AI" }];
}

const MONTH_LABELS = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];

const STATUS_COLORS: Record<string, string> = {
  admitted: "#6366f1",
  in_treatment: "#3b82f6",
  observation: "#f59e0b",
  discharged: "#10b981",
  follow_up: "#8b5cf6",
  active: "#22c55e",
};

const ROLE_LABELS: Record<string, string> = {
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  pharmacist: "Dược sĩ",
  lab_tech: "KTV xét nghiệm",
  patient: "Bệnh nhân",
};

const TIME_RANGES = [
  { label: "6 tháng", months: 6 },
  { label: "1 năm", months: 12 },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState(12);

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ["all-invoices-report"],
    queryFn: () => getAllInvoices({ page: 1, limit: 100 }),
  });

  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ["patients-report"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-report"],
    queryFn: () => getUsers({ role: "doctor", limit: 100 }),
  });

  const isLoading = invoicesLoading || patientsLoading || staffLoading;

  const invoices = invoicesData?.res || [];
  const patients = patientsData?.res || [];
  const doctors = staffData?.res || [];

  // Revenue chart data
  const revenueData = useMemo(() => {
    const now = new Date();
    const startMonth = now.getMonth() - timeRange + 1;
    return Array.from({ length: timeRange }, (_, i) => {
      const monthIdx = ((startMonth + i) % 12 + 12) % 12;
      const label = MONTH_LABELS[monthIdx];
      const paid = invoices
        .filter((inv) => {
          if (inv.status !== "paid") return false;
          const d = new Date(inv.createdAt || "");
          return d.getMonth() === monthIdx;
        })
        .reduce((s, inv) => s + (inv.totalAmount || 0), 0);
      const pending = invoices
        .filter((inv) => {
          if (inv.status !== "pending_payment") return false;
          const d = new Date(inv.createdAt || "");
          return d.getMonth() === monthIdx;
        })
        .reduce((s, inv) => s + (inv.totalAmount || 0), 0);
      return { name: label, "Đã thu": paid, "Chờ thu": pending };
    });
  }, [invoices, timeRange]);

  // Patient status distribution
  const patientStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    patients.forEach((p: User) => {
      const status = p.status || "active";
      counts[status] = (counts[status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status === "admitted" ? "Nhập viện"
        : status === "in_treatment" ? "Đang điều trị"
        : status === "observation" ? "Theo dõi"
        : status === "discharged" ? "Xuất viện"
        : status === "follow_up" ? "Tái khám"
        : status === "active" ? "Hoạt động"
        : status,
      value: count,
      fill: STATUS_COLORS[status] || "#94a3b8",
    }));
  }, [patients]);

  // Mock admissions trend (weekly)
  const admissionTrend = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      week: `Tuần ${i + 1}`,
      "Nhập viện": Math.floor(Math.random() * 15) + 5,
      "Xuất viện": Math.floor(Math.random() * 12) + 3,
    }));
  }, []);

  // Top doctors by patient count (mock)
  const topDoctors = useMemo(() => {
    return doctors.slice(0, 5).map((doc: User, i) => ({
      name: doc.name,
      patients: Math.floor(Math.random() * 20) + 5,
      specialization: doc.specialization || "Đa khoa",
    }));
  }, [doctors]);

  // Summary numbers
  const totalRevenue = invoices.reduce((s, i) => s + (i.status === "paid" ? i.totalAmount : 0), 0);
  const pendingRevenue = invoices.reduce((s, i) => s + (i.status === "pending_payment" ? i.totalAmount : 0), 0);
  const totalPatients = patients.length;
  const admittedPatients = patients.filter((p: User) => p.status === "admitted").length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Đang tải báo cáo..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Báo cáo & Phân tích</h1>
          <p className="text-muted-foreground">Tổng quan toàn diện về hoạt động và tài chính bệnh viện.</p>
        </div>
        <div className="flex gap-2 no-print">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.months}
              size="sm"
              variant={timeRange === r.months ? "default" : "outline"}
              onClick={() => setTimeRange(r.months)}
              className={timeRange === r.months ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            >
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="w-4 h-4" /> Xuất PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Tổng doanh thu",
            value: `${totalRevenue.toLocaleString()} VNĐ`,
            sub: "Đã thu được",
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/30",
            trend: "+12.5%",
            trendUp: true,
          },
          {
            label: "Chờ thu",
            value: `${pendingRevenue.toLocaleString()} VNĐ`,
            sub: "Chưa thanh toán",
            icon: FileText,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/30",
            trend: "-3.2%",
            trendUp: false,
          },
          {
            label: "Tổng bệnh nhân",
            value: totalPatients,
            sub: "Đang quản lý",
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50 dark:bg-indigo-950/30",
            trend: "+8.1%",
            trendUp: true,
          },
          {
            label: "Đang nội trú",
            value: admittedPatients,
            sub: "Bệnh nhân nhập viện",
            icon: Activity,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/30",
            trend: "+2.4%",
            trendUp: true,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-xl ${kpi.bg}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <Badge
                  className={`text-[10px] font-bold border-0 ${kpi.trendUp ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                >
                  <TrendingUp className={`w-3 h-3 mr-0.5 ${!kpi.trendUp ? "rotate-180" : ""}`} />
                  {kpi.trend}
                </Badge>
              </div>
              <p className="text-2xl font-black">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <Card className="card shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Xu hướng doanh thu
            </CardTitle>
            <CardDescription>Doanh thu đã thu và còn chờ theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }}
                    formatter={(v: number) => [`${v.toLocaleString()} VNĐ`, ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Đã thu" stroke="#6366f1" strokeWidth={2} fill="url(#gradPaid)" />
                  <Area type="monotone" dataKey="Chờ thu" stroke="#f59e0b" strokeWidth={2} fill="url(#gradPending)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Patient Status Pie */}
        <Card className="card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" />
              Trạng thái bệnh nhân
            </CardTitle>
            <CardDescription>Phân bổ hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            {patientStatusData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">Không có dữ liệu</div>
            ) : (
              <>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={patientStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {patientStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: "8px", fontSize: "12px", background: "var(--card)", border: "1px solid var(--border)" }}
                        formatter={(v: any) => [`${v} BN`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {patientStatusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-bold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admission/Discharge Trend */}
        <Card className="card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Xu hướng nhập/xuất viện
            </CardTitle>
            <CardDescription>Theo tuần trong tháng qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="week" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--card-foreground)" }}
                  />
                  <Legend />
                  <Bar dataKey="Nhập viện" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={18} />
                  <Bar dataKey="Xuất viện" fill="#10b981" radius={[4, 4, 0, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Doctors */}
        <Card className="card shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Bác sĩ tiếp nhận nhiều nhất
            </CardTitle>
            <CardDescription>Theo số bệnh nhân đã điều trị</CardDescription>
          </CardHeader>
          <CardContent>
            {topDoctors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Chưa có dữ liệu bác sĩ.</p>
            ) : (
              <div className="space-y-4">
                {topDoctors.map((doc, i) => {
                  const maxPatients = Math.max(...topDoctors.map((d) => d.patients));
                  const pct = Math.round((doc.patients / maxPatients) * 100);
                  return (
                    <div key={doc.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-muted-foreground w-4">{i + 1}.</span>
                          <span className="font-bold truncate max-w-36">{doc.name || "Bác sĩ " + (i + 1)}</span>
                          <Badge variant="secondary" className="text-[10px]">{doc.specialization}</Badge>
                        </div>
                        <span className="font-bold text-indigo-600">{doc.patients} BN</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
