import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import type { Role } from "@/types";
import Loader from "@/components/global/Loader";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { useEffect } from "react";
import { toast } from "sonner";
import { getRouteConfig, navConfig } from "@/components/navigation/nav-config";
import Header from "@/components/navigation/Header";
import ChatFloatingButton from "@/components/navigation/ChatFloatingButton";
import { socket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";

const Layout = () => {
  const { data: session, isPending } = authClient.useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = (session?.user?.role as Role) || "patient";

  useEffect(() => {
    if (session?.user) {
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit("identify", session.user.id);
      socket.on(`new_notification_${session.user.id}`, () => {
        queryClient.invalidateQueries({ queryKey: ["appointments"], exact: false });
        queryClient.invalidateQueries({ queryKey: ["appointments", session.user.role, session.user.id], exact: true });
        queryClient.invalidateQueries({ queryKey: ["notifications", session.user.id] });
        queryClient.refetchQueries({ queryKey: ["appointments"], exact: false });
        queryClient.refetchQueries({ queryKey: ["appointments", session.user.role, session.user.id], exact: true });
      });
      socket.on("notification_received", () => {
        queryClient.invalidateQueries({ queryKey: ["notifications", session.user?.id] });
      });
    }

    return () => {
      if (session?.user) {
        socket.off(`new_notification_${session.user.id}`);
        socket.off("notification_received");
      }
    };
  }, [queryClient, session?.user]);

  useEffect(() => {
    if (isPending) return;

    // These routes are accessible to all authenticated users
    const openRoutes = ["/profile", "/appointments", "/bed-management", "/reports"];
    const isOpenRoute = openRoutes.some((r) => pathname.startsWith(r));
    if (isOpenRoute) return;

    const allNavItems = [...navConfig.navMain];
    const currentRouteConfig = getRouteConfig(pathname, allNavItems);

    if (currentRouteConfig) {
      const hasAccess = currentRouteConfig.allowedRoles.includes(userRole);

      if (!hasAccess) {
        toast.error("Truy cập không được phép");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [pathname, userRole, isPending, navigate]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader label="Đang khởi tạo Medflow..." />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-card/50">
        <Header />
        <main className="px-4 my-4">
          <Outlet key={pathname} />
        </main>
        <ChatFloatingButton />
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
