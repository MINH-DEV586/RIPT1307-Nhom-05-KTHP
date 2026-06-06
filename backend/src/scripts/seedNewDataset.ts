import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { auth } from "../lib/auth.js";
import { connectDB } from "../config/db.js";
import Appointment from "../models/appointment.js";
import MedicalRecord from "../models/medicalRecord.js";
import Prescription from "../models/prescription.js";
import LabResult from "../models/labResults.js";
import LabRequest from "../models/labRequest.js";
import Invoice from "../models/invoice.js";
import Medicine from "../models/medicine.js";
import { Message, TelemedicineSession } from "../models/telemedicine.js";
import DoctorSchedule from "../models/doctorSchedule.js";
import * as dotenv from "dotenv";

dotenv.config();

async function seed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI is not defined");

  // 1. Clear database
  await connectDB();
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();
  
  console.log("🧹 Clearing the database...");
  const usersCollection = db.collection("user");
  const sessionsCollection = db.collection("session");
  const accountsCollection = db.collection("account");

  // Xóa user không phải admin
  const adminUsers = await usersCollection.find({ role: "admin" }).toArray();
  const adminIds = adminUsers.map(u => u._id);
  
  await usersCollection.deleteMany({ role: { $ne: "admin" } });
  await sessionsCollection.deleteMany({});
  
  if (adminIds.length > 0) {
    await accountsCollection.deleteMany({ userId: { $nin: adminIds } });
  } else {
    await accountsCollection.deleteMany({});
  }
  
  // Clear other collections
  await Appointment.deleteMany({});
  await MedicalRecord.deleteMany({});
  await Prescription.deleteMany({});
  await LabResult.deleteMany({});
  await LabRequest.deleteMany({});
  await Invoice.deleteMany({});
  await Medicine.deleteMany({});
  await Message.deleteMany({});
  await TelemedicineSession.deleteMany({});
  await DoctorSchedule.deleteMany({});

  console.log("✅ Database cleared (except Admin and LabTests).");

  // 2. Seed Users
  console.log("👤 Creating Doctors, Nurses, and Patients...");
  
  const usersToCreate = [
    { name: "BS. Bác sĩ 1", email: "doctor1@hospital.com", password: "password123", role: "doctor", specialization: "Nội khoa", department: "Khoa Nội", experience: "10 năm", consultationFee: 300000, rating: 4.8, isOnline: true, status: "active" },
    { name: "BS. Bác sĩ 2", email: "doctor2@hospital.com", password: "password123", role: "doctor", specialization: "Ngoại khoa", department: "Khoa Ngoại", experience: "8 năm", consultationFee: 500000, rating: 4.9, isOnline: true, status: "active" },
    { name: "Điều dưỡng 1", email: "nurse1@hospital.com", password: "password123", role: "nurse", department: "Khoa Nội", status: "active" },
    { name: "Điều dưỡng 2", email: "nurse2@hospital.com", password: "password123", role: "nurse", department: "Khoa Ngoại", status: "active" },
    { 
      name: "Nguyễn Văn A", email: "patient.a@hospital.com", password: "password123", role: "patient",
      status: "admitted", patientType: "inpatient", birthday: "1980-05-15", phoneNumber: "0901234567",
      bloodgroup: "O+", address: "123 Đường A, Quận 1, TP.HCM", insuranceId: "BHYT123456789", medicalHistory: "Tiền sử viêm phế quản, hay mắc các bệnh lý hô hấp nội khoa"
    },
    { 
      name: "Nguyễn Văn B", email: "patient.b@hospital.com", password: "password123", role: "patient",
      status: "admitted", patientType: "outpatient", birthday: "1992-10-20", phoneNumber: "0987654321",
      bloodgroup: "A+", address: "456 Đường B, Quận 2, TP.HCM", insuranceId: "BHYT987654321", medicalHistory: "Tiền sử chấn thương thể thao, thường xuyên đau nhức xương khớp ngoại khoa"
    },
  ];

  const createdUsers: any = {};

  for (const u of usersToCreate) {
    const result = await auth.api.signUpEmail({
      body: {
        name: u.name,
        email: u.email,
        password: u.password,
      },
    });

    if (result?.user?.id) {
      await usersCollection.updateOne(
        { email: u.email },
        { 
          $set: { 
            role: u.role,
            specialization: u.specialization,
            department: u.department,
            experience: u.experience,
            consultationFee: u.consultationFee,
            rating: u.rating,
            isOnline: u.isOnline,
            status: u.status,
            patientType: u.patientType,
            birthday: u.birthday,
            phoneNumber: u.phoneNumber,
            bloodgroup: u.bloodgroup,
            address: u.address,
            insuranceId: u.insuranceId,
            medicalHistory: u.medicalHistory,
            assignedDoctorId: u.assignedDoctorId,
            assignedDoctorName: u.assignedDoctorName,
            assignedNurseId: u.assignedNurseId,
            assignedNurseName: u.assignedNurseName,
            triageReasoning: u.triageReasoning
          } 
        }
      );
      createdUsers[u.email] = result.user.id;
    }
  }

  const doctor1Id = createdUsers["doctor1@hospital.com"];
  const doctor2Id = createdUsers["doctor2@hospital.com"];
  const patientAId = createdUsers["patient.a@hospital.com"];
  const patientBId = createdUsers["patient.b@hospital.com"];

  const nurse1Id = createdUsers["nurse1@hospital.com"];
  const nurse2Id = createdUsers["nurse2@hospital.com"];

  // Update Patients with AI Assignments
  await usersCollection.updateOne(
    { _id: new mongoose.Types.ObjectId(patientAId) },
    { $set: {
      assignedDoctorId: doctor1Id,
      assignedDoctorName: "BS. Bác sĩ 1",
      assignedNurseId: nurse1Id,
      assignedNurseName: "Điều dưỡng 1",
      triageReasoning: "Bệnh nhân có tiền sử hô hấp và triệu chứng viêm phổi nên được phân công cho Khoa Nội."
    }}
  );

  await usersCollection.updateOne(
    { _id: new mongoose.Types.ObjectId(patientBId) },
    { $set: {
      assignedDoctorId: doctor2Id,
      assignedDoctorName: "BS. Bác sĩ 2",
      assignedNurseId: nurse2Id,
      assignedNurseName: "Điều dưỡng 2",
      triageReasoning: "Bệnh nhân có vấn đề thoái hóa khớp gối nên được phân công cho Khoa Ngoại."
    }}
  );

  // 3. Seed Medicines
  console.log("💊 Creating Medicines...");
  const medicinesData = [
    { name: "Paracetamol 500mg", category: "Giảm đau, hạ sốt", stock: 1000, unit: "viên", price: 1000, expiryDate: new Date("2026-12-31") },
    { name: "Amoxicillin 500mg", category: "Kháng sinh", stock: 500, unit: "viên", price: 3000, expiryDate: new Date("2025-06-30") },
    { name: "Omeprazole 20mg", category: "Dạ dày", stock: 200, unit: "viên", price: 2000, expiryDate: new Date("2026-01-01") },
    { name: "Vitamin C 1000mg", category: "Vitamin", stock: 300, unit: "viên", price: 1500, expiryDate: new Date("2027-01-01") },
    { name: "Loratadine 10mg", category: "Kháng dị ứng", stock: 400, unit: "viên", price: 1200, expiryDate: new Date("2025-12-31") },
    { name: "Ibuprofen 400mg", category: "Giảm đau kháng viêm", stock: 600, unit: "viên", price: 2500, expiryDate: new Date("2026-11-30") },
    { name: "Cetirizine 10mg", category: "Kháng dị ứng", stock: 350, unit: "viên", price: 1000, expiryDate: new Date("2025-08-31") },
    { name: "Metformin 500mg", category: "Tiểu đường", stock: 800, unit: "viên", price: 1800, expiryDate: new Date("2026-05-31") },
    { name: "Amlodipine 5mg", category: "Huyết áp", stock: 700, unit: "viên", price: 2200, expiryDate: new Date("2026-07-31") },
    { name: "Atorvastatin 20mg", category: "Mỡ máu", stock: 500, unit: "viên", price: 4000, expiryDate: new Date("2025-10-31") },
  ];
  const createdMedicines = await Medicine.insertMany(medicinesData);

  // 4. Seed Appointments
  console.log("📅 Creating Appointments...");
  const appointmentA = await Appointment.create({
    patientId: patientAId,
    doctorId: doctor1Id,
    patientType: "self",
    date: new Date(),
    timeSlot: "09:00 - 10:00",
    type: "offline",
    symptoms: "Sốt cao, ho nhiều",
    status: "confirmed"
  });

  const appointmentB = await Appointment.create({
    patientId: patientBId,
    doctorId: doctor2Id,
    patientType: "self",
    date: new Date(),
    timeSlot: "14:00 - 15:00",
    type: "online",
    symptoms: "Đau khớp gối",
    status: "cancelled",
    rejectionReason: "Bác sĩ có lịch mổ đột xuất"
  });

  // 5. Seed Medical Records & Prescriptions
  console.log("📝 Creating Medical Records, Prescriptions, and Lab Results...");
  
  // Patient A (Nội trú)
  const prescriptionA1 = await Prescription.create({
    patientId: patientAId,
    doctorId: doctor1Id,
    diagnosis: "Viêm phổi (Nhập viện)",
    status: "dispensed",
    items: [
      { medicineId: createdMedicines[0]._id, medicineName: createdMedicines[0].name, dosage: "500mg", frequency: "Sáng 1 viên, Tối 1 viên", duration: "5 ngày", quantity: 10 },
      { medicineId: createdMedicines[1]._id, medicineName: createdMedicines[1].name, dosage: "500mg", frequency: "Sáng 1 viên, Tối 1 viên", duration: "7 ngày", quantity: 14 }
    ]
  });

  const prescriptionA2 = await Prescription.create({
    patientId: patientAId,
    doctorId: doctor1Id,
    diagnosis: "Bổ sung sức đề kháng",
    status: "pending",
    items: [
      { medicineId: createdMedicines[3]._id, medicineName: createdMedicines[3].name, dosage: "1000mg", frequency: "Sáng 1 viên", duration: "10 ngày", quantity: 10 }
    ]
  });

  const prescriptionA3 = await Prescription.create({
    patientId: patientAId,
    doctorId: doctor1Id,
    diagnosis: "Hỗ trợ hô hấp",
    status: "dispensed",
    items: [
      { medicineId: createdMedicines[4]._id, medicineName: createdMedicines[4].name, dosage: "10mg", frequency: "Tối 1 viên", duration: "5 ngày", quantity: 5 }
    ]
  });

  const prescriptionA4 = await Prescription.create({
    patientId: patientAId,
    doctorId: doctor1Id,
    diagnosis: "Giảm đau dự phòng",
    status: "pending",
    items: [
      { medicineId: createdMedicines[5]._id, medicineName: createdMedicines[5].name, dosage: "400mg", frequency: "Khi đau 1 viên", duration: "3 ngày", quantity: 6 }
    ]
  });

  const medRecordA = await MedicalRecord.create({
    patient: patientAId,
    doctor: doctor1Id,
    date: new Date(),
    symptoms: "Sốt cao, ho nhiều",
    diagnosis: "Viêm phổi nặng cần theo dõi",
    treatmentPlan: "Truyền dịch, kháng sinh tĩnh mạch, theo dõi tại giường",
    recordType: "inpatient",
    admissionReason: "Viêm phổi cấp",
    prescriptionIds: [prescriptionA1._id.toString(), prescriptionA2._id.toString(), prescriptionA3._id.toString(), prescriptionA4._id.toString()]
  });

  await LabResult.create({
    patient: patientAId,
    uploadedBy: doctor1Id,
    testType: "Xét nghiệm máu tổng quát",
    status: "completed",
    doctorNotes: "Bạch cầu tăng cao",
    indicators: [{ name: "WBC", value: 15, unit: "G/L", normalRange: "4-10" }]
  });

  await LabResult.create({
    patient: patientAId,
    uploadedBy: doctor1Id,
    testType: "X-Quang Phổi",
    bodyPart: "Phổi",
    status: "completed",
    doctorNotes: "Bóng mờ thùy dưới phổi phải"
  });

  // Patient B (Ngoại trú)
  const prescriptionB1 = await Prescription.create({
    patientId: patientBId,
    doctorId: doctor2Id,
    diagnosis: "Viêm khớp gối",
    status: "dispensed",
    items: [
      { medicineId: createdMedicines[5]._id, medicineName: createdMedicines[5].name, dosage: "400mg", frequency: "Sáng 1 viên, Chiều 1 viên sau ăn", duration: "7 ngày", quantity: 14 }
    ]
  });

  const prescriptionB2 = await Prescription.create({
    patientId: patientBId,
    doctorId: doctor2Id,
    diagnosis: "Bảo vệ dạ dày",
    status: "pending",
    items: [
      { medicineId: createdMedicines[2]._id, medicineName: createdMedicines[2].name, dosage: "20mg", frequency: "Sáng 1 viên trước ăn", duration: "14 ngày", quantity: 14 }
    ]
  });

  const prescriptionB3 = await Prescription.create({
    patientId: patientBId,
    doctorId: doctor2Id,
    diagnosis: "Kiểm soát mỡ máu",
    status: "dispensed",
    items: [
      { medicineId: createdMedicines[9]._id, medicineName: createdMedicines[9].name, dosage: "20mg", frequency: "Tối 1 viên", duration: "30 ngày", quantity: 30 }
    ]
  });

  const prescriptionB4 = await Prescription.create({
    patientId: patientBId,
    doctorId: doctor2Id,
    diagnosis: "Hỗ trợ tim mạch",
    status: "pending",
    items: [
      { medicineId: createdMedicines[8]._id, medicineName: createdMedicines[8].name, dosage: "5mg", frequency: "Sáng 1 viên", duration: "30 ngày", quantity: 30 }
    ]
  });

  const medRecordB = await MedicalRecord.create({
    patient: patientBId,
    doctor: doctor2Id,
    date: new Date(),
    symptoms: "Đau khớp gối khi đi lại",
    diagnosis: "Thoái hóa khớp gối sớm",
    treatmentPlan: "Dùng thuốc giảm đau, tập vật lý trị liệu",
    recordType: "outpatient",
    prescriptionIds: [prescriptionB1._id.toString(), prescriptionB2._id.toString(), prescriptionB3._id.toString(), prescriptionB4._id.toString()]
  });

  await LabResult.create({
    patient: patientBId,
    uploadedBy: doctor2Id,
    testType: "X-Quang Khớp gối",
    bodyPart: "Khớp gối",
    status: "completed",
    doctorNotes: "Gai xương nhỏ ở mâm chày"
  });

  await LabResult.create({
    patient: patientBId,
    uploadedBy: doctor2Id,
    testType: "Siêu âm khớp",
    bodyPart: "Khớp gối",
    status: "completed",
    doctorNotes: "Tràn dịch nhẹ khớp gối phải"
  });

  // 6. Seed Invoices
  console.log("💰 Creating Invoices...");
  await Invoice.create({
    patientId: patientAId,
    status: "pending_payment",
    invoiceType: "inpatient",
    items: [
      { description: "Phí khám bệnh nội trú (3 ngày)", quantity: 3, unitPrice: 200000, totalPrice: 600000 },
      { description: "Tiền phòng (3 ngày)", quantity: 3, unitPrice: 300000, totalPrice: 900000 },
      { description: "Tiền thuốc", quantity: 1, unitPrice: 500000, totalPrice: 500000 }
    ],
    totalAmount: 2000000
  });

  await Invoice.create({
    patientId: patientBId,
    status: "pending_payment",
    invoiceType: "outpatient",
    items: [
      { description: "Phí khám chuyên khoa Ngoại", quantity: 1, unitPrice: 500000, totalPrice: 500000 },
      { description: "Tiền X-Quang, Siêu âm", quantity: 2, unitPrice: 250000, totalPrice: 500000 },
      { description: "Tiền thuốc", quantity: 1, unitPrice: 200000, totalPrice: 200000 }
    ],
    totalAmount: 1200000
  });

  // 7. Seed Messages (Telemedicine)
  console.log("💬 Creating Chat Messages...");
  
  const sessionA = await TelemedicineSession.create({
    patientId: patientAId,
    doctorId: doctor1Id,
    startTime: new Date(),
    status: "completed"
  });

  await Message.insertMany([
    { sessionId: sessionA._id, senderId: patientAId, receiverId: doctor1Id, content: "Chào bác sĩ, dạo này tôi ho nhiều và sốt cao về chiều.", isRead: true, createdAt: new Date(Date.now() - 3600000) },
    { sessionId: sessionA._id, senderId: doctor1Id, receiverId: patientAId, content: "Chào anh, ho có đờm không? Anh đã dùng thuốc gì chưa?", isRead: true, createdAt: new Date(Date.now() - 3000000) },
    { sessionId: sessionA._id, senderId: patientAId, receiverId: doctor1Id, content: "Dạ ho có đờm vàng, tôi chưa dám uống gì ạ.", isRead: true, createdAt: new Date(Date.now() - 2500000) },
    { sessionId: sessionA._id, senderId: doctor1Id, receiverId: patientAId, content: "Tình trạng này cần nhập viện để kiểm tra viêm phổi. Anh sắp xếp vào viện nhé.", isRead: false, createdAt: new Date() }
  ]);

  const sessionB = await TelemedicineSession.create({
    patientId: patientBId,
    doctorId: doctor2Id,
    startTime: new Date(),
    status: "completed"
  });

  await Message.insertMany([
    { sessionId: sessionB._id, senderId: patientBId, receiverId: doctor2Id, content: "Bác sĩ ơi, khớp gối tôi đau nhức khi đi lại cầu thang.", isRead: true, createdAt: new Date(Date.now() - 7200000) },
    { sessionId: sessionB._id, senderId: doctor2Id, receiverId: patientBId, content: "Đau bao lâu rồi anh? Có bị sưng đỏ không?", isRead: true, createdAt: new Date(Date.now() - 6000000) },
    { sessionId: sessionB._id, senderId: patientBId, receiverId: doctor2Id, content: "Khoảng 1 tuần nay, không sưng đỏ nhưng đi lụp cụp.", isRead: true, createdAt: new Date(Date.now() - 5000000) },
    { sessionId: sessionB._id, senderId: doctor2Id, receiverId: patientBId, content: "Anh đặt lịch đến phòng khám để tôi chụp X-Quang xem sao nhé.", isRead: false, createdAt: new Date() }
  ]);

  console.log("🎉 Seed completed successfully!");
  await client.close();
  mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
