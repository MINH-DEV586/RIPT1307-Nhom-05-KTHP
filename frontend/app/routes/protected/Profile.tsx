import { useParams, Link } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import {
  getUserById,
  getMyActiveInvoice,
  createCheckoutSession,
  getBillingHistory,
  updateUser,
  getAllBeds,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Edit3,
  Loader2,
  User,
  CreditCard,
  Receipt,
  History,
  CheckCircle2,
  Video,
  MessageSquare,
  Building2,
  Zap,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  FileText,
  BedDouble,
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_CONFIG } from "@/components/users/statusBadge";
import Loader from "@/components/global/Loader";
import MedicalHistory from "@/components/patients/MedicalHistory";
import CreateMedicalRecordModal from "@/components/patients/CreateMedicalRecordModal";
import ExamHistoryList from "@/components/patients/ExamHistoryList";
import CreateExamHistoryModal from "@/components/patients/CreateExamHistoryModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function meta() {
  return [{ title: "Hồ sơ người dùng" }];
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const queryClient = useQueryClient();
  const loggedInUser = session?.user;

  const targetUserId = id || loggedInUser?.id;
  const isViewingOwnProfile = loggedInUser?.id === targetUserId;
  const isAdmin = loggedInUser?.role === "admin";

  const { data: profileUser, isLoading: profileLoading } = useQuery({
    queryKey: ["user", targetUserId],
    queryFn: () => getUserById(targetUserId!),
    enabled: !!targetUserId,
  });

  const isPatient = profileUser?.role === "patient";
  const isDischarged = profileUser?.status === "discharged";

  const { data: invoices, isLoading: invoiceLoading } = useQuery<any[]>({
    queryKey: ["my-invoice", targetUserId],
    queryFn: () => getMyActiveInvoice(targetUserId!),
    enabled: !!targetUserId && isPatient && (isViewingOwnProfile || isAdmin),
  });

  const { data: billingHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["billing-history", targetUserId],
    queryFn: () => getBillingHistory(targetUserId!),
    enabled: !!targetUserId && isPatient && (isViewingOwnProfile || isAdmin),
  });

  const { data: beds = [] } = useQuery<any[]>({
    queryKey: ["beds", "all"],
    queryFn: () => getAllBeds(),
    enabled: isPatient && profileUser?.status === "admitted",
  });
  const myBed = beds.find((b: any) => b.patientId === profileUser?._id || b._id === profileUser?.assignedBedId);

  const checkoutMutation = useMutation({
    mutationFn: createCheckoutSession,
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể bắt đầu thanh toán");
    },
  });

  if (sessionLoading || profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader label={"Đang tải hồ sơ..."} />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-red-500 font-bold">
        Không tìm thấy người dùng.
      </div>
    );
  }

  const statusConf =
    STATUS_CONFIG[profileUser.status as any] || STATUS_CONFIG["active"];

  const roleTranslations: Record<string, string> = {
    admin: "Quản trị viên",
    doctor: "Bác sĩ",
    nurse: "Điều dưỡng",
    pharmacist: "Dược sĩ",
    lab_tech: "Kỹ thuật viên",
    patient: "Bệnh nhân",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-6 pb-20">
      <h1 className="text-3xl font-bold tracking-tight">
        {isViewingOwnProfile ? "Hồ sơ của tôi" : `Hồ sơ của ${profileUser.name}`}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 card shadow-sm h-min">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-4 border-white dark:border-slate-800 shadow-sm">
              <AvatarImage src={profileUser.image} />
              <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                {profileUser.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{profileUser.name}</h2>
            <p className="text-sm text-slate-500 mb-4">{profileUser.email}</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="capitalize">
                {roleTranslations[profileUser.role] || profileUser.role}
              </Badge>
              <Badge variant="outline" className={statusConf.color}>
                {statusConf.label}
              </Badge>
            </div>

            { (isViewingOwnProfile || isAdmin || (loggedInUser?.role === 'doctor' && isPatient)) && (
              <EditProfileModal user={profileUser} viewerRole={loggedInUser?.role || undefined} />
            )}

            {/* Quick Actions for Profile */}
            <div className="mt-6 w-full pt-6 border-t space-y-2">
              {isPatient && (
                <Button 
                  asChild 
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/10"
                >
                  <Link to="/telemedicine/sessions/book">
                    <Video className="w-4 h-4" /> Đặt lịch tư vấn
                  </Link>
                </Button>
              )}
              {loggedInUser?.role === 'doctor' && isPatient && (
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                >
                  <Link to="/telemedicine/sessions">
                    <MessageSquare className="w-4 h-4" /> Xem phiên khám
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="col-span-1 md:col-span-2 space-y-6">
          <Card className="card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                {isPatient ? "Thông tin y tế" : "Thông tin nghề nghiệp"}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              {isPatient ? (
                <>
                  <DetailItem label="Ngày sinh" value={profileUser.birthday} icon={<Calendar className="w-3.5 h-3.5" />} />
                  <DetailItem label="Số điện thoại" value={profileUser.phoneNumber} icon={<Phone className="w-3.5 h-3.5" />} />
                  <DetailItem label="Nhóm máu" value={profileUser.bloodgroup} icon={<ShieldCheck className="w-3.5 h-3.5 text-red-500" />} />
                  <div className="col-span-2">
                    <DetailItem label="Địa chỉ" value={profileUser.address} icon={<MapPin className="w-3.5 h-3.5" />} />
                  </div>
                  <div className="col-span-2">
                    <DetailItem label="Mã BHYT" value={profileUser.insuranceId} icon={<ShieldCheck className="w-3.5 h-3.5" />} />
                  </div>
                  <div className="col-span-2">
                    <DetailItem
                      label="Tiền sử bệnh lý"
                      value={profileUser.medicalHistory || "Hồ sơ sạch"}
                      icon={<FileText className="w-3.5 h-3.5" />}
                    />
                  </div>
                </>
              ) : (
                <>
                  <DetailItem
                    label="Khoa"
                    value={profileUser.department}
                    icon={<Building2 className="w-3.5 h-3.5" />}
                  />
                  <DetailItem
                    label="Chuyên môn"
                    value={profileUser.specialization}
                    icon={<Zap className="w-3.5 h-3.5" />}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {isPatient && (
            <>
              {/* Card: Thông tin điều trị nội trú */}
              {profileUser.status === "admitted" && myBed && (
                <Card className="card shadow-sm border-l-4 border-l-amber-500 bg-amber-50/10 dark:bg-amber-950/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <BedDouble className="h-5 w-5" />
                      Thông tin điều trị nội trú
                    </CardTitle>
                    <CardDescription>Bệnh nhân đang nằm viện và điều trị nội trú tại cơ sở.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <DetailItem 
                      label="Số giường" 
                      value={`Giường #${myBed.bedNumber}`} 
                      icon={<BedDouble className="w-3.5 h-3.5" />} 
                    />
                    <DetailItem 
                      label="Loại giường" 
                      value={myBed.type === "vip" ? "Phòng VIP (500,000 đ/ngày)" : myBed.type === "emergency" ? "Cấp cứu (300,000 đ/ngày)" : "Thường (200,000 đ/ngày)"} 
                      icon={<Zap className="w-3.5 h-3.5 text-amber-500" />} 
                    />
                    <DetailItem 
                      label="Khoa / Tầng" 
                      value={`${myBed.department} - Tầng ${myBed.floor}`} 
                      icon={<Building2 className="w-3.5 h-3.5" />} 
                    />
                    <DetailItem 
                      label="Ngày nhập viện" 
                      value={profileUser.admittedAt ? new Date(profileUser.admittedAt).toLocaleString("vi-VN") : new Date(profileUser.createdAt).toLocaleString("vi-VN")} 
                      icon={<Calendar className="w-3.5 h-3.5" />} 
                    />
                    <div className="col-span-2 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl flex items-center justify-between border border-amber-100 dark:border-amber-900/30">
                      <div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Thời gian nằm viện tạm tính</p>
                        <p className="text-sm font-medium mt-0.5">
                          {(() => {
                            const admittedAt = profileUser.admittedAt ? new Date(profileUser.admittedAt) : new Date(profileUser.createdAt);
                            const days = Math.max(1, Math.ceil((new Date().getTime() - admittedAt.getTime()) / (1000 * 60 * 60 * 24)));
                            return `${days} ngày`;
                          })()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Chi phí giường tạm tính</p>
                        <p className="text-lg font-black text-amber-700 dark:text-amber-400">
                          {(() => {
                            const admittedAt = profileUser.admittedAt ? new Date(profileUser.admittedAt) : new Date(profileUser.createdAt);
                            const days = Math.max(1, Math.ceil((new Date().getTime() - admittedAt.getTime()) / (1000 * 60 * 60 * 24)));
                            const rate = myBed.type === "vip" ? 500000 : myBed.type === "emergency" ? 300000 : 200000;
                            return `${(days * rate).toLocaleString()} VNĐ`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card: Hồ sơ bệnh án nội trú */}
              <Card id="medical-records" className="card shadow-sm scroll-mt-20">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-end">
                    {["admin", "doctor"].includes(loggedInUser?.role || "") && (
                      <CreateMedicalRecordModal
                        patientId={profileUser._id}
                        patientName={profileUser.name}
                        patientStatus={profileUser.status as any}
                      />
                    )}
                  </div>
                  <MedicalHistory patientId={profileUser._id} patientStatus={profileUser.status} />

                </div>
              </Card>

              {/* Card: Lịch sử khám ngoại trú */}
              <Card className="card shadow-sm">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-end">
                    {["admin", "doctor"].includes(loggedInUser?.role || "") && (
                      <CreateExamHistoryModal
                        patientId={profileUser._id}
                        patientName={profileUser.name}
                      />
                    )}
                  </div>
                  <ExamHistoryList patientId={profileUser._id} />
                </div>
              </Card>
            </>
          )}


          {isPatient && (isViewingOwnProfile || isAdmin) && (
            <Card className="card shadow-sm overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">
                        Số dư hiện tại
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Các chi phí cần thanh toán
                      </CardDescription>
                    </div>
                  </div>
                  {invoices && invoices.length > 0 && (
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0).toLocaleString()} VNĐ
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!invoices || invoices.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-2">
                    Không có chi phí phát sinh.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {invoices.map((inv: any, index: number) => (
                      <div key={inv._id || index} className="space-y-3 border-b last:border-0 pb-4 last:pb-0">
                        <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                          Hóa đơn #{inv._id?.slice(-6) || index + 1}
                        </p>
                        <div className="space-y-1">
                          {inv.items?.map((item: any, i: number) => (
                            <div
                              key={i}
                              className="flex justify-between text-xs text-slate-400"
                            >
                              <span>{item.description}</span>
                              <span>{item.totalPrice.toLocaleString()} VNĐ</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 flex justify-between items-center border-t border-dashed border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold">Tổng hóa đơn này:</span>
                          <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                            {inv.totalAmount.toLocaleString()} VNĐ
                          </span>
                        </div>
                        {inv.status === "paid" ? (
                          <Badge className="w-full justify-center py-2 bg-green-50 text-green-700 border-green-200 mt-2">
                            Thanh toán hoàn tất
                          </Badge>
                        ) : (
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                            disabled={(!isDischarged && profileUser?.status === "admitted") || checkoutMutation.isPending}
                            onClick={() => checkoutMutation.mutate(inv._id)}
                          >
                            {checkoutMutation.isPending ? (
                              <Loader2 className="animate-spin mr-2 h-4 w-4" />
                            ) : (
                              <CreditCard className="mr-2 h-4 w-4" />
                            )}
                            {profileUser?.status === "admitted" && !isDischarged
                              ? "Đang chờ xuất viện"
                              : "Thanh toán ngay"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {isPatient && (isViewingOwnProfile || isAdmin) && (
            <Card className="card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-slate-400" />
                  Lịch sử thanh toán
                </CardTitle>
                <CardDescription>
                  Hồ sơ các hóa đơn đã thanh toán trước đó.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin h-5 w-5 text-slate-300" />
                  </div>
                ) : !billingHistory || billingHistory.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4 italic border border-dashed rounded-lg">
                    Không tìm thấy thanh toán trước đó.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {billingHistory.map((pastInv: any) => (
                      <div
                        key={pastInv._id}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600">
                            <CheckCircle2 size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold">
                              {pastInv.totalAmount.toLocaleString()} VNĐ
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                              Đã trả vào ngày{" "}
                              {new Date(pastInv.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2"
                        >
                          Chi tiết
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

function DetailItem({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <p className="font-medium text-slate-800 dark:text-slate-200">
        {value || "Chưa cập nhật"}
      </p>
    </div>
  );
}

function EditProfileModal({ user, viewerRole }: { user: any, viewerRole?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [address, setAddress] = useState(user.address || "");
  const [insuranceId, setInsuranceId] = useState(user.insuranceId || "");
  const [bloodgroup, setBloodgroup] = useState(user.bloodgroup || "");
  const [medicalHistory, setMedicalHistory] = useState(user.medicalHistory || "");
  const queryClient = useQueryClient();

  const isPatient = user.role === "patient";
  const canEditMedical = viewerRole === "admin" || viewerRole === "doctor";
  const isSelf = viewerRole === user.role; // This is a bit simplistic but works for determining self-edit fields

  useEffect(() => {
    setName(user.name || "");
    setEmail(user.email || "");
    setBirthday(user.birthday || "");
    setPhoneNumber(user.phoneNumber || "");
    setAddress(user.address || "");
    setInsuranceId(user.insuranceId || "");
    setBloodgroup(user.bloodgroup || "");
    setMedicalHistory(user.medicalHistory || "");
  }, [user, open]);

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      toast.success("Cập nhật hồ sơ thành công");
      queryClient.invalidateQueries({ queryKey: ["user", user._id] });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi khi cập nhật hồ sơ");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { 
      name, 
      email, 
      birthday, 
      phoneNumber, 
      address, 
      insuranceId 
    };
    if (canEditMedical && isPatient) {
      data.bloodgroup = bloodgroup;
      data.medicalHistory = medicalHistory;
    }
    updateMutation.mutate({
      userId: user._id,
      userData: data,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-4 gap-2 border-slate-200 w-full">
          <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa hồ sơ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hồ sơ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin {isPatient ? "bệnh nhân" : "cá nhân"} tại đây.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập họ tên"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                required
              />
            </div>
            {isPatient && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="birthday">Ngày sinh</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Số điện thoại</Label>
                    <Input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ cư trú"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="insuranceId">Mã bảo hiểm y tế</Label>
                  <Input
                    id="insuranceId"
                    value={insuranceId}
                    onChange={(e) => setInsuranceId(e.target.value)}
                    placeholder="Mã số BHYT"
                  />
                </div>
              </>
            )}
            {isPatient && canEditMedical && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="bloodgroup">Nhóm máu</Label>
                  <select 
                    id="bloodgroup"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={bloodgroup}
                    onChange={(e) => setBloodgroup(e.target.value)}
                  >
                    <option value="">Chọn nhóm máu</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="medicalHistory">Tiền sử bệnh lý</Label>
                  <textarea
                    id="medicalHistory"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                    placeholder="Nhập tiền sử bệnh lý, dị ứng..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={updateMutation.isPending}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default Profile;
