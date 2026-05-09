import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getAllPrescriptionsList } from "@/lib/api";
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

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải đơn thuốc..." /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
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
      ) : (
        <div className="grid gap-6">
          {prescriptions.map((prescription) => (
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
                  <Button variant="outline" size="sm" className="bg-background/50 hover:bg-background">
                    <Printer className="w-4 h-4 mr-2" />
                    In đơn thuốc
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  {prescription.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-background/50 border border-primary/5 hover:border-primary/20 transition-colors group">
                      <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Pill className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-lg">{item.medicineName}</h4>
                          <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">SL: {item.quantity}</span>
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
                          <div className="flex items-center gap-2 md:col-span-2">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-medium text-foreground">Thời gian:</span> {item.duration}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
      )}
    </div>
  );
}
