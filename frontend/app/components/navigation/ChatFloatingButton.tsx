import { useState, useEffect } from "react";
import { Link } from "react-router";
import { socket } from "@/lib/socket";
import { MessageSquare, X, Video, ExternalLink, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "../ui/popover";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function ChatFloatingButton() {
  const { data: session } = authClient.useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    if (session?.user) {
      socket.connect();
      
      socket.on("connect", () => {
        socket.emit("identify", session.user.id);
      });
      
      socket.on("new_chat_notification", (data) => {
        setUnreadCount(prev => prev + 1);
        setLastNotification(data);
        // Tự động đóng notification sau 5 giây
        setTimeout(() => setLastNotification(null), 5000);
      });

      return () => {
        socket.off("new_chat_notification");
      };
    }
  }, [session]);

  if (!session?.user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Toast-like notification when message arrives */}
      {lastNotification && (
        <div className="animate-fade-up bg-card border shadow-2xl rounded-2xl p-4 max-w-xs w-64 flex flex-col gap-2 glass">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Tin nhắn mới</span>
            <button onClick={() => setLastNotification(null)}>
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm font-bold truncate">Bạn có một tin nhắn tư vấn mới</p>
          <p className="text-xs text-muted-foreground line-clamp-2 italic">"{lastNotification.content}"</p>
          <Button asChild size="sm" className="w-full mt-1 bg-blue-700 hover:bg-blue-800 h-8 text-xs">
            <Link to={`/telemedicine/c/${lastNotification.sessionId}`} onClick={() => setLastNotification(null)}>
              Trả lời ngay
            </Link>
          </Button>
        </div>
      )}

      {/* Main Floating Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              size="icon"
              className={cn(
                "h-14 w-14 rounded-full shadow-xl shadow-blue-700/30 transition-all hover:scale-110 active:scale-95 group border-none",
                isOpen ? "bg-slate-700 rotate-90" : "bg-blue-700 hover:bg-blue-800"
              )}
              onClick={() => {
                setUnreadCount(0);
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <MessageSquare className="w-6 h-6 text-white group-hover:animate-pulse" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white border-2 border-background animate-bounce p-0 text-[10px] font-bold"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-0 rounded-2xl overflow-hidden border-none shadow-2xl glass">
          <div className="bg-blue-700 p-4 text-white">
            <h3 className="font-black text-lg flex items-center gap-2">
               <MessageCircle className="w-5 h-5" /> MedFlow Messenger
            </h3>
            <p className="text-[10px] text-blue-100 opacity-80 uppercase font-bold tracking-wider mt-1">
               Tư vấn trực tuyến 24/7
            </p>
          </div>
          <div className="p-4 space-y-3">
             <div className="bg-muted/50 p-3 rounded-xl border border-dashed border-border/60">
                <p className="text-xs text-muted-foreground leading-relaxed">
                   Chào <strong>{session.user.name}</strong>, bạn có thể xem lại các phiên tư vấn hoặc bắt đầu đặt lịch mới ngay tại đây.
                </p>
             </div>
             <div className="grid grid-cols-1 gap-2">
                 <Button asChild variant="outline" className="justify-start gap-2 h-11 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
                   <Link to="/telemedicine" onClick={() => setIsOpen(false)}>
                     <MessageSquare className="w-4 h-4" /> Mở Messenger
                   </Link>
                 </Button>
             </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 text-center">
             <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                Đã được mã hóa đầu cuối
             </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
