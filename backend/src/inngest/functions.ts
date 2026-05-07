import mongoose from "mongoose";
import { inngest } from "./client";
import { NonRetriableError } from "inngest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { notifyUsers } from "./notifyUsers";
import labResults from "../models/labResults";
import invoice from "../models/invoice";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!);

export const admitPatient = inngest.createFunction(
  { id: "admit-patient" },
  { event: "patient/admitted" },
  async ({ event, step }) => {
    const { patientId, admissionReason } = event.data;
    const collection = mongoose.connection.collection("user");

    const data = await step.run("fetch-hospital-data", async () => {
      const patient = await collection.findOne({
        _id: new mongoose.Types.ObjectId(patientId),
      });
      const doctors = await collection
        .find({ role: "doctor", status: "active" })
        .toArray();
      const nurses = await collection
        .find({ role: "nurse", status: "active" })
        .toArray();
      return { patient, doctors, nurses };
    });

    if (
      !data.patient ||
      data.doctors.length === 0 ||
      data.nurses.length === 0
    ) {
      throw new NonRetriableError(
        "Thiếu bệnh nhân hoặc nhân viên đang hoạt động để hoàn tất phân loại.",
      );
    }

    const aiAssignment = await step.run("ai-triage", async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" },
      });
      const patientDataStr = `Tuổi: ${data.patient!.age}, Giới tính: ${data.patient!.gender}, Tiền sử: ${data.patient!.medicalHistory}. Vấn đề hiện tại: ${admissionReason}`;
      const doctorDataStr = data.doctors
        .map(
          (d) =>
            `ID: ${d._id.toString()}, Tên: ${d.name}, Chuyên môn: ${d.specialization}, Khoa: ${d.department}`,
        )
        .join("\n");
      const nurseDataStr = data.nurses
        .map(
          (n) =>
            `ID: ${n._id.toString()}, Tên: ${n.name}, Khoa: ${n.department}`,
        )
        .join("\n");

      const prompt = `
        Bạn là chuyên gia AI phân loại bệnh viện (Hospital Triage AI). Hãy ghép nối bệnh nhân này với Bác sĩ và Điều dưỡng phù hợp nhất.
        BỆNH NHÂN: ${patientDataStr}
        BÁC SĨ HIỆN CÓ: ${doctorDataStr}
        ĐIỀU DƯỠNG HIỆN CÓ: ${nurseDataStr}
        
        Chỉ phản hồi một đối tượng JSON hợp lệ:
        {
          "doctorId": "id",
          "doctorName": "name",
          "nurseId": "id",
          "nurseName": "name",
          "reasoning": "Giải thích lý do lâm sàng cho sự phân công này (bằng tiếng Việt)."
        }
      `;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanJson);
    });

    const updatedPatient = await step.run("update-database", async () => {
      const updatePayload = {
        status: "admitted",
        admissionReason,
        assignedDoctorId: aiAssignment.doctorId,
        assignedDoctorName: aiAssignment.doctorName,
        assignedNurseId: aiAssignment.nurseId,
        assignedNurseName: aiAssignment.nurseName,
        triageReasoning: aiAssignment.reasoning,
      };
      await collection.updateOne(
        { _id: new mongoose.Types.ObjectId(patientId) },
        { $set: updatePayload },
      );
      return await collection.findOne({
        _id: new mongoose.Types.ObjectId(patientId),
      });
    });

    await step.run("send-notification", async () => {
      await notifyUsers(
        aiAssignment.doctorId,
        aiAssignment.nurseId,
        "Đã phân công bệnh nhân",
        `Bạn đã được phân công cho bệnh nhân mới: ${updatedPatient?.name}`,
        `/patient/${patientId}`,
        "assignment",
      );
    });
    return { success: true, aiAssignment, updatedPatient };
  },
);

export const analyzeXRayJob = inngest.createFunction(
  { id: "analyze-xray" },
  { event: "labResult/created" },
  async ({ event, step }) => {
    const { labResultId, imageUrl, bodyPart } = event.data;

    const imageBase64 = await step.run("fetch-image", async () => {
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer).toString("base64");
    });

    const aiAnalysis = await step.run("call-gemini", async () => {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });

      const prompt = `Bạn là một bác sĩ chẩn đoán hình ảnh AI chuyên nghiệp. Hãy phân tích hình ảnh X-ray ${bodyPart} này. Cung cấp phản hồi theo cấu trúc bằng tiếng Việt: \n1. Các phát hiện chính\n2. Các bất thường tiềm ẩn\n3. Tóm tắt.\nGiữ phong cách lâm sàng, súc tích và kết thúc bằng một tuyên bố từ chối trách nhiệm (disclaimer) rằng đây chỉ là hỗ trợ AI.`;

      const imageParts = [
        {
          inlineData: {
            data: imageBase64,
            mimeType: "image/jpeg",
          },
        },
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      return result.response.text();
    });

    const updatedLab = await step.run("update-db", async () => {
      const updatedLabResult = await labResults
        .findByIdAndUpdate(
          labResultId,
          { aiAnalysis, status: "analyzed" },
          { new: true },
        )
        .lean();

      if (!updatedLabResult) {
        throw new NonRetriableError("Không tìm thấy kết quả xét nghiệm");
      }

      const patient = await mongoose.connection.collection("user").findOne(
        { _id: new mongoose.Types.ObjectId(updatedLabResult.patient) },
        { projection: { password: 0, emailVerified: 0 } },
      );

      const resultWithPatient = {
        ...updatedLabResult,
        patient: patient || null,
      };

      return resultWithPatient;
    });

    await step.run("send-notification", async () => {
      await notifyUsers(
        updatedLab?.patient?.assignedDoctorId.toString() || "",
        updatedLab?.patient?.assignedNurseId.toString() || "",
        "Kết quả xét nghiệm đã được phân tích",
        `Kết quả xét nghiệm cho ${updatedLab?.testType} đã được phân tích bởi AI.`,
        `/patients`,
        "lab_result",
      );
    });
  },
);

export const addChargeToInvoice = inngest.createFunction(
  { id: "add-medical-charge" },
  { event: "billing/charge.added" },
  async ({ event, step }) => {
    const { patientId, description, priceInCents } = event.data;
    if (!patientId || !priceInCents) {
      throw new NonRetriableError("Thiếu thông tin chi phí bắt buộc.");
    }

    let inv = await invoice.findOne({ patientId, status: "draft" });
    await step.run("create invoice", async () => {
      if (!inv) {
        inv = new invoice({ patientId, items: [], totalAmount: 0 });
      }

      inv.items.push({
        description,
        quantity: 1,
        unitPrice: priceInCents,
        totalPrice: priceInCents,
      });
      inv.totalAmount += priceInCents;
      await inv.save();
    });

    return { success: true, invoiceId: inv?._id.toString() };
  },
);
