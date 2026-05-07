import { useQuery } from "@tanstack/react-query";
import { getPatientMedicalRecords } from "@/lib/api";
import { format, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Stethoscope, ClipboardList, Activity } from "lucide-react";
import type { MedicalRecord } from "@/types";
import {
  Card as UICard,
  CardHeader as UICardHeader,
  CardTitle as UICardTitle,
  CardContent as UICardContent,
} from "@/components/ui/card";

export default function MedicalHistory({ patientId }: { patientId: string }) {
  const { data: records, isLoading, isError } = useQuery<MedicalRecord[]>({
    queryKey: ["medical-records", patientId],
    queryFn: () => getPatientMedicalRecords(patientId),
    enabled: !!patientId,
  });

  if (isLoading) return <Loader label="Đang tải lịch sử bệnh án..." />;

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500 bg-red-50 rounded-xl border border-red-100">
        <p className="font-medium">Lỗi khi tải lịch sử bệnh án. Vui lòng thử lại.</p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed">
        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Chưa có lịch sử bệnh án cho bệnh nhân này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Activity className="w-5 h-5 text-red-500" />
        Lịch sử khám & điều trị
      </h3>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {records.map((record) => (
            <UICard key={record._id} className="overflow-hidden border-l-4 border-l-blue-500">
              <UICardHeader className="bg-slate-50/50 pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <UICardTitle className="text-lg font-bold text-blue-900">
                      {record.diagnosis}
                    </UICardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {record.date && isValid(new Date(record.date))
                          ? format(new Date(record.date), "PPP", { locale: vi })
                          : "Không rõ ngày"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-4 h-4" />
                        Bác sĩ:{" "}
                        {typeof record.doctor === "object" && record.doctor !== null
                          ? (record.doctor as any).name
                          : "Chưa rõ"}
                      </span>
                    </div>
                  </div>
                </div>
              </UICardHeader>
              <UICardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Triệu chứng
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{record.symptoms}</p>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Phác đồ điều trị
                  </h4>
                  <p className="text-slate-600 leading-relaxed">{record.treatmentPlan}</p>
                </div>
                {record.notes && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Ghi chú</h4>
                    <p className="text-sm text-amber-900 italic">"{record.notes}"</p>
                  </div>
                )}
              </UICardContent>
            </UICard>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
