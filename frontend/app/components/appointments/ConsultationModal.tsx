import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  createMedicalRecord,
  createExamHistory,
  getAllMedicines,
  createPrescription,
  createLabRequest,
  getPatientMedicalRecords,
  getPatientLabResults,
  getAllBeds,
  admitPatientToBed,
  updatePatientStatus,
} from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Stethoscope,
  FlaskConical,
  Pill,
  History,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Zap,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Medicine, PrescriptionItem, MedicalRecord, LabResult } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConsultationModalProps {
  appointment: Appointment;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (billingData: any) => void;
}

export function ConsultationModal({ appointment, isOpen, onClose, onComplete }: ConsultationModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("exam");
  const [disposition, setDisposition] = useState<"outpatient" | "inpatient">("outpatient");

  // Form State
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBedId, setSelectedBedId] = useState("");
  // Triệu chứng — bác sĩ có thể chỉnh sửa (walk-in mặc định không có)
  const isWalkIn = appointment.symptoms === "Khám trực tiếp (Walk-in)" || !appointment.symptoms;
  const [symptoms, setSymptoms] = useState(isWalkIn ? "" : (appointment.symptoms || ""));

  // Lab State
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [customTest, setCustomTest] = useState("");

  // Prescription State
  const [prescribedItems, setPrescribedItems] = useState<Partial<PrescriptionItem>[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");

  // Data Queries
  const { data: beds = [] } = useQuery({
    queryKey: ["beds", "available"],
    queryFn: () => getAllBeds({ status: "available" }),
    enabled: isOpen && disposition === "inpatient",
  });

  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: getAllMedicines,
    enabled: isOpen,
  });

  const { data: history = [] } = useQuery<MedicalRecord[]>({
    queryKey: ["history", appointment.patientId],
    queryFn: () => getPatientMedicalRecords(appointment.patientId),
    enabled: isOpen,
  });

  const { data: labResults = [] } = useQuery<LabResult[]>({
    queryKey: ["lab-results", appointment.patientId],
    queryFn: () => getPatientLabResults(appointment.patientId),
    enabled: isOpen,
  });

  // Mutations
  const medicalRecordMutation = useMutation({
    mutationFn: createMedicalRecord,
  });

  const examHistoryMutation = useMutation({
    mutationFn: createExamHistory,
  });

  const prescriptionMutation = useMutation({
    mutationFn: createPrescription,
  });

  const labRequestMutation = useMutation({
    mutationFn: createLabRequest,
  });

  const handleAddMedicine = () => {
    const med = medicines.find(m => m._id === selectedMedId);
    if (med) {
      setPrescribedItems([...prescribedItems, {
        medicineId: med._id,
        medicineName: med.name,
        dosage: "1 viên",
        frequency: "2 lần/ngày",
        duration: "7 ngày",
        quantity: 14
      }]);
      setSelectedMedId("");
    }
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescribedItems(prescribedItems.filter((_, i) => i !== index));
  };

  const handleAddTest = () => {
    if (customTest && !selectedTests.includes(customTest)) {
      setSelectedTests([...selectedTests, customTest]);
      setCustomTest("");
    }
  };

  const handleFinalize = async () => {
    if (!diagnosis || !treatmentPlan) {
      toast.error("Vui lòng nhập chuẩn đoán và hướng điều trị");
      return;
    }
    if (!symptoms.trim()) {
      toast.error("Vui lòng nhập triệu chứng của bệnh nhân");
      return;
    }

    try {
      // 1. Create Prescription if any
      let prescriptionTotal = 0;
      let prescriptionId: string | undefined;
      if (prescribedItems.length > 0) {
        const prescription = await prescriptionMutation.mutateAsync({
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          diagnosis,
          items: prescribedItems,
          notes
        });
        prescriptionId = prescription?._id;
        prescribedItems.forEach(item => {
          const med = medicines.find(m => m._id === item.medicineId);
          if (med) prescriptionTotal += (med.price * (item.quantity || 0));
        });
      }

      // 2. Create Lab Requests if any
      const labRequestIds: string[] = [];
      if (selectedTests.length > 0) {
        for (const test of selectedTests) {
          const lab = await labRequestMutation.mutateAsync({
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            testType: test,
            status: "pending"
          });
          if (lab?._id) labRequestIds.push(lab._id);
        }
      }

      if (disposition === "outpatient") {
        // 3a. NGOẠI TRÚ → lưu lịch sử khám (ExamHistory)
        await examHistoryMutation.mutateAsync({
          patient: appointment.patientId,
          symptoms: symptoms.trim(),
          diagnosis,
          treatmentPlan,
          notes,
          visitReason: symptoms.trim() || "Khám tổng quát",
          prescriptionIds: prescriptionId ? [prescriptionId] : [],
          labRequestIds,
        });

        // Cập nhật trạng thái bệnh nhân → "Tái khám" (hoàn thành khám ngoại trú)
        // Chỉ cập nhật nếu bệnh nhân KHÔNG đang nội trú thực sự
        const inpatientStatuses = ["admitted", "in_treatment", "observation"];
        const currentStatus = appointment.patient?.status || "";
        if (!inpatientStatuses.includes(currentStatus)) {
          await updatePatientStatus(appointment.patientId, "follow_up");
        }
        queryClient.invalidateQueries({ queryKey: ["user", appointment.patientId] });
        queryClient.invalidateQueries({ queryKey: ["patients"] });


        onComplete({
          consultationFee: appointment.doctor?.consultationFee || 200000,
          labFee: selectedTests.length * 50000,
          prescriptionFee: prescriptionTotal
        });
        toast.success("Ca khám ngoại trú đã hoàn thành và lưu lịch sử khám!");
        onClose();

      } else {
        // 3b. NỘI TRÚ → tạo hồ sơ bệnh án + nhập viện + redirect
        if (!selectedBedId) {
          toast.error("Vui lòng chọn giường bệnh để nhập viện");
          return;
        }

        // Nhập viện vào giường
        await admitPatientToBed({
          patientId: appointment.patientId,
          bedId: selectedBedId,
          admissionReason: diagnosis
        });

        // Tạo hồ sơ bệnh án nội trú
        await medicalRecordMutation.mutateAsync({
          patient: appointment.patientId,
          doctor: appointment.doctorId,
          symptoms: symptoms.trim(),
          diagnosis,
          treatmentPlan,
          notes,
          admissionReason: diagnosis,
          recordType: "inpatient",
        });

        onComplete({
          consultationFee: appointment.doctor?.consultationFee || 200000,
          labFee: selectedTests.length * 50000,
          prescriptionFee: prescriptionTotal
        });
        toast.success("Bệnh nhân đã được nhập viện! Đang chuyển sang hồ sơ bệnh nhân...");
        onClose();

        // Redirect đến profile bệnh nhân, scroll đến phần hồ sơ bệnh án
        setTimeout(() => {
          navigate(`/profile/${appointment.patientId}#medical-records`);
        }, 800);
      }

    } catch (error: any) {
      toast.error(error?.message || "Đã xảy ra lỗi trong quá trình lưu hồ sơ");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black">Thực hiện khám bệnh</DialogTitle>
                <DialogDescription className="text-indigo-100 font-medium">
                  Bệnh nhân: <span className="font-bold text-white">{appointment.patient?.name}</span> • ID: {appointment.patientId.slice(-6).toUpperCase()}
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-white/20 text-white border-none px-4 py-1.5 rounded-full font-bold">
              {appointment.type === "online" ? "Khám từ xa" : "Khám trực tiếp"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-muted/30 border-r p-4 flex flex-col gap-2">
            {[
              { id: "exam", label: "Khám bệnh", icon: Stethoscope },
              { id: "lab", label: "Xét nghiệm", icon: FlaskConical },
              { id: "prescription", label: "Kê đơn thuốc", icon: Pill },
              { id: "history", label: "Tiền sử", icon: History },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`justify-start gap-3 rounded-xl h-12 ${activeTab === tab.id ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-bold text-sm">{tab.label}</span>
              </Button>
            ))}

            <div className="mt-auto pt-4 border-t border-dashed space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chỉ định xử trí</span>
              </div>
              <div
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${disposition === "outpatient" ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                onClick={() => setDisposition("outpatient")}
              >
                <Stethoscope className={`w-6 h-6 mb-2 ${disposition === "outpatient" ? "text-indigo-500" : "text-slate-400"}`} />
                <p className="text-[10px] font-black uppercase tracking-tighter">Ngoại trú</p>
                <p className="text-[9px] font-medium leading-tight mt-1 opacity-80">Kê đơn & Thanh toán</p>
              </div>

              <div
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${disposition === "inpatient" ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                onClick={() => setDisposition("inpatient")}
              >
                <Building2 className={`w-6 h-6 mb-2 ${disposition === "inpatient" ? "text-amber-500" : "text-slate-400"}`} />
                <p className="text-[10px] font-black uppercase tracking-tighter">Nội trú</p>
                <p className="text-[9px] font-medium leading-tight mt-1 opacity-80">Nhập viện (Chọn giường)</p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <ScrollArea className="flex-1 p-8">
            <Tabs value={activeTab} className="w-full">
              {/* --- EXAM TAB --- */}
              <TabsContent value="exam" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">
                      Triệu chứng hiện tại <span className="text-red-500">*</span>
                    </h4>
                    {!isWalkIn && appointment.symptoms ? (
                      // Có triệu chứng từ lịch hẹn — hiển thị nhưng vẫn cho sửa
                      <p className="text-xs text-indigo-400 italic mb-1">Từ lịch hẹn: "{appointment.symptoms}"</p>
                    ) : null}
                    <Textarea
                      placeholder="Nhập triệu chứng bệnh nhân mô tả (đau bụng, sốt, ho...)..."
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="min-h-[80px] rounded-xl bg-white border-indigo-200 text-sm"
                    />
                  </div>


                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Chuẩn đoán xác định <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Vd: Viêm họng cấp J02.9, Sốt virus..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="h-12 rounded-xl bg-background border-slate-200 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Hướng điều trị / Phác đồ <span className="text-red-500">*</span></Label>
                    <Textarea
                      placeholder="Ghi rõ hướng điều trị cho bệnh nhân..."
                      value={treatmentPlan}
                      onChange={(e) => setTreatmentPlan(e.target.value)}
                      className="min-h-[150px] rounded-xl bg-background border-slate-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Ghi chú thêm</Label>
                    <Textarea
                      placeholder="Lời dặn về chế độ ăn uống, sinh hoạt..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl bg-background border-slate-200"
                    />
                  </div>

                  {disposition === "inpatient" && (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-6 h-6 text-amber-600" />
                          <h4 className="font-black text-amber-700">Chỉ định nhập viện</h4>
                        </div>
                        <Badge className="bg-amber-500 text-white border-none">Nội trú</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-amber-700 uppercase tracking-wider">Chọn giường trống (Theo khoa)</Label>
                          <Select value={selectedBedId} onValueChange={setSelectedBedId}>
                            <SelectTrigger className="rounded-xl h-12 bg-white border-amber-200">
                              <SelectValue placeholder="Chọn giường & khoa..." />
                            </SelectTrigger>
                            <SelectContent>
                              {beds.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">Không có giường trống</div>
                              ) : (
                                beds.map((bed: any) => (
                                  <SelectItem key={bed._id} value={bed._id}>
                                    [{bed.department}] - Giường {bed.bedNumber} (Tầng {bed.floor})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest bg-white/50 p-2 rounded-lg border border-amber-100">
                          Lưu ý: Bác sĩ chỉ định nhập viện sẽ chuyển bệnh nhân sang chế độ chăm sóc nội trú.
                        </p>
                      </div>
                    </div>
                  )}

                  {disposition === "outpatient" && (
                    <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Stethoscope className="w-6 h-6 text-indigo-600" />
                          <h4 className="font-black text-indigo-700">Chỉ định ngoại trú</h4>
                        </div>
                        <Badge className="bg-indigo-600 text-white border-none">Ngoại trú</Badge>
                      </div>
                      <p className="text-sm text-indigo-600/80 font-medium italic">
                        Bệnh nhân được điều trị tại nhà theo đơn thuốc và phác đồ đã kê. Hệ thống sẽ tạo hóa đơn thanh toán sau khi hoàn thành.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* --- LAB TAB --- */}
              <TabsContent value="lab" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập loại xét nghiệm (Vd: Xét nghiệm máu, X-Quang...)"
                      value={customTest}
                      onChange={(e) => setCustomTest(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTest()}
                      className="rounded-xl"
                    />
                    <Button onClick={handleAddTest} variant="outline" className="rounded-xl px-6">
                      <Plus className="w-4 h-4 mr-2" /> Thêm
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {["Công thức máu", "Nước tiểu", "Siêu âm bụng", "X-Quang Ngực", "Đường huyết", "Chức năng gan"].map(t => (
                      <Badge
                        key={t}
                        variant={selectedTests.includes(t) ? "default" : "outline"}
                        className={`cursor-pointer px-4 py-1.5 rounded-lg font-medium transition-all ${selectedTests.includes(t) ? "bg-indigo-600" : "hover:bg-indigo-50"}`}
                        onClick={() => selectedTests.includes(t) ? setSelectedTests(selectedTests.filter(st => st !== t)) : setSelectedTests([...selectedTests, t])}
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" /> Chỉ định hiện tại ({selectedTests.length})
                    </h4>
                    {selectedTests.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-40">
                        <p className="text-sm font-bold">Chưa có chỉ định xét nghiệm nào</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {selectedTests.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group border border-slate-100">
                            <span className="font-bold text-slate-700">{t}</span>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTests(selectedTests.filter(st => st !== t))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* --- PRESCRIPTION TAB --- */}
              <TabsContent value="prescription" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <div className="md:col-span-8">
                      <Select value={selectedMedId} onValueChange={setSelectedMedId}>
                        <SelectTrigger className="rounded-xl h-12">
                          <SelectValue placeholder="Chọn thuốc từ danh mục..." />
                        </SelectTrigger>
                        <SelectContent>
                          {medicines.map(m => (
                            <SelectItem key={m._id} value={m._id}>{m.name} ({m.unit}) - Tồn: {m.stock}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-4">
                      <Button onClick={handleAddMedicine} className="w-full h-12 rounded-xl bg-indigo-600 font-bold" disabled={!selectedMedId}>
                        <Plus className="w-4 h-4 mr-2" /> Thêm thuốc
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {prescribedItems.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-40">
                        <p className="text-sm font-bold">Chưa có thuốc nào trong đơn</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prescribedItems.map((item, idx) => (
                          <Card key={idx} className="border-none bg-slate-50/50 rounded-2xl shadow-sm overflow-hidden group">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Pill className="w-5 h-5 text-indigo-500" />
                                  </div>
                                  <span className="font-black text-slate-800">{item.medicineName}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveMedicine(idx)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black text-slate-400 uppercase">Liều dùng</Label>
                                  <Input
                                    value={item.dosage}
                                    onChange={(e) => {
                                      const newItems = [...prescribedItems];
                                      newItems[idx].dosage = e.target.value;
                                      setPrescribedItems(newItems);
                                    }}
                                    className="h-8 text-xs bg-white rounded-lg"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black text-slate-400 uppercase">Tần suất</Label>
                                  <Input
                                    value={item.frequency}
                                    onChange={(e) => {
                                      const newItems = [...prescribedItems];
                                      newItems[idx].frequency = e.target.value;
                                      setPrescribedItems(newItems);
                                    }}
                                    className="h-8 text-xs bg-white rounded-lg"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black text-slate-400 uppercase">Thời gian</Label>
                                  <Input
                                    value={item.duration}
                                    onChange={(e) => {
                                      const newItems = [...prescribedItems];
                                      newItems[idx].duration = e.target.value;
                                      setPrescribedItems(newItems);
                                    }}
                                    className="h-8 text-xs bg-white rounded-lg"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-[10px] font-black text-slate-400 uppercase">Số lượng</Label>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newItems = [...prescribedItems];
                                      newItems[idx].quantity = Number(e.target.value);
                                      setPrescribedItems(newItems);
                                    }}
                                    className="h-8 text-xs bg-white rounded-lg"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* --- HISTORY TAB --- */}
              <TabsContent value="history" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <History className="w-4 h-4" /> Bệnh án trước đây ({history.length})
                    </h4>
                    {history.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-40">
                        <p className="text-sm font-bold">Không tìm thấy bệnh án cũ</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {history.map((record) => (
                          <Card key={record._id} className="border-none shadow-sm bg-slate-50/50 rounded-2xl">
                            <CardContent className="p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-indigo-600">{new Date(record.createdAt).toLocaleDateString("vi-VN")}</span>
                                <Badge variant="outline" className="text-[10px]">Lần khám trước</Badge>
                              </div>
                              <p className="text-sm font-black text-slate-800">{record.diagnosis}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 italic">"{record.treatmentPlan}"</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" /> Kết quả xét nghiệm ({labResults.length})
                    </h4>
                    {labResults.length === 0 ? (
                      <div className="py-10 text-center border-2 border-dashed rounded-3xl opacity-40">
                        <p className="text-sm font-bold">Chưa có kết quả xét nghiệm nào</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {labResults.map((lab) => (
                          <Card key={lab._id} className="border-none shadow-sm bg-slate-50/50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border shadow-sm">
                              <img src={lab.imageUrl} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-800">{lab.testType}</p>
                              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-tighter">{lab.status === 'analyzed' ? 'Đã có kết quả' : 'Đang xử lý'}</p>
                            </div>
                            <Button variant="ghost" size="sm" className="font-bold text-indigo-600" onClick={() => window.open(lab.imageUrl, '_blank')}>Xem</Button>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 bg-slate-50 border-t flex items-center justify-between rounded-b-3xl">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tóm tắt ca khám</span>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <FlaskConical className={`w-3 h-3 ${selectedTests.length > 0 ? "text-indigo-600" : "text-slate-300"}`} />
                  <span className="text-xs font-bold">{selectedTests.length} xét nghiệm</span>
                </div>
                <div className="flex items-center gap-1">
                  <Pill className={`w-3 h-3 ${prescribedItems.length > 0 ? "text-indigo-600" : "text-slate-300"}`} />
                  <span className="text-xs font-bold">{prescribedItems.length} thuốc</span>
                </div>
                {disposition === "inpatient" && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 rounded-md text-amber-700">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-[10px] font-black uppercase">Chỉ định: NHẬP VIỆN</span>
                  </div>
                )}
                {disposition === "outpatient" && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 rounded-md text-indigo-700">
                    <Stethoscope className="w-3 h-3 text-indigo-500" />
                    <span className="text-[10px] font-black uppercase">Chỉ định: NGOẠI TRÚ</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl h-11 px-6 font-bold">Tạm lưu</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-8 font-black gap-2 shadow-lg shadow-emerald-500/20"
              onClick={handleFinalize}
              disabled={medicalRecordMutation.isPending}
            >
              <CheckCircle2 className="w-5 h-5" />
              {medicalRecordMutation.isPending ? "Đang lưu..." : "HOÀN THÀNH CA KHÁM"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
