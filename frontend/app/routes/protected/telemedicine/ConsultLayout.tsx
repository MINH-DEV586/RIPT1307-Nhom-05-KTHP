import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router";
import { Search, MessageCircle, Plus, Users, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTelemedicineSessions } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";

export default function TelemedicineLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const currentUser = session?.user;
  const isPatient = currentUser?.role === "patient";

  const [sessions, setSessions] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSessions();
    socket.connect();
    
    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users);
    const handleReceiveMessage = () => fetchSessions(); // Refresh sidebar on new message

    socket.on("online_users", handleOnlineUsers);
    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("online_users", handleOnlineUsers);
      socket.off("receive_message", handleReceiveMessage);
      socket.disconnect();
    };
  }, []);

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

  const filteredSessions = sessions.filter(s => 
    s.otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-3xl border bg-card/30 backdrop-blur-md shadow-2xl animate-page-in">
      {/* Sidebar - Messenger Style */}
      <div className="w-80 md:w-96 border-r flex flex-col bg-background/40 backdrop-blur-xl">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">MedChat</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tư vấn trực tuyến</p>
            </div>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => navigate("/dashboard")}
              className="rounded-full hover:bg-indigo-50 text-indigo-600"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-indigo-500" />
            <Input 
              placeholder="Tìm người hội thoại..." 
              className="pl-10 h-11 bg-muted/50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
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
                      "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-300 group relative",
                      isActive 
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1" 
                        : "hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-12 w-12 border-2 border-background/20 shadow-sm transition-transform group-hover:scale-105">
                        <AvatarImage src={other?.image} />
                        <AvatarFallback className={cn("font-bold text-lg", isActive ? "bg-white/20" : "bg-indigo-100 text-indigo-700")}>
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
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        {isPatient && (
          <div className="p-5 border-t bg-background/20">
            <Button 
              className="w-full rounded-2xl gap-2 font-black h-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-95" 
              onClick={() => navigate("/telemedicine")}
            >
              <Plus className="w-5 h-5" /> TƯ VẤN MỚI
            </Button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-card/5 relative">
        <Outlet />
      </div>
    </div>
  );
}
