import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getUserByEmail,
  adminResetPassword,
} from "../controllers/authController.js";
import { saveFcmToken } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/user/:email", getUserByEmail);

router.post("/admin/reset-password", adminResetPassword);
router.post("/save-token", authMiddleware, saveFcmToken);

export default router;
