import express from "express";
import {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
  addPrescriptionToRecord,
  addPrescriptionToPatientRecord,
} from "../controllers/medicalRecord";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";

const router = express.Router();

router.use(requireAuth);

// Tạo hồ sơ (bác sĩ/admin)
router.post("/", checkRole(["admin", "doctor"]), createMedicalRecord);

// Tự động gẫn prescription vào hồ sơ nội trú mới nhất của bệnh nhân
router.patch("/patient/:patientId/add-prescription", checkRole(["admin", "doctor"]), addPrescriptionToPatientRecord);

// Xem danh sách hồ sơ của bệnh nhân (tất cả đăng nhập)
router.get("/patient/:patientId", getPatientMedicalRecords);

// Xem chi tiết một hồ sơ (tất cả đăng nhập)
router.get("/:id", getMedicalRecordById);

// Thêm prescription vào hồ sơ cụ thể (bác sĩ/admin)
router.patch("/:id/add-prescription", checkRole(["admin", "doctor"]), addPrescriptionToRecord);

// Sửa hồ sơ (chỉ bác sĩ/admin)
router.put("/:id", checkRole(["admin", "doctor"]), updateMedicalRecord);

// Xóa hồ sơ (chỉ bác sĩ/admin)
router.delete("/:id", checkRole(["admin", "doctor"]), deleteMedicalRecord);

export default router;
