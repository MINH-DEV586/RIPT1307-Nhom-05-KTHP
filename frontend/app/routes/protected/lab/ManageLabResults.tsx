import { useEffect, useState } from "react";
import { getAllLabResultsList, updateLabResult, deleteLabResult, deleteFile } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Search, Activity, Calendar, Eye, Edit2, Trash2, Save, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@/lib/uploadthing";
import { authClient } from "@/lib/auth-client";

export default function ManageLabResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeImage, setActiveImage] = useState<{ url: string; title: string } | null>(null);

  // Edit states
  const [editingResult, setEditingResult] = useState<any>(null);
  const [editNote, setEditNote] = useState("");
  const [editBodyPart, setEditBodyPart] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editIndicators, setEditIndicators] = useState<any[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const data = await getAllLabResultsList();
      setResults(data);
    } catch (error) {
      toast.error("Không thể tải danh sách kết quả");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (result: any) => {
    setEditingResult(result);
    setEditNote(result.doctorNotes || "");
    setEditBodyPart(result.bodyPart || "");
    setEditImageUrl(result.imageUrl || "");
    setEditIndicators(result.indicators || []);
    setIsEditOpen(true);
  };

  const handleAddIndicator = () => {
    setEditIndicators([...editIndicators, { name: "", value: "", unit: "", normalRange: "" }]);
  };

  const handleRemoveIndicator = (idx: number) => {
    setEditIndicators(editIndicators.filter((_, i) => i !== idx));
  };

  const handleIndicatorChange = (idx: number, field: string, val: string) => {
    const updated = [...editIndicators];
    updated[idx] = { ...updated[idx], [field]: val };
    setEditIndicators(updated);
  };

  const handleSaveEdit = async () => {
    if (!editingResult) return;
    setSaving(true);
    try {
      await updateLabResult({
        id: editingResult._id,
        data: {
          doctorNotes: editNote,
          bodyPart: editBodyPart,
          imageUrl: editImageUrl,
          indicators: editIndicators.filter(i => i.name && i.value).map(i => ({
            ...i,
            value: Number(i.value)
          })),
        }
      });
      toast.success("Cập nhật kết quả xét nghiệm thành công");
      setIsEditOpen(false);
      fetchResults();
    } catch (err: any) {
      toast.error("Lỗi khi cập nhật kết quả: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa kết quả xét nghiệm này? Hành động này sẽ không thể khôi phục.")) {
      return;
    }
    try {
      await deleteLabResult(id);
      toast.success("Xóa kết quả xét nghiệm thành công");
      fetchResults();
    } catch (err: any) {
      toast.error("Lỗi khi xóa kết quả: " + err.message);
    }
  };

  const filtered = results.filter(r => 
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.testType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
          <Activity className="w-8 h-8" />
          Kết quả xét nghiệm
        </h1>
        <p className="text-muted-foreground mt-1">
          Xem và quản lý các kết quả xét nghiệm chỉ số và hình ảnh.
        </p>
      </div>

      <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm bệnh nhân, loại xét nghiệm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background/50 border-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="font-semibold">Bệnh nhân</TableHead>
                <TableHead className="font-semibold">Loại xét nghiệm</TableHead>
                <TableHead className="font-semibold">Chỉ số đo được</TableHead>
                <TableHead className="font-semibold">Ngày thực hiện</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="text-right font-semibold">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 italic text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Chưa có kết quả xét nghiệm nào.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r._id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium">{r.patientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.testType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {r.indicators && r.indicators.length > 0 ? (
                          r.indicators.map((ind: any, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px] py-0">
                              {ind.name}: {ind.value} {ind.unit}
                            </Badge>
                          ))
                        ) : r.imageUrl ? (
                          <span 
                            onClick={() => setActiveImage({ url: r.imageUrl, title: `${r.patientName} - ${r.testType}` })}
                            className="text-xs italic text-blue-500 hover:text-blue-600 underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem hình ảnh
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Không có dữ liệu số</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                        Đã có kết quả
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEditModal(r)}
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 font-bold"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Sửa
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(r._id)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-500/10 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Image Preview Lightbox */}
      <Dialog open={!!activeImage} onOpenChange={(v) => { if (!v) setActiveImage(null); }}>
        <DialogContent className="sm:max-w-[700px] bg-slate-950 text-white p-0 overflow-hidden border border-slate-800">
          <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800">
            <DialogTitle className="text-sm font-bold truncate">
              {activeImage?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-2 bg-black max-h-[80vh] overflow-y-auto">
            {activeImage && (
              <img 
                src={activeImage.url} 
                alt="Preview" 
                className="max-w-full h-auto object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Result Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-card border-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary text-xl font-bold">
              <Edit2 className="w-5 h-5" /> Chỉnh sửa kết quả xét nghiệm
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chỉ số đo được hoặc ảnh chụp chẩn đoán của bệnh nhân.
            </DialogDescription>
          </DialogHeader>

          {editingResult && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-500/5 border border-primary/5 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground uppercase">Bệnh nhân</span>
                  <p className="font-bold text-base mt-0.5">{editingResult.patientName}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground uppercase">Loại xét nghiệm</span>
                  <p className="font-bold text-base mt-0.5 text-primary">{editingResult.testType}</p>
                </div>
              </div>

              {/* Indicators section */}
              <div className="space-y-3">
                <Label className="font-bold text-sm">Chỉ số xét nghiệm</Label>
                <div className="space-y-3">
                  {editIndicators.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2.5 rounded-lg bg-background/50 border group">
                      <div className="col-span-4 space-y-1">
                        <Label className="text-[10px]">Tên chỉ số</Label>
                        <Input 
                          placeholder="Glucose" 
                          value={item.name || ""} 
                          onChange={(e) => handleIndicatorChange(idx, "name", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">Giá trị</Label>
                        <Input 
                          placeholder="0.0" 
                          value={item.value ?? ""} 
                          onChange={(e) => handleIndicatorChange(idx, "value", e.target.value)}
                          className="h-8 font-bold"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-[10px]">Đơn vị</Label>
                        <Input 
                          placeholder="mg/dL" 
                          value={item.unit || ""} 
                          onChange={(e) => handleIndicatorChange(idx, "unit", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3 space-y-1">
                        <Label className="text-[10px]">Ngưỡng chuẩn</Label>
                        <Input 
                          placeholder="70-100" 
                          value={item.referenceRange || item.normalRange || ""} 
                          onChange={(e) => handleIndicatorChange(idx, "referenceRange", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveIndicator(idx)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddIndicator} className="w-full border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Thêm chỉ số
                </Button>
              </div>

              {/* Note input */}
              <div className="space-y-2">
                <Label htmlFor="editNote">Ghi chú của bác sĩ</Label>
                <Input 
                  id="editNote" 
                  value={editNote} 
                  onChange={(e) => setEditNote(e.target.value)} 
                  placeholder="Nhận xét của bác sĩ chuyên khoa..."
                />
              </div>

              {/* Image Upload section */}
              <div className="space-y-3">
                <Label className="font-bold text-sm">Hình ảnh chẩn đoán hình ảnh</Label>
                {!editImageUrl ? (
                  <UploadDropzone
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      if (res && res[0]) {
                        setEditImageUrl(res[0].ufsUrl);
                        toast.success("Tải ảnh kết quả thành công!");
                      }
                    }}
                    headers={async () => {
                      const session = await authClient.getSession();
                      return {
                        Authorization: `Bearer ${session.data?.session.token}`,
                      };
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Lỗi tải ảnh: ${error.message}`);
                    }}
                    className="border-dashed border-slate-200 dark:border-slate-800 bg-background/20 rounded-xl p-4"
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border">
                      <img
                        src={editImageUrl}
                        alt="Ảnh chẩn đoán"
                        className="h-full w-full object-contain"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8"
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteFile({ file: editImageUrl });
                            setEditImageUrl("");
                            toast.success("Đã xóa ảnh");
                          } catch (err: any) {
                            toast.error("Lỗi xóa ảnh: " + err.message);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Xóa ảnh
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="editBodyPart">Bộ phận chụp chiếu</Label>
                      <Input
                        id="editBodyPart"
                        value={editBodyPart}
                        onChange={(e) => setEditBodyPart(e.target.value)}
                        placeholder="Ví dụ: Phổi thẳng, Ổ bụng..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="shadow-lg shadow-primary/20">
              {saving ? "Đang lưu..." : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
