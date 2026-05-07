import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getTelemedicineSessions, updateSessionStatus } from "@/lib/api";
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
  CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/global/Loader";

export default function ManageSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getTelemedicineSessions();
      setSessions(data);
    } catch (error) {
      toast.error("Không thể tải danh sách phiên khám");
    } finally {
      setLoading(false);
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
        <Loader label="Đang tải danh sách phiên khám..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-page-in">
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border border-dashed border-border/60">
          <CalendarDays className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chưa có phiên khám nào</h3>
          <p className="text-muted-foreground max-w-xs mt-2">
            Bạn chưa thực hiện hoặc chưa có lịch hẹn tư vấn trực tuyến nào được thiết lập.
          </p>
          <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
            <Link to="/telemedicine/sessions/book">Đặt lịch ngay bây giờ</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                    <Avatar className="h-12 w-12 border-2 border-indigo-50 shadow-sm">
                       <AvatarImage src={session.otherUser?.image} />
                       <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">
                         {session.otherUser?.name?.[0].toUpperCase() || "?"}
                       </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base font-black tracking-tight">{session.otherUser?.name || "Người dùng"}</CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold text-indigo-500/70">
                         {session.otherUser?.role === 'doctor' ? 'Bác sĩ phụ trách' : 'Bệnh nhân'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={cn(
                    "text-[10px] font-black border-none",
                    session.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    session.status === "scheduled" ? "bg-indigo-100 text-indigo-700" : 
                    "bg-slate-100 text-slate-600"
                  )}>
                    {session.status === "active" ? "ĐANG DIỄN RA" : 
                     session.status === "scheduled" ? "SẮP TỚI" : 
                     session.status === "completed" ? "HOÀN THÀNH" : "ĐÃ HỦY"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {new Date(session.startTime).toLocaleDateString("vi-VN")}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {new Date(session.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {session.notes && (
                  <div className="flex gap-2 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100/50 dark:border-amber-900/20">
                     <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                     <p className="text-[11px] text-amber-800 dark:text-amber-300 line-clamp-2 leading-relaxed">
                        {session.notes}
                     </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button asChild className="flex-1 rounded-xl shadow-lg shadow-indigo-500/10 font-bold" variant={session.status === "active" ? "default" : "outline"}>
                    <Link to={`/telemedicine/sessions/${session._id}/chat`}>
                      <MessageSquare className="w-4 h-4 mr-2" /> Nhắn tin
                    </Link>
                  </Button>
                  {session.status === "scheduled" && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                      onClick={() => handleStatusChange(session._id, "active")} 
                      title="Bắt đầu phiên khám"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
