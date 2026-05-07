import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import { Message } from "../models/telemedicine";

let io: SocketIOServer;
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // 1. Nhận diện người dùng và cập nhật trạng thái online
    socket.on("identify", (userId) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        io.emit("online_users", Array.from(onlineUsers.keys()));
        console.log(`User ${userId} is online`);
      }
    });

    // 2. Tham gia phòng thông báo theo vai trò
    socket.on("join_role_room", (role) =>
      socket.join(role === "admin" ? "admin_room" : "medical_room")
    );

    // 3. Chat Realtime cho Khám từ xa
    socket.on("join_session", (sessionId) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session room: ${sessionId}`);
    });

    socket.on("send_message", async (data) => {
      const { sessionId, senderId, receiverId, content } = data;
      try {
        // Lưu tin nhắn vào Database
        const newMessage = new Message({
          sessionId,
          senderId,
          receiverId,
          content
        });
        await newMessage.save();

        // Gửi tin nhắn tới tất cả mọi người trong phòng (bao gồm người gửi)
        io.to(sessionId).emit("receive_message", newMessage);
        
        // Gửi thông báo cho người nhận nếu họ đang online nhưng không trong phòng chat
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_chat_notification", {
            sessionId,
            senderId,
            content
          });
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // 4. Xử lý khi ngắt kết nối
    socket.on("disconnect", () => {
      let disconnectedUserId = "";
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));
      console.log(`User ${disconnectedUserId || socket.id} disconnected`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
