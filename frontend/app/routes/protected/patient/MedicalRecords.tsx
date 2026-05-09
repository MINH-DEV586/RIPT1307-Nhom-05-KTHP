import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getPatientMedicalRecords } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ClipboardList, 
  Calendar, 
  Stethoscope, 
  FileText, 
  ArrowRight,
  Clock,
  User,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";

export default function MedicalRecords() {
  const { data: session } = authClient.useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRecords();
    }
  }, [session?.user?.id]);

  const fetchRecords = async () => {
    try {
      const data = await getPatientMedicalRecords(session!.user.id);
      setRecords(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải hồ sơ..." /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          Hồ sơ bệnh án
        </h1>
        <p className="text-muted-foreground text-lg ml-1">
          Lịch sử khám bệnh và các chẩn đoán chi tiết từ bác sĩ của bạn.
        </p>
      </div>

      {records.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Chưa có hồ sơ nào</h3>
            <p className="text-muted-foreground max-w-xs mt-2">
              Lịch sử khám bệnh của bạn sẽ xuất hiện tại đây sau khi bạn hoàn thành buổi khám với bác sĩ.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-primary/20 before:to-transparent">
          {records.map((record, index) => (
            <div key={record._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
              </div>

              {/* Content */}
              <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border-none shadow-xl bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 card-hover">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex gap-1 items-center">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(record.date), "dd MMMM, yyyy", { locale: vi })}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(record.date), "HH:mm")}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                    {record.diagnosis}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Activity className="w-4 h-4" />
                      Triệu chứng
                    </div>
                    <p className="text-sm line-clamp-2">{record.symptoms}</p>
                  </div>

                  <div className="pt-4 border-t border-primary/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <Stethoscope className="w-3 h-3 text-indigo-500" />
                        </div>
                        Bác sĩ: {record.doctor?.name || "Bác sĩ hệ thống"}
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
