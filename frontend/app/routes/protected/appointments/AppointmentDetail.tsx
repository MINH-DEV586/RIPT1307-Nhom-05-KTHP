import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAppointmentById, updateAppointmentStatus } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Clock, MapPin, Video, Stethoscope, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Loader from "@/components/global/Loader";

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  confirmed: { label: "Đã xác nhận", color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20" },
  completed: { label: "Hoàn thành", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  cancelled: { label: "Đã hủy", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
};

export function meta() {
  return [{ title: "Chi tiết lịch hẹn" }];
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();

  const { data: appointment, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["appointment", id],
    queryFn: () => getAppointmentById(id!),
    enabled: !!id,
    onError: (err: any) => toast.error(err?.message || "Không thể tải chi tiết lịch hẹn"),
  });

  const isDoctor = session?.user?.role === "doctor" || session?.user?.role === "admin";
  const isPendingApproval = appointment?.status === "pending";

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: string }) => updateAppointmentStatus(id!, { status }),
    onSuccess: () => {
      toast.success("Cập nhật trạng thái lịch hẹn thành công");
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Không thể cập nhật trạng thái lịch hẹn");
    },
  });

  const handleStatusChange = (newStatus: string) => {
    if (!id) return;
    statusMutation.mutate({ status: newStatus });
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader label="Đang tải chi tiết lịch hẹn..." />
      </div>
    );
  }

  if (!appointment || isError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
        <p className="text-red-500 font-semibold">Không tìm thấy lịch hẹn.</p>
        <Button asChild>
          <Link to="/appointments" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
        </Button>
      </div>
    );
  }

  const status = STATUS_MAP[appointment.status] || STATUS_MAP.pending;
  const isOnline = appointment.type === "online";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Chi tiết lịch hẹn</h1>
          <p className="text-sm text-slate-500">Mã lịch hẹn: {appointment._id}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/appointments" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Quay lại
          </Link>
        </Button>
      </div>

      <Card className="shadow-xl bg-card/70 border border-slate-200">
        <CardHeader>
          <CardTitle className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span>{appointment.title || "Lịch hẹn khám bệnh"}</span>
            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={status.color}>{status.label}</Badge>
              {isDoctor && isPendingApproval && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => handleStatusChange("confirmed")}
                    disabled={statusMutation.isLoading}
                  >
                    Xác nhận
                  </Button>
                  <Button
                    variant="destructive"
                    className="border-rose-500 text-rose-600 hover:bg-rose-50"
                    onClick={() => handleStatusChange("cancelled")}
                    disabled={statusMutation.isLoading}
                  >
                    Hủy
                  </Button>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Bệnh nhân</p>
                <p className="font-semibold">{appointment.patient?.name || appointment.patientName || "Không xác định"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Bác sĩ</p>
                <p className="font-semibold">{appointment.doctor?.name || "Chưa xác định"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Ngày</p>
                <p className="font-semibold">{format(new Date(appointment.date), "dd/MM/yyyy")}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Giờ</p>
                <p className="font-semibold">{appointment.timeSlot}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isOnline ? <Video className="w-5 h-5 text-indigo-500" /> : <MapPin className="w-5 h-5 text-emerald-500" />}
              <span className="font-semibold">{isOnline ? "Khám trực tuyến" : "Khám tại bệnh viện"}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">Triệu chứng / ghi chú</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {appointment.symptoms || appointment.notes || "Không có ghi chú"}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Thông tin thêm</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                <p><span className="font-semibold">Loại bệnh nhân:</span> {appointment.patientType === "family" ? `Khám cho ${appointment.patientName}` : "Khám cho bản thân"}</p>
                <p><span className="font-semibold">Trạng thái:</span> {status.label}</p>
                <p><span className="font-semibold">Tạo lúc:</span> {new Date(appointment.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>

            {appointment.rejectionReason && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-semibold">Lý do bác sĩ từ chối</p>
                <p>{appointment.rejectionReason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
