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

// ========== PAYMENT CONFIRMATION EMAIL ==========

export interface InvoiceItem {
  description: string;
  quantity: number;
  totalPrice: number;
}

export const getPaymentConfirmationTemplate = (
  patientName: string,
  patientEmail: string,
  invoiceId: string,
  txnRef: string,
  totalAmount: number,
  paidAt: Date,
  items: InvoiceItem[]
): string => {
  const formattedDate = format(new Date(paidAt), "dd/MM/yyyy");
  const formattedTime = format(new Date(paidAt), "HH:mm:ss");

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #374151; font-size: 14px;">${item.description}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #374151; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #111827; font-size: 14px; font-weight: 600; text-align: right; white-space: nowrap;">${item.totalPrice.toLocaleString("vi-VN")} VNĐ</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; background-color: #f4f6f9; padding: 24px; border-radius: 12px;">
      <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0060a9 0%, #003d7a 100%); padding: 32px 32px 28px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 22px;">✅</span>
            </div>
            <div>
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Thanh toán thành công</h1>
              <p style="color: #93c5fd; margin: 4px 0 0; font-size: 13px;">MedFlow AI — Hệ thống quản lý bệnh viện</p>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 28px 32px;">

          <!-- Greeting -->
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
            Xin chào <strong style="color: #111827;">${patientName}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Hệ thống đã ghi nhận giao dịch thanh toán hóa đơn y tế của bạn thành công. Dưới đây là thông tin chi tiết:
          </p>

          <!-- Transaction Info Box -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; color: #1e40af; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Thông tin giao dịch</p>
            <div style="display: grid; gap: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">📋 Mã hóa đơn:</span>
                <span style="font-family: monospace; color: #111827; font-size: 13px; font-weight: 600;">#${invoiceId.slice(-8).toUpperCase()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">🔖 Mã giao dịch VNPay:</span>
                <span style="font-family: monospace; color: #111827; font-size: 13px; font-weight: 600;">${txnRef}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">📅 Ngày thanh toán:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 600;">${formattedDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #6b7280; font-size: 14px;">⏰ Giờ thanh toán:</span>
                <span style="color: #111827; font-size: 14px; font-weight: 600;">${formattedTime}</span>
              </div>
            </div>
          </div>

          <!-- Invoice Items Table -->
          <p style="color: #374151; font-size: 14px; font-weight: 700; margin: 0 0 10px;">Chi tiết các khoản phí:</p>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Mô tả</th>
                <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">SL</th>
                <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Total -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
            <span style="color: #166534; font-size: 15px; font-weight: 700;">Tổng cộng đã thanh toán</span>
            <span style="color: #15803d; font-size: 22px; font-weight: 900; font-variant-numeric: tabular-nums;">${totalAmount.toLocaleString("vi-VN")} VNĐ</span>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/patient/invoices"
               style="display: inline-block; background: linear-gradient(135deg, #0060a9, #003d7a); color: #ffffff; padding: 13px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(0,96,169,0.35);">
              📄 Xem lịch sử thanh toán
            </a>
          </div>

          <!-- Thank you note -->
          <div style="background: #fafafa; border-left: 4px solid #0060a9; border-radius: 4px; padding: 14px 18px;">
            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
              🙏 <strong>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của MedFlow AI.</strong> Nếu bạn có bất kỳ thắc mắc nào về hóa đơn, vui lòng liên hệ với chúng tôi qua hệ thống hoặc trực tiếp tại quầy lễ tân của bệnh viện.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center; background: #fafafa;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Email này được gửi tự động từ hệ thống MedFlow AI.<br>
            Trân trọng, <strong>Đội ngũ MedFlow AI</strong>
          </p>
        </div>
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

// ========== APPOINTMENT BOOKING CONFIRMATION ==========

export const getAppointmentBookedTemplate = (
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
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #3b82f6;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">📅 Đặt lịch hẹn thành công</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin chào <strong style="color: #111827;">${patientName}</strong>,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Bạn đã đặt lịch hẹn khám thành công. Lịch hẹn đang chờ xác nhận từ bác sĩ. Dưới đây là thông tin chi tiết:</p>
        
        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #bfdbfe;">
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>👨‍⚕️ Bác sĩ:</strong> ${doctorName}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>📅 Ngày khám:</strong> ${formattedDate}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>⏰ Khung giờ:</strong> ${timeSlot}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>🏥 Hình thức:</strong> ${appointmentType}</p>
          ${symptoms ? `<p style="margin: 0; color: #374151; font-size: 15px;"><strong>🩺 Triệu chứng:</strong> ${symptoms}</p>` : ""}
        </div>

        <div style="background-color: #fef9c3; padding: 14px 18px; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">⏳ Lịch hẹn đang chờ xác nhận từ bác sĩ. Bạn sẽ nhận được email thông báo sau khi được duyệt.</p>
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/appointments" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xem lịch hẹn của tôi</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Trân trọng,<br><strong>Đội ngũ MedFlow AI</strong></p>
      </div>
    </div>
  `;
};

// ========== CONSULTATION COMPLETION EMAIL ==========

export const getConsultationCompletedTemplate = (
  patientName: string,
  doctorName: string,
  diagnosis: string,
  hasPrescription: boolean,
  hasLabRequests: boolean
): string => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px; border-radius: 12px;">
      <div style="background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 5px solid #10b981;">
        <h2 style="color: #1f2937; margin-top: 0; font-size: 24px;">✅ Ca khám của bạn đã hoàn thành</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Xin chào <strong style="color: #111827;">${patientName}</strong>,</p>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">Bác sĩ <strong>${doctorName}</strong> đã hoàn thành ca khám cho bạn. Dưới đây là tóm tắt kết quả:</p>

        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #bbf7d0;">
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>🩺 Chẩn đoán:</strong> ${diagnosis}</p>
          <p style="margin: 0 0 10px 0; color: #374151; font-size: 15px;"><strong>💊 Đơn thuốc:</strong> ${hasPrescription ? "✅ Đã kê đơn thuốc" : "Không có"}</p>
          <p style="margin: 0; color: #374151; font-size: 15px;"><strong>🔬 Xét nghiệm:</strong> ${hasLabRequests ? "✅ Có chỉ định xét nghiệm" : "Không có"}</p>
        </div>

        <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Vui lòng đăng nhập vào hệ thống để xem chi tiết kết quả khám, đơn thuốc và thực hiện thanh toán hóa đơn.</p>

        <div style="margin-top: 30px; text-align: center; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/patient/prescriptions" style="background-color: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 4px;">💊 Xem đơn thuốc</a>
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/patient/invoices" style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin: 4px;">💳 Thanh toán hóa đơn</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #9ca3af; font-size: 13px; text-align: center; margin: 0;">Trân trọng,<br><strong>Đội ngũ MedFlow AI</strong></p>
      </div>
    </div>
  `;
};
