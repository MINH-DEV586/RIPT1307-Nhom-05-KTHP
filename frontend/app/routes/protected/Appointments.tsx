import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAppointments, getDoctorAppointments, updateAppointmentStatus, createMedicalRecord } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock,
  Video,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Plus,
  MessageSquare,
  FileText,
  MoreVertical,
  MapPin,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function meta() {
  return [{ title: "Quản lý lịch hẹn | MedFlow AI" }];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  confirmed: { label: "Đã xác nhận", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20", icon: CheckCircle2 },
  completed: { label: "Hoàn thành", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isDoctor = user?.role === "doctor" || user?.role === "admin";

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", user?.role],
    queryFn: () => (isDoctor ? getDoctorAppointments() : getMyAppointments()),
    enabled: !!user,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, meetingLink, billing }: { id: string; status: string; meetingLink?: string; billing?: any }) => 
      updateAppointmentStatus(id, { status, meetingLink, billing }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    }
  });

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải lịch hẹn..." /></div>;

  const upcoming = appointments.filter(a => a.status === "pending" || a.status === "confirmed");
  const completed = appointments.filter(a => a.status === "completed");
  const cancelled = appointments.filter(a => a.status === "cancelled");

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Lịch hẹn của bạn</h1>
          <p className="text-muted-foreground text-lg">
            {isDoctor 
              ? "Quản lý các ca khám bệnh và tư vấn trực tuyến của bạn." 
              : "Theo dõi và quản lý các cuộc hẹn khám bệnh với bác sĩ."}
          </p>
        </div>
        {!isDoctor && (
          <Button
            onClick={() => navigate("/appointments/book")}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 h-12 px-6 font-bold"
          >
            <Plus className="w-5 h-5" />
            Đặt lịch mới
          </Button>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
          <TabsTrigger value="upcoming" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"> Sắp tới ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Hoàn thành ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled" className="rounded-lg px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Đã hủy ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="pt-6">
          <div className="grid gap-6">
            {upcoming.length > 0 ? (
              upcoming.map((appt) => (
                <AppointmentCard 
                  key={appt._id} 
                  appointment={appt} 
                  isDoctor={isDoctor} 
                  onStatusUpdate={(status, link, billing) => statusMutation.mutate({ id: appt._id, status, meetingLink: link, billing })}
                />
              ))
            ) : (
              <EmptyState title="Không có lịch hẹn sắp tới" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="pt-6">
          <div className="grid gap-6">
             {completed.map((appt) => (
                <AppointmentCard key={appt._id} appointment={appt} isDoctor={isDoctor} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="pt-6">
          <div className="grid gap-6">
             {cancelled.map((appt) => (
                <AppointmentCard key={appt._id} appointment={appt} isDoctor={isDoctor} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppointmentCard({ appointment, isDoctor, onStatusUpdate }: { appointment: any, isDoctor: boolean, onStatusUpdate?: (status: string, link?: string, billing?: any) => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [diagnosisData, setDiagnosisData] = useState({
    diagnosis: "",
    treatmentPlan: "",
    notes: "",
    consultationFee: appointment.doctor?.consultationFee || 200000,
    labFee: 0,
    prescriptionFee: 0
  });

  const status = STATUS_MAP[appointment.status];
  const person = isDoctor ? appointment.patient : appointment.doctor;
  const isOnline = appointment.type === "online";

  const medicalRecordMutation = useMutation({
    mutationFn: (data: any) => createMedicalRecord(data),
    onSuccess: () => {
      toast.success("Đã lưu chuẩn đoán và bệnh án!");
      setDiagnosisModalOpen(false);
      onStatusUpdate?.("completed", undefined, {
        consultationFee: Number(diagnosisData.consultationFee),
        labFee: Number(diagnosisData.labFee),
        prescriptionFee: Number(diagnosisData.prescriptionFee)
      });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => toast.error("Lỗi khi lưu bệnh án")
  });

  const handleSaveDiagnosis = (e: React.FormEvent) => {
    e.preventDefault();
    medicalRecordMutation.mutate({
      patient: appointment.patientId,
      doctor: appointment.doctorId,
      symptoms: appointment.symptoms,
      ...diagnosisData
    });
  };

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all group relative">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isOnline ? "bg-indigo-500" : "bg-emerald-500"}`} />
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Info */}
          <div className="flex-1 flex gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/10 shadow-sm">
              <AvatarImage src={person?.image || ""} />
              <AvatarFallback className="bg-primary/10 font-bold text-primary">
                {person?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black">{person?.name}</h3>
                <Badge className={status.color}>
                  <status.icon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm font-bold text-indigo-600">{person?.specialization || (isDoctor ? "Bệnh nhân" : "Bác sĩ")}</p>
              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {format(new Date(appointment.date), "dd/MM/yyyy")}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {appointment.timeSlot}</span>
                <span className="flex items-center gap-1.5">
                  {isOnline ? <Video className="w-4 h-4 text-indigo-500" /> : <MapPin className="w-4 h-4 text-emerald-500" />}
                  {isOnline ? "Tư vấn trực tuyến" : "Tại bệnh viện"}
                </span>
              </div>
            </div>
          </div>

          {/* Center: Symptoms (Desktop) */}
          <div className="hidden md:block flex-1 border-l pl-6">
             <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Triệu chứng & Ghi chú</h4>
             <p className="text-sm font-medium line-clamp-3 leading-relaxed">{appointment.symptoms}</p>
             {appointment.patientType === "family" && (
                <Badge variant="outline" className="mt-2 bg-indigo-50 text-indigo-700 border-indigo-200">Khám cho: {appointment.patientName}</Badge>
             )}
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col justify-center gap-2 min-w-[160px]">
            {appointment.status === "pending" && isDoctor && (
              <>
                <Button onClick={() => onStatusUpdate?.("confirmed")} className="bg-indigo-600 hover:bg-indigo-700 font-bold">Chấp nhận</Button>
                <Button variant="outline" onClick={() => onStatusUpdate?.("cancelled")} className="text-rose-600 border-rose-200 hover:bg-rose-50">Từ chối</Button>
              </>
            )}
            
            {appointment.status === "confirmed" && (
              <>
                {isOnline && (
                  <Button onClick={() => navigate(`/telemedicine/sessions/${appointment._id}/chat`)} className="gap-2 bg-indigo-600 font-bold">
                    <Video className="w-4 h-4" /> Vào phòng họp
                  </Button>
                )}
                {isDoctor && (
                  <Button onClick={() => setDiagnosisModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold">
                    <FileText className="w-4 h-4" /> Ghi chuẩn đoán
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  className="gap-2 font-bold text-muted-foreground"
                  onClick={() => navigate(`/telemedicine/sessions/${appointment._id}/chat`)}
                >
                  <MessageSquare className="w-4 h-4" /> Nhắn tin
                </Button>
              </>
            )}

            {appointment.status === "completed" && (
              <>
                <Button
                  variant="outline"
                  className="gap-2 font-bold"
                  onClick={() => navigate("/patient/prescriptions")}
                >
                  <FileText className="w-4 h-4" /> Xem đơn thuốc
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 font-bold"
                  onClick={() => navigate("/patient/test-results")}
                >
                  <FileText className="w-4 h-4" /> Kết quả khám
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                  <DropdownMenuItem
                    className="text-rose-600 font-medium"
                    onClick={() => onStatusUpdate?.("cancelled")}
                  >
                    Hủy lịch hẹn
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="font-medium" onClick={() => navigate(`/patient/medical-records`)}>Xem chi tiết bệnh án</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Diagnosis Modal */}
      <Dialog open={diagnosisModalOpen} onOpenChange={setDiagnosisModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Ghi chuẩn đoán & Điều trị</DialogTitle>
            <DialogDescription>
              Bệnh nhân: <span className="font-bold text-primary">{person?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveDiagnosis} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Chuẩn đoán bệnh</Label>
              <Input 
                placeholder="Ví dụ: Viêm họng cấp, Suy nhược cơ thể..." 
                className="bg-muted/50"
                required
                value={diagnosisData.diagnosis}
                onChange={(e) => setDiagnosisData({...diagnosisData, diagnosis: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Phác đồ điều trị</Label>
              <Textarea 
                placeholder="Mô tả các bước điều trị, thuốc cần dùng..." 
                className="bg-muted/50 min-h-[120px]"
                required
                value={diagnosisData.treatmentPlan}
                onChange={(e) => setDiagnosisData({...diagnosisData, treatmentPlan: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Lời khuyên & Ghi chú</Label>
              <Textarea 
                placeholder="Dặn dò bệnh nhân về chế độ ăn uống, sinh hoạt..." 
                className="bg-muted/50"
                value={diagnosisData.notes}
                onChange={(e) => setDiagnosisData({...diagnosisData, notes: e.target.value})}
              />
            </div>

            <div className="pt-4 border-t space-y-4">
               <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-600">Thông tin viện phí</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Phí khám (VNĐ)</Label>
                    <Input 
                      type="number"
                      value={diagnosisData.consultationFee}
                      onChange={(e) => setDiagnosisData({...diagnosisData, consultationFee: e.target.value})}
                      className="bg-muted/50 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Phí xét nghiệm (VNĐ)</Label>
                    <Input 
                      type="number"
                      value={diagnosisData.labFee}
                      onChange={(e) => setDiagnosisData({...diagnosisData, labFee: e.target.value})}
                      className="bg-muted/50 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tiền thuốc (VNĐ)</Label>
                    <Input 
                      type="number"
                      value={diagnosisData.prescriptionFee}
                      onChange={(e) => setDiagnosisData({...diagnosisData, prescriptionFee: e.target.value})}
                      className="bg-muted/50 font-bold"
                    />
                  </div>
               </div>
               <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="text-sm font-bold text-indigo-700">Tổng cộng ước tính:</span>
                  <span className="text-lg font-black text-indigo-700">
                    {(Number(diagnosisData.consultationFee) + Number(diagnosisData.labFee) + Number(diagnosisData.prescriptionFee)).toLocaleString()} VNĐ
                  </span>
               </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDiagnosisModalOpen(false)}>Hủy</Button>
              <Button type="submit" className="bg-indigo-600 font-bold px-8" disabled={medicalRecordMutation.isPending}>
                {medicalRecordMutation.isPending ? "Đang lưu..." : "Lưu & Hoàn thành khám"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed">
      <div className="p-6 bg-muted rounded-full opacity-40">
        <CalendarDays className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-bold text-muted-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-sm">Mọi lịch hẹn của bạn sẽ xuất hiện tại đây để bạn dễ dàng theo dõi.</p>
    </div>
  );
}
