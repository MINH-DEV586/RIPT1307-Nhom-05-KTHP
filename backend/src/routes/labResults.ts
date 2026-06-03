import { Router } from "express";
import { requireAuth } from "../middleware/auth"; // Your Better Auth middleware
import { checkRole } from "../middleware/checkRole"; // Your RBAC middleware
import {
  createLabResult,
  getPatientLabResults,
  updateLabResult,
  getAllLabResults,
  explainLabResult,
  deleteLabResult,
} from "../controllers/labResults";

const labResultsRouter = Router();

// GET: All results for staff
labResultsRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "lab_tech"]),
  getAllLabResults,
);

// POST: Upload an X-Ray (Allowed for Lab Techs, Doctors, Admins)
labResultsRouter.post(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  createLabResult,
);

// GET: Fetch all X-Rays for a patient (Allowed for Medical Staff & The Patient)
labResultsRouter.get(
  "/patient/:patientId",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "lab_tech", "patient"]),
  getPatientLabResults,
);

// GET: Explain a lab result using AI (Allowed for Patients and Staff)
labResultsRouter.get(
  "/:id/explain",
  requireAuth,
  explainLabResult,
);

// PUT: Update X-Ray with AI Analysis or Doctor Notes
labResultsRouter.put(
  "/:id",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  updateLabResult,
);

// DELETE: Delete a lab result
labResultsRouter.delete(
  "/:id",
  requireAuth,
  checkRole(["admin", "doctor", "lab_tech"]),
  deleteLabResult,
);

export default labResultsRouter;
