import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Search, MessageCircle, Plus, Users, LayoutDashboard, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTelemedicineSessions, deleteTelemedicineSession } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { socket } from "@/lib/socket";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

export default function TelemedicineLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;
  const isPatient = currentUser?.role === "patient";

  const [sessions, setSessions] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      socket.connect();
      socket.emit("identify", currentUser.id);
      
      // Re-identify on reconnect
      socket.on("connect", () => {
        socket.emit("identify", currentUser.id);
      });

      fetchSessions();
    }
    
    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users);
    const handleRefresh = () => fetchSessions(); 
    const handleSessionDeleted = (deletedId: string) => {
      fetchSessions();
      if (pathname.includes(deletedId)) {
        toast.info("Cuộc hội thoại này đã bị xóa bởi người dùng khác.");
        navigate("/telemedicine");
      }
    };

    socket.on("online_users", handleOnlineUsers);
    socket.on("receive_message", handleRefresh);
    socket.on("new_chat_notification", handleRefresh);
    socket.on("session_deleted", handleSessionDeleted);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("receive_message", handleRefresh);
      socket.off("new_chat_notification", handleRefresh);
      socket.off("session_deleted", handleSessionDeleted);
      socket.disconnect();
    };
  }, [currentUser?.id]);

  const fetchSessions = async () => {
    try {
      const data = await getTelemedicineSessions();
      // Sort by last update
      const sorted = data.sort((a: any, b: any) => 
        new Date(b.updatedAt || b.startTime).getTime() - new Date(a.updatedAt || a.startTime).getTime()
      );
      setSessions(sorted);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      setIsDeleting(true);
      await deleteTelemedicineSession(sessionToDelete);
      toast.success("Đã xóa cuộc hội thoại thành công");
      fetchSessions();
      if (pathname.includes(sessionToDelete)) {
        navigate("/telemedicine");
      }
      setSessionToDelete(null);
    } catch (error) {
      toast.error("Lỗi khi xóa cuộc hội thoại");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-xl border bg-card/30 backdrop-blur-md shadow-md animate-page-in">
      {/* Sidebar - Messenger Style */}
      <div className="w-80 md:w-96 border-r flex flex-col min-h-0 bg-background/40 backdrop-blur-xl">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-blue-600 dark:text-blue-400">MedChat</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tư vấn trực tuyến</p>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="rounded-lg hover:bg-blue-50 text-blue-600"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
            <Input 
              placeholder="Tìm người hội thoại..." 
              className="pl-10 h-10 bg-muted/50 border-none rounded-lg focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-3">
          <div className="space-y-1 pb-6">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Gần đây</span>
              <Users className="w-3 h-3 text-muted-foreground/40" />
            </div>
            
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
                <MessageCircle className="w-10 h-10" />
                <p className="text-xs font-bold italic max-w-[150px]">Chưa có cuộc hội thoại nào diễn ra.</p>
              </div>
            ) : (
              filteredSessions.map((s) => {
                const isActive = pathname.includes(s._id);
                const other = s.otherUser;
                const isOnline = onlineUsers.includes(other?._id);
                
                return (
                  <div 
                    key={s._id}
                    onClick={() => navigate(`/telemedicine/sessions/${s._id}/chat`)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 group relative",
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                        : "hover:bg-blue-50 dark:hover:bg-blue-950/30"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-background/20 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={other?.image} />
                        <AvatarFallback className={cn("font-bold text-lg", isActive ? "bg-white/20" : "bg-blue-100 text-blue-700")}>
                          {other?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className="text-sm font-black truncate tracking-tight">{other?.name || "Người dùng"}</h4>
                        <span className={cn("text-[9px] font-bold opacity-60", isActive ? "text-white" : "text-muted-foreground")}>
                          {new Date(s.updatedAt || s.startTime).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={cn("text-[11px] truncate leading-tight", isActive ? "text-white/80" : "text-muted-foreground font-medium")}>
                        {s.lastMessage || "Nhấn để bắt đầu trao đổi..."}
                      </p>
                    </div>

                    {!s.isAppointment && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(s._id);
                        }}
                        className={cn(
                          "opacity-0 group-hover:opacity-100 p-2 rounded-full transition-all hover:bg-red-500/20 text-red-500",
                          isActive && "group-hover:text-white group-hover:hover:bg-white/20"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {isPatient && (
          <div className="p-4 border-t bg-background/20">
            <Button 
              className="w-full rounded-lg gap-2 font-semibold h-10 bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95" 
              onClick={() => navigate("/telemedicine")}
            >
              <Plus className="w-4 h-4" /> Tư vấn mới
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-card/5 relative">
        <Outlet />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <DialogContent className="sm:max-w-md border-none shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <DialogHeader className="p-2">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Xóa cuộc hội thoại?</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
                  Hành động này sẽ xóa vĩnh viễn toàn bộ lịch sử tin nhắn. Bạn không thể hoàn tác thao tác này.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 p-4 gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setSessionToDelete(null)}
              className="rounded-lg font-medium h-10"
              disabled={isDeleting}
            >
              Hủy bỏ
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSession}
              disabled={isDeleting}
              className="rounded-lg font-semibold h-10 px-6 shadow-sm bg-red-500 hover:bg-red-600 border-none transition-all active:scale-95"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
