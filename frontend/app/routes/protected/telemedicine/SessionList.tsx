import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getUsers, createTelemedicineSession, getTelemedicineSessions } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Zap, MessageCircle, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Loader from "@/components/global/Loader";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function TelemedicineHome() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;
  const isPatient = currentUser?.role === "patient";

  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isPatient) {
      fetchDoctors();
    } else {
      setLoading(false);
    }
  }, [isPatient]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await getUsers({ role: "doctor", limit: 20 });
      setDoctors(data.res);
    } catch (error) {
      toast.error("Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInstantConsult = async (doctorId: string) => {
    try {
      const existingSessions = await getTelemedicineSessions();
      const existing = existingSessions.find((s: any) => s.doctorId === doctorId || s.patientId === doctorId);
      
      if (existing) {
        navigate(`/telemedicine/sessions/${existing._id}/chat`);
        return;
      }

      const newSession = await createTelemedicineSession({
        doctorId,
        startTime: new Date().toISOString(),
        notes: "Messenger Consultation Initiation"
      });
      toast.success("Đã kết nối với bác sĩ");
      navigate(`/telemedicine/sessions/${newSession._id}/chat`);
      window.location.reload(); // Refresh layout to update sidebar
    } catch (error) {
      toast.error("Lỗi khi bắt đầu tư vấn");
    }
  };

  if (!isPatient) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-8 animate-page-in">
        <div className="relative">
          <div className="w-32 h-32 bg-indigo-100 dark:bg-indigo-950/50 rounded-full flex items-center justify-center animate-pulse">
            <MessageCircle className="w-16 h-16 text-indigo-600" />
          </div>
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-400 animate-bounce" />
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-black tracking-tighter">Chào bác sĩ {currentUser?.name}!</h2>
          <p className="text-muted-foreground font-medium text-sm leading-relaxed">
            Hệ thống tư vấn trực tuyến đã sẵn sàng. Hãy chọn một bệnh nhân từ danh sách bên trái để bắt đầu cuộc hội thoại và hỗ trợ y khoa.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
           <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Bảo mật</span>
           </div>
           <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center gap-2">
              <HeartPulse className="w-6 h-6 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Tức thời</span>
           </div>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loader label="Đang tìm chuyên gia trực tuyến..." /></div>;

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10 animate-page-in flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div>
          <Badge className="bg-indigo-100 text-indigo-700 border-none mb-3 px-3 py-1 font-black text-[10px] tracking-widest uppercase">
            Available Now
          </Badge>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Bắt đầu tư vấn mới</h2>
          <p className="text-slate-500 font-medium mt-2">Kết nối ngay với đội ngũ bác sĩ chuyên khoa hàng đầu qua hệ thống tin nhắn bảo mật.</p>
        </div>
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Tìm bác sĩ hoặc chuyên khoa..." 
            className="pl-12 h-12 rounded-2xl border-slate-200 bg-white shadow-xl shadow-indigo-500/5 focus-visible:ring-indigo-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.map((doctor) => (
          <Card 
            key={doctor._id}
            className="group relative overflow-hidden card border-none shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 p-8 flex flex-col items-center text-center space-y-6 bg-white dark:bg-slate-900"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            
            <div className="relative">
              <Avatar className="h-28 w-28 border-4 border-white dark:border-slate-800 shadow-2xl ring-4 ring-indigo-50 transition-transform duration-500 group-hover:scale-110">
                <AvatarImage src={doctor.image} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-3xl">
                  {doctor.name[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full shadow-lg" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-black text-xl text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors tracking-tight">{doctor.name}</h3>
              <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-none text-[11px] font-black uppercase tracking-wider px-3">
                {doctor.specialization || "Bác sĩ chuyên khoa"}
              </Badge>
            </div>

            <Button 
              className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 gap-3 font-black h-12 transition-all active:scale-95 group"
              onClick={() => handleStartInstantConsult(doctor._id)}
            >
              <Zap className="w-5 h-5 fill-white group-hover:animate-pulse" />
              TƯ VẤN NGAY
            </Button>
          </Card>
        ))}
        {filteredDoctors.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-40">
             <Search className="w-16 h-16 mx-auto mb-4" />
             <p className="text-xl font-bold italic">Không tìm thấy bác sĩ phù hợp với yêu cầu của bạn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
