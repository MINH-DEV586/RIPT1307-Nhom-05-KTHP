import express from "express";
import { checkRole } from "../middleware/checkRole";
import { requireAuth } from "../middleware/auth";
import { 
  bookSession, 
  getSessions, 
  getChatHistory, 
  updateSessionStatus,
  deleteSession
} from "../controllers/telemedicine";

const router = express.Router();

// Matches frontend: createTelemedicineSession -> POST /api/telemedicine/sessions
router.post("/sessions", requireAuth, checkRole(["patient", "admin"]), bookSession);

// Matches frontend: getTelemedicineSessions -> GET /api/telemedicine/sessions
router.get("/sessions", requireAuth, checkRole(["doctor", "patient", "admin"]), getSessions);

// Matches frontend: getChatHistory -> GET /api/telemedicine/sessions/:sessionId/chat
router.get("/sessions/:sessionId/chat", requireAuth, getChatHistory);

// Matches frontend: updateSessionStatus -> PUT /api/telemedicine/sessions/:id/status
router.put("/sessions/:id/status", requireAuth, checkRole(["doctor", "admin"]), updateSessionStatus);

// Matches frontend: deleteTelemedicineSession -> DELETE /api/telemedicine/sessions/:id
router.delete("/sessions/:id", requireAuth, deleteSession);

export default router;
