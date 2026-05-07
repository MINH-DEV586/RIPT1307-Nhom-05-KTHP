import express from "express";
import { checkRole } from "../middleware/checkRole";
import { 
  createLabRequest, 
  getLabRequests, 
  getLabRequestById,
  updateLabRequestStatus 
} from "../controllers/labRequest";

const router = express.Router();

router.post("/", checkRole(["doctor", "admin"]), createLabRequest);
router.get("/", checkRole(["doctor", "admin", "nurse"]), getLabRequests);
router.get("/:id", checkRole(["doctor", "admin", "nurse", "lab_tech"]), getLabRequestById);
router.put("/:id/status", checkRole(["doctor", "admin", "nurse"]), updateLabRequestStatus);

export default router;
