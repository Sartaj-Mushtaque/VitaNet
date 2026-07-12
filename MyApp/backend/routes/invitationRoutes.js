import express from "express";
import { createInvitation, validateInviteCode } from "../controllers/invitationController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createInvitation);
router.post("/validate", authMiddleware, validateInviteCode);

export default router;
