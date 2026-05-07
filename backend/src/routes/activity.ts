import express from "express";

const activityLogRouter = express.Router();

import { requireAuth } from "../middleware/auth";
import { createActivityLog, getActivityLogs } from "../controllers/activity";
import { checkRole } from "../middleware/checkRole";

// only admins can fetch logs
activityLogRouter.get("/", requireAuth, checkRole(["admin"]), getActivityLogs);
activityLogRouter.post("/create", requireAuth, createActivityLog);

export default activityLogRouter;
