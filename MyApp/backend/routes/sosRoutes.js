import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  sendSos,
  getMySosHistory,
  getReceivedSos,
  resolveSos,
} from "../controllers/sosController.js";

const router = express.Router();

router.post("/send", authMiddleware, sendSos);
router.get("/history", authMiddleware, getMySosHistory);
router.get("/received", authMiddleware, getReceivedSos);
router.patch("/resolve/:sosId", authMiddleware, resolveSos);

export default router;