import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getAvailableMedicines, createPrescription, getUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, ClipboardList, User, Pill, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PrescriptionItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

export default function CreatePrescription() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patientId: "",
    diagnosis: "",
    notes: "",
    items: [] as PrescriptionItem[]
  });

  const [currentItem, setCurrentItem] = useState<Partial<PrescriptionItem>>({
    medicineId: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: 1
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [patientsData, medicinesData] = await Promise.all([
        getUsers({ role: "patient", limit: 100 }),
        getAvailableMedicines()
      ]);
      setPatients(patientsData.res);
      setMedicines(medicinesData);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu ban đầu");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    if (!currentItem.medicineId || !currentItem.dosage || !currentItem.quantity) {
      toast.error("Vui lòng nhập đầy đủ thông tin thuốc");
      return;
    }

    const selectedMed = medicines.find(m => m._id === currentItem.medicineId);
    
    const newItem: PrescriptionItem = {
      medicineId: currentItem.medicineId,
      medicineName: selectedMed.name,
      dosage: currentItem.dosage!,
      frequency: currentItem.frequency || "1 lần/ngày",
      duration: currentItem.duration || "7 ngày",
      quantity: Number(currentItem.quantity)
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({
      medicineId: "",
      dosage: "",
      frequency: "",
      duration: "",
      quantity: 1
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.diagnosis || formData.items.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      await createPrescription(formData);
      toast.success("Đã tạo đơn thuốc thành công");
      navigate("/pharmacy/prescriptions");
    } catch (error: any) {
      toast.error(error.message || "Lỗi khi tạo đơn thuốc");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center italic text-muted-foreground">Đang chuẩn bị biểu mẫu...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="group">
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Quay lại
      </Button>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary" />
                Thông tin đơn thuốc
              </CardTitle>
              <CardDescription>Nhập thông tin bệnh nhân và chẩn đoán.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patient" className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" /> Bệnh nhân
                  </Label>
                  <Select 
                    value={formData.patientId} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, patientId: val }))}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Chọn bệnh nhân..." />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(p => (
                        <SelectItem key={p._id} value={p._id}>{p.name} - {p.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Chẩn đoán</Label>
                  <Input 
                    id="diagnosis"
                    placeholder="Nhập chẩn đoán..."
                    value={formData.diagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú thêm</Label>
                <Textarea 
                  id="notes"
                  placeholder="Hướng dẫn dùng thuốc, chế độ ăn uống..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Danh mục thuốc kê đơn
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic border-2 border-dashed border-primary/10 rounded-lg">
                  Chưa có thuốc nào được thêm vào đơn.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-primary/10 group">
                      <div className="flex-1">
                        <p className="font-semibold text-primary">{item.medicineName}</p>
                        {(() => {
                          const med = medicines.find(m => m._id === item.medicineId);
                          return med ? (
                            <p className="text-xs text-muted-foreground">
                              {item.dosage} | {item.frequency} | {item.duration} | Đơn giá: {med.price.toLocaleString()} đ | Thành tiền: {(item.quantity * med.price).toLocaleString()} đ
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {item.dosage} | {item.frequency} | {item.duration}
                            </p>
                          );
                        })()}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">x{item.quantity}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(idx)}
                          className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Item Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-primary/5 border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Thêm thuốc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tên thuốc</Label>
                <Select 
                  value={currentItem.medicineId} 
                  onValueChange={(val) => setCurrentItem(prev => ({ ...prev, medicineId: val }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Chọn thuốc..." />
                  </SelectTrigger>
                  <SelectContent>
                    {medicines.map(m => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.name} ({m.stock} {m.unit}) - {m.price.toLocaleString()} đ
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Liều dùng (VD: 500mg)</Label>
                <Input 
                  value={currentItem.dosage}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="VD: 1 viên"
                  className="bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tần suất</Label>
                  <Input 
                    value={currentItem.frequency}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="2 lần/ngày"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian</Label>
                  <Input 
                    value={currentItem.duration}
                    onChange={(e) => setCurrentItem(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="7 ngày"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Số lượng tổng</Label>
                <Input 
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  className="bg-background"
                />
              </div>
              <Button type="button" onClick={addItem} className="w-full mt-2" variant="secondary">
                <Plus className="mr-2 h-4 w-4" /> Thêm vào danh sách
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Tổng giá trị đơn thuốc dự kiến</p>
            <h3 className="text-2xl font-black text-primary mt-1">
              {formData.items.reduce((acc, item) => {
                const med = medicines.find(m => m._id === item.medicineId);
                return acc + (med ? med.price * item.quantity : 0);
              }, 0).toLocaleString()} VNĐ
            </h3>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-14 text-lg shadow-xl shadow-primary/30"
            disabled={submitting || formData.items.length === 0}
          >
            {submitting ? "Đang lưu..." : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Lưu & Hoàn tất
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
