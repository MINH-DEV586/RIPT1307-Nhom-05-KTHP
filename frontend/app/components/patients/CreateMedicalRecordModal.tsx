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
import { FileText, Plus } from "lucide-react";

export default function CreateMedicalRecordModal({ patientId, patientName }: { patientId: string, patientName: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    symptoms: "",
    diagnosis: "",
    treatmentPlan: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: createMedicalRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-records", patientId] });
      toast.success("Đã lưu hồ sơ bệnh án thành công");
      setOpen(false);
      setFormData({ symptoms: "", diagnosis: "", treatmentPlan: "", notes: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi lưu hồ sơ");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      patient: patientId,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Tạo hồ sơ bệnh án
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Hồ sơ bệnh án - {patientName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="symptoms">Triệu chứng</Label>
            <Textarea
              id="symptoms"
              placeholder="Nhập triệu chứng của bệnh nhân..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Chẩn đoán</Label>
            <Input
              id="diagnosis"
              placeholder="Nhập chẩn đoán..."
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treatmentPlan">Phác đồ điều trị</Label>
            <Textarea
              id="treatmentPlan"
              placeholder="Nhập kế hoạch điều trị..."
              value={formData.treatmentPlan}
              onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú thêm</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú thêm (không bắt buộc)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu hồ sơ bệnh án"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
