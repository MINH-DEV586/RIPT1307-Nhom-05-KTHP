import express from "express";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";
import {
  getDoctors,
  bookAppointment,
  getMyAppointments,
  getDoctorAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  upsertSchedule,
  getDoctorSchedule,
  getAllSchedules,
  getAvailableSlots,
  createWalkInAppointment
} from "../controllers/appointment";

const router = express.Router();

router.post("/debug-book", async (req, res) => {
  const Appointment = require("../models/appointment").default;
  try {
    const { doctorId, patientType, patientName, date, timeSlot, type, symptoms, notes, files } = req.body;
    const patientId = "debug-patient-id";
    const appointment = new Appointment({
      patientId, doctorId, patientType, patientName, date, timeSlot, type, symptoms, notes, files, status: "pending"
    });
    await appointment.save();
    res.status(201).json(appointment);
  } catch (error: any) {
    res.status(500).json({ message: "Lỗi", error: error.message || error });
  }
});

router.use(requireAuth);

// Patient routes
router.get("/doctors", getDoctors);
router.post("/book", checkRole(["patient", "admin"]), bookAppointment);
router.get("/my", checkRole(["patient", "admin"]), getMyAppointments);
router.get("/available-slots/:doctorId", getAvailableSlots);

// Doctor routes - MUST come before the catch-all /:id route
router.get("/doctor-list", checkRole(["doctor", "admin"]), getDoctorAppointments);
router.post("/walk-in", checkRole(["doctor", "admin"]), createWalkInAppointment);

// Get specific appointment by ID - MUST be after other specific routes
router.get("/:id", checkRole(["patient", "doctor", "admin"]), getAppointmentById);

// Status update
router.put("/:id/status", checkRole(["patient", "doctor", "admin"]), updateAppointmentStatus);

// Schedule routes
router.get("/schedule/all", checkRole(["admin"]), getAllSchedules);
router.post("/schedule", checkRole(["doctor", "admin"]), upsertSchedule);
router.get("/schedule/:doctorId", getDoctorSchedule);

export default router;
