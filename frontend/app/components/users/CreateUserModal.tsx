import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Role, User } from "@/types";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Mail,
  Lock,
  Building2,
  FileHeart,
  UserIcon,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Camera,
  X,
} from "lucide-react";
import { CustomInput } from "@/components/global/CustomInput";
import { CustomSelect } from "@/components/global/CustomSelect";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type UserValues,
  GENDER_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  SPECIALIZATION_OPTIONS,
  PATIENT_STATUS_OPTIONS,
  STAFF_STATUS_OPTIONS,
  userSchema,
} from "./create-user-schema";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createActivityLog, createUser, triggerAdmission, updateUser } from "@/lib/api";
import { socket } from "@/lib/socket";
import { UploadButton } from "@/lib/uploadthing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";

interface UserModalProps {
  role: Role;
  user?: User;
  loading?: boolean;
}

const roleTranslations: Record<string, string> = {
  admin: "Quản trị viên",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  pharmacist: "Dược sĩ",
  lab_tech: "Kỹ thuật viên",
  patient: "Bệnh nhân",
  superadmin: "Siêu quản trị",
};

const CreateUserModal = ({ role, user, loading }: UserModalProps) => {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.image || "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const isEdit = !!user;
  const roleLabel = roleTranslations[role] || role;

  const schema = userSchema(isEdit);
  const form = useForm<UserValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      specialization: "",
      department: "",
      gender: "",
      bloodgroup: "",
      medicalHistory: "",
      status: role === "patient" ? "admitted" : "active",
      birthday: "",
      phoneNumber: "",
      address: "",
      insuranceId: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (user) {
        setAvatarUrl(user.image || "");
        form.reset({
          name: user.name,
          email: user.email,
          password: "",
          status: user.status as string,
          specialization: user.specialization || "",
          department: user.department || "",
          gender: user.gender || "",
          bloodgroup: user.bloodgroup || "",
          medicalHistory: user.medicalHistory || "",
          birthday: user.birthday || "",
          phoneNumber: user.phoneNumber || "",
          address: user.address || "",
          insuranceId: user.insuranceId || "",
        });
      } else {
        setAvatarUrl("");
        form.reset({
           name: "",
           email: "",
           password: "",
           status: role === "patient" ? "admitted" : "active",
           specialization: "",
           department: "",
           gender: "",
           bloodgroup: "",
           medicalHistory: "",
           birthday: "",
           phoneNumber: "",
           address: "",
           insuranceId: "",
         });
       }
    }
  }, [open, user, form, role]);

  const admitMutation = useMutation({
    mutationFn: triggerAdmission,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      queryClient.setQueriesData({ queryKey: ["users"] }, (old: any) => {
        if (!old || !old.res) return old;
        return {
          ...old,
          res: old.res.map((u: any) => u._id === variables.patientId ? { ...u, status: "admitted" } : u)
        };
      });
    },
    onSuccess: () => {
      toast.success("Bệnh nhân đã nhập viện thành công!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Nhập viện thất bại");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      queryClient.setQueriesData({ queryKey: ["users"] }, (old: any) => {
        if (!old || !old.res) return old;
        return {
          ...old,
          res: old.res.map((u: any) => u._id === variables.userId ? { ...u, ...variables.userData } : u)
        };
      });
    },
    onSuccess: () => {
      toast.success("Cập nhật người dùng thành công!");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Cập nhật người dùng thất bại");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const activityMutation = useMutation({
    mutationFn: createActivityLog,
    onError: (error) => {
      console.log("Activity Log Error:", error);
    },
  });

  const onSubmit = async (data: UserValues) => {
    const payload: any = {
      name: data.name,
      email: data.email,
      role: role,
      status: data.status,
    };

    if (role === "doctor") {
      payload.specialization = data.specialization;
      payload.department = data.department;
    } else if (role === "patient") {
      payload.gender = data.gender;
      payload.bloodgroup = data.bloodgroup;
      payload.medicalHistory = data.medicalHistory;
      payload.birthday = data.birthday;
      payload.phoneNumber = data.phoneNumber;
      payload.address = data.address;
      payload.insuranceId = data.insuranceId;
    } else if (["nurse", "lab_tech", "pharmacist"].includes(role)) {
      payload.department = data.department;
    }

    if (isEdit && user) {
      if (data.password) {
        payload.password = data.password;
      }
      if (avatarUrl) {
        payload.image = avatarUrl;
      }

      updateMutation.mutate({
        userId: user._id,
        userData: payload,
      });
    } else {
      setIsCreating(true);
      try {
        const result = await createUser({
          name: data.name,
          email: data.email,
          password: data.password!,
          role: role,
          image: avatarUrl || undefined,
          ...payload,
        });
        
        const createdUser = result.user;

        if (createdUser && role === "patient" && data.status === "admitted") {
          admitMutation.mutate({
            patientId: createdUser.id,
            admissionReason: data.medicalHistory || "Nhập viện tổng quát",
          });
        }
        socket.emit("notify_user_created");
        toast.success(`Đã tạo ${roleLabel} thành công!`);
        queryClient.invalidateQueries({ queryKey: ["users"] });
        activityMutation.mutate({
          userId: (session?.user as any).id,
          action: "create",
          details: `Tài khoản ${roleLabel} đã được tạo cho ${createdUser.name}`,
        });
        setOpen(false);
        form.reset();
      } catch (error: any) {
        toast.error(error.message || "Tạo người dùng thất bại");
      } finally {
        setIsCreating(false);
      }
      return;
    }
  };

  const isLoading =
    loading ||
    isCreating ||
    uploadingAvatar ||
    admitMutation.isPending ||
    updateMutation.isPending ||
    activityMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="outline" disabled={loading} size="sm">
            Sửa
          </Button>
        ) : (
          <Button className="gap-2">
            <Plus size={16} /> Thêm {roleLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl min-w-xl max-h-[98vh] overflow-y-auto card">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa" : "Thêm mới"} {roleLabel}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Cập nhật thông tin cho ${user?.name}.`
              : `Nhập thông tin để tạo tài khoản ${roleLabel} mới.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Avatar Upload Section */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-800 shadow-md">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                  {form.watch("name")?.charAt(0) || user?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <Label className="text-xs text-slate-500">Ảnh đại diện (tùy chọn)</Label>
              <UploadButton
                endpoint="imageUploader"
                onUploadBegin={() => setUploadingAvatar(true)}
                onClientUploadComplete={(res) => {
                  setUploadingAvatar(false);
                  if (res && res[0]) {
                    setAvatarUrl(res[0].ufsUrl);
                    toast.success("Tải ảnh thành công!");
                  }
                }}
                headers={async () => {
                  const session = await authClient.getSession();
                  return {
                    Authorization: `Bearer ${session.data?.session.token}`,
                  };
                }}
                onUploadError={(error: Error) => {
                  setUploadingAvatar(false);
                  toast.error(`Lỗi tải ảnh: ${error.message}`);
                }}
                appearance={{
                  button: "bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 h-auto",
                  allowedContent: "hidden",
                }}
                content={{
                  button: (
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      {uploadingAvatar ? "Đang tải..." : (avatarUrl ? "Đổi ảnh" : "Tải ảnh lên")}
                    </span>
                  ),
                }}
              />
            </div>
          </div>
          <CustomInput
            control={form.control}
            name="name"
            label="Họ tên đầy đủ"
            placeholder="Nguyễn Văn A"
            startIcon={<UserIcon size={18} />}
          />

          <CustomInput
            control={form.control}
            name="email"
            label="Địa chỉ Email"
            type="email"
            placeholder="name@hospital.com"
            startIcon={<Mail size={18} />}
          />

          <CustomInput
            control={form.control}
            name="password"
            label={isEdit ? "Mật khẩu mới (Tùy chọn)" : "Mật khẩu"}
            type="password"
            placeholder={isEdit ? "Để trống nếu không muốn đổi" : "••••••••"}
            startIcon={<Lock size={18} />}
          />

          {role === "doctor" && (
            <>
              <CustomSelect
                control={form.control}
                name="specialization"
                label="Chuyên môn"
                placeholder="Chọn chuyên môn"
                options={SPECIALIZATION_OPTIONS}
              />
              <CustomInput
                control={form.control}
                name="department"
                label="Khoa"
                placeholder="Ví dụ: Khoa Tim mạch"
                startIcon={<Building2 size={18} />}
              />
            </>
          )}
            {role === "patient" && (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <CustomSelect
                    control={form.control}
                    name="gender"
                    label="Giới tính"
                    options={GENDER_OPTIONS}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <CustomInput
                    control={form.control}
                    name="birthday"
                    label="Ngày sinh"
                    type="date"
                    startIcon={<Calendar size={18} />}
                  />
                  <CustomInput
                    control={form.control}
                    name="phoneNumber"
                    label="Số điện thoại"
                    placeholder="0912..."
                    startIcon={<Phone size={18} />}
                  />
                </div>
                <CustomInput
                  control={form.control}
                  name="address"
                  label="Địa chỉ"
                  placeholder="Số 123, Đường..."
                  startIcon={<MapPin size={18} />}
                />
                <div className="grid grid-cols-2 gap-4">
                  <CustomSelect
                    control={form.control}
                    name="bloodgroup"
                    label="Nhóm máu"
                    options={BLOOD_GROUP_OPTIONS}
                  />
                  <CustomInput
                    control={form.control}
                    name="insuranceId"
                    label="Mã BHYT"
                    placeholder="GD401..."
                    startIcon={<ShieldCheck size={18} />}
                  />
                </div>
                <CustomInput
                  control={form.control}
                  name="medicalHistory"
                  label="Tiền sử bệnh lý / Dị ứng / Lý do nhập viện"
                  placeholder="Đậu phộng, Penicillin..."
                  startIcon={<FileHeart size={18} />}
                />
              </>
            )}
          <CustomSelect
            control={form.control}
            name="status"
            label="Trạng thái"
            placeholder="Chọn trạng thái"
            options={
              role === "patient" ? PATIENT_STATUS_OPTIONS : STAFF_STATUS_OPTIONS
            }
          />
          {["nurse", "lab_tech", "pharmacist"].includes(role) && (
            <CustomInput
              control={form.control}
              name="department"
              label="Khoa"
              placeholder="Ví dụ: ICU, Xét nghiệm, Nhà thuốc"
              startIcon={<Building2 size={18} />}
            />
          )}
          <DialogFooter className="mt-6 border-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Cập nhật" : "Tạo"} tài khoản
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
