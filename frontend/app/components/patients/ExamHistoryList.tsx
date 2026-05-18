import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPatientExamHistory } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { format, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Stethoscope,
  ClipboardCheck,
  Activity,
  Eye,
  ChevronDown,
  ChevronUp,
  Pill,
  CalendarClock,
} from "lucide-react";
import type { ExamHistory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExamHistoryListProps {
  patientId: string;
}

function ExamDetailDialog({
  record,
  open,
  onClose,
}: {
  record: ExamHistory | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!record) return null;

  const doctorName =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).name
      : "Chưa rõ";
  const doctorSpec =
    typeof record.doctor === "object" ? (record.doctor as any).specialization : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <ClipboardCheck className="w-5 h-5" />
            Chi tiết kết quả khám ngoại trú
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 pb-3 border-b">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              {record.examDate && isValid(new Date(record.examDate))
                ? format(new Date(record.examDate), "PPP", { locale: vi })
                : "Không rõ ngày"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Stethoscope className="w-3 h-3" />
              {doctorName}
              {doctorSpec ? ` - ${doctorSpec}` : ""}
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
              Ngoại trú
            </Badge>
          </div>

          <ExamSection
            label="Lý do khám"
            value={record.chiefComplaint}
            color="text-orange-600"
            dotColor="bg-orange-500"
          />
          <ExamSection
            label="Triệu chứng"
            value={record.symptoms}
            color="text-blue-600"
            dotColor="bg-blue-500"
          />
          <ExamSection
            label="Chẩn đoán"
            value={record.diagnosis}
            color="text-red-600"
            dotColor="bg-red-500"
          />
          <ExamSection
            label="Hướng xử trí"
            value={record.treatment}
            color="text-green-600"
            dotColor="bg-green-500"
          />

          {record.prescription && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Pill className="w-3 h-3" /> Đơn thuốc / Toa kê
              </p>
              <p className="text-sm text-blue-900 dark:text-blue-100">{record.prescription}</p>
            </div>
          )}

          {record.followUpDate && isValid(new Date(record.followUpDate)) && (
            <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200">
              <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <CalendarClock className="w-3 h-3" /> Lịch tái khám
              </p>
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                {format(new Date(record.followUpDate), "PPP", { locale: vi })}
              </p>
            </div>
          )}

          {record.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Ghi chú</p>
              <p className="text-sm italic text-amber-900 dark:text-amber-100">"{record.notes}"</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExamSection({
  label,
  value,
  color,
  dotColor,
}: {
  label: string;
  value: string;
  color: string;
  dotColor: string;
}) {
  return (
    <div>
      <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2 ${color}`}>
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        {label}
      </h4>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">{value}</p>
    </div>
  );
}

function ExamCard({ record }: { record: ExamHistory }) {
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const doctorName =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).name
      : "Chưa rõ";

  return (
    <>
      <div className="overflow-hidden border border-border rounded-xl shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 border-b">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-emerald-900 dark:text-emerald-100 truncate">{record.diagnosis}</p>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {record.examDate && isValid(new Date(record.examDate))
                  ? format(new Date(record.examDate), "dd/MM/yyyy", { locale: vi })
                  : "Không rõ"}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                {doctorName}
              </span>
              {record.followUpDate && isValid(new Date(record.followUpDate)) && (
                <span className="flex items-center gap-1 text-purple-500">
                  <CalendarClock className="w-3 h-3" />
                  Tái khám: {format(new Date(record.followUpDate), "dd/MM/yyyy")}
                </span>
              )}
              <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                Ngoại trú
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-3 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-500 hover:text-emerald-600"
              onClick={() => setShowDetail(true)}
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-0.5">Lý do khám</p>
              <p className="text-slate-600 dark:text-slate-300">{record.chiefComplaint}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-0.5">Hướng xử trí</p>
              <p className="text-slate-600 dark:text-slate-300">{record.treatment}</p>
            </div>
            {record.prescription && (
              <p className="text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 p-2 rounded border border-blue-100">
                <Pill className="w-3 h-3 inline mr-1" />
                {record.prescription}
              </p>
            )}
          </div>
        )}
      </div>

      <ExamDetailDialog
        record={record}
        open={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}

// ---- Main Component ----

export default function ExamHistoryList({ patientId }: ExamHistoryListProps) {
  const { data: records, isLoading, isError } = useQuery<ExamHistory[]>({
    queryKey: ["exam-history", patientId],
    queryFn: () => getPatientExamHistory(patientId),
    enabled: !!patientId,
  });

  if (isLoading) return <Loader label="Đang tải lịch sử khám..." />;

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100">
        <p className="font-medium">Lỗi khi tải lịch sử khám. Vui lòng thử lại.</p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed">
        <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Chưa có lịch sử khám ngoại trú.</p>
        <p className="text-slate-400 text-sm mt-1">Lịch sử sẽ được lưu lại sau mỗi lần khám ngoại trú.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-500" />
        <h3 className="text-lg font-bold">Lịch sử khám ngoại trú</h3>
        <Badge variant="secondary">{records.length} lần khám</Badge>
      </div>
      <ScrollArea className="h-[500px] pr-2">
        <div className="space-y-3">
          {records.map((record) => (
            <ExamCard key={record._id} record={record} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
