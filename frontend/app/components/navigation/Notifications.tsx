import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, UserPlus, Activity, AlertCircle, FileText, CalendarPlus, CalendarX, CheckCircle, FileCheck, MessageSquare, Pill, TestTubes } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchNotifications, markAsRead } from "@/lib/api";
import type { User } from "better-auth";
import type { Notification } from "@/types";

export default function Notifications({ user }: { user: User }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: fetchNotifications,
    refetchInterval: 5 * 60 * 1000,
  });

  const notifications: Notification[] = data?.notifications || [];
  const unreadCount: number = data?.unreadCount || 0;

  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      refetch();
    },
  });

  const getIcon = (type: string, title?: string) => {
    const lowerTitle = title?.toLowerCase() || "";
    
    if (lowerTitle.includes("hủy") || lowerTitle.includes("từ chối")) {
      return <CalendarX className="h-4 w-4 text-red-500" />;
    }
    if (lowerTitle.includes("đặt lịch")) {
      return <CalendarPlus className="h-4 w-4 text-blue-500" />;
    }
    if (lowerTitle.includes("xác nhận")) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (lowerTitle.includes("tin nhắn")) {
      return <MessageSquare className="h-4 w-4 text-sky-500" />;
    }
    if (lowerTitle.includes("đơn thuốc")) {
      return <Pill className="h-4 w-4 text-teal-500" />;
    }
    if (lowerTitle.includes("xét nghiệm")) {
      return <TestTubes className="h-4 w-4 text-purple-500" />;
    }
    if (lowerTitle.includes("kết quả")) {
      return <FileCheck className="h-4 w-4 text-emerald-500" />;
    }

    switch (type) {
      case "assignment":
        return <UserPlus className="h-4 w-4 text-indigo-500" />;
      case "lab_result":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "alert":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-[1.2rem] text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <p className="absolute top-0.5 right-0 size-4 bg-primary rounded-full">
              <span className="text-[12px] absolute top-2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-bold">
                {unreadCount}
              </span>
            </p>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0 shadow-xl rounded-xl"
      >
        <DropdownMenuLabel className="p-4 pb-2 flex justify-between items-center">
          <span className="font-bold">Thông báo</span>
          {unreadCount > 0 && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {unreadCount} mới
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-slate-500">
              Đang tải...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center">
              <Bell className="h-8 w-8 text-slate-200 mb-2" />
              Bạn đã xem hết tất cả thông báo!
            </div>
          ) : (
            <DropdownMenuGroup>
              {notifications.map((notif) => (
                <DropdownMenuItem
                  key={notif._id}
                  className={cn(
                    "p-4 border-b last:border-0 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 transition-colors",
                    !notif.isRead
                      ? "bg-indigo-50/30 dark:bg-indigo-950/20"
                      : "",
                  )}
                  onClick={() => {
                    if (!notif.isRead) readMutation.mutate(notif._id);
                  }}
                  asChild
                >
                  <Link
                    to={notif.link || "/appointments"}
                    className="flex items-start gap-3 w-full"
                  >
                    <div className="mt-1 bg-white dark:bg-slate-800 p-2 rounded-full border shadow-sm shrink-0">
                      {getIcon(notif.type, notif.title)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          !notif.isRead
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300",
                        )}
                      >
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        {new Date(notif.createdAt).toLocaleDateString("vi-VN")} •{" "}
                        {new Date(notif.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="h-2 w-2 bg-indigo-600 rounded-full mt-2 shrink-0" />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full text-xs text-indigo-600 hover:text-indigo-700 h-8"
                onClick={() => {
                  notifications.forEach((notif) => {
                    if (!notif.isRead) readMutation.mutate(notif._id);
                  });
                }}
                disabled={unreadCount === 0 || readMutation.isPending}
              >
                Đánh dấu tất cả là đã đọc
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
