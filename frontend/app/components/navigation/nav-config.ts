import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  ClipboardPlus,
  Stethoscope,
  Pill,
  FlaskConical,
  Settings2,
  LifeBuoy,
  Send,
  ReceiptCent,
  CalendarDays,
  BedDouble,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: any;
  allowedRoles: Role[];
  items?: {
    title: string;
    url: string;
    allowedRoles?: Role[];
  }[];
}

export const navConfig: {
  navMain: NavItem[];
  navAdmin: NavItem[];
  navSecondary: NavItem[];
} = {
  navMain: [
    {
      title: "Bảng điều khiển",
      url: "/dashboard",
      icon: LayoutDashboard,
      allowedRoles: ["admin", "doctor", "nurse", "pharmacist", "lab_tech"],
      items: [
        { title: "Tổng quan", url: "/dashboard" },
        { title: "Nhật ký hoạt động", url: "/activities-log", allowedRoles: ["admin"] },
      ],
    },
    {
      title: "Quản trị viên",
      url: "/admins",
      icon: Users,
      allowedRoles: ["admin"],
      items: [{ title: "Tất cả quản trị viên", url: "/admins" }],
    },
    {
      title: "Bệnh nhân",
      url: "/patients",
      icon: Users,
      allowedRoles: ["admin", "doctor", "nurse"],
      items: [
        { title: "Tất cả bệnh nhân", url: "/patients" },
        { title: "Quản lý giường bệnh", url: "/bed-management" },
      ],
    },
    {
      title: "Lịch hẹn",
      url: "/appointments",
      icon: CalendarDays,
      allowedRoles: ["admin", "doctor", "nurse", "patient"],
      items: [
        { title: "Lịch hẹn tổng quan", url: "/appointments" },
        { title: "Đặt lịch mới", url: "/appointments/book", allowedRoles: ["patient"] },
        { title: "Tất cả lịch bác sĩ", url: "/appointments/all-schedules", allowedRoles: ["admin"] },
        { title: "Cài đặt lịch làm việc", url: "/appointments/schedule-setup", allowedRoles: ["doctor"] },
        { title: "Tư vấn trực tuyến", url: "/telemedicine" },
      ],
    },
    {
      title: "Trạm điều dưỡng",
      url: "/nursing",
      icon: ClipboardPlus,
      allowedRoles: ["admin"],
      items: [{ title: "Điều dưỡng", url: "/nurses" }],
    },
    {
      title: "Bác sĩ",
      url: "/doctors",
      icon: Stethoscope,
      allowedRoles: ["admin", "doctor"],
      items: [{ title: "Bác sĩ", url: "/doctors" }],
    },
    {
      title: "Nhà thuốc",
      url: "/pharmacy",
      icon: Pill,
      allowedRoles: ["admin", "pharmacist", "doctor"],
      items: [
        { title: "Phát thuốc", url: "/pharmacy/dispense" },
        { title: "Kho dược", url: "/pharmacy/inventory" },
        { title: "Đơn thuốc", url: "/pharmacy/prescriptions" },
      ],
    },
    {
      title: "Phòng xét nghiệm",
      url: "/lab",
      icon: FlaskConical,
      allowedRoles: ["admin", "lab_tech", "doctor"],
      items: [
        { title: "Yêu cầu xét nghiệm", url: "/lab/requests" },
        { title: "Nhập kết quả", url: "/lab/results" },
      ],
    },
    {
      title: "Tài chính & Báo cáo",
      url: "/records",
      icon: ReceiptCent,
      allowedRoles: ["admin", "doctor"],
      items: [
        { title: "Lịch sử hóa đơn", url: "/financial-history" },
        { title: "Báo cáo & Phân tích", url: "/reports" },
      ],
    },
    {
      title: "Hồ sơ sức khỏe",
      url: "/patient/medical-records",
      icon: ClipboardPlus,
      allowedRoles: ["patient"],
      items: [
        { title: "Lịch sử khám chữa bệnh", url: "/patient/medical-records" },
        { title: "Đơn thuốc điện tử", url: "/patient/prescriptions" },
        { title: "Kết quả xét nghiệm", url: "/patient/test-results" },
        { title: "Thanh toán viện phí", url: "/patient/invoices" },
      ],
    },

  ],
  navAdmin: [
    {
      title: "Cài đặt",
      url: "/settings",
      icon: Settings2,
      allowedRoles: ["admin"],
      items: [
        { title: "Chung", url: "/settings/general" },
        { title: "Vai trò & Quyền", url: "/settings/roles" },
        { title: "Thanh toán", url: "/settings/billing" },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Hỗ trợ",
      url: "/support",
      icon: LifeBuoy,
      allowedRoles: ["admin", "doctor", "nurse", "pharmacist", "lab_tech"],
    },
    {
      title: "Phản hồi",
      url: "/feedback",
      icon: Send,
      allowedRoles: ["admin", "doctor", "nurse", "pharmacist", "lab_tech"],
    },
  ],
};

export function getRouteConfig(path: string, items: NavItem[]): NavItem | null {
  for (const item of items) {
    if (item.url === path) return item;
    if (item.items) {
      const found = item.items.find((sub) => sub.url === path);
      if (found)
        return {
          ...found,
          allowedRoles: found.allowedRoles || item.allowedRoles,
        } as NavItem;
    }
  }
  return null;
}
