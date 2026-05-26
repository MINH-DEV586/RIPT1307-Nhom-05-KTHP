import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { getPrescriptionById, confirmDispense } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, User, Stethoscope, ClipboardList, Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function DispenseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const data = await getPrescriptionById(id!);
      setPrescription(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thông tin đơn thuốc");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!id) return;
    setSubmitting(true);
    try {
      await confirmDispense(id);
      toast.success("Đã phát thuốc thành công");
      navigate("/pharmacy/dispense");
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi xác nhận phát thuốc");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (!prescription) {
    return <div className="p-8 text-center text-destructive">Không tìm thấy đơn thuốc</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Quay lại
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prescription Info */}
        <Card className="md:col-span-2 border-none shadow-xl bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  Chi tiết đơn thuốc
                </CardTitle>
                <CardDescription className="mt-1 font-mono uppercase text-xs">
                  ID: {prescription._id}
                </CardDescription>
              </div>
              <Badge variant={prescription.status === "pending" ? "default" : "outline"} className="capitalize">
                {prescription.status === "pending" ? "Đang chờ" : "Đã phát"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase font-semibold">
                  <User className="w-3 h-3" /> Bệnh nhân
                </p>
                <p className="font-medium text-lg">{prescription.patient?.name || "N/A"}</p>
                <p className="text-xs text-muted-foreground">{prescription.patient?.email}</p>
              </div>
              <div className="space-y-1 text-right md:text-left">
                <p className="text-xs text-muted-foreground flex items-center md:justify-start justify-end gap-1 uppercase font-semibold">
                  <Stethoscope className="w-3 h-3" /> Bác sĩ kê đơn
                </p>
                <p className="font-medium text-lg">{prescription.doctor?.name || "N/A"}</p>
                <p className="text-xs text-muted-foreground">{prescription.doctor?.specialization}</p>
              </div>
            </div>

            <Separator className="bg-primary/10" />

            <div className="space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Danh mục thuốc chỉ định
              </p>
              <div className="rounded-lg border border-primary/10 overflow-hidden bg-background/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5 hover:bg-primary/5">
                      <TableHead>Tên thuốc</TableHead>
                      <TableHead>Liều lượng</TableHead>
                      <TableHead className="text-center">Số lượng</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prescription.items.map((item: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-primary/5 transition-colors">
                        <TableCell>
                          <p className="font-semibold">{item.medicineName}</p>
                          <p className="text-xs text-muted-foreground italic">
                            {item.frequency} - {item.duration}
                          </p>
                        </TableCell>
                        <TableCell>{item.dosage}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price ? `${item.price.toLocaleString()} đ` : "---"}</TableCell>
                        <TableCell className="text-right font-semibold">{item.price ? `${(item.price * item.quantity).toLocaleString()} đ` : "---"}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-primary/5 hover:bg-primary/5 font-bold">
                      <TableCell colSpan={4} className="text-right">Tổng giá trị đơn thuốc:</TableCell>
                      <TableCell className="text-right text-primary font-black">
                        {prescription.items.reduce((acc: number, item: any) => acc + ((item.price || 0) * item.quantity), 0).toLocaleString()} đ
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {prescription.notes && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Ghi chú bác sĩ:</p>
                <p className="text-sm">{prescription.notes}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="pt-6">
            {prescription.status === "pending" && (
              <Button 
                className="w-full text-lg h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Xác nhận phát thuốc
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Side summary or status */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg">Chẩn đoán</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{prescription.diagnosis}</p>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Hướng dẫn</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>• Kiểm tra kỹ tên thuốc và liều lượng trước khi phát.</p>
              <p>• Xác nhận tồn kho thực tế trùng khớp với hệ thống.</p>
              <p>• In nhãn hướng dẫn sử dụng cho bệnh nhân.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
