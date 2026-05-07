import { useEffect, useState } from "react";
import {
  getAllMedicines,
  createMedicineRecord,
  updateMedicineRecord,
  deleteMedicineRecord,
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ArrowUpDown,
  Download,
  Upload
} from "lucide-react";

export default function Inventory() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    unit: "viên",
    price: 0,
    expiryDate: ""
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await getAllMedicines();
      setMedicines(data);
    } catch (error) {
      toast.error("Không thể tải danh sách thuốc");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMed) {
        await updateMedicineRecord(editingMed._id, formData);
        toast.success("Đã cập nhật thông tin thuốc");
      } else {
        await createMedicineRecord(formData);
        toast.success("Đã thêm thuốc mới vào kho");
      }
      setIsDialogOpen(false);
      setEditingMed(null);
      setFormData({ name: "", category: "", stock: 0, unit: "viên", price: 0, expiryDate: "" });
      fetchMedicines();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleEdit = (med: any) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      category: med.category,
      stock: med.stock,
      unit: med.unit,
      price: med.price,
      expiryDate: med.expiryDate ? new Date(med.expiryDate).toISOString().split("T")[0] : ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa loại thuốc này khỏi kho?")) {
      try {
        await deleteMedicineRecord(id);
        toast.success("Đã xóa thuốc thành công");
        fetchMedicines();
      } catch (error) {
        toast.error("Không thể xóa thuốc");
      }
    }
  };

  const filtered = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return <Badge variant="destructive">Hết hàng</Badge>;
    if (stock < 20) return <Badge variant="outline" className="text-orange-500 border-orange-500">Sắp hết</Badge>;
    return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Ổn định</Badge>;
  };

  const isExpired = (date: string) => {
    return new Date(date) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
            <Package className="w-8 h-8" />
            Kho dược & Thiết bị
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tồn kho, hạn sử dụng và đơn giá các loại thuốc.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="hidden md:flex">
            <Upload className="w-4 h-4 mr-2" /> Import
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingMed(null); setFormData({ name: "", category: "", stock: 0, unit: "viên", price: 0, expiryDate: "" }); }} className="shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Thêm thuốc
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingMed ? "Cập nhật thông tin thuốc" : "Thêm thuốc mới"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên thuốc</Label>
                  <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Danh mục</Label>
                    <Input id="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="VD: Kháng sinh" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Đơn vị</Label>
                    <Input id="unit" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="viên, hộp..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Số lượng tồn</Label>
                    <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Đơn giá (VNĐ)</Label>
                    <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="expiry">Hạn sử dụng</Label>
                  <Input id="expiry" type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required />
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full">{editingMed ? "Lưu thay đổi" : "Thêm vào kho"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-orange-500/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Sắp hết hàng</p>
                <h3 className="text-2xl font-bold">{medicines.filter(m => m.stock < 20 && m.stock > 0).length} loại</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-destructive">Hết hạn sử dụng</p>
                <h3 className="text-2xl font-bold">{medicines.filter(m => isExpired(m.expiryDate)).length} loại</h3>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Tổng giá trị kho</p>
                <h3 className="text-2xl font-bold">
                  {medicines.reduce((acc, m) => acc + (m.price * m.stock), 0).toLocaleString()} <span className="text-sm font-normal">VNĐ</span>
                </h3>
              </div>
              <Package className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-card/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm tên thuốc, danh mục..."
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
                <TableHead className="font-semibold">Tên thuốc</TableHead>
                <TableHead className="font-semibold">Danh mục</TableHead>
                <TableHead className="font-semibold">Tồn kho</TableHead>
                <TableHead className="font-semibold">Đơn vị</TableHead>
                <TableHead className="font-semibold">Đơn giá</TableHead>
                <TableHead className="font-semibold">Hạn dùng</TableHead>
                <TableHead className="font-semibold">Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 italic text-muted-foreground">
                    Đang tải dữ liệu kho...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    Không tìm thấy thuốc nào trong kho.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => (
                  <TableRow key={m._id} className="border-primary/5 hover:bg-primary/5 transition-colors">
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><Badge variant="outline">{m.category}</Badge></TableCell>
                    <TableCell className="font-bold">{m.stock}</TableCell>
                    <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                    <TableCell>{m.price.toLocaleString()} đ</TableCell>
                    <TableCell className={isExpired(m.expiryDate) ? "text-destructive font-bold" : ""}>
                      {new Date(m.expiryDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>{getStockStatus(m.stock)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(m)} className="h-8 w-8 hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id)} className="h-8 w-8 hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
