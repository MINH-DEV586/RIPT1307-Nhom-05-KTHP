import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExamHistory } from "@/lib/api";
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
import { ClipboardCheck, Plus } from "lucide-react";

interface Props {
  patientId: string;
  patientName: string;
}

export default function CreateExamHistoryModal({ patientId, patientName }: Props) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    chiefComplaint: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    prescription: "",
    followUpDate: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: createExamHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-history", patientId] });
      toast.success("Đã lưu kết quả khám thành công");
      setOpen(false);
      setFormData({
        chiefComplaint: "",
        symptoms: "",
        diagnosis: "",
        treatment: "",
        prescription: "",
        followUpDate: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi lưu kết quả khám");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      patient: patientId,
      ...formData,
      followUpDate: formData.followUpDate || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          <Plus className="w-4 h-4" />
          Ghi kết quả khám
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            Ghi kết quả khám ngoại trú - {patientName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">Lý do khám *</Label>
            <Input
              id="chiefComplaint"
              placeholder="Bệnh nhân đến khám vì..."
              value={formData.chiefComplaint}
              onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-symptoms">Triệu chứng *</Label>
            <Textarea
              id="exam-symptoms"
              placeholder="Mô tả triệu chứng..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-diagnosis">Chẩn đoán *</Label>
            <Input
              id="exam-diagnosis"
              placeholder="Kết quả chẩn đoán..."
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="treatment">Hướng xử trí *</Label>
            <Textarea
              id="treatment"
              placeholder="Hướng điều trị, xử lý..."
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prescription">Đơn thuốc / Toa kê</Label>
            <Textarea
              id="prescription"
              placeholder="Thuốc kê đơn (nếu có)..."
              value={formData.prescription}
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="followUpDate">Lịch tái khám</Label>
            <Input
              id="followUpDate"
              type="date"
              value={formData.followUpDate}
              onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-notes">Ghi chú thêm</Label>
            <Textarea
              id="exam-notes"
              placeholder="Ghi chú thêm (không bắt buộc)..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Đang lưu..." : "Lưu kết quả khám"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
