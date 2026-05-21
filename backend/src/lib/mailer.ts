import nodemailer from "nodemailer";
import { format } from "date-fns";

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

// ========== EMAIL TEMPLATES ==========

export const getAppointmentConfirmedTemplate = (
  patientName: string,
  doctorName: string,
  appointmentDate: Date,
  timeSlot: string,
  type: string,
  symptoms?: string
): string => {
  const formattedDate = format(new Date(appointmentDate), "dd/MM/yyyy");
  const appointmentType = type === "online" ? "Khám trực tuyến" : "Khám trực tiếp tại phòng khám";
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #10b981;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">✓ Lịch hẹn của bạn đã được duyệt</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin chào <strong style="color: #111827;">${patientName}</strong>,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Bác sĩ <strong>${doctorName}</strong> đã duyệt và xác nhận lịch hẹn của bạn. Dưới đây là thông tin chi tiết:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>👨‍⚕️ Bác sĩ:</strong> ${doctorName}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>📅 Ngày khám:</strong> ${formattedDate}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>⏰ Khung giờ:</strong> ${timeSlot}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>🏥 Hình thức:</strong> ${appointmentType}</p>
          ${symptoms ? `<p style="margin: 0; color: #374151; font-size: 15px;"><strong>🩺 Triệu chứng:</strong> ${symptoms}</p>` : ""}
        </div>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Vui lòng sắp xếp thời gian để đến đúng hẹn. Nếu cần thay đổi, bạn có thể dời hoặc hủy lịch trên hệ thống.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/appointments" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem lịch hẹn</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Trân trọng,<br><strong>Đội ngũ MedFlow AI</strong></p>
      </div>
    </div>
  `;
};

export const getAppointmentRejectedTemplate = (
  patientName: string,
  doctorName: string,
  appointmentDate: Date,
  timeSlot: string,
  rejectionReason?: string
): string => {
  const formattedDate = format(new Date(appointmentDate), "dd/MM/yyyy");
  
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #ef4444;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">⚠️ Lịch hẹn đã được từ chối</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin chào <strong style="color: #111827;">${patientName}</strong>,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin thông báo rằng bác sĩ <strong>${doctorName}</strong> không thể xác nhận lịch hẹn của bạn vào <strong>${formattedDate}</strong> (${timeSlot}).</p>
        
        ${
          rejectionReason
            ? `
        <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #ef4444; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #7f1d1d; font-size: 14px;"><strong>Lý do:</strong> ${rejectionReason}</p>
        </div>
            `
            : ""
        }

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Vui lòng quay lại hệ thống để lựa chọn thời gian khác hoặc liên hệ với bác sĩ để thảo luận thêm về lịch hẹn phù hợp.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/appointments" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Đặt lịch mới</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Trân trọng,<br><strong>Đội ngũ MedFlow AI</strong></p>
      </div>
    </div>
  `;
};

export const getLabResultsTemplate = (
  patientName: string,
  testType: string,
  bodyPart?: string,
  resultStatus?: string
): string => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #0891b2;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">🔬 Kết quả xét nghiệm của bạn đã sẵn sàng</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin chào <strong style="color: #111827;">${patientName}</strong>,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Kết quả xét nghiệm của bạn đã được xử lý và sẵn sàng để xem. Vui lòng đăng nhập vào hệ thống để kiểm tra chi tiết.</p>
        
        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>🧪 Loại xét nghiệm:</strong> ${testType}</p>
          ${bodyPart ? `<p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>📍 Vị trí:</strong> ${bodyPart}</p>` : ""}
          ${resultStatus ? `<p style="margin: 0; color: #374151; font-size: 15px;"><strong>📊 Trạng thái:</strong> ${resultStatus}</p>` : ""}
        </div>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Để xem chi tiết kết quả, hãy truy cập phần "Kết quả xét nghiệm" trong hồ sơ bệnh án của bạn. Nếu có bất kỳ thắc mắc nào, bạn có thể liên hệ với bác sĩ theo hướng dẫn trong hệ thống.</p>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/patient/test-results" style="background-color: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem kết quả</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        
        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Trân trọng,<br><strong>Đội ngũ MedFlow AI</strong></p>
      </div>
    </div>
  `;
};
