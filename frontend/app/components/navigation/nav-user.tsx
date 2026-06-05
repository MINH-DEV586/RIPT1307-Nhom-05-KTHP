"use client";
import { useNavigate } from "react-router";
import { useState } from "react";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { addProUpgradeInvoice } from "@/lib/api";
import { toast } from "sonner";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [isProDialogOpen, setIsProDialogOpen] = useState(false);

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Đăng xuất thành công");
          window.location.href = "/login";
        },
        onError: () => {
          toast.error("Có lỗi xảy ra khi đăng xuất");
        },
      },
    });
  };

  const handleProUpgrade = async () => {
    try {
      await addProUpgradeInvoice();
      setIsProDialogOpen(false);
      toast.success("Đã cập nhật số tiền nâng cấp Pro vào hóa đơn.");
      navigate("/patient/invoices");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm gói Pro.");
    }
  };


  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="relative">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {(session?.user as any)?.membership === "pro" && (
                  <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded shadow-sm border border-white dark:border-sidebar">
                    PRO
                  </div>
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium flex items-center gap-1">
                  {user.name}
                  {(session?.user as any)?.membership === "pro" && <Sparkles className="w-3 h-3 text-amber-500" />}
                </span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="relative">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {(session?.user as any)?.membership === "pro" && (
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-bold px-1 rounded shadow-sm border border-white dark:border-background">
                      PRO
                    </div>
                  )}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium flex items-center gap-1">
                    {user.name}
                    {(session?.user as any)?.membership === "pro" && <Sparkles className="w-3 h-3 text-amber-500" />}
                  </span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            {session?.user?.role === "patient" && (session?.user as any)?.membership !== "pro" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsProDialogOpen(true)}>
                    <Sparkles />
                    Nâng cấp lên Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate(`/profile/${session?.user?.id}`)}>
                <BadgeCheck />
                Tài khoản
              </DropdownMenuItem>
              {["admin", "doctor", "patient"].includes(session?.user?.role as string) && (
                <DropdownMenuItem onClick={() => navigate(session?.user?.role === "patient" ? "/patient/invoices" : "/financial-history")}>
                  <CreditCard />
                  Thanh toán
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                <Bell />
                Thông báo
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={isProDialogOpen} onOpenChange={setIsProDialogOpen}>
        <DialogContent className="sm:max-w-[425px] border-amber-200 dark:border-amber-900 bg-linear-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-background overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-amber-500" />
          </div>
          <DialogHeader className="pt-4">
            <div className="mx-auto w-12 h-12 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mb-4 ring-8 ring-amber-50 dark:ring-amber-950">
              <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center text-xl font-bold">Nâng cấp <span className="text-amber-600 dark:text-amber-400">Pro</span></DialogTitle>
            <DialogDescription className="text-center pt-2">
              Bạn có chắc chắn muốn nâng cấp tài khoản lên gói Pro để mở khóa các tính năng cao cấp không? 
              <br/><br/>
              Hệ thống sẽ cập nhật số tiền nâng cấp <strong className="text-amber-600 dark:text-amber-400">(500,000 VNĐ)</strong> vào phần thanh toán hóa đơn của bạn. Sau khi thanh toán thành công, tài khoản sẽ tự động được nâng cấp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setIsProDialogOpen(false)} className="w-full sm:w-auto">
              Hủy
            </Button>
            <Button onClick={handleProUpgrade} className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md shadow-amber-500/20 transition-all">
              Đồng ý nâng cấp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  );
}
