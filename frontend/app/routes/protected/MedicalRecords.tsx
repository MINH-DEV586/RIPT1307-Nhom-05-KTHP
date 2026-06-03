import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getUsers } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  ClipboardCheck,
  Search,
  ChevronRight,
  Users,
  Stethoscope,
  BedDouble,
} from "lucide-react";
import Loader from "@/components/global/Loader";
import MedicalHistory from "@/components/patients/MedicalHistory";
import ExamHistoryList from "@/components/patients/ExamHistoryList";
import CreateMedicalRecordModal from "@/components/patients/CreateMedicalRecordModal";
import CreateExamHistoryModal from "@/components/patients/CreateExamHistoryModal";
import type { User } from "@/types";

export function meta() {
  return [{ title: "Hồ sơ bệnh án | MedFlow AI" }];
}

type TabType = "medical-records" | "exam-history";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  admitted: { label: "Đang nội trú", color: "bg-blue-100 text-blue-700 border-blue-200" },
  in_treatment: { label: "Đang điều trị", color: "bg-blue-100 text-blue-700 border-blue-200" },
  observation: { label: "Theo dõi", color: "bg-amber-100 text-amber-700 border-amber-200" },
  discharged: { label: "Đã xuất viện", color: "bg-slate-100 text-slate-600 border-slate-200" },
  follow_up: { label: "Tái khám", color: "bg-sky-100 text-sky-700 border-sky-200" },
};

const TABS = [
  {
    key: "medical-records" as TabType,
    label: "Hồ sơ bệnh án",
    icon: FileText,
    description: "Hồ sơ nội trú sau khi bệnh nhân nhập viện",
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

export default function MedicalRecordsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("medical-records");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);

  // Sync tab từ URL param (khi click submenu trên sidebar)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "exam-history" || tabParam === "medical-records") {
      setActiveTab(tabParam);
      setSelectedPatient(null);
    }
  }, [searchParams]);

  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role;
  const isPatientRole = userRole === "patient";
  const canCreateRecord = userRole === "doctor" || userRole === "admin";

  // Nếu là bệnh nhân → xem trực tiếp hồ sơ của chính mình (không cần chọn từ danh sách)
  const patientSelfId = isPatientRole ? session?.user?.id : null;

  const { data: patientsData, isLoading } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: () => getUsers({ role: "patient", limit: 100 }),
    enabled: !isPatientRole, // Chỉ fetch danh sách khi là doctor/admin
  });

  const patients = patientsData?.res || [];
  const filtered = patients.filter((p: User) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ============================================================
  // PATIENT VIEW: bệnh nhân xem trực tiếp hồ sơ của chính mình
  // ============================================================
  if (isPatientRole && patientSelfId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Hồ sơ sức khỏe của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Xem hồ sơ bệnh án nội trú và lịch sử kết quả khám ngoại trú của bạn.
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
                    ? "border-transparent bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-md shadow-blue-500/20"
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

        {/* Content */}
        <Card className="card shadow-sm">
          <CardContent className="p-6">
            {activeTab === "medical-records" ? (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold">Hồ sơ bệnh án nội trú</h2>
                </div>
                <MedicalHistory patientId={patientSelfId} />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold">Lịch sử khám ngoại trú</h2>
                </div>
                <ExamHistoryList patientId={patientSelfId} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // DOCTOR/ADMIN VIEW: chọn bệnh nhân từ danh sách
  // ============================================================
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Đang tải danh sách bệnh nhân..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Hồ sơ &amp; Lịch sử khám</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý hồ sơ bệnh án nội trú và lịch sử kết quả khám ngoại trú.
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
              onClick={() => { setActiveTab(tab.key); setSelectedPatient(null); }}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                isActive
                  ? "border-transparent bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-md shadow-blue-500/20"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Patient List */}
        <div className="lg:col-span-1">
          <Card className="card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                Chọn bệnh nhân
              </CardTitle>
              <CardDescription>
                {activeTab === "medical-records"
                  ? "Xem hồ sơ bệnh án của bệnh nhân"
                  : "Xem lịch sử khám của bệnh nhân"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm bệnh nhân..."
                  className="pl-9 h-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6">Không tìm thấy bệnh nhân.</p>
                ) : (
                  filtered.map((patient: User) => {
                    const isSelected = selectedPatient?._id === patient._id;
                    const statusInfo = STATUS_LABEL[patient.status] || null;
                    return (
                      <button
                        key={patient._id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
                            : "hover:bg-muted/60 border border-transparent"
                        }`}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={patient.image || ""} />
                          <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                            {patient.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isSelected ? "text-blue-700" : ""}`}>
                            {patient.name}
                          </p>
                          {statusInfo && (
                            <Badge className={`text-[10px] mt-0.5 ${statusInfo.color}`}>
                              {statusInfo.label}
                            </Badge>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-500" : "text-muted-foreground/40"}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Content Panel */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <Card className="card shadow-sm h-full">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                {activeTab === "medical-records" ? (
                  <>
                    <BedDouble className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="font-bold text-slate-500">Chọn bệnh nhân để xem hồ sơ bệnh án</p>
                    <p className="text-sm text-slate-400 mt-1">Hồ sơ bệnh án chỉ có sau khi bệnh nhân nhập viện.</p>
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="font-bold text-slate-500">Chọn bệnh nhân để xem lịch sử khám</p>
                    <p className="text-sm text-slate-400 mt-1">Lịch sử được lưu sau mỗi lần khám ngoại trú.</p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="card shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={selectedPatient.image || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                        {selectedPatient.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{selectedPatient.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-0.5">
                        {selectedPatient.age && `${selectedPatient.age} tuổi`}
                        {selectedPatient.bloodgroup && ` • Nhóm máu ${selectedPatient.bloodgroup}`}
                        {selectedPatient.status && STATUS_LABEL[selectedPatient.status] && (
                          <Badge className={`text-[10px] ${STATUS_LABEL[selectedPatient.status].color}`}>
                            {STATUS_LABEL[selectedPatient.status].label}
                          </Badge>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {canCreateRecord && (
                    <div className="flex gap-2">
                      {activeTab === "medical-records" && (
                        <CreateMedicalRecordModal
                          patientId={selectedPatient._id}
                          patientName={selectedPatient.name}
                          patientStatus={selectedPatient.status as any}
                        />
                      )}
                      {activeTab === "exam-history" && (
                        <CreateExamHistoryModal
                          patientId={selectedPatient._id}
                          patientName={selectedPatient.name}
                        />
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeTab === "medical-records" ? (
                  <MedicalHistory patientId={selectedPatient._id} />
                ) : (
                  <ExamHistoryList patientId={selectedPatient._id} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
