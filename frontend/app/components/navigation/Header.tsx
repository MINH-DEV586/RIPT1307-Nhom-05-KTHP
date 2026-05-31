import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Link, useLocation } from "react-router";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import Notifications from "./Notifications";
import type { Role } from "@/types";

const roleTranslations: Record<Role, string> = {
  admin: "Quản trị viên",
  doctor: "Bác sĩ",
  nurse: "Điều dưỡng",
  pharmacist: "Dược sĩ",
  lab_tech: "Kỹ thuật viên",
  patient: "Bệnh nhân",
  superadmin: "Siêu quản trị",
};

const Header = () => {
  const { pathname } = useLocation();
  const { data: session } = authClient.useSession();

  const getPageTitle = () => {
    if (pathname.split("/").includes("profile")) return "Hồ sơ";
    if (pathname === "/bed-management") return "Quản lý giường bệnh";
    if (pathname === "/appointments") return "Lịch hẹn & Tư vấn";
    if (pathname === "/reports") return "Báo cáo & Phân tích";
    const lastPart = pathname.split("/").pop();
    switch (lastPart) {
      case "dashboard":
        return "Bảng điều khiển";
      case "activities-log":
        return "Nhật ký hoạt động";
      case "admins":
        return "Quản trị viên";
      case "patients":
        return "Bệnh nhân";
      case "nurses":
        return "Điều dưỡng";
      case "doctors":
        return "Bác sĩ";
      case "dispense":
        return "Phát thuốc";
      case "inventory":
        return "Kho dược";
      case "prescriptions":
        return "Đơn thuốc";
      case "requests":
        return "Yêu cầu xét nghiệm";
      case "results":
        return "Kết quả xét nghiệm";
      case "test-results":
        return "Kết quả xét nghiệm";
      case "medical-records":
        return "Lịch sử khám chữa bệnh";
      case "invoices":
        return "Hóa đơn thanh toán";
      case "financial-history":
        return "Lịch sử tài chính";
      case "sessions":
        return "Phiên khám từ xa";
      case "book":
        return "Đặt lịch khám";
      case "chat":
        return "Phòng khám trực tuyến";
      case "general":
        return "Cài đặt chung";
      case "roles":
        return "Vai trò & Quyền";
      case "billing":
        return "Thanh toán";
      case "lab-technicians":
        return "Kỹ thuật viên";
      case "pharmacists":
        return "Dược sĩ";
      case "appointments":
        return "Lịch hẹn & Tư vấn";
      default:
        return lastPart;
    }
  };


  return (
    <header className="flex h-16 items-center gap-2 border-b w-full px-3">
      <SidebarTrigger className="size-9" />
      <Separator orientation="vertical" />
      <div className="flex justify-between w-full">
        <div className="flex flex-col space-y-0.5">
          <h1 className="capitalize font-bold text-lg">{getPageTitle()}</h1>
          <p className="text-sm text-muted-foreground">
            Chào mừng trở lại, {session?.user.role === "doctor" ? "Bác sĩ " : ""}
            {session?.user.name}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Separator orientation="vertical" />
          <ThemeToggle />
          <Separator orientation="vertical" />
          {session?.user && <Notifications user={session?.user} />}
          <Separator orientation="vertical" />
          <Link
            to={`/profile/${session?.user.id}`}
            className={
              buttonVariants({
                variant: "ghost",
              }) + " flex items-center gap-2 rounded-lg px-2 py-6"
            }
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={session?.user.image || ""}
                alt={session?.user.name}
              />
              <AvatarFallback className="rounded-lg text-primary">
                {session?.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-bold">{session?.user.name}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {roleTranslations[session?.user.role as Role] ||
                  session?.user.role}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
