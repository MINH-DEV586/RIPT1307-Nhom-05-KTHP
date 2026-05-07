import express from "express";

const userRouter = express.Router();

import {
  fetchAllUsers,
  createUser,
  getUserById,
  updateUser,
  admitPatient,
  getPolarPortalLink,
} from "../controllers/user";
import { requireAuth } from "../middleware/auth";
import { checkRole } from "../middleware/checkRole";

userRouter.post(
  "/create",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  createUser,
);

userRouter.get(
  "/",
  requireAuth,
  checkRole(["admin", "doctor", "nurse", "patient"]),
  fetchAllUsers,
);
userRouter.put(
  "/update/:id",
  requireAuth,
  //   allowed roles: admin, doctor, nurse
  checkRole(["admin", "doctor", "nurse"]),
  updateUser,
);

// only admin and medical staff can update patient profiles
userRouter.get("/profile/:id", requireAuth, getUserById);
// test admit
userRouter.post(
  "/:id/admit",
  requireAuth,
  checkRole(["admin", "doctor", "nurse"]),
  admitPatient,
);

userRouter.get("/polar-portal/:userId", requireAuth, getPolarPortalLink);

// if :id route is first, it will catch all routes including /update/:id, so we need to put it after the /update/:id route
export default userRouter;
