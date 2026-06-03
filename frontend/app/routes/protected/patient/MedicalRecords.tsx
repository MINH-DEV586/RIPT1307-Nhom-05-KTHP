import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getPatientMedicalRecords, getPrescriptionById } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList,
  Calendar,
  Stethoscope,
  FileText,
  Clock,
  Activity,
  ClipboardCheck,
  ChevronRight,
  Pill,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import ExamHistoryPanel from "@/components/patients/ExamHistoryPanel";

export function meta() {
  return [{ title: "Lịch sử khám chữa bệnh | MedFlow AI" }];
}

type TabType = "medical-records" | "exam-history";

export default function PatientMedicalRecords() {
  const { data: session } = authClient.useSession();
  const patientId = session?.user?.id || "";
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    searchParams.get("tab") === "exam-history" ? "exam-history" : "medical-records"
  );
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "exam-history" || tab === "medical-records") {
      setActiveTab(tab);
      setSelectedRecord(null);
    }
  }, [searchParams]);

  // Reset selection when switching tab
  useEffect(() => {
    setSelectedRecord(null);
  }, [activeTab]);

  const { data: records = [], isLoading } = useQuery<any[]>({
    queryKey: ["medical-records", patientId],
    queryFn: () => getPatientMedicalRecords(patientId),
    enabled: !!patientId,
  });

  const TABS = [
    {
      key: "medical-records" as TabType,
      label: "Hồ sơ bệnh án",
      icon: FileText,
      color: "text-blue-600",
      activeClass: "bg-blue-600 text-white shadow-blue-200",
      inactiveClass: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100",
    },
    {
      key: "exam-history" as TabType,
      label: "Lịch sử khám",
      icon: ClipboardCheck,
      color: "text-emerald-600",
      activeClass: "bg-emerald-600 text-white shadow-emerald-200",
      inactiveClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100",
    },
  ];

  return (
    <div className="w-full flex flex-col gap-5 pb-10 h-full">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ClipboardList className="w-6 h-6 text-primary" />
          </div>
          Lịch sử khám chữa bệnh
        </h1>
        <p className="text-muted-foreground text-sm ml-1">
          Hồ sơ nội trú và các lần khám ngoại trú của bạn.
        </p>
      </div>

      {/* Split Panel */}
      <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 200px)" }}>
        {/* LEFT: List Panel */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          {/* Compact Tab Switcher */}
          <div className="flex gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    isActive ? tab.activeClass + " shadow" : tab.inactiveClass
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="flex-1 rounded-xl border bg-card overflow-hidden shadow-sm">
            {activeTab === "medical-records" && (
              <>
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader label="Đang tải..." />
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-muted-foreground gap-3">
                    <FileText className="w-10 h-10 text-muted-foreground/40" />
                    <div>
                      <p className="font-medium text-sm">Chưa có hồ sơ nào</p>
                      <p className="text-xs mt-1">Hồ sơ được tạo sau khi nhập viện.</p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full">
                    <div className="divide-y">
                      {records.map((record: any) => {
                        const isSelected = selectedRecord?._id === record._id;
                        return (
                          <button
                            key={record._id}
                            onClick={() => setSelectedRecord(record)}
                            className={`w-full text-left px-4 py-3 transition-all hover:bg-muted/50 flex items-center gap-3 group ${
                              isSelected ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500" : "border-l-2 border-transparent"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-100" : "bg-muted"}`}>
                              <FileText className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isSelected ? "text-blue-700 dark:text-blue-400" : ""}`}>
                                {record.diagnosis}
                              </p>
                              <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {record.date && isValid(new Date(record.date))
                                    ? format(new Date(record.date), "dd/MM/yyyy", { locale: vi })
                                    : "Không rõ ngày"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3" />
                                  <span className="font-medium text-foreground">{record.doctor?.name || "Bác sĩ hệ thống"}</span>
                                  {record.doctor?.specialization && (
                                    <>
                                      <span className="text-muted-foreground/60">Chuyên khoa</span>
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">{record.doctor.specialization}</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-blue-500 translate-x-0.5" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </>
            )}

            {activeTab === "exam-history" && (
              <ExamHistoryPanel
                patientId={patientId}
                onSelectRecord={setSelectedRecord}
                selectedId={selectedRecord?._id}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="flex-1 min-w-0 rounded-xl border bg-card shadow-sm overflow-hidden">
          {!selectedRecord ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Chọn một mục để xem chi tiết</p>
                <p className="text-xs mt-1 text-muted-foreground/70">Nhấp vào danh sách bên trái</p>
              </div>
            </div>
          ) : activeTab === "medical-records" ? (
            <MedicalRecordDetail record={selectedRecord} />
          ) : (
            <ExamHistoryDetail record={selectedRecord} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Chi tiết Hồ sơ Bệnh án ===== */
function MedicalRecordDetail({ record }: { record: any }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight">{record.diagnosis}</h2>
            <Badge className="bg-blue-100 text-blue-700 shrink-0">Nội trú</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              {record.date && isValid(new Date(record.date))
                ? format(new Date(record.date), "dd MMMM, yyyy", { locale: vi })
                : "Không rõ ngày"}
            </Badge>
            {record.date && isValid(new Date(record.date)) && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {format(new Date(record.date), "HH:mm")}
              </Badge>
            )}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Doctor */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-muted-foreground">Bác sĩ phụ trách:</span>
          <span className="font-semibold text-foreground">{record.doctor?.name || "Bác sĩ hệ thống"}</span>
          {record.doctor?.specialization && (
             <>
               <span className="text-muted-foreground/60">Chuyên khoa</span>
               <span className="text-blue-600 dark:text-blue-400 font-medium">{record.doctor.specialization}</span>
             </>
          )}
        </div>

        {/* Fields */}
        {record.admissionReason && (
          <DetailSection
            label="Lý do nhập viện"
            value={record.admissionReason}
            color="text-orange-600"
            bg="bg-orange-50 dark:bg-orange-950/20"
            border="border-orange-200 dark:border-orange-800"
          />
        )}

        {record.symptoms && (
          <DetailSection
            label="Triệu chứng"
            value={record.symptoms}
            color="text-blue-600"
            bg="bg-blue-50 dark:bg-blue-950/20"
            border="border-blue-200 dark:border-blue-800"
            icon={<Activity className="w-3.5 h-3.5" />}
          />
        )}

        {record.treatmentPlan && (
          <DetailSection
            label="Phác đồ điều trị"
            value={record.treatmentPlan}
            color="text-green-600"
            bg="bg-green-50 dark:bg-green-950/20"
            border="border-green-200 dark:border-green-800"
          />
        )}

        {record.notes && (
          <DetailSection
            label="Ghi chú"
            value={record.notes}
            color="text-amber-600"
            bg="bg-amber-50 dark:bg-amber-950/20"
            border="border-amber-200 dark:border-amber-800"
          />
        )}

        {/* Các đơn thuốc nội trú */}
        {record.prescriptionIds && record.prescriptionIds.length > 0 && (
          <div className="space-y-4">
            <div className="h-px bg-border my-4" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-600 flex items-center gap-2">
              <Pill className="w-4 h-4" /> Đơn thuốc trong đợt điều trị
            </h3>
            {record.prescriptionIds.map((id: string) => (
              <InpatientPrescriptionCard key={id} prescriptionId={id} />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function InpatientPrescriptionCard({ prescriptionId }: { prescriptionId: string }) {
  const { data: prescriptionDetail, isLoading: loadingRx } = useQuery({
    queryKey: ["prescription", prescriptionId],
    queryFn: () => getPrescriptionById(prescriptionId),
  });

  return (
    <div className="rounded-lg border border-sky-200 dark:border-sky-800 overflow-hidden">
      <div className="bg-sky-50 dark:bg-sky-950/20 px-4 py-2.5 flex items-center gap-2 border-b border-sky-200 dark:border-sky-800">
        <Pill className="w-4 h-4 text-sky-600" />
        <p className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
          Đơn thuốc {prescriptionDetail?.createdAt ? format(new Date(prescriptionDetail.createdAt), "dd/MM/yyyy HH:mm") : ""}
        </p>
        {prescriptionDetail && (
          <Badge
            className={`ml-auto text-[10px] ${
              prescriptionDetail.status === "dispensed"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {prescriptionDetail.status === "dispensed" ? "Đã phát thuốc" : "Chờ phát thuốc"}
          </Badge>
        )}
      </div>
      {loadingRx ? (
        <div className="px-4 py-3 text-xs text-muted-foreground">Đang tải đơn thuốc...</div>
      ) : prescriptionDetail?.items?.length > 0 ? (
        <div className="divide-y divide-purple-100 dark:divide-purple-900">
          {prescriptionDetail.items.map((item: any, i: number) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <Pill className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{item.medicineName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.dosage} &bull; {item.frequency} &bull; {item.duration}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                x{item.quantity} {item.unit || "viên"}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-3 text-xs text-muted-foreground">Không có thông tin thuốc.</div>
      )}
    </div>
  );
}

/* ===== Chi tiết Lịch sử Khám ===== */
function ExamHistoryDetail({ record }: { record: any }) {
  const doctorName =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).name
      : "Chưa rõ";
  const doctorSpec =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).specialization ?? ""
      : "";

  const prescriptionId = record.prescription;
  const { data: prescriptionDetail, isLoading: loadingRx } = useQuery({
    queryKey: ["prescription", prescriptionId],
    queryFn: () => getPrescriptionById(prescriptionId!),
    enabled: !!prescriptionId,
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold leading-tight">{record.diagnosis}</h2>
            <Badge className="bg-emerald-100 text-emerald-700 shrink-0">Ngoại trú</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Calendar className="w-3 h-3" />
              {record.examDate && isValid(new Date(record.examDate))
                ? format(new Date(record.examDate), "dd MMMM, yyyy", { locale: vi })
                : "Không rõ ngày"}
            </Badge>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Doctor */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-muted-foreground">Bác sĩ khám:</span>
          <span className="font-semibold text-foreground">{doctorName}</span>
          {doctorSpec && (
             <>
               <span className="text-muted-foreground/60">Chuyên khoa</span>
               <span className="text-emerald-600 dark:text-emerald-500 font-medium">{doctorSpec}</span>
             </>
          )}
        </div>

        {/* Fields */}
        {record.chiefComplaint && (
          <DetailSection
            label="Lý do khám"
            value={record.chiefComplaint}
            color="text-orange-600"
            bg="bg-orange-50 dark:bg-orange-950/20"
            border="border-orange-200 dark:border-orange-800"
          />
        )}
        {record.symptoms && (
          <DetailSection
            label="Triệu chứng"
            value={record.symptoms}
            color="text-blue-600"
            bg="bg-blue-50 dark:bg-blue-950/20"
            border="border-blue-200 dark:border-blue-800"
            icon={<Activity className="w-3.5 h-3.5" />}
          />
        )}
        {record.treatment && (
          <DetailSection
            label="Hướng xử trí"
            value={record.treatment}
            color="text-green-600"
            bg="bg-green-50 dark:bg-green-950/20"
            border="border-green-200 dark:border-green-800"
          />
        )}

        {/* Đơn thuốc */}
        {prescriptionId && (
          <div className="rounded-lg border border-sky-200 dark:border-sky-800 overflow-hidden">
            <div className="bg-sky-50 dark:bg-sky-950/20 px-4 py-2.5 flex items-center gap-2 border-b border-sky-200 dark:border-sky-800">
              <Pill className="w-4 h-4 text-sky-600" />
              <p className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">
                Đơn thuốc
              </p>
              {prescriptionDetail && (
                <Badge
                  className={`ml-auto text-[10px] ${
                    prescriptionDetail.status === "dispensed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {prescriptionDetail.status === "dispensed" ? "Đã phát thuốc" : "Chờ phát thuốc"}
                </Badge>
              )}
            </div>
            {loadingRx ? (
              <div className="px-4 py-3 text-xs text-muted-foreground">Đang tải đơn thuốc...</div>
            ) : prescriptionDetail?.items?.length > 0 ? (
              <div className="divide-y divide-purple-100 dark:divide-purple-900">
                {prescriptionDetail.items.map((item: any, i: number) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Pill className="w-3.5 h-3.5 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.medicineName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.dosage} &bull; {item.frequency} &bull; {item.duration}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      x{item.quantity} {item.unit || "viên"}
                    </Badge>
                  </div>
                ))}
                {prescriptionDetail.items.some((it: any) => it.price > 0) && (
                  <div className="px-4 py-2.5 flex justify-between items-center bg-sky-50/60 dark:bg-sky-950/20">
                    <span className="text-xs text-muted-foreground">Tổng giá trị đơn thuốc</span>
                    <span className="text-sm font-bold text-sky-700 dark:text-sky-300">
                      {prescriptionDetail.items
                        .reduce((acc: number, it: any) => acc + (it.price || 0) * it.quantity, 0)
                        .toLocaleString()} VNĐ
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-muted-foreground">Không có thông tin thuốc.</div>
            )}
          </div>
        )}

        {record.followUpDate && isValid(new Date(record.followUpDate)) && (
          <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20 p-4">
            <p className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Lịch tái khám
            </p>
            <p className="text-sm font-semibold text-sky-800 dark:text-sky-200">
              {format(new Date(record.followUpDate), "PPP", { locale: vi })}
            </p>
          </div>
        )}
        {record.notes && (
          <DetailSection
            label="Ghi chú"
            value={record.notes}
            color="text-amber-600"
            bg="bg-amber-50 dark:bg-amber-950/20"
            border="border-amber-200 dark:border-amber-800"
          />
        )}
      </div>
    </ScrollArea>
  );
}

/* ===== Reusable Detail Section ===== */
function DetailSection({
  label,
  value,
  color,
  bg,
  border,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  border: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border ${border} ${bg} p-4`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${color}`}>
        {icon}
        {label}
      </p>
      <p className="text-sm leading-relaxed text-foreground/90">{value}</p>
    </div>
  );
}
