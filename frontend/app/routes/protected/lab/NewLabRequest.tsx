import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { createLabRequest, getUsers, getLabTests } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FlaskConical, User, ClipboardList, Save } from "lucide-react";

export default function CreateLabRequest() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    testType: "",
    notes: ""
  });

  // Tải danh sách loại xét nghiệm từ API (động, đồng bộ với bảng giá)
  const { data: labTests = [] } = useQuery<any[]>({
    queryKey: ["lab-tests"],
    queryFn: getLabTests,
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getUsers({ role: "patient", limit: 100 });
      setPatients(data.res);
    } catch (error) {
      toast.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.testType) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      await createLabRequest(formData);
      toast.success("Đã tạo yêu cầu xét nghiệm thành công");
      navigate("/lab/requests");
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center italic text-muted-foreground">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Quay lại
      </Button>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-6 h-6 text-primary" />
              Tạo chỉ định xét nghiệm
            </CardTitle>
            <CardDescription>Nhập thông tin chỉ định cận lâm sàng cho bệnh nhân.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-4 h-4 text-muted-foreground" /> Bệnh nhân
              </Label>
              <Select 
                value={formData.patientId} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, patientId: val }))}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Chọn bệnh nhân..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p._id} value={p._id}>{p.name} - {p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testType" className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="w-4 h-4 text-muted-foreground" /> Loại xét nghiệm / Chẩn đoán
              </Label>
              <Select 
                value={formData.testType} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, testType: val }))}
              >
                <SelectTrigger className="bg-background/50 border-primary/20">
                  <SelectValue placeholder="Chọn loại xét nghiệm..." />
                </SelectTrigger>
                <SelectContent>
                  {labTests.map((t: any) => (
                    <SelectItem key={t._id} value={t.name}>
                      <span>{t.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {t.price.toLocaleString("vi-VN")}đ
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="Khác">Khác (Ghi chú chi tiết)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Chỉ định chi tiết & Ghi chú</Label>
              <Textarea 
                id="notes"
                placeholder="Nhập yêu cầu cụ thể cho kỹ thuật viên xét nghiệm..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-background/50 border-primary/20 min-h-[150px] focus:border-primary"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-primary/5 pt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
            <Button type="submit" disabled={submitting} className="min-w-[150px]">
              {submitting ? "Đang xử lý..." : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Gửi yêu cầu
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
