import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
let senderEmail = "";

const initTransporter = async () => {
  if (transporter) return;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    senderEmail = process.env.SMTP_USER;
  } else {
    console.log("Không tìm thấy cấu hình SMTP trong .env. Đang tạo tài khoản test tự động...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    senderEmail = testAccount.user;
    console.log("Tài khoản test đã được tạo: ", testAccount.user);
  }
};

export const sendMail = async (to: string, subject: string, html: string) => {
  await initTransporter();

  try {
    const info = await transporter!.sendMail({
      from: `"Phòng Khám" <${senderEmail}>`,
      to,
      subject,
      html,
    });
    console.log("Đã gửi email tới: %s (MessageID: %s)", to, info.messageId);
    
    // Nếu dùng test account, in ra URL xem trước email
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("Vui lòng click vào link này để xem nội dung email mô phỏng: %s", previewUrl);
    }
    return info;
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
    throw error;
  }
};
