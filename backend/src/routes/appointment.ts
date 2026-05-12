import express from "express";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";
import {
  getDoctors,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  upsertSchedule,
  getDoctorSchedule,
  getAllSchedules,
  getAvailableSlots
} from "../controllers/appointment";

const router = express.Router();

router.use(requireAuth);

// Patient routes
router.get("/doctors", getDoctors);
router.post("/book", checkRole(["patient", "admin"]), bookAppointment);
router.get("/my", checkRole(["patient", "admin"]), getMyAppointments);
router.get("/available-slots/:doctorId", getAvailableSlots);

// Doctor routes
router.get("/doctor-list", checkRole(["doctor", "admin"]), getDoctorAppointments);
router.put("/:id/status", checkRole(["doctor", "admin"]), updateAppointmentStatus);

// Schedule routes
router.get("/schedule/all", checkRole(["admin"]), getAllSchedules);
router.post("/schedule", checkRole(["doctor", "admin"]), upsertSchedule);
router.get("/schedule/:doctorId", getDoctorSchedule);

export default router;
