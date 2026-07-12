import express from "express";
import upload from "../middleware/upload.js";
import Report from "../models/Report.js";
import authMiddleware from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";

const router = express.Router();

router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file" });

      const normalizedPath = req.file.path.replace(/\\/g, "/");
      const fileUrl = `${req.protocol}://${req.get("host")}/${normalizedPath}`;

      console.log("📁 File saved at:", normalizedPath);
      console.log("🔗 File URL:", fileUrl);

      const report = await Report.create({
        patientId:  req.user.id,
        folderName: req.query.folderName || "General",  // ← from query now
        fileName:   req.file.originalname,
        fileType:   req.file.mimetype,
        filePath:   normalizedPath,
        fileUrl,
      });

      res.json(report);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// ───── GET ALL ─────
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await Report.find({ patientId: req.user.id });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ───── DELETE ─────
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const file = await Report.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "Not found" });

    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;