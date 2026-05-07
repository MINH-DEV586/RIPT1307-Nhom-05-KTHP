import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createTelemedicineSession, getUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Calendar, User, Clock, ShieldCheck, Stethoscope } from "lucide-react";

export default function BookConsultation() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: "",
    startTime: "",
    notes: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await getUsers({ role: "doctor", limit: 50 });
      setDoctors(data.res);
    } catch (error) {
      toast.error("Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctorId || !formData.startTime) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      await createTelemedicineSession(formData);
      toast.success("Đã đặt lịch khám thành công");
      navigate("/telemedicine/sessions");
    } catch (error) {
      toast.error("Lỗi khi đặt lịch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Quay lại
      </Button>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-md">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
               <Stethoscope className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">Đặt lịch tư vấn trực tuyến</CardTitle>
            <CardDescription>Chọn bác sĩ và thời gian bạn muốn thực hiện tư vấn từ xa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Chọn bác sĩ
                </Label>
                <Select onValueChange={(val) => setFormData({...formData, doctorId: val})}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Bác sĩ phụ trách..." />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => (
                      <SelectItem key={d._id} value={d._id}>{d.name} ({d.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Thời gian khám
                </Label>
                <Input 
                  type="datetime-local" 
                  className="bg-background/50" 
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Lý do khám & Triệu chứng
              </Label>
              <Textarea 
                placeholder="Mô tả ngắn gọn tình trạng của bạn để bác sĩ nắm bắt trước..." 
                className="bg-background/50 min-h-[120px]"
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex items-start gap-3">
               <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
               <div className="text-xs text-muted-foreground">
                 <p className="font-semibold text-primary mb-1">Đảm bảo bảo mật</p>
                 Cuộc hội thoại của bạn được mã hóa và chỉ bác sĩ phụ trách mới có quyền truy cập thông tin tư vấn.
               </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6 border-t border-primary/5">
             <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
             <Button type="submit" disabled={submitting} className="min-w-[150px] shadow-lg shadow-primary/20">
               {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
             </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
