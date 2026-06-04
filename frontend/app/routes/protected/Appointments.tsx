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
import { ConsultationModal } from "@/components/appointments/ConsultationModal";

export function meta() {
  return [{ title: "Quản lý lịch hẹn | MedFlow AI" }];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CheckCircle2 },
  completed: { label: "Hoàn thành", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle },
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const isDoctorOrAdmin = isDoctor || isAdmin;

  const appointmentQueryKey = ["appointments", user?.role, user?.id] as const;

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: appointmentQueryKey,
    queryFn: () => (isDoctorOrAdmin ? getDoctorAppointments() : getMyAppointments()),
    enabled: !!user,
    refetchOnMount: "always",
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, meetingLink, billing, rejectionReason }: { id: string; status: string; meetingLink?: string; billing?: any; rejectionReason?: string }) => 
      updateAppointmentStatus(id, { status, meetingLink, billing, rejectionReason }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: appointmentQueryKey, exact: true });
      await queryClient.cancelQueries({ queryKey: ["appointments"], exact: false });
      const prevData = queryClient.getQueryData(appointmentQueryKey);
      queryClient.setQueryData(appointmentQueryKey, (old: any) => {
        if (!old) return old;
        return old.map((appt: any) => appt._id === variables.id ? { ...appt, status: variables.status, meetingLink: variables.meetingLink, rejectionReason: variables.rejectionReason } : appt);
      });
      return { prevData };
    },
    onError: (err, variables, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(appointmentQueryKey, context.prevData);
      }
      toast.error(err.message || "Lỗi khi cập nhật trạng thái");
    },
    onSuccess: () => {
      toast.success("Cập nhật trạng thái thành công");
      queryClient.invalidateQueries({ queryKey: appointmentQueryKey, exact: true });
      queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
    }
  });

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải lịch hẹn..." /></div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcoming = appointments.filter(a => {
    const appointmentDate = new Date(a.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return (a.status === "pending" || a.status === "confirmed") && appointmentDate.getTime() >= today.getTime();
  });
  const completed = appointments.filter(a => a.status === "completed").reverse();
  const cancelled = appointments.filter(a => a.status === "cancelled").reverse();

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {isAdmin ? "Quản lý toàn bộ lịch hẹn" : "Lịch hẹn của bạn"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isAdmin 
              ? "Theo dõi và giám sát tất cả các cuộc hẹn trong hệ thống."
              : isDoctor 
                ? "Quản lý các ca khám bệnh và tư vấn trực tuyến của bạn." 
                : "Theo dõi và quản lý các cuộc hẹn khám bệnh với bác sĩ."}
          </p>
        </div>
        {!isDoctorOrAdmin && (
          <Button
            onClick={() => navigate("/appointments/book")}
            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 h-12 px-6 font-bold"
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
                  isDoctor={isDoctorOrAdmin} 
                  isAdmin={isAdmin}
                  onStatusUpdate={(status, link, billing, reason) => statusMutation.mutate({ id: appt._id, status, meetingLink: link, billing, rejectionReason: reason })}
                />
              ))
            ) : (
              <EmptyState title="Không có lịch hẹn sắp tới" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="pt-6">
          <div className="grid gap-6">
            {completed.length > 0 ? (
              completed.map((appt) => (
                <AppointmentCard key={appt._id} appointment={appt} isDoctor={isDoctorOrAdmin} isAdmin={isAdmin} />
              ))
            ) : (
              <EmptyState title="Không có lịch hẹn hoàn thành" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="pt-6">
          <div className="grid gap-6">
            {cancelled.length > 0 ? (
              cancelled.map((appt) => (
                <AppointmentCard key={appt._id} appointment={appt} isDoctor={isDoctorOrAdmin} isAdmin={isAdmin} />
              ))
            ) : (
              <EmptyState title="Không có lịch hẹn đã hủy" />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AppointmentCard({ 
  appointment, 
  isDoctor, 
  isAdmin, 
  onStatusUpdate 
}: { 
  appointment: any, 
  isDoctor: boolean, 
  isAdmin?: boolean, 
  onStatusUpdate?: (status: string, link?: string, billing?: any, reason?: string) => void 
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [diagnosisModalOpen, setDiagnosisModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const isPending = appointment.status === "pending";
  const modalTitle = isPending ? "Từ chối lịch hẹn" : "Hủy lịch hẹn";
  const modalDesc = isPending ? "Vui lòng cho biết lý do bạn từ chối lịch hẹn này để bệnh nhân được rõ." : "Vui lòng cho biết lý do bạn hủy lịch hẹn này.";
  const modalLabel = isPending ? "Lý do từ chối" : "Lý do hủy";

  const status = STATUS_MAP[appointment.status];
  const person = isDoctor ? appointment.patient : appointment.doctor;
  const isOnline = appointment.type === "online";

  const handleFinalizeConsultation = (billingData: any) => {
    onStatusUpdate?.("completed", undefined, billingData);
    setDiagnosisModalOpen(false);
  };

  const appointmentDate = new Date(appointment.date);
  appointmentDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isFuture = appointmentDate.getTime() > today.getTime();

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all group relative">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${isOnline ? "bg-blue-500" : "bg-emerald-500"}`} />
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
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-foreground">
                  {appointment.patient?.name || "Bệnh nhân"}
                </h3>
                <Badge className={status.color}>
                  <status.icon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              {/* Loại bệnh nhân */}
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
                  {appointment.patientType === "family" ? `Khám cho người thân: ${appointment.patientName}` : "Khám cho bản thân"}
                </Badge>
              </div>

              {/* Bác sĩ & Khoa */}
              <div className="flex flex-col gap-0.5 pt-1">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                  <Stethoscope className="w-4 h-4" />
                  <span>Bác sĩ: {appointment.doctor?.name || "Chưa xác định"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 ml-6">
                  <span>Khoa: {appointment.doctor?.specialization || "Bác sĩ chuyên khoa"}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> {format(new Date(appointment.date), "dd/MM/yyyy")}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {appointment.timeSlot}</span>
                <span className="flex items-center gap-1.5">
                  {isOnline ? <Video className="w-4 h-4 text-blue-500" /> : <MapPin className="w-4 h-4 text-emerald-500" />}
                  {isOnline ? "Tư vấn trực tuyến" : "Tại bệnh viện"}
                </span>
              </div>
            </div>
          </div>

              <div className="hidden md:block flex-1 border-l pl-6">
                 <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Triệu chứng & Ghi chú</h4>
                 <p className="text-sm font-medium line-clamp-2 leading-relaxed">{appointment.symptoms}</p>
                 {appointment.rejectionReason && (
                    <div className="mt-2 p-2 bg-rose-50 rounded-lg border border-rose-100">
                      <p className="text-[10px] font-black uppercase text-rose-600 mb-1">Lý do từ chối:</p>
                      <p className="text-xs font-bold text-rose-700">{appointment.rejectionReason}</p>
                    </div>
                 )}
              </div>

          {/* Right: Actions */}
          <div className="flex flex-col justify-center gap-2 min-w-[160px]">
            {appointment.status === "pending" && isDoctor && !isAdmin && (
              <>
                <Button onClick={() => onStatusUpdate?.("confirmed")} className="bg-blue-600 hover:bg-blue-700 font-bold">Chấp nhận</Button>
                <Button variant="outline" onClick={() => setRejectionModalOpen(true)} className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold">Từ chối</Button>
              </>
            )}
            
            {appointment.status === "confirmed" && (
              <>
                {isOnline && (
                  <Button 
                    onClick={() => navigate(`/telemedicine/sessions/${appointment._id}/chat`)} 
                    className="gap-2 bg-blue-600 font-bold"
                    disabled={isFuture}
                    title={isFuture ? "Chỉ khả dụng vào ngày khám" : ""}
                  >
                    <Video className="w-4 h-4" /> Vào phòng họp
                  </Button>
                )}
                {isDoctor && !isAdmin && (
                  <Button 
                    onClick={() => setDiagnosisModalOpen(true)} 
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold"
                    disabled={isFuture}
                    title={isFuture ? "Chỉ khả dụng vào ngày khám" : ""}
                  >
                    <FileText className="w-4 h-4" /> Ghi chuẩn đoán
                  </Button>
                )}
                {isFuture && (
                  <span className="text-[10px] font-bold text-amber-600 text-center bg-amber-50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-100 dark:border-amber-900/50">
                    Chưa đến ngày khám
                  </span>
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
                  onClick={() => {
                    // Patients see their prescriptions page. Staff (doctor/admin) should view prescriptions via pharmacy.
                    if (isDoctor || isAdmin) {
                      // pass patientId to pharmacy prescriptions so staff can view this patient's prescriptions
                      navigate(`/pharmacy/prescriptions?patientId=${appointment.patientId}`);
                    } else {
                      navigate("/patient/prescriptions");
                    }
                  }}
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

            {/* Thêm nút Hủy lịch trực tiếp cho Bệnh nhân */}
            {!isDoctor && !isAdmin && (appointment.status === "pending" || appointment.status === "confirmed") && (
              <Button 
                variant="outline" 
                className="text-rose-600 border-rose-200 hover:bg-rose-50 font-bold gap-2 mt-2"
                onClick={() => setRejectionModalOpen(true)}
              >
                <XCircle className="w-4 h-4" /> Hủy lịch hẹn
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {appointment.status !== "cancelled" && appointment.status !== "completed" && !isAdmin && (
                  <DropdownMenuItem
                    className="text-rose-600 font-medium"
                    onClick={() => setRejectionModalOpen(true)}
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

      {/* Consultation Modal (Advanced Diagnosis & Indications) */}
      <ConsultationModal 
        appointment={appointment}
        isOpen={diagnosisModalOpen}
        onClose={() => setDiagnosisModalOpen(false)}
        onComplete={handleFinalizeConsultation}
      />

      {/* Rejection/Cancel Modal */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600">{modalTitle}</DialogTitle>
            <DialogDescription>
              {modalDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="reason" className="text-sm font-bold">{modalLabel}</Label>
            <Textarea 
              id="reason" 
              placeholder="Ví dụ: Bác sĩ có việc bận đột xuất, vui lòng chọn giờ khác..." 
              className="mt-2 bg-muted/50"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectionModalOpen(false)}>Quay lại</Button>
            <Button 
              className="bg-rose-600 hover:bg-rose-700 font-bold" 
              onClick={() => {
                if (!rejectionReason) {
                  toast.error(`Vui lòng nhập ${modalLabel.toLowerCase()}`);
                  return;
                }
                onStatusUpdate?.("cancelled", undefined, undefined, rejectionReason);
                setRejectionModalOpen(false);
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
function EmptyState({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-xl border border-dashed">
      <div className="p-6 bg-muted rounded-full opacity-40">
        <CalendarDays className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-bold text-muted-foreground">{title}</h3>
      <p className="text-muted-foreground max-w-sm">Mọi lịch hẹn của bạn sẽ xuất hiện tại đây để bạn dễ dàng theo dõi.</p>
    </div>
  );
}
