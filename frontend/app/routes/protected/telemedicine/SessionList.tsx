import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { getTelemedicineSessions, updateSessionStatus, getUsers, createTelemedicineSession } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Video, 
  MessageSquare, 
  Calendar, 
  Clock, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Plus,
  Search,
  User,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/global/Loader";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";

export default function ManageSessions() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const isPatient = session?.user.role === "patient";

  const [sessions, setSessions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSessions();
    if (isPatient) {
      fetchDoctors();
    }
  }, [isPatient]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getTelemedicineSessions();
      setSessions(data);
    } catch (error) {
      toast.error("Không thể tải danh sách phiên tư vấn");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setDoctorsLoading(true);
      const data = await getUsers({ role: "doctor", limit: 20 });
      setDoctors(data.res);
    } catch (error) {
      toast.error("Không thể tải danh sách bác sĩ");
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleStartInstantConsult = async (doctorId: string) => {
    try {
      const newSession = await createTelemedicineSession({
        doctorId,
        startTime: new Date().toISOString(),
        notes: "Tư vấn trực tuyến trực tiếp"
      });
      toast.success("Đã tạo phiên tư vấn thành công");
      navigate(`/telemedicine/sessions/${newSession._id}/chat`);
    } catch (error) {
      toast.error("Lỗi khi bắt đầu tư vấn");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateSessionStatus(id, status);
      toast.success("Đã cập nhật trạng thái");
      fetchSessions();
    } catch (error) {
      toast.error("Lỗi khi cập nhật");
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader label="Đang tải dữ liệu tư vấn..." />
      </div>
    );
  }

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-page-in">
      {/* Active Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Phiên tư vấn của bạn</h2>
            <p className="text-sm text-slate-500 font-medium">Quản lý các cuộc trò chuyện đang diễn ra và sắp tới.</p>
          </div>
          {isPatient && (
            <Button asChild variant="outline" className="rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold px-6">
              <Link to="/telemedicine/sessions/book" className="gap-2">
                <Plus className="w-4 h-4" /> Đặt lịch hẹn trước
              </Link>
            </Button>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium italic">Bạn chưa có phiên tư vấn nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card 
                key={session._id} 
                className="group card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border-none overflow-hidden"
              >
                <div className={cn(
                  "h-1.5 w-full",
                  session.status === "active" ? "bg-emerald-500" : 
                  session.status === "scheduled" ? "bg-indigo-500" : 
                  session.status === "completed" ? "bg-slate-400" : "bg-red-400"
                )} />
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-indigo-50 shadow-sm">
                         <AvatarImage src={session.otherUser?.image} />
                         <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                           {session.otherUser?.name?.[0].toUpperCase() || "?"}
                         </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm font-bold tracking-tight">{session.otherUser?.name || "Người dùng"}</CardTitle>
                        <CardDescription className="text-[9px] uppercase font-bold text-indigo-500/70">
                           {session.otherUser?.role === 'doctor' ? 'Bác sĩ phụ trách' : 'Bệnh nhân'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-[9px] font-black border-none px-2 py-0.5",
                      session.status === "active" ? "bg-emerald-100 text-emerald-700" :
                      session.status === "scheduled" ? "bg-indigo-100 text-indigo-700" : 
                      "bg-slate-100 text-slate-600"
                    )}>
                      {session.status === "active" ? "ACTIVE" : 
                       session.status === "scheduled" ? "SCHEDULED" : "FINISHED"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      {new Date(session.startTime).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {new Date(session.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1 rounded-lg font-bold" variant={session.status === "active" ? "default" : "outline"}>
                      <Link to={`/telemedicine/sessions/${session._id}/chat`}>
                        <MessageSquare className="w-3.5 h-3.5 mr-2" /> Nhắn tin
                      </Link>
                    </Button>
                    {session.status === "scheduled" && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-lg hover:bg-emerald-50 hover:text-emerald-600"
                        onClick={() => handleStatusChange(session._id, "active")} 
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Start New Consultation Section - ONLY FOR PATIENTS */}
      {isPatient && (
        <section className="space-y-6 pt-6 border-t">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Bắt đầu tư vấn mới</h2>
              <p className="text-sm text-slate-500 font-medium">Chọn một bác sĩ đang trực tuyến để nhận tư vấn ngay lập tức.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Tìm bác sĩ hoặc chuyên khoa..." 
                className="pl-10 rounded-full border-slate-200 bg-white shadow-sm focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {doctorsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card 
                  key={doctor._id}
                  className="group card border-none shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all p-5 flex flex-col items-center text-center space-y-4"
                >
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-xl ring-2 ring-indigo-50">
                      <AvatarImage src={doctor.image} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-xl">
                        {doctor.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-sm" />
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{doctor.name}</h3>
                    <Badge variant="secondary" className="mt-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none text-[10px] font-black uppercase tracking-wider">
                      {doctor.specialization || "Đa khoa"}
                    </Badge>
                  </div>

                  <Button 
                    className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 gap-2 font-black text-xs"
                    onClick={() => handleStartInstantConsult(doctor._id)}
                  >
                    <Zap className="w-4 h-4 fill-white animate-pulse" />
                    TƯ VẤN NGAY
                  </Button>
                </Card>
              ))}
              {filteredDoctors.length === 0 && (
                <div className="col-span-full py-10 text-center">
                  <p className="text-slate-400 italic">Không tìm thấy bác sĩ phù hợp.</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
