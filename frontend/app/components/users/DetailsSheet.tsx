import {
  CheckCircle2,
  Clock,
  Activity,
  Home,
  User,
  Building2,
  Stethoscope,
  ShieldCheck,
  FlaskConical,
  Pill,
  Zap,
  ExternalLink,
} from "lucide-react";
import type { User as UserType, Role } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { STATUS_CONFIG } from "./statusBadge";
import { useNavigate } from "react-router";
import { toast } from "sonner";

interface DetailsSheetProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

const roleTranslations: Record<Role, string> = {
  admin: "Quản trị viên",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  pharmacist: "Dược sĩ",
  lab_tech: "Kỹ thuật viên",
  patient: "Bệnh nhân",
  superadmin: "Siêu quản trị",
};

const genderTranslations: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
  Male: "Nam",
  Female: "Nữ",
  Other: "Khác",
};

export function DetailsSheet({ user, isOpen, onClose }: DetailsSheetProps) {
  const navigate = useNavigate();
  if (!user) return null;

  const statusConf = STATUS_CONFIG[user.status!] || STATUS_CONFIG["active"];
  const RoleIcon = getRoleIcon(user.role as Role);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md overflow-y-auto card">
        <SheetHeader className="space-y-4">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-4 border-2 border-slate-100 shadow-sm">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-blue-50 text-blue-600">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <SheetTitle className="text-xl font-black">{user.name}</SheetTitle>
            <SheetDescription className="font-medium">
              {user.email}
            </SheetDescription>

            <div className="flex gap-2 mt-4">
              <Badge variant="secondary" className="flex items-center gap-1.5 py-1">
                <RoleIcon size={12} /> {roleTranslations[user.role as Role] || user.role}
              </Badge>
              <Badge variant="outline" className={`gap-1.5 py-1 ${statusConf.color}`}>
                {statusConf.icon && <statusConf.icon size={12} />}
                {statusConf.label}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <div className="space-y-6 pb-8">
          {/* Section: Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="ID Người dùng" value={user._id.slice(-8).toUpperCase()} />
            <InfoItem label="Ngày tham gia" value={new Date(user.createdAt).toLocaleDateString("vi-VN")} />
            <InfoItem label="Giới tính" value={genderTranslations[user.gender!] || user.gender || "Chưa rõ"} />
            <InfoItem label="Tuổi" value={user.age || "N/A"} />
          </div>

          <Separator />

          {/* Section: Role Specifics */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {user.role === "patient" ? "Thông tin y tế" : "Thông tin công tác"}
            </h4>

            {user.role === "patient" ? (
              <div className="grid grid-cols-1 gap-4">
                <InfoItem label="Nhóm máu" value={user.bloodgroup || "Không rõ"} isBadge={!!user.bloodgroup} />
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/20 dark:to-background rounded-2xl border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Zap size={18} className="text-amber-600 fill-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest">Hạng thành viên</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user.membership === 'pro' ? 'Hội viên PRO' : 'Hội viên Thường'}</p>
                    </div>
                  </div>
                  {user.membership !== 'pro' && (
                    <Button 
                      size="sm" 
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-8 text-[10px] font-black"
                      onClick={async () => {
                        const { updateUser } = await import("@/lib/api");
                        try {
                          await updateUser({ userId: user._id, userData: { membership: 'pro' } });
                          toast.success(`Đã nâng cấp ${user.name} lên hạng PRO!`);
                          onClose();
                          // Mutation invalidation will happen via socket or parent refetch
                        } catch (e) {
                          toast.error("Nâng cấp thất bại");
                        }
                      }}
                    >
                      NÂNG CẤP
                    </Button>
                  )}
                </div>
                <InfoItem label="Tiền sử bệnh lý" value={user.medicalHistory || "Không có hồ sơ trước đó."} />
                {user.triageReasoning && (
                  <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Phân loại AI</span>
                    <p className="text-xs italic text-blue-900 dark:text-blue-300 mt-1 leading-relaxed">
                      {user.triageReasoning}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <InfoItem label="Khoa" value={user.department || "Chưa phân khoa"} icon={Building2} />
                {user.role === "doctor" && (
                  <InfoItem label="Chuyên môn" value={user.specialization || "Đa khoa"} icon={Stethoscope} />
                )}
              </div>
            )}
          </div>
          <Separator />
          <Button 
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 mt-4" 
            onClick={() => {
              navigate(`/profile/${user._id}`);
              onClose();
            }}
          >
            <ExternalLink size={16} /> Xem hồ sơ chi tiết & Bệnh án
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function InfoItem({ label, value, isBadge, icon: Icon }: { label: string; value: string; isBadge?: boolean; icon?: any }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400" />}
        {isBadge ? (
          <Badge variant="outline" className="text-red-500 bg-red-50 border-red-100">
            {value}
          </Badge>
        ) : (
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function getRoleIcon(role: Role) {
  switch (role) {
    case "admin": return ShieldCheck;
    case "doctor": return Stethoscope;
    case "nurse": return Activity;
    case "pharmacist": return Pill;
    case "lab_tech": return FlaskConical;
    default: return User;
  }
}
