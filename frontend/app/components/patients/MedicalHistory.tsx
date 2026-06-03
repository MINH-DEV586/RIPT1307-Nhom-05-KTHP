import { useState } from "react";
import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";

import { getPatientMedicalRecords, deleteMedicalRecord, updateMedicalRecord, getPrescriptionById } from "@/lib/api";

import { authClient } from "@/lib/auth-client";
import { format, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import Loader from "@/components/global/Loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Stethoscope,
  ClipboardList,
  Activity,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import type { MedicalRecord } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ---- RecordDetailDialog ----
function RecordDetailDialog({
  record,
  open,
  onClose,
}: {
  record: MedicalRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!record) return null;
  const doctorName =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).name
      : "Chưa rõ";
  const doctorSpec =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).specialization ?? ""
      : "";

  // Hỗ trợ cả prescriptionId (cũ) lẫn prescriptionIds (mới)
  const rawIds: string[] = [
    ...((record as any).prescriptionIds || []),
    ...((record as any).prescriptionId ? [(record as any).prescriptionId] : []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);  // deduplicate

  const prescriptionQueries = useQueries({
    queries: rawIds.map((pid) => ({
      queryKey: ["prescription", pid],
      queryFn: () => getPrescriptionById(pid),
      enabled: !!pid,
    })),
  });
  const prescriptions = prescriptionQueries
    .map((q) => q.data)
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <FileText className="w-5 h-5" />
            Chi tiết hồ sơ bệnh án
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-wrap gap-3 pb-3 border-b">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              {record.date && isValid(new Date(record.date))
                ? format(new Date(record.date), "PPP", { locale: vi })
                : "Không rõ ngày"}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Stethoscope className="w-3 h-3" />
              {doctorName}{doctorSpec ? ` - ${doctorSpec}` : ""}
            </Badge>
          </div>
          {(record as any).admissionReason && (
            <DetailSection color="text-orange-600" dotColor="bg-orange-500" label="Lý do nhập viện" value={(record as any).admissionReason} />
          )}
          <DetailSection color="text-red-600" dotColor="bg-red-500" label="Chẩn đoán" value={record.diagnosis} />
          <DetailSection color="text-blue-600" dotColor="bg-blue-500" label="Triệu chứng" value={record.symptoms} />
          <DetailSection color="text-green-600" dotColor="bg-green-500" label="Phác đồ điều trị" value={record.treatmentPlan} />
          {record.notes && (
            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Ghi chú</p>
              <p className="text-sm text-amber-900 dark:text-amber-100 italic">"{record.notes}"</p>
            </div>
          )}

          {/* Danh sách đơn thuốc trong quá trình điều trị */}
          {prescriptions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-sky-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                Đơn thuốc trong điều trị ({prescriptions.length} đơn)
              </p>
              {prescriptions.map((rx: any, idx: number) => (
                <div key={rx._id || idx} className="border rounded-lg overflow-hidden">
                  <div className="bg-sky-50 dark:bg-sky-950/20 px-4 py-2 border-b flex items-center justify-between">
                    <p className="text-xs font-semibold text-sky-700">
                      Đơn #{idx + 1} — {rx.items?.length || 0} loại thuốc
                    </p>
                    <Badge className={rx.status === "dispensed"
                      ? "bg-green-100 text-green-700 text-[10px]"
                      : "bg-yellow-100 text-yellow-700 text-[10px]"}
                    >
                      {rx.status === "dispensed" ? "Đã phát" : "Đang chờ"}
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {(rx.items || []).map((item: any, i: number) => (
                      <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.medicineName}</p>
                          <p className="text-xs text-muted-foreground">{item.dosage} • {item.frequency} • {item.duration}</p>
                        </div>
                        <Badge variant="outline" className="text-xs ml-4 shrink-0">x{item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


function DetailSection({ label, value, dotColor, color }: { label: string; value: string; dotColor: string; color: string }) {
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

// ---- EditRecordDialog ----
function EditRecordDialog({
  record,
  open,
  onClose,
  patientId,
}: {
  record: MedicalRecord | null;
  open: boolean;
  onClose: () => void;
  patientId: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    admissionReason: (record as any)?.admissionReason || "",
    symptoms: record?.symptoms || "",
    diagnosis: record?.diagnosis || "",
    treatmentPlan: record?.treatmentPlan || "",
    notes: record?.notes || "",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => updateMedicalRecord(record!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      toast.success("Đã cập nhật hồ sơ bệnh án thành công");
      onClose();
    },
    onError: (err: any) => toast.error(err.message || "Lỗi khi cập nhật"),
  });

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-blue-600" />
            Cập nhật hồ sơ bệnh án
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 py-2"
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
        >
          <div className="space-y-2">
            <Label htmlFor="edit-reason">Lý do nhập viện</Label>
            <Input id="edit-reason" value={form.admissionReason}
              onChange={(e) => setForm({ ...form, admissionReason: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-symptoms">Triệu chứng</Label>
            <Textarea id="edit-symptoms" value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-diagnosis">Chẩn đoán</Label>
            <Input id="edit-diagnosis" value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-treatment">Phác đồ điều trị</Label>
            <Textarea id="edit-treatment" value={form.treatmentPlan}
              onChange={(e) => setForm({ ...form, treatmentPlan: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Ghi chú</Label>
            <Textarea id="edit-notes" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={mutation.isPending}>
              {mutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- RecordCard ----
function RecordCard({ record, canEdit, canDelete, patientId }: { record: MedicalRecord; canEdit: boolean; canDelete: boolean; patientId: string }) {

  const queryClient = useQueryClient();
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteMedicalRecord(record._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      toast.success("Đã xóa hồ sơ bệnh án");
      setShowDelete(false);
    },
    onError: (err: any) => toast.error(err.message || "Lỗi khi xóa"),
  });

  const doctorName =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).name ?? "Chưa rõ"
      : "Chưa rõ";
  const doctorSpec =
    typeof record.doctor === "object" && record.doctor !== null
      ? (record.doctor as any).specialization ?? ""
      : "";


  return (
    <>
      <div className="overflow-hidden border border-border rounded-xl shadow-sm hover:shadow-md transition-all">
        {/* Card Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/80 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/20 border-b">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-blue-900 dark:text-blue-100 truncate">{record.diagnosis}</p>
            <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {record.date && isValid(new Date(record.date))
                  ? format(new Date(record.date), "dd/MM/yyyy", { locale: vi })
                  : "Không rõ"}
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="w-3 h-3" />
                <span className="font-medium text-foreground">{doctorName}</span>
                {doctorSpec && (
                  <>
                    <span className="text-muted-foreground/60">Chuyên khoa</span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">{doctorSpec}</span>
                  </>
                )}
              </span>
              <div className="pt-0.5">
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  Nội trú
                </Badge>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600"
              onClick={() => setShowDetail(true)} title="Xem chi tiết">
              <Eye className="w-4 h-4" />
            </Button>
            {canEdit && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600"
                onClick={() => setShowEdit(true)} title="Chỉnh sửa">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {canDelete && (
              <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-600"
                onClick={() => setShowDelete(true)} title="Xóa">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <RecordDetailDialog record={record} open={showDetail} onClose={() => setShowDetail(false)} />

      {/* Edit Dialog */}
      <EditRecordDialog record={record} open={showEdit} onClose={() => setShowEdit(false)} patientId={patientId} />

      {/* Delete Confirm Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Xác nhận xóa hồ sơ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Bạn có chắc chắn muốn xóa hồ sơ bệnh án này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDelete(false)}>Hủy</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa hồ sơ"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---- Main Component ----
export default function MedicalHistory({ patientId, patientStatus }: { patientId: string; patientStatus?: string }) {
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as any)?.role;
  const isAdminOrDoctor = userRole === "doctor" || userRole === "admin";
  const isDischarged = patientStatus === "discharged";

  // Đã xuất viện → chỉ xoá được, không sửa
  const canEdit = isAdminOrDoctor && !isDischarged;
  const canDelete = isAdminOrDoctor;

  const { data: records, isLoading, isError, refetch } = useQuery<MedicalRecord[]>({
    queryKey: ["medical-records", patientId],
    queryFn: () => getPatientMedicalRecords(patientId),
    enabled: !!patientId,
    staleTime: 0,               // Luôn coi data là cũ
    refetchOnMount: "always",   // Luôn fetch lại khi component mount
    refetchOnWindowFocus: true, // Fetch lại khi quay lại tab
  });


  if (isLoading) return <Loader label="Đang tải hồ sơ bệnh án..." />;

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-100">
        <p className="font-medium">Lỗi khi tải hồ sơ bệnh án. Vui lòng thử lại.</p>
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed">
        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Chưa có hồ sơ bệnh án nội trú nào.</p>
        <p className="text-slate-400 text-sm mt-1">Hồ sơ chỉ được tạo sau khi bệnh nhân được nhập viện.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-red-500" />
        <h3 className="text-lg font-bold">Hồ sơ bệnh án nội trú</h3>
        <Badge variant="secondary">{records.length} hồ sơ</Badge>
        <Button
          size="icon" variant="ghost"
          className="h-6 w-6 ml-auto text-muted-foreground hover:text-primary"
          onClick={() => refetch()}
          title="Làm mới"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <RecordCard key={record._id} record={record} canEdit={canEdit} canDelete={canDelete} patientId={patientId} />
        ))}

      </div>

    </div>
  );
}
