import { useQuery } from "@tanstack/react-query";
import { getPatientExamHistory } from "@/lib/api";
import { format, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Stethoscope,
  ClipboardCheck,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import type { ExamHistory } from "@/types";
import { Badge } from "@/components/ui/badge";

interface ExamHistoryPanelProps {
  patientId: string;
  selectedId?: string;
  onSelectRecord: (record: ExamHistory) => void;
}

export default function ExamHistoryPanel({
  patientId,
  selectedId,
  onSelectRecord,
}: ExamHistoryPanelProps) {
  const { data: records, isLoading, isError } = useQuery<ExamHistory[]>({
    queryKey: ["exam-history", patientId],
    queryFn: () => getPatientExamHistory(patientId),
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader label="Đang tải..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-2 text-red-500">
        <p className="text-sm font-medium">Lỗi khi tải dữ liệu.</p>
        <p className="text-xs text-muted-foreground">Vui lòng thử lại sau.</p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12 text-muted-foreground gap-3">
        <ClipboardCheck className="w-10 h-10 text-muted-foreground/40" />
        <div>
          <p className="font-medium text-sm">Chưa có lịch sử khám</p>
          <p className="text-xs mt-1">Dữ liệu sẽ xuất hiện sau mỗi lần khám.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {records.map((record) => {
          const isSelected = selectedId === record._id;
          const doctorName =
            typeof record.doctor === "object" && record.doctor !== null
              ? (record.doctor as any).name
              : "Chưa rõ";
          const doctorSpec =
            typeof record.doctor === "object" && record.doctor !== null
              ? (record.doctor as any).specialization ?? ""
              : "";

          return (
            <button
              key={record._id}
              onClick={() => onSelectRecord(record)}
              className={`w-full text-left px-4 py-3 transition-all hover:bg-muted/50 flex items-center gap-3 group ${
                isSelected
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-emerald-500"
                  : "border-l-2 border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-emerald-100" : "bg-muted"
                }`}
              >
                <ClipboardCheck
                  className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-muted-foreground"}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isSelected ? "text-emerald-700 dark:text-emerald-400" : ""
                  }`}
                >
                  {record.diagnosis}
                </p>
                <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {record.examDate && isValid(new Date(record.examDate))
                      ? format(new Date(record.examDate), "dd/MM/yyyy", { locale: vi })
                      : "Không rõ"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    <span className="font-medium text-foreground">{doctorName}</span>
                    {doctorSpec && (
                      <>
                        <span className="text-muted-foreground/60">Chuyên khoa</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{doctorSpec}</span>
                      </>
                    )}
                  </span>
                  {record.followUpDate && isValid(new Date(record.followUpDate)) && (
                    <span className="flex items-center gap-1 text-sky-500">
                      <CalendarClock className="w-3 h-3" />
                      {format(new Date(record.followUpDate), "dd/MM")}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isSelected
                    ? "text-emerald-500 translate-x-0.5"
                    : "text-muted-foreground/40 group-hover:text-muted-foreground"
                }`}
              />
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
