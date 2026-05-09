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
  ArrowLeft,
  Video,
  Clock,
  MoreVertical,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "Tư vấn trực tuyến | MedFlow AI" }];
}

export default function ConsultationChat() {
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
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [sessionId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    try {
      setLoading(true);
      // 1. Fetch consultation details to know receiver
      const allSessions = await getTelemedicineSessions();
      // Try matching by _id first, then by appointmentId field (when navigating from Appointments page)
      const current = allSessions.find(
        (s: any) => s._id === sessionId || String(s._id) === sessionId
      );
      if (!current) {
        toast.error("Không tìm thấy phiên khám. Đây có thể là phiên từ lịch hẹn trực tiếp.");
        // Still allow chat room to load with basic session info
        setConsultation({ _id: sessionId, patientId: null, doctorId: null, otherUser: null, startTime: new Date() });
      } else {
        setConsultation(current);
      }

      // 2. Fetch history
      const history = await getChatHistory(sessionId!);
      setMessages(history);

      // 3. Setup Socket
      socket.connect();

      socket.on("connect", () => {
        socket.emit("identify", currentUser.id);
        socket.emit("join_session", sessionId);
      });

      socket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err);
        toast.error("Mất kết nối máy chủ chat");
      });

      socket.on("receive_message", (msg) => {
        setMessages((prev) => {
          // Tránh duplicate tin nhắn nếu socket gửi lại
          if (prev.find((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      });

      socket.on("online_users", (users) => {
        setOnlineUsers(users);
      });
    } catch (error) {
      toast.error("Lỗi khi khởi tạo chat");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentUser || !consultation) return;

    const receiverId =
      currentUser.role === "doctor"
        ? consultation.patientId
        : consultation.doctorId;

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
    ? onlineUsers.includes(
        currentUser?.role === "doctor"
          ? consultation.patientId
          : consultation.doctorId,
      )
    : false;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-muted/20 rounded-xl border border-dashed">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Đang kết nối phòng khám bảo mật...
        </p>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-muted/20 rounded-xl">
        <AlertCircle className="w-10 h-10 text-destructive opacity-50" />
        <p className="text-sm font-medium">Phiên khám không hợp lệ.</p>
        <Button variant="outline" onClick={() => navigate("/telemedicine/sessions")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full glass rounded-xl overflow-hidden border shadow-2xl animate-page-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-md border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/telemedicine/sessions")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={consultation.otherUser?.image} />
                <AvatarFallback className="bg-indigo-600 text-white font-bold">
                  {consultation.otherUser?.name?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background shadow-sm",
                  isOtherUserOnline ? "bg-emerald-500 pulse-dot" : "bg-slate-400",
                )}
              />
            </div>
            <div>
              <h2 className="font-black text-base leading-tight tracking-tight">
                {consultation.otherUser?.name}
              </h2>
              <p className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {isOtherUserOnline ? (
                  <>
                    <span className="text-emerald-500">Trực tuyến</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>Sẵn sàng tư vấn</span>
                  </>
                ) : (
                  "Ngoại tuyến"
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 transition-all gap-2 font-bold"
          >
            <Video className="w-4 h-4" /> Cuộc gọi Video
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6 bg-slate-50/50 dark:bg-gray-950/50 relative">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
            <div className="p-3 bg-card rounded-2xl shadow-sm border mb-4">
              <Clock className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-slate-500">
              Bắt đầu phiên tư vấn: {new Date(consultation.startTime).toLocaleString("vi-VN")}
            </p>
            <p className="text-[10px] mt-2 max-w-[280px] leading-relaxed">
              Dữ liệu trò chuyện được mã hóa đầu cuối và lưu trữ bảo mật để phục vụ công tác chẩn đoán y khoa.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {messages.map((msg, index) => {
              const isMe = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg._id || index}
                  className={cn(
                    "flex animate-fade-up",
                    isMe ? "justify-end" : "justify-start",
                  )}
                  style={{ animationDelay: `${index * 10}ms` }}
                >
                  <div
                    className={cn(
                      "flex flex-col max-w-[75%] gap-1",
                      isMe ? "items-end" : "items-start",
                    )}
                  >
                    {!isMe && (
                       <span className="text-[10px] font-bold text-muted-foreground ml-1 mb-1">
                         {consultation.otherUser?.name}
                       </span>
                    )}
                    <div
                      className={cn(
                        "px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all",
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-700"
                          : "bg-card text-card-foreground rounded-tl-none border border-border/50 hover:border-indigo-200",
                      )}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[9px] font-medium text-muted-foreground/60 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={scrollRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-card border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Trao đổi với bác sĩ..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-muted/50 border-none focus-visible:ring-indigo-500 shadow-inner rounded-xl h-11"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim()}
            className="h-11 w-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 shrink-0 transition-all hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
