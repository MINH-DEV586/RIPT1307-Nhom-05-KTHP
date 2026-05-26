import labResults from "../models/labResults";
import LabRequest from "../models/labRequest";
import LabTest from "../models/labTest";
import Invoice from "../models/invoice";
import type { Request, Response } from "express";
import { logActivity } from "../lib/activity";
import { inngest } from "../inngest/client";
import Notification from "../models/notification";
import { getIO } from "../lib/socket";
import { sendMail, getLabResultsTemplate } from "../lib/mailer";

export const createLabResult = async (req: Request, res: Response) => {
  try {
    const { 
      patientId, 
      labRequestId, 
      testType, 
      bodyPart, 
      imageUrl, 
      aiAnalysis, 
      indicators, 
      note 
    } = req.body;
    const createdBy = (req as any).user.id;

    const newLabResult = new labResults({
      patient: patientId,
      labRequestId,
      uploadedBy: createdBy,
      testType,
      bodyPart,
      imageUrl,
      aiAnalysis,
      indicators,
      doctorNotes: note,
      status: indicators && indicators.length > 0 ? "completed" : "pending",
    });

    await newLabResult.save();

    // Update linked LabRequest status if exists & create lab fee invoice
    if (labRequestId) {
      const labReq = await LabRequest.findByIdAndUpdate(labRequestId, { status: "completed" }, { new: true });
      
      if (labReq) {
        // Look up the price of this test type from LabTest collection
        const labTestRecord = await LabTest.findOne({ name: labReq.testType, isActive: true });
        const labFee = labTestRecord?.price || 0;

        if (labFee > 0) {
          // Check patient admission status to avoid double-billing for inpatients
          const mongoose = (await import("mongoose")).default;
          const userCollection = mongoose.connection.collection("user");
          let patientUser = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(patientId) });
          if (!patientUser) {
            patientUser = await userCollection.findOne({ _id: patientId as any });
          }
          const isAdmitted = patientUser && patientUser.status === "admitted";

          if (!isAdmitted) {
            // Create a separate lab fee invoice for outpatients
            const labInvoice = new Invoice({
              patientId,
              status: "pending_payment",
              items: [
                {
                  description: `Chi phí xét nghiệm - ${labReq.testType} (${new Date().toLocaleDateString("vi-VN")})`,
                  quantity: 1,
                  unitPrice: labFee,
                  totalPrice: labFee
                }
              ],
              totalAmount: labFee
            });
            await labInvoice.save();
            await logActivity(
              createdBy,
              "Tạo hóa đơn xét nghiệm",
              `Đã tạo hóa đơn xét nghiệm ${labReq.testType} - ${labFee.toLocaleString("vi-VN")}đ cho bệnh nhân ID: ${patientId}`
            );
          }
        }
      }
    }

    // AI Analysis trigger for scans
    if (imageUrl) {
      await inngest.send({
        name: "labResult/created",
        data: {
          labResultId: newLabResult._id,
          imageUrl,
          bodyPart,
        },
      });
    }

    // Tạo thông báo cho bệnh nhân
    try {
      await Notification.create({
        user: patientId,
        title: "Kết quả xét nghiệm mới",
        message: `Kết quả xét nghiệm ${testType} đã có. Vui lòng kiểm tra phần Kết quả xét nghiệm.`,
        type: "lab_result",
        link: `/patient/test-results`,
      });
      try { getIO().emit(`new_notification_${patientId}`); } catch (e) { /* ignore */ }

      // Gửi email kết quả xét nghiệm tới bệnh nhân
      try {
        const mongoose = (await import("mongoose")).default;
        const userCollection = mongoose.connection.collection("user");
        
        let patient = await userCollection.findOne({ _id: patientId as any });
        if (!patient && mongoose.Types.ObjectId.isValid(patientId)) {
          patient = await userCollection.findOne({ _id: new mongoose.Types.ObjectId(patientId) });
        }

        if (patient && patient.email) {
          const resultStatus = indicators && indicators.length > 0 ? "Hoàn thành" : "Đang xử lý";
          const emailHtml = getLabResultsTemplate(
            patient.name || "Bệnh nhân",
            testType,
            bodyPart,
            resultStatus
          );

          sendMail(
            patient.email,
            "🔬 Kết quả xét nghiệm của bạn đã sẵn sàng",
            emailHtml
          ).catch(err => {
            console.error("Failed to send lab results email:", err);
          });
        }
      } catch (emailErr) {
        console.error("Failed to send lab results email notification:", emailErr);
      }
    } catch (notifyErr) {
      console.error("Failed to create notification for lab result:", notifyErr);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("lab_result_added");
    }

    await logActivity(
      createdBy,
      "Tạo kết quả xét nghiệm",
      `Đã tạo ${testType} cho bệnh nhân: ${patientId}`
    );

    res.status(201).json({
      message: "Đã tạo kết quả xét nghiệm thành công",
      labResult: newLabResult,
    });
  } catch (error) {
    console.error("Error creating lab result:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getAllLabResults = async (req: Request, res: Response) => {
  try {
    const results = await labResults.find().sort({ createdAt: -1 }).lean();
    const mongoose = (await import("mongoose")).default;
    const userCollection = mongoose.connection.collection("user");
    
    const detailedResults = await Promise.all(
      results.map(async (r) => {
        const patient = await userCollection.findOne(
          { _id: new mongoose.Types.ObjectId(r.patient) },
          { projection: { name: 1 } }
        );
        return { ...r, patientName: patient?.name || "N/A" };
      })
    );

    res.json(detailedResults);
  } catch (error) {
    console.error("Error fetching all results:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getPatientLabResults = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const results = await labResults
      .find({ patient: patientId })
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    console.error("Error fetching lab results:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateLabResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedResult = await labResults.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedResult) {
      return res.status(404).json({ message: "Không tìm thấy kết quả xét nghiệm" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("lab_result_updated");
    }

    await logActivity(
      (req as any).user.id,
      "Cập nhật kết quả xét nghiệm",
      `Đã cập nhật xét nghiệm ID: ${id}`,
    );

    res.json({
      message: "Đã cập nhật kết quả xét nghiệm thành công",
      labResult: updatedResult,
    });
  } catch (error) {
    console.error("Error updating lab result:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const explainLabResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await labResults.findById(id).lean();

    if (!result) {
      return res.status(404).json({ message: "Không tìm thấy kết quả xét nghiệm" });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const dataStr = `
      Loại xét nghiệm: ${result.testType}
      Vị trí: ${result.bodyPart || "N/A"}
      Các chỉ số: ${JSON.stringify(result.indicators || [])}
      Ghi chú của bác sĩ: ${result.doctorNotes || "Không có"}
      Phân tích AI trước đó: ${result.aiAnalysis || "Không có"}
    `;

    const prompt = `
      Bạn là một trợ lý y tế AI thân thiện. Hãy giải thích kết quả xét nghiệm này cho bệnh nhân một cách dễ hiểu nhất.
      DỮ LIỆU: ${dataStr}
      
      Yêu cầu:
      1. Tránh sử dụng quá nhiều thuật ngữ chuyên môn, hoặc nếu có hãy giải thích chúng.
      2. Cho biết các chỉ số này có ý nghĩa gì đối với sức khỏe của họ (có bình thường không?).
      3. Đưa ra lời khuyên nhẹ nhàng về các bước tiếp theo (ví dụ: cần trao đổi thêm với bác sĩ nào).
      4. Tuyệt đối không đưa ra chẩn đoán khẳng định hoặc đơn thuốc.
      5. Luôn nhắc nhở bệnh nhân rằng đây chỉ là thông tin tham khảo từ AI.
      6. Trình bày bằng tiếng Việt, súc tích, chia thành các đoạn ngắn.
    `;

    const aiResponse = await model.generateContent(prompt);
    const explanation = aiResponse.response.text();

    res.json({ explanation });
  } catch (error) {
    console.error("AI Explanation Error:", error);
    res.status(500).json({ message: "Không thể kết nối với AI để giải thích lúc này." });
  }
};
