import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { getPatientMedicalRecords } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Calendar,
  Stethoscope,
  FileText,
  Clock,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { format, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import ExamHistoryList from "@/components/patients/ExamHistoryList";

export function meta() {
  return [{ title: "Hồ sơ sức khỏe | MedFlow AI" }];
}

type TabType = "medical-records" | "exam-history";

export default function PatientMedicalRecords() {
  const { data: session } = authClient.useSession();
  const patientId = session?.user?.id || "";
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>(
    searchParams.get("tab") === "exam-history" ? "exam-history" : "medical-records"
  );

  // Sync tab khi URL thay đổi (ví dụ click sidebar)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "exam-history" || tab === "medical-records") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Hồ sơ bệnh án nội trú
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
      description: "Hồ sơ nội trú sau khi nhập viện",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      key: "exam-history" as TabType,
      label: "Lịch sử khám",
      icon: ClipboardCheck,
      description: "Kết quả các lần khám ngoại trú",
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <ClipboardList className="w-8 h-8 text-primary" />
          </div>
          Hồ sơ sức khỏe của tôi
        </h1>
        <p className="text-muted-foreground text-lg ml-1">
          Xem hồ sơ bệnh án nội trú và lịch sử các lần khám ngoại trú.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-2 gap-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                isActive
                  ? "border-transparent bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20"
                  : "border-border hover:border-blue-200 hover:bg-muted/50"
              }`}
            >
              <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : tab.bg}`}>
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : tab.color}`} />
              </div>
              <div>
                <p className={`font-bold text-sm ${isActive ? "text-white" : ""}`}>{tab.label}</p>
                <p className={`text-xs ${isActive ? "text-white/70" : "text-muted-foreground"}`}>
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ===== TAB: HỒ SƠ BỆNH ÁN NỘI TRÚ ===== */}
      {activeTab === "medical-records" && (
        <>
          {isLoading ? (
            <div className="h-[40vh] flex items-center justify-center">
              <Loader label="Đang tải hồ sơ..." />
            </div>
          ) : records.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Chưa có hồ sơ nào</h3>
                <p className="text-muted-foreground max-w-xs mt-2">
                  Hồ sơ bệnh án chỉ được tạo sau khi bạn được nhập viện theo yêu cầu bác sĩ.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
              {records.map((record: any, index: number) => (
                <div
                  key={record._id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Timeline dot */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  </div>

                  <Card className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] border-none shadow-xl bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 flex gap-1 items-center"
                        >
                          <Calendar className="w-3 h-3" />
                          {record.date && isValid(new Date(record.date))
                            ? format(new Date(record.date), "dd MMMM, yyyy", { locale: vi })
                            : "Không rõ ngày"}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 text-[10px]">Nội trú</Badge>
                      </div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {record.diagnosis}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {record.admissionReason && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                            Lý do nhập viện
                          </p>
                          <p className="text-sm">{record.admissionReason}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                          <Activity className="w-4 h-4" />
                          Triệu chứng
                        </div>
                        <p className="text-sm line-clamp-2">{record.symptoms}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-green-600 uppercase tracking-wider">
                          Phác đồ điều trị
                        </p>
                        <p className="text-sm line-clamp-2">{record.treatmentPlan}</p>
                      </div>
                      <div className="pt-3 border-t border-primary/5 flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                          <Stethoscope className="w-3 h-3 text-indigo-500" />
                        </div>
                        Bác sĩ: {record.doctor?.name || "Bác sĩ hệ thống"}
                        {record.date && isValid(new Date(record.date)) && (
                          <span className="ml-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(record.date), "HH:mm")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ===== TAB: LỊCH SỬ KHÁM NGOẠI TRÚ ===== */}
      {activeTab === "exam-history" && (
        <Card className="card shadow-sm">
          <CardContent className="p-6">
            {patientId ? (
              <ExamHistoryList patientId={patientId} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Đang tải...
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
