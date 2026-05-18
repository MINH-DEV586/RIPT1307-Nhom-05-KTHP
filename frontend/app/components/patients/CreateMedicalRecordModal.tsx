import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMedicalRecord } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Plus, AlertCircle } from "lucide-react";
import type { PatientStatus } from "@/types";

interface CreateMedicalRecordModalProps {
  patientId: string;
  patientName: string;
  patientStatus?: PatientStatus;
}

const ADMITTED_STATUSES: PatientStatus[] = ["admitted", "in_treatment", "observation"];

export default function CreateMedicalRecordModal({
  patientId,
  patientName,
  patientStatus,
}: CreateMedicalRecordModalProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    admissionReason: "",
    symptoms: "",
    diagnosis: "",
    treatmentPlan: "",
    notes: "",
  });

  // Nếu không truyền patientStatus thì cho phép tạo (backward compat)
  const isAdmitted = patientStatus ? ADMITTED_STATUSES.includes(patientStatus) : true;

  const mutation = useMutation({
    mutationFn: createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      toast.success("Đã lưu hồ sơ bệnh án thành công");
      setOpen(false);
      setFormData({ admissionReason: "", symptoms: "", diagnosis: "", treatmentPlan: "", notes: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi lưu hồ sơ");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmitted) {
      toast.error("Bệnh nhân phải được nhập viện trước khi tạo hồ sơ bệnh án.");
      return;
    }
    mutation.mutate({ patient: patientId, patientStatus, ...formData });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!isAdmitted}
          title={!isAdmitted ? "Bệnh nhân phải được nhập viện trước" : "Tạo hồ sơ bệnh án"}
        >
          <Plus className="w-4 h-4" />
          Tạo hồ sơ bệnh án
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Hồ sơ bệnh án - {patientName}
          </DialogTitle>
        </DialogHeader>

        {!isAdmitted && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              Bệnh nhân chưa được nhập viện. Hồ sơ bệnh án chỉ được tạo khi bệnh nhân có trạng thái{" "}
              <strong>Đã nhập viện</strong>, <strong>Đang điều trị</strong>, hoặc <strong>Theo dõi</strong>.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="admissionReason">Lý do nhập viện *</Label>
            <Input
              id="admissionReason"
              placeholder="Lý do bệnh nhân được nhập viện..."
              value={formData.admissionReason}
              onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })}
              required
              disabled={!isAdmitted}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symptoms">Triệu chứng *</Label>
            <Textarea
              id="symptoms"
              placeholder="Nhập triệu chứng của bệnh nhân..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              required
              disabled={!isAdmitted}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Chẩn đoán *</Label>
            <Input
              id="diagnosis"
              placeholder="Nhập chẩn đoán..."
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
              disabled={!isAdmitted}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treatmentPlan">Phác đồ điều trị *</Label>
            <Textarea
              id="treatmentPlan"
              placeholder="Nhập kế hoạch điều trị..."
              value={formData.treatmentPlan}
              onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
              required
              disabled={!isAdmitted}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú thêm</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú thêm (không bắt buộc)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!isAdmitted}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={mutation.isPending || !isAdmitted}
            >
              {mutation.isPending ? "Đang lưu..." : "Lưu hồ sơ bệnh án"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
