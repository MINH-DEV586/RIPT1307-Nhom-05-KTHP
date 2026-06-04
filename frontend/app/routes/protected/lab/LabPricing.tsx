import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLabTests, createLabTestRecord, updateLabTestRecord, deleteLabTestRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FlaskConical, Tag } from "lucide-react";
import { toast } from "sonner";

interface LabTest {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  duration: string;
  isActive: boolean;
}

const EMPTY_FORM = { name: "", description: "", price: 0, category: "Sinh hóa", duration: "30 phút" };
const CATEGORIES = ["Huyết học", "Sinh hóa", "Vi sinh", "Chẩn đoán hình ảnh", "Khác"];

export default function LabPricing() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LabTest | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: labTests = [], isLoading } = useQuery<LabTest[]>({
    queryKey: ["lab-tests"],
    queryFn: getLabTests,
  });

  const createMutation = useMutation({
    mutationFn: createLabTestRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-tests"] });
      toast.success("Đã thêm loại xét nghiệm mới");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message || "Lỗi khi thêm"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLabTestRecord(id, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["lab-tests"] });
      const prevData = queryClient.getQueryData(["lab-tests"]);
      queryClient.setQueryData(["lab-tests"], (old: any) => {
        if (!old) return old;
        return old.map((t: any) => t._id === variables.id ? { ...t, ...variables.data } : t);
      });
      return { prevData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-tests"] });
      toast.success("Đã cập nhật thành công");
      closeDialog();
    },
    onError: (err: any, variables, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["lab-tests"], context.prevData);
      }
      toast.error("Lỗi khi cập nhật");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLabTestRecord,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["lab-tests"] });
      const prevData = queryClient.getQueryData(["lab-tests"]);
      queryClient.setQueryData(["lab-tests"], (old: any) => {
        if (!old) return old;
        return old.filter((t: any) => t._id !== id);
      });
      return { prevData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lab-tests"] });
      toast.success("Đã xóa loại xét nghiệm");
    },
    onError: (err: any, variables, context) => {
      if (context?.prevData) {
        queryClient.setQueryData(["lab-tests"], context.prevData);
      }
      toast.error("Lỗi khi xóa");
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (test: LabTest) => {
    setEditTarget(test);
    setForm({ name: test.name, description: test.description, price: test.price, category: test.category, duration: test.duration });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error("Vui lòng nhập tên xét nghiệm");
    if (form.price <= 0) return toast.error("Giá phải lớn hơn 0");

    if (editTarget) {
      updateMutation.mutate({ id: editTarget._id, data: form });
    } else {
      createMutation.mutate(form as any);
    }
  };

  // Nhóm theo category
  const grouped = labTests.reduce((acc: Record<string, LabTest[]>, t) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <FlaskConical className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Bảng giá xét nghiệm</h1>
            <p className="text-sm text-muted-foreground">Quản lý danh mục và giá các loại xét nghiệm</p>
          </div>
        </div>
        <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 font-bold">
          <Plus className="w-4 h-4" /> Thêm loại xét nghiệm
        </Button>
      </div>

      {/* Tổng quan */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-blue-600">{labTests.length}</p>
          <p className="text-sm text-blue-500 font-medium mt-1">Loại xét nghiệm</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-emerald-600">{Object.keys(grouped).length}</p>
          <p className="text-sm text-emerald-500 font-medium mt-1">Danh mục</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-amber-600">
            {labTests.length > 0
              ? Math.round(labTests.reduce((s, t) => s + t.price, 0) / labTests.length).toLocaleString("vi-VN")
              : 0}đ
          </p>
          <p className="text-sm text-amber-500 font-medium mt-1">Giá trung bình</p>
        </div>
      </div>

      {/* Bảng theo nhóm */}
      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Đang tải...</div>
      ) : (
        Object.entries(grouped).map(([category, tests]) => (
          <div key={category} className="rounded-2xl border border-border overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b">
              <Tag className="w-4 h-4 text-blue-500" />
              <span className="font-black text-sm uppercase tracking-wider">{category}</span>
              <Badge variant="secondary" className="ml-auto">{tests.length} loại</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Tên xét nghiệm</TableHead>
                  <TableHead className="font-bold">Mô tả</TableHead>
                  <TableHead className="font-bold">Thời gian</TableHead>
                  <TableHead className="font-bold text-right">Đơn giá</TableHead>
                  <TableHead className="font-bold text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test._id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{test.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{test.description || "—"}</TableCell>
                    <TableCell className="text-sm">{test.duration}</TableCell>
                    <TableCell className="text-right font-black text-blue-600">
                      {test.price.toLocaleString("vi-VN")}đ
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => openEdit(test)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Xóa "${test.name}"?`)) deleteMutation.mutate(test._id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      )}

      {/* Dialog thêm/sửa */}
      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">
              {editTarget ? "Cập nhật xét nghiệm" : "Thêm loại xét nghiệm mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="font-bold">Tên xét nghiệm <span className="text-red-500">*</span></Label>
              <Input placeholder="Vd: Siêu âm tim..." value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold">Mô tả</Label>
              <Input placeholder="Mô tả ngắn về xét nghiệm..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-bold">Giá (VNĐ) <span className="text-red-500">*</span></Label>
                <Input type="number" min={0} placeholder="150000" value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold">Thời gian trả KQ</Label>
                <Input placeholder="30 phút" value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold">Danh mục</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Badge key={c} variant={form.category === c ? "default" : "outline"}
                    className={`cursor-pointer rounded-lg px-3 py-1 ${form.category === c ? "bg-blue-600 text-white" : "hover:bg-blue-50"}`}
                    onClick={() => setForm({ ...form, category: c })}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog} className="rounded-xl">Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">
              {editTarget ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
