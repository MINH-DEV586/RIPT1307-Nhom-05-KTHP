import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAvailableDoctors, bookAppointment, getAvailableSlots } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { ScheduleOverview } from "@/components/appointments/ScheduleOverview";
import { DoctorSearchCard } from "@/components/appointments/DoctorSearchCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, Filter, CalendarDays, Clock, Users, ArrowLeft, CheckCircle2, Zap } from "lucide-react";
import { useNavigate } from "react-router";
import Loader from "@/components/global/Loader";

export default function BookAppointment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patientType: "self",
    patientName: "",
    date: "",
    timeSlot: "",
    type: "offline",
    symptoms: "",
    notes: "",
  });

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors", selectedSpec],
    queryFn: () => getAvailableDoctors({ specialization: selectedSpec === "all" ? undefined : selectedSpec }),
  });

  const { data: slotsData, isLoading: slotsLoading } = useQuery({
    queryKey: ["available-slots", selectedDoctor?._id, formData.date],
    queryFn: () => getAvailableSlots(selectedDoctor._id, formData.date),
    enabled: !!selectedDoctor?._id && !!formData.date,
  });

  const bookingMutation = useMutation({
    mutationFn: bookAppointment,
    onSuccess: () => {
      toast.success("Đặt lịch thành công!");
      setBookingModalOpen(false);
      setSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: () => {
      toast.error("Có lỗi xảy ra khi đặt lịch.");
    }
  });

  const filteredDoctors = doctors.filter((doc: any) => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.specialization?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const specs = [
    { value: "all", label: "Tất cả chuyên khoa" },
    { value: "General", label: "Nội khoa / Tổng quát" },
    { value: "Pediatrics", label: "Nhi khoa" },
    { value: "Surgery", label: "Ngoại khoa" },
    { value: "Cardiology", label: "Tim mạch" },
    { value: "Obstetrics", label: "Sản phụ khoa" },
    { value: "Dermatology", label: "Da liễu" }
  ];

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.timeSlot || !formData.symptoms) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }
    bookingMutation.mutate({
      ...formData,
      doctorId: selectedDoctor._id,
    });
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader label="Đang tìm kiếm bác sĩ tốt nhất cho bạn..." /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit gap-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Button>
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-primary">
            Tìm kiếm bác sĩ & Đặt lịch
          </h1>
          <p className="text-muted-foreground text-lg">
          </p>
        </div>
        {session?.user.membership === 'pro' && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 rounded-3xl text-white shadow-lg shadow-amber-500/20 flex items-center justify-between animate-in slide-in-from-right-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Zap className="w-5 h-5 fill-white" />
              </div>
              <div>
                <p className="font-black leading-none">Ưu tiên đặt lịch: PRO</p>
                <p className="text-xs text-white/80 mt-1 font-medium">Bạn có quyền ưu tiên duyệt lịch hẹn và hỗ trợ nhanh nhất.</p>
              </div>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 border-none text-white font-bold">PRO MEMBER</Badge>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-card/40 p-4 rounded-3xl border shadow-sm backdrop-blur-md">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm theo tên bác sĩ hoặc chuyên khoa..." 
            className="pl-10 h-12 bg-background/50 border-none rounded-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="md:col-span-4">
          <Select value={selectedSpec} onValueChange={setSelectedSpec}>
            <SelectTrigger className="h-12 bg-background/50 border-none rounded-2xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                <SelectValue placeholder="Chuyên khoa" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {specs.map((s: any) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Button className="w-full h-12 rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* Doctor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doc: any) => (
            <DoctorSearchCard 
              key={doc._id} 
              doctor={doc} 
              onSelect={(d) => {
                setSelectedDoctor(d);
                setBookingModalOpen(true);
              }} 
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto opacity-30">
              <Users className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-muted-foreground">Không tìm thấy bác sĩ phù hợp</h3>
            <p className="text-muted-foreground">Vui lòng thử lại với từ khóa hoặc chuyên khoa khác.</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={bookingModalOpen} onOpenChange={setBookingModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-indigo-500/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Đặt lịch khám bệnh</DialogTitle>
            <DialogDescription>
              Bạn đang đặt lịch với <span className="font-bold text-indigo-600">{selectedDoctor?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBook} className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Đối tượng khám</Label>
                <Select 
                  value={formData.patientType} 
                  onValueChange={(v) => setFormData({...formData, patientType: v})}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Bản thân</SelectItem>
                    <SelectItem value="family">Người thân</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hình thức khám</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData({...formData, type: v as any})}
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offline">Tại bệnh viện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.patientType === "family" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label>Họ tên người thân</Label>
                <Input 
                  placeholder="Nhập đầy đủ họ tên..." 
                  className="bg-background/50"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày khám</Label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500" />
                  <Input 
                    type="date" 
                    className="pl-10 bg-background/50"
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({...formData, date: e.target.value, timeSlot: ""});
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Khung giờ</Label>
                <Select 
                  value={formData.timeSlot} 
                  onValueChange={(v) => setFormData({...formData, timeSlot: v})}
                  disabled={!formData.date || slotsLoading || !slotsData?.available}
                >
                  <SelectTrigger className="bg-background/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <SelectValue placeholder={slotsLoading ? "Đang tải..." : (formData.date ? (slotsData?.available ? "Chọn giờ" : "Không có lịch") : "Chọn ngày trước")} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {slotsData?.slots?.map((s: string) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                    {slotsData?.available && slotsData?.slots?.length === 0 && (
                      <div className="p-2 text-xs text-center text-muted-foreground">Đã hết chỗ</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Doctor Schedule Reference */}
            {selectedDoctor && (
              <div className="mt-4">
                <ScheduleOverview schedule={selectedDoctor.schedule} title="Lịch làm việc chung của bác sĩ" showBreak={false} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Triệu chứng / Lý do khám</Label>
              <Textarea 
                placeholder="Mô tả ngắn gọn tình trạng sức khỏe của bạn..." 
                className="bg-background/50 min-h-[100px]"
                value={formData.symptoms}
                onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Ghi chú (Không bắt buộc)</Label>
              <Textarea 
                placeholder="Ghi chú thêm cho bác sĩ..." 
                className="bg-background/50"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setBookingModalOpen(false)}>Hủy</Button>
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8"
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? "Đang xử lý..." : "Xác nhận đặt lịch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-[400px] text-center p-10">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Đặt lịch thành công!</DialogTitle>
            <DialogDescription className="text-lg pt-2">
              Lịch hẹn của bạn đã được gửi tới bác sĩ. Vui lòng chờ xác nhận từ hệ thống.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-8 space-y-3">
            <Button className="w-full bg-indigo-600 font-bold py-6" onClick={() => navigate("/appointments")}>
              Xem danh sách lịch hẹn
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setSuccessModalOpen(false)}>
              Quay lại trang tìm kiếm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
