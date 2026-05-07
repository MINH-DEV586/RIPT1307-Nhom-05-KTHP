import express from "express";
import {
  createMedicalRecord,
  getPatientMedicalRecords,
  getMedicalRecordById,
} from "../controllers/medicalRecord";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";

const router = express.Router();

// All medical record routes require authentication
router.use(requireAuth);

router.post(
  "/",
  checkRole(["admin", "doctor", "nurse"]),
  createMedicalRecord
);

router.get("/patient/:patientId", getPatientMedicalRecords);
router.get("/:id", getMedicalRecordById);

export default router;
