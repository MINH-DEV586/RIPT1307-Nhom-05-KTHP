import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { socket } from "@/lib/socket";
import { getChatHistory, getTelemedicineSessions } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Clock,
  MoreVertical,
  Loader2,
  AlertCircle,
  Phone,
  Video,
  ShieldCheck,
  CheckCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function EmbeddedChat() {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = session?.user;

  useEffect(() => {
    if (sessionId && currentUser) {
      initChat();
    }
    return () => {
      socket.off("receive_message");
      socket.off("online_users");
    };
  }, [sessionId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    try {
      setLoading(true);
      const allSessions = await getTelemedicineSessions();
      const current = allSessions.find((s: any) => s._id === sessionId || String(s._id) === sessionId);
      
      if (!current) {
        toast.error("Không tìm thấy phiên khám.");
        navigate("/telemedicine");
        return;
      }
      setConsultation(current);

      const history = await getChatHistory(sessionId!);
      
      // Tự động thêm tin nhắn chào mừng nếu là cuộc hội thoại mới và là bệnh nhân
      if (history.length === 0 && currentUser?.role === "patient") {
        const welcomeMsg = {
          _id: "welcome-system",
          senderId: current.doctorId,
          content: `Chào bạn, tôi là bác sĩ ${current.otherUser?.name}. Tôi đã nhận được yêu cầu tư vấn của bạn. Vui lòng mô tả triệu chứng hoặc gửi câu hỏi, tôi sẽ phản hồi bạn sớm nhất có thể!`,
          createdAt: new Date().toISOString(),
          isSystem: true
        };
        setMessages([welcomeMsg]);
      } else {
        setMessages(history);
      }

      socket.on("receive_message", (msg) => {
        if (msg.sessionId === sessionId) {
          setMessages((prev) => {
            if (prev.find((m) => m._id === msg._id)) return prev;
            return [...prev, msg];
          });
        }
      });

      socket.on("online_users", (users) => setOnlineUsers(users));
      socket.emit("join_session", sessionId);
      
    } catch (error) {
      toast.error("Lỗi khi kết nối Messenger");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !consultation) return;

    const receiverId = currentUser.role === "doctor" ? consultation.patientId : consultation.doctorId;

    const messageData = {
      sessionId,
      senderId: currentUser.id,
      receiverId,
      content: inputText.trim(),
    };

    socket.emit("send_message", messageData);
    setInputText("");
  };

  const isOtherUserOnline = consultation
    ? onlineUsers.includes(currentUser?.role === "doctor" ? consultation.patientId : consultation.doctorId)
    : false;

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-indigo-500 opacity-50" /></div>;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background/20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-background/60 backdrop-blur-md border-b">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-background shadow-md">
              <AvatarImage src={consultation?.otherUser?.image} />
              <AvatarFallback className="bg-indigo-600 text-white font-black text-lg">
                {consultation?.otherUser?.name?.[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOtherUserOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full pulse-dot shadow-sm" />
            )}
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight tracking-tight">
              {consultation?.otherUser?.name}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
               <span className={cn("text-[10px] font-black uppercase tracking-widest", isOtherUserOnline ? "text-emerald-500" : "text-muted-foreground")}>
                {isOtherUserOnline ? "Đang trực tuyến" : "Ngoại tuyến"}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{consultation?.otherUser?.specialization || "Thành viên"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground"><MoreVertical className="w-5 h-5" /></Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 p-8">
        <div className="space-y-8 pb-4">
          <div className="flex flex-col items-center justify-center text-center py-10 opacity-40">
            <div className="p-4 bg-indigo-50 rounded-xl mb-4 border border-indigo-100 shadow-sm">
               <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Kênh tư vấn bảo mật MedChat</p>
            <p className="text-[10px] mt-2 max-w-[300px] leading-relaxed font-medium">
              Cuộc trò chuyện này được mã hóa đầu cuối. Mọi thông tin y tế trao đổi tại đây sẽ được lưu trữ trong hồ sơ bệnh án điện tử của bạn.
            </p>
            {consultation?.isAppointment && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col items-center gap-2 max-w-[400px]">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[11px] font-semibold">Thông tin lịch hẹn</span>
                </div>
                <p className="text-[10px] text-amber-600 font-medium">
                  Đây là phòng chat đi kèm với lịch hẹn khám đã xác nhận. Bạn không thể xóa cuộc hội thoại này trừ khi lịch hẹn bị hủy hoặc hoàn thành.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-[11px] font-semibold text-amber-700 h-auto p-0 underline decoration-amber-300"
                  onClick={() => navigate("/appointments")}
                >
                  Quản lý lịch hẹn tại đây
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg._id || index}
                  className={cn("flex flex-col group animate-fade-up", isMe ? "items-end" : "items-start")}
                  style={{ animationDelay: `${index * 5}ms` }}
                >
                  <div className={cn(
                    "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all duration-300 relative",
                    isMe 
                      ? "bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-700" 
                      : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none hover:border-indigo-200"
                  )}>
                    {msg.content}
                  </div>
                  <div className={cn("flex items-center gap-1.5 mt-1.5 px-2", isMe ? "flex-row-reverse" : "flex-row")}>
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                      {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-6 bg-background/60 backdrop-blur-md border-t">
        <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
          <Input
            placeholder="Nhập nội dung trao đổi y khoa..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 shadow-inner rounded-lg h-12 px-5 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim()}
            className="h-12 w-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 shadow-sm shrink-0 transition-all active:scale-95"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
