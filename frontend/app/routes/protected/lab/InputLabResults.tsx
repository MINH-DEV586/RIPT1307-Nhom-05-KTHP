import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { getLabRequestById, createLabResult, deleteFile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2, ClipboardCheck, User, FlaskConical, ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UploadButton } from "@/lib/uploadthing";
import { authClient } from "@/lib/auth-client";
import { Camera, Loader2 } from "lucide-react";

interface Indicator {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
}

export default function EnterLabResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [indicators, setIndicators] = useState<Indicator[]>([
    { name: "", value: "", unit: "", normalRange: "" }
  ]);
  const [note, setNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const data = await getLabRequestById(id!);
      setRequest(data);
      // Auto-populate some indicators based on test type if needed
      if (data.testType.includes("máu") || data.testType.includes("CBC")) {
         setIndicators([
           { name: "Glucose", value: "", unit: "mg/dL", normalRange: "70-100" },
           { name: "Hemoglobin", value: "", unit: "g/dL", normalRange: "13.5-17.5" },
           { name: "WBC", value: "", unit: "K/uL", normalRange: "4.5-11.0" },
           { name: "Cholesterol", value: "", unit: "mg/dL", normalRange: "<200" }
         ]);
      }
    } catch (error) {
      toast.error("Không thể tải thông tin yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  const addIndicator = () => {
    setIndicators([...indicators, { name: "", value: "", unit: "", normalRange: "" }]);
  };

  const removeIndicator = (index: number) => {
    setIndicators(indicators.filter((_, i) => i !== index));
  };

  const handleIndicatorChange = (index: number, field: keyof Indicator, val: string) => {
    const updated = [...indicators];
    updated[index][field] = val;
    setIndicators(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        patientId: request.patientId,
        labRequestId: id,
        testType: request.testType,
        indicators: indicators.filter(i => i.name && i.value).map(i => ({
          ...i,
          value: Number(i.value)
        })),
        note
      };

      if (imageUrl) {
        payload.imageUrl = imageUrl;
        payload.bodyPart = bodyPart || "Toàn thân";
        payload.aiAnalysis = "Đang xử lý phân tích AI...";
      }

      await createLabResult(payload);
      toast.success("Đã lưu kết quả xét nghiệm thành công");
      navigate("/lab/requests");
    } catch (error) {
      toast.error("Lỗi khi lưu kết quả");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center italic text-muted-foreground">Đang tải biểu mẫu...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Quay lại
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-none shadow-xl bg-primary/5 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <User className="w-5 h-5 text-primary" /> Thông tin bệnh nhân
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Họ và tên</Label>
              <p className="font-bold text-lg">{request.patient?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Loại xét nghiệm</Label>
              <p className="font-semibold text-primary">{request.testType}</p>
            </div>
            <Separator className="bg-primary/10" />
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Bác sĩ chỉ định</Label>
              <p className="text-sm">{request.doctor?.name || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-6 h-6 text-primary" />
                Nhập chỉ số xét nghiệm
              </CardTitle>
              <CardDescription>Nhập các thông số kỹ thuật thu được từ quá trình xét nghiệm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {indicators.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg bg-background/40 border border-primary/5 group">
                    <div className="col-span-4 space-y-1">
                      <Label className="text-[10px]">Tên chỉ số</Label>
                      <Input 
                        placeholder="VD: Glucose" 
                        value={item.name} 
                        onChange={(e) => handleIndicatorChange(idx, "name", e.target.value)}
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px]">Giá trị</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.0" 
                        value={item.value} 
                        onChange={(e) => handleIndicatorChange(idx, "value", e.target.value)}
                        className="h-8 bg-background font-bold"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-[10px]">Đơn vị</Label>
                      <Input 
                        placeholder="mg/dL" 
                        value={item.unit} 
                        onChange={(e) => handleIndicatorChange(idx, "unit", e.target.value)}
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="col-span-3 space-y-1">
                      <Label className="text-[10px]">Khoảng bình thường</Label>
                      <Input 
                        placeholder="70-100" 
                        value={item.normalRange} 
                        onChange={(e) => handleIndicatorChange(idx, "normalRange", e.target.value)}
                        className="h-8 bg-background"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeIndicator(idx)}
                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addIndicator} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Thêm chỉ số
              </Button>

              <div className="pt-4 space-y-2">
                <Label htmlFor="note">Ghi chú của kỹ thuật viên / Bác sĩ</Label>
                <Input 
                  id="note" 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)} 
                  placeholder="Nhận xét về mẫu bệnh phẩm hoặc quá trình thực hiện..."
                  className="bg-background/50"
                />
              </div>

              <div className="pt-6 space-y-4 border-t border-primary/5">
                <Label className="text-sm font-bold flex items-center gap-2 text-primary">
                  <ImageIcon className="w-4 h-4" /> Hình ảnh kết quả chẩn đoán (X-Quang, Nội soi, Siêu âm...)
                </Label>
                
                {!imageUrl ? (
                  <div className="flex flex-col items-center gap-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 bg-background/20">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/20">
                        <ImageIcon className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Chọn ảnh X-Quang, Siêu âm, CT, MRI...
                      </p>
                      <p className="text-xs text-muted-foreground/70">PNG, JPG, WEBP — tối đa 4MB</p>
                    </div>
                    <UploadButton
                      endpoint="imageUploader"
                      onUploadBegin={() => setUploadingImage(true)}
                      onClientUploadComplete={(res) => {
                        setUploadingImage(false);
                        const url = res?.[0]?.ufsUrl || (res?.[0] as any)?.url;
                        if (url) {
                          setImageUrl(url);
                          toast.success("Tải ảnh kết quả thành công!");
                        } else {
                          toast.error("Không lấy được URL ảnh sau khi tải lên.");
                        }
                      }}
                      headers={async () => {
                        const session = await authClient.getSession();
                        const token = session.data?.session?.token;
                        return {
                          Authorization: token ? `Bearer ${token}` : "",
                        };
                      }}
                      onUploadError={(error: Error) => {
                        setUploadingImage(false);
                        console.error("[Upload] Error:", error);
                        toast.error(`Lỗi tải ảnh: ${error.message}`);
                      }}
                      appearance={{
                        button: "bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 h-auto text-sm font-medium",
                        allowedContent: "hidden",
                      }}
                      content={{
                        button: uploadingImage ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Camera className="w-4 h-4" /> Chọn ảnh
                          </span>
                        ),
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                      <img
                        src={imageUrl}
                        alt="Kết quả chẩn đoán hình ảnh"
                        className="h-full w-full object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-3 right-3 shadow-md"
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteFile({ file: imageUrl });
                            setImageUrl("");
                            toast.success("Đã xóa hình ảnh");
                          } catch (err: any) {
                            toast.error("Lỗi khi xóa ảnh: " + err.message);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa ảnh
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bodyPart">Bộ phận chụp chiếu / khảo sát</Label>
                      <Input
                        id="bodyPart"
                        value={bodyPart}
                        onChange={(e) => setBodyPart(e.target.value)}
                        placeholder="Ví dụ: Phổi thẳng, Ổ bụng tổng quát, Khớp cổ tay..."
                        className="bg-background/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 pt-6 border-t border-primary/5">
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Hủy</Button>
              <Button type="submit" disabled={submitting} className="min-w-[150px] shadow-lg shadow-primary/20">
                {submitting ? "Đang lưu..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Hoàn tất & Lưu
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
