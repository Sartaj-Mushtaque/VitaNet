import express from "express";
import upload from "../middleware/upload.js";
import Report from "../models/Report.js";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getPatientProfile,
  createPatientProfile,
} from "../controllers/patientProfileController.js"; // ← adjust path if different

const router = express.Router();

// ── Profile routes ─────────────────────────────────────────────────────────
// GET  /api/patient/me  → fetch logged-in patient's profile
router.get("/me", authMiddleware, getPatientProfile);

// POST /api/patient/me  → create or update logged-in patient's profile
router.post("/me", authMiddleware, createPatientProfile);

// ── Report upload ──────────────────────────────────────────────────────────
router.post(
  "/upload",
  (req, res, next) => {
    console.log("🚀 UPLOAD ROUTE HIT");
    next();
  },
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILE:", req.file);

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { folderName } = req.body;

      if (!folderName) {
        return res.status(400).json({ message: "Folder name required" });
      }

      const report = new Report({
        patientId: req.user._id || req.user.id,
        folderName,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
      });

      await report.save();

      res.json({ message: "Upload successful", report });
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;