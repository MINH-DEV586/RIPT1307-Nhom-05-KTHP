import CreateUserModal from "@/components/users/CreateUserModal";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { CalendarDays, BarChart3, BedDouble } from "lucide-react";

const QuickActions = ({ role }: { role: Role | null | undefined }) => {
  if (role === "patient") return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {["doctor", "nurse", "admin"].includes(role || "") && (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/appointments">
            <CalendarDays className="w-4 h-4" /> Lịch hẹn
          </Link>
        </Button>
      )}
      {["admin", "doctor", "nurse"].includes(role || "") && (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/bed-management">
            <BedDouble className="w-4 h-4" /> Giường bệnh
          </Link>
        </Button>
      )}
      {role === "admin" && (
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link to="/reports">
            <BarChart3 className="w-4 h-4" /> Báo cáo
          </Link>
        </Button>
      )}
      {role === "admin" && <CreateUserModal role="doctor" />}
      {["doctor", "nurse", "admin"].includes(role || "") && (
        <CreateUserModal role="patient" />
      )}
    </div>
  );
};

export default QuickActions;
