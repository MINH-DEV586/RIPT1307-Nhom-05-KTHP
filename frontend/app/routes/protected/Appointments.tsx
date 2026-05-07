import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTelemedicineSessions } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  Video,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { useNavigate } from "react-router";

export function meta() {
  return [{ title: "Lịch hẹn | MedFlow AI" }];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "Đã lên lịch", color: "bg-blue-50 text-blue-700 border-blue-200", icon: CalendarDays },
  confirmed: { label: "Đã xác nhận", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: CheckCircle2 },
  completed: { label: "Hoàn thành", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  "in-progress": { label: "Đang diễn ra", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
};

// Generate week days for the mini calendar
function getWeekDays(base: Date) {
  const start = startOfWeek(base, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekBase, setWeekBase] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { data: session } = authClient.useSession();

  const { data: sessions = [], isLoading } = useQuery<any[]>({
    queryKey: ["telemedicine-sessions"],
    queryFn: getTelemedicineSessions,
  });

  const weekDays = getWeekDays(weekBase);

  // Filter by status
  const filtered = sessions.filter((s) => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    return true;
  });

  // Appointments for selected date (mock by index since we don't have date on session directly)
  const todaySessions = filtered;
  const todayCount = sessions.filter((s) => s.status !== "cancelled").length;
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const pendingCount = sessions.filter((s) => s.status === "scheduled" || s.status === "confirmed").length;
  const inProgressCount = sessions.filter((s) => s.status === "in-progress").length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Đang tải lịch hẹn..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Lịch hẹn & Tư vấn</h1>
          <p className="text-muted-foreground">Quản lý lịch khám và phiên tư vấn từ xa.</p>
        </div>
        <Button
          onClick={() => navigate("/telemedicine/sessions/book")}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Đặt lịch mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng lịch hẹn", value: todayCount, icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "Hoàn thành", value: completedCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Chờ xác nhận", value: pendingCount, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
          { label: "Đang diễn ra", value: inProgressCount, icon: Video, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
        ].map((stat) => (
          <Card key={stat.label} className="card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Week Calendar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {format(weekBase, "MMMM yyyy", { locale: vi })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWeekBase((d) => addDays(d, -7))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setWeekBase((d) => addDays(d, 7))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => {
                  const sel = isSameDay(day, selectedDate);
                  const tod = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        flex flex-col items-center justify-center rounded-xl h-10 text-sm font-bold transition-all
                        ${sel ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25" : "hover:bg-muted"}
                        ${tod && !sel ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-bold text-muted-foreground mb-2">Hôm nay: {format(new Date(), "EEEE, dd/MM", { locale: vi })}</p>
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => { setSelectedDate(new Date()); setWeekBase(new Date()); }}>
                  Về hôm nay
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <Card className="card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="w-4 h-4" /> Lọc trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[{ value: "all", label: "Tất cả" }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === opt.value ? "bg-indigo-600 text-white" : "hover:bg-muted"}`}
                >
                  {opt.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Sessions List */}
        <div className="lg:col-span-2">
          <Card className="card shadow-sm h-full">
            <CardHeader>
              <CardTitle>Danh sách phiên tư vấn</CardTitle>
              <CardDescription>
                {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: vi })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todaySessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground font-medium">Không có lịch hẹn nào.</p>
                  <Button
                    className="mt-4 gap-2"
                    variant="outline"
                    onClick={() => navigate("/telemedicine/sessions/book")}
                  >
                    <Plus className="w-4 h-4" /> Đặt lịch mới
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySessions.map((appt: any, idx: number) => {
                    const conf = STATUS_CONFIG[appt.status] || STATUS_CONFIG["scheduled"];
                    const StatusIcon = conf.icon;
                    return (
                      <div
                        key={appt._id}
                        className="group flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-muted/30 transition-all cursor-pointer"
                        onClick={() => navigate(`/telemedicine/sessions/${appt._id}/chat`)}
                      >
                        {/* Time col */}
                        <div className="flex flex-col items-center w-14 shrink-0">
                          <span className="text-xs font-bold text-muted-foreground">
                            {String(9 + idx).padStart(2, "0")}:00
                          </span>
                          <div className="w-px h-6 bg-border mt-1" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[10px] border ${conf.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {conf.label}
                            </Badge>
                            {appt.isVirtual && (
                              <Badge variant="secondary" className="text-[10px]">
                                <Video className="w-3 h-3 mr-1" /> Trực tuyến
                              </Badge>
                            )}
                          </div>
                          <p className="font-bold text-sm truncate">{appt.reason || "Tư vấn định kỳ"}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" /> Bệnh nhân
                            </span>
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" /> Bác sĩ phụ trách
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <Button size="sm" variant="ghost" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          Vào phòng <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
