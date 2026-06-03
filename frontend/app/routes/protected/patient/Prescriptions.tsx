import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getAllPrescriptionsList } from "@/lib/api";
import { printMedicalDoc } from "@/lib/print";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Calendar, 
  User, 
  ClipboardCheck, 
  Info,
  Clock,
  ArrowRight,
  Printer,
  ChevronDown,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function Prescriptions() {
  const { data: session } = authClient.useSession();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPrescriptions();
    }
  }, [session?.user?.id]);

  const fetchPrescriptions = async () => {
    try {
      const data = await getAllPrescriptionsList({ patientId: session!.user.id });
      setPrescriptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPrescription = (prescription: any) => {
    const dateStr = format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: vi });
    const total = prescription.items.reduce((acc: number, item: any) => acc + ((item.price || 0) * item.quantity), 0);
    
    let itemsHtml = prescription.items.map((item: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.medicineName}</strong></td>
        <td>${item.quantity} ${item.unit || "viên"}</td>
        <td>
          Liều lượng: ${item.dosage}<br>
          Tần suất: ${item.frequency}<br>
          Thời gian: ${item.duration}
        </td>
        <td>${(item.price || 0).toLocaleString()} đ</td>
        <td>${((item.price || 0) * item.quantity).toLocaleString()} đ</td>
      </tr>
    `).join('');

    const html = `
      <div style="margin-bottom: 20px;">
        <p><strong>Bệnh nhân:</strong> ${session?.user?.name || "Bệnh nhân"}</p>
        <p><strong>Chẩn đoán:</strong> ${prescription.diagnosis}</p>
        <p><strong>Bác sĩ kê đơn:</strong> ${prescription.doctorName}</p>
        <p><strong>Ngày kê:</strong> ${dateStr}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên thuốc</th>
            <th>Số lượng</th>
            <th>Hướng dẫn sử dụng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 15px; font-size: 18px;">
        <strong>Tổng tiền: <span style="color: #0056b3;">${total.toLocaleString()} VNĐ</span></strong>
      </div>

      ${prescription.notes ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #0056b3;">
          <strong>Lời dặn của bác sĩ:</strong><br>
          ${prescription.notes}
        </div>
      ` : ''}
    `;

    printMedicalDoc("ĐƠN THUỐC ĐIỆN TỬ", html);
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải đơn thuốc..." /></div>;

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Pill className="w-8 h-8 text-primary" />
            </div>
            Đơn thuốc điện tử
          </h1>
          <p className="text-muted-foreground text-lg ml-1">
            Danh sách các loại thuốc đã được bác sĩ kê đơn và hướng dẫn sử dụng.
          </p>
        </div>
      </div>

      {prescriptions.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Chưa có đơn thuốc nào</h3>
            <p className="text-muted-foreground max-w-xs mt-2">
              Bạn chưa có đơn thuốc nào trong hệ thống. Đơn thuốc sẽ tự động xuất hiện sau khi bác sĩ kê đơn.
            </p>
          </CardContent>
        </Card>
      ) : (() => {
        // Group prescriptions by date
        const grouped = prescriptions.reduce((acc: Record<string, any[]>, p) => {
          const dateKey = format(new Date(p.createdAt), "yyyy-MM-dd");
          if (!acc[dateKey]) acc[dateKey] = [];
          acc[dateKey].push(p);
          return acc;
        }, {});
        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        return (
          <div className="space-y-10">
            {sortedDates.map((dateKey) => (
              <div key={dateKey} className="space-y-4">
                {/* Date header */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-md shadow-emerald-500/20">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(dateKey), "EEEE, dd/MM/yyyy", { locale: vi })}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent dark:from-emerald-800" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    {grouped[dateKey].length} đơn thuốc
                  </span>
                </div>

                {/* Cards grid 2 columns */}
                <div className="grid gap-6 md:grid-cols-2">
                  {grouped[dateKey].map((prescription) => (
                    <Card key={prescription._id} className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md hover:shadow-2xl transition-all duration-300">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <CardHeader className="bg-primary/5 pb-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">Đơn thuốc: {prescription.diagnosis}</CardTitle>
                      <Badge variant={prescription.status === "dispensed" ? "default" : "secondary"} className={prescription.status === "dispensed" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : ""}>
                        {prescription.status === "dispensed" ? "Đã phát thuốc" : "Chờ lấy thuốc"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      Ngày kê: {format(new Date(prescription.createdAt), "dd/MM/yyyy", { locale: vi })}
                      <span className="mx-1">•</span>
                      <User className="w-3.5 h-3.5" />
                      Bác sĩ: {prescription.doctorName}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 hover:bg-background" onClick={() => handlePrintPrescription(prescription)}>
                    <Printer className="w-4 h-4 mr-2" />
                    In đơn thuốc
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  {prescription.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-primary/5 hover:border-primary/20 transition-colors group">
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Pill className="w-6 h-6 text-blue-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-lg">{item.medicineName}</h4>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">SL: {item.quantity}</span>
                            {item.price > 0 && (
                              <span className="text-xs font-semibold text-emerald-600">
                                {item.price.toLocaleString()} đ / viên
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                            <span className="font-medium text-foreground">Liều lượng:</span> {item.dosage}
                          </div>
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-medium text-foreground">Tần suất:</span> {item.frequency}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium text-foreground">Thời gian:</span> {item.duration}
                          </div>
                          {item.price > 0 && (
                            <div className="flex items-center gap-2 font-bold text-slate-700">
                              <span>Thành tiền:</span>
                              <span className="text-primary">{(item.price * item.quantity).toLocaleString()} đ</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="p-4 bg-muted/40 rounded-xl border border-primary/5 flex justify-between items-center font-bold">
                    <span className="text-sm text-slate-600">Tổng giá trị đơn thuốc:</span>
                    <span className="text-lg text-primary">
                      {prescription.items.reduce((acc: number, item: any) => acc + ((item.price || 0) * item.quantity), 0).toLocaleString()} VNĐ
                    </span>
                  </div>
                </div>

                {prescription.notes && (
                  <div className="mt-6 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                    <div className="flex items-center gap-2 text-orange-600 font-semibold mb-1 text-sm">
                      <Info className="w-4 h-4" />
                      Lời dặn của bác sĩ:
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {prescription.notes}
                    </p>
                  </div>
                )}
              </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
