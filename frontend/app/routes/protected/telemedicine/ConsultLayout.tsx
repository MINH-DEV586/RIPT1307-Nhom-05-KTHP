import { Outlet, useLocation, Link } from "react-router";
import { Video, Calendar, MessageSquare, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TelemedicineLayout() {
  const { pathname } = useLocation();

  const isChat = pathname.includes("/chat");

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      {!isChat && (
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
               <Video className="w-8 h-8 text-indigo-600" />
               Tư vấn từ xa
            </h1>
            <p className="text-muted-foreground mt-1">
              Khám bệnh trực tuyến với đội ngũ chuyên gia MedFlow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link 
              to="/telemedicine/sessions" 
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                pathname === "/telemedicine/sessions" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              <Calendar className="w-4 h-4" /> Danh sách phiên
            </Link>
            <Link 
              to="/telemedicine/sessions/book" 
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                pathname === "/telemedicine/sessions/book" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              )}
            >
              <Plus className="w-4 h-4" /> Đặt lịch mới
            </Link>
          </div>
        </div>
      )}

      <div className={cn("flex-1", isChat ? "" : "bg-card/30 rounded-2xl border border-dashed border-border/60 p-4")}>
         <Outlet />
      </div>
    </div>
  );
}
