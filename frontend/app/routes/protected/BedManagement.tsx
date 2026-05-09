import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllBeds, getUsers, admitPatientToBed, dischargePatientFromBed, createBed } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BedDouble,
  Activity,
  CheckCircle2,
  Wrench,
  Users,
  LayoutGrid,
  List,
  Plus,
  LogOut,
  UserPlus,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Loader from "@/components/global/Loader";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { User, Bed } from "@/types";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function meta() {
  return [{ title: "Quản lý giường bệnh | MedFlow AI" }];
}

const DEPARTMENTS = [
  { id: "all", label: "Tất cả khoa" },
  { id: "Nội tổng quát", label: "Nội tổng quát" },
  { id: "Tim mạch", label: "Tim mạch" },
  { id: "Thần kinh", label: "Thần kinh" },
  { id: "Nhi khoa", label: "Nhi khoa" },
  { id: "Hồi sức cấp cứu", label: "Cấp cứu" },
];

const BED_TYPES = {
  normal: { label: "Thường", color: "bg-slate-100 text-slate-700" },
  emergency: { label: "Cấp cứu", color: "bg-red-100 text-red-700" },
  rehab: { label: "Phục hồi", color: "bg-blue-100 text-blue-700" },
  disability: { label: "Khuyết tật", color: "bg-purple-100 text-purple-700" },
  vip: { label: "Phòng VIP", color: "bg-amber-100 text-amber-700" },
};

function BedIcon({ status, type }: { status: string, type: string }) {
  const isVip = type === "vip";
  return (
    <div
      className={`
        w-10 h-7 rounded-md border-2 flex items-center justify-center transition-all relative
        ${status === "available" ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40" : ""}
        ${status === "occupied" ? "border-indigo-400 bg-indigo-100 dark:bg-indigo-950/60" : ""}
        ${status === "maintenance" ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40" : ""}
        ${isVip ? "ring-2 ring-amber-400 ring-offset-1" : ""}
      `}
    >
      <BedDouble
        className={`w-4 h-4
          ${status === "available" ? "text-emerald-500" : ""}
          ${status === "occupied" ? "text-indigo-500" : ""}
          ${status === "maintenance" ? "text-amber-500" : ""}
        `}
      />
      {isVip && <Zap className="w-2 h-2 text-amber-500 absolute -top-1 -right-1 fill-amber-500" />}
    </div>
  );
}

export default function BedManagementPage() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [selectedDept, setSelectedDept] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [admissionReason, setAdmissionReason] = useState("");
  const [createBedDialogOpen, setCreateBedDialogOpen] = useState(false);
  const [newBedData, setNewBedData] = useState({
    bedNumber: "",
    type: "normal",
    department: "Nội tổng quát",
    floor: "1",
  });

  const { data: beds = [], isLoading: bedsLoading } = useQuery<Bed[]>({
    queryKey: ["beds", selectedDept],
    queryFn: () => getAllBeds({ department: selectedDept === "all" ? undefined : selectedDept }),
  });

  const { data: patientsData, isLoading: patientsLoading } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: () => getUsers({ role: "patient", limit: 200 }),
  });

  const admitMutation = useMutation({
    mutationFn: admitPatientToBed,
    onSuccess: () => {
      toast.success("Đã xếp giường cho bệnh nhân thành công");
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setAdmitDialogOpen(false);
      setSelectedBed(null);
      setSelectedPatientId("");
      setAdmissionReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi xếp giường");
    }
  });

  const createBedMutation = useMutation({
    mutationFn: createBed,
    onSuccess: () => {
      toast.success("Đã tạo giường bệnh mới");
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      setCreateBedDialogOpen(false);
      setNewBedData({
        bedNumber: "",
        type: "normal",
        department: "Nội tổng quát",
        floor: "1",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi tạo giường");
    }
  });

  const dischargeMutation = useMutation({
    mutationFn: dischargePatientFromBed,
    onSuccess: () => {
      toast.success("Bệnh nhân đã xuất viện hoặc trả giường thành công");
      queryClient.invalidateQueries({ queryKey: ["beds"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });

  const handleAdmitClick = (bed: Bed) => {
    setSelectedBed(bed);
    setAdmitDialogOpen(true);
  };

  const handleDischarge = (patientId: string) => {
    if (confirm("Xác nhận cho bệnh nhân này xuất viện và trả giường?")) {
      dischargeMutation.mutate(patientId);
    }
  };

  if (bedsLoading || patientsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label="Đang tải thông tin giường bệnh..." />
      </div>
    );
  }

  const patients = (patientsData?.res || []) as User[];
  const availablePatients = patients.filter(p => p.status !== "admitted");

  const totalBedsCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === "occupied").length;
  const availableCount = beds.filter(b => b.status === "available").length;
  const maintenanceCount = beds.filter(b => b.status === "maintenance").length;
  const occupancyRate = totalBedsCount > 0 ? Math.round((occupiedCount / totalBedsCount) * 100) : 0;

  const pieData = [
    { name: "Đang dùng", value: occupiedCount, color: "#6366f1" },
    { name: "Còn trống", value: availableCount, color: "#10b981" },
    { name: "Bảo trì", value: maintenanceCount, color: "#f59e0b" },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Quản lý giường bệnh</h1>
          <p className="text-muted-foreground text-lg">Hệ thống quản lý vị trí nội trú và phân loại giường thực tế.</p>
        </div>
        <div className="flex gap-2">
          {(session?.user.role === "admin" || session?.user.role === "doctor") && (
            <Button 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-xl h-9"
              onClick={() => setCreateBedDialogOpen(true)}
            >
              <Plus className="w-4 h-4" /> Thêm giường
            </Button>
          )}
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="gap-2 rounded-xl h-9"
          >
            <LayoutGrid className="w-4 h-4" /> Lưới
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-2 rounded-xl h-9"
          >
            <List className="w-4 h-4" /> Danh sách
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng giường", value: totalBedsCount, icon: BedDouble, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800" },
          { label: "Đang sử dụng", value: occupiedCount, icon: Activity, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
          { label: "Còn trống", value: availableCount, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          { label: "Tỷ lệ lấp đầy", value: `${occupancyRate}%`, icon: Users, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
        ].map((s) => (
          <Card key={s.label} className="card shadow-md border-none overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black group-hover:scale-110 transition-transform origin-left">{s.value}</p>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
                </div>
                <div className={`p-4 rounded-2xl ${s.bg} transform group-hover:rotate-12 transition-transform`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Filters & Charts */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="card shadow-xl border-none bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Phân bổ hiện tại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-sm font-medium text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-black text-sm">{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card shadow-xl border-none">
            <CardHeader>
              <CardTitle className="text-lg">Bộ lọc khoa</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="flex flex-col gap-1">
                {DEPARTMENTS.map((d) => (
                  <Button
                    key={d.id}
                    variant={selectedDept === d.id ? "default" : "ghost"}
                    onClick={() => setSelectedDept(d.id)}
                    className={`justify-start gap-3 h-11 px-4 rounded-xl ${selectedDept === d.id ? "bg-indigo-600" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedDept === d.id ? "bg-white" : "bg-slate-300"}`} />
                    {d.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid/List View */}
        <div className="lg:col-span-3">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {beds.map((bed) => {
                const patient = patients.find(p => p._id === bed.patientId);
                const isVip = bed.type === "vip";
                
                return (
                  <Card
                    key={bed._id}
                    className={`card shadow-lg border-none hover:ring-2 hover:ring-indigo-500/30 transition-all ${isVip ? "bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/10 dark:to-background" : ""}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <BedIcon status={bed.status} type={bed.type} />
                          <div>
                            <p className="font-black text-xl leading-none">#{bed.bedNumber}</p>
                            <p className="text-xs text-muted-foreground mt-1">{bed.floor} · {bed.department}</p>
                          </div>
                        </div>
                        <Badge className={`rounded-lg font-bold ${BED_TYPES[bed.type as keyof typeof BED_TYPES]?.color}`}>
                          {BED_TYPES[bed.type as keyof typeof BED_TYPES]?.label}
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {bed.status === "occupied" && patient ? (
                          <div className="p-4 bg-muted/40 rounded-2xl space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                <AvatarImage src={patient.image || ""} />
                                <AvatarFallback className="font-bold bg-indigo-100 text-indigo-600">
                                  {patient.name?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-black">{patient.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Bệnh nhân nội trú</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-xs h-8 rounded-lg"
                                onClick={() => window.location.href = `/profile/${patient._id}`}
                              >
                                Hồ sơ
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] h-8 rounded-lg p-1"
                                onClick={() => handleDischarge(patient._id)}
                                title="Cho xuất viện & Giải phóng giường"
                              >
                                <LogOut className="w-3 h-3" /> Xuất viện
                              </Button>
                            </div>
                          </div>
                        ) : bed.status === "available" ? (
                          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/20 rounded-2xl bg-emerald-50/10">
                            <p className="text-xs font-bold text-emerald-600 mb-3 uppercase tracking-widest">Giường trống</p>
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-2 h-9 px-4"
                              onClick={() => handleAdmitClick(bed)}
                            >
                              <UserPlus className="w-4 h-4" /> Nhập viện
                            </Button>
                          </div>
                        ) : (
                          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-amber-500/20 rounded-2xl bg-amber-50/10">
                            <Wrench className="w-6 h-6 text-amber-500 mb-2" />
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Đang bảo trì</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="card shadow-xl border-none">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="p-4 font-black text-sm">Số giường</th>
                        <th className="p-4 font-black text-sm">Loại</th>
                        <th className="p-4 font-black text-sm">Khoa</th>
                        <th className="p-4 font-black text-sm">Bệnh nhân</th>
                        <th className="p-4 font-black text-sm">Trạng thái</th>
                        <th className="p-4 font-black text-sm text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {beds.map((bed) => {
                         const patient = patients.find(p => p._id === bed.patientId);
                         return (
                           <tr key={bed._id} className="hover:bg-muted/10 transition-colors">
                             <td className="p-4">
                               <div className="flex items-center gap-2">
                                 <BedIcon status={bed.status} type={bed.type} />
                                 <span className="font-bold">#{bed.bedNumber}</span>
                               </div>
                             </td>
                             <td className="p-4 text-sm">{BED_TYPES[bed.type as keyof typeof BED_TYPES]?.label}</td>
                             <td className="p-4 text-sm">{bed.department}</td>
                             <td className="p-4">
                               {patient ? (
                                 <div className="flex items-center gap-2">
                                   <Avatar className="h-6 w-6">
                                     <AvatarImage src={patient.image || ""} />
                                     <AvatarFallback className="text-[8px]">{patient.name?.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <span className="text-sm font-medium">{patient.name}</span>
                                 </div>
                               ) : "-"}
                             </td>
                             <td className="p-4">
                               <Badge 
                                 className={`rounded-full px-3 py-0.5 text-[10px] uppercase tracking-wider
                                   ${bed.status === "available" ? "bg-emerald-100 text-emerald-700" : ""}
                                   ${bed.status === "occupied" ? "bg-indigo-100 text-indigo-700" : ""}
                                   ${bed.status === "maintenance" ? "bg-amber-100 text-amber-700" : ""}
                                 `}
                               >
                                 {bed.status === "available" ? "Trống" : bed.status === "occupied" ? "Đã dùng" : "Bảo trì"}
                               </Badge>
                             </td>
                             <td className="p-4 text-right">
                               {bed.status === "available" ? (
                                 <Button size="sm" variant="ghost" className="text-emerald-600 font-bold" onClick={() => handleAdmitClick(bed)}>Nhập viện</Button>
                               ) : bed.status === "occupied" ? (
                                 <Button size="sm" variant="ghost" className="text-red-500 font-bold" onClick={() => handleDischarge(bed.patientId!)}>Xuất viện</Button>
                               ) : null}
                             </td>
                           </tr>
                         );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Admission Dialog */}
      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Xếp giường nhập viện</DialogTitle>
            <DialogDescription>
              Gán bệnh nhân vào giường <span className="font-bold text-primary">#{selectedBed?.bedNumber}</span> ({selectedBed?.department})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="patient" className="font-bold">Chọn bệnh nhân</Label>
              <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
                <SelectTrigger id="patient" className="h-12 rounded-xl">
                  <SelectValue placeholder="Tìm bệnh nhân..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePatients.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Không có bệnh nhân chờ nhập viện</div>
                  ) : (
                    availablePatients.map(p => (
                      <SelectItem key={p._id} value={p._id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 mr-2">
                            <AvatarImage src={p.image || ""} />
                            <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {p.name} {p.membership === "pro" && <ShieldCheck className="w-3 h-3 text-amber-500 inline ml-1" />}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedBed?.type === "vip" && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700 font-black mb-1">
                  <Zap className="w-4 h-4 fill-amber-500" /> Lưu ý: Phòng VIP
                </div>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Giường này thuộc khu vực VIP. Chỉ ưu tiên cho bệnh nhân có hạng **Pro** hoặc trường hợp đặc biệt.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason" className="font-bold">Lý do nhập viện</Label>
              <Input 
                id="reason" 
                placeholder="Ví dụ: Theo dõi hậu phẫu, suy hô hấp..." 
                className="h-12 rounded-xl"
                value={admissionReason}
                onChange={(e) => setAdmissionReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdmitDialogOpen(false)} className="rounded-xl h-11 px-6">Hủy</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 px-8 font-bold"
              disabled={!selectedPatientId || admitMutation.isPending}
              onClick={() => admitMutation.mutate({
                patientId: selectedPatientId,
                bedId: selectedBed!._id,
                admissionReason: admissionReason
              })}
            >
              {admitMutation.isPending ? "Đang xử lý..." : "Xác nhận nhập viện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bed Dialog */}
      <Dialog open={createBedDialogOpen} onOpenChange={setCreateBedDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Thêm giường bệnh mới</DialogTitle>
            <DialogDescription>Nhập thông tin chi tiết để thêm giường vào hệ thống.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Số giường</Label>
                <Input 
                  placeholder="Vd: F1R1B1" 
                  value={newBedData.bedNumber}
                  onChange={(e) => setNewBedData({...newBedData, bedNumber: e.target.value})}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Loại giường</Label>
                <Select 
                  value={newBedData.type}
                  onValueChange={(v) => setNewBedData({...newBedData, type: v})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BED_TYPES).map(([val, {label}]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold">Khoa</Label>
                <Select 
                  value={newBedData.department}
                  onValueChange={(v) => setNewBedData({...newBedData, department: v})}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.filter(d => d.id !== "all").map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Tầng</Label>
                <Input 
                  type="number"
                  value={newBedData.floor}
                  onChange={(e) => setNewBedData({...newBedData, floor: e.target.value})}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateBedDialogOpen(false)} className="rounded-xl h-11">Hủy</Button>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 rounded-xl h-11 px-8 font-bold"
              onClick={() => createBedMutation.mutate(newBedData)}
              disabled={!newBedData.bedNumber || createBedMutation.isPending}
            >
              {createBedMutation.isPending ? "Đang tạo..." : "Xác nhận tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
