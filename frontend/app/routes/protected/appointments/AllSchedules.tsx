import { useQuery } from "@tanstack/react-query";
import { getAllDoctorSchedules } from "@/lib/api";
import { ScheduleOverview } from "@/components/appointments/ScheduleOverview";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/global/Loader";
import { Stethoscope, CalendarDays } from "lucide-react";

export function meta() {
  return [{ title: "Tất cả lịch làm việc | MedFlow AI" }];
}

export default function AllSchedules() {
  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["all-doctor-schedules"],
    queryFn: getAllDoctorSchedules,
  });

  if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><Loader label="Đang tải danh sách lịch làm việc..." /></div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Lịch làm việc bác sĩ</h1>
        <p className="text-muted-foreground text-lg">
          Quản lý và theo dõi lịch trình làm việc của tất cả bác sĩ trong hệ thống.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.length > 0 ? (
          schedules.map((s: any) => (
            <Card key={s._id} className="overflow-hidden border-none shadow-xl bg-card/40 backdrop-blur-md flex flex-col">
              <CardHeader className="bg-muted/20 border-b p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/10">
                    <AvatarImage src={s.doctor?.image} />
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {s.doctor?.name?.[0] || "D"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-black text-indigo-700">
                      {s.doctor?.name || `Bác sĩ (ID: ${s.doctorId.substring(0, 8)}...)`}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5 text-indigo-500" /> {s.doctor?.specialization || "Bác sĩ chuyên khoa"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="p-4 bg-indigo-50/30 border-b text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Lịch trình của bác sĩ {s.doctor?.name}
                </div>
                <ScheduleOverview schedule={s} title="Cấu hình thời gian" showBreak={true} />
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-30">
              <CalendarDays className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-muted-foreground">Chưa có lịch làm việc nào được thiết lập</h3>
            <p className="text-muted-foreground text-sm">Bác sĩ cần truy cập hồ sơ để thiết lập lịch làm việc của họ.</p>
          </div>
        )}
      </div>
    </div>
  );
}
