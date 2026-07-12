import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createSchedule,
  getMySchedules,
  updateScheduleStatus,
  deleteSchedule,
  getPatientSchedules,
} from "../controllers/scheduleController.js";
import Community from "../models/Community.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/",                    authMiddleware, createSchedule);
router.get("/",                     authMiddleware, getMySchedules);
router.get("/my-community",         authMiddleware, async (req, res) => {
  try {
    const connections = await Community.find({ patientId: req.user.id });
    const memberIds   = connections.map(c => c.memberId);
    const members     = await User.find({ _id: { $in: memberIds } }).select("name email");
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch community members" });
  }
});
router.get("/patient/:patientId",   authMiddleware, getPatientSchedules);
router.patch("/:id",                authMiddleware, updateScheduleStatus);
router.delete("/:id",               authMiddleware, deleteSchedule);

export default router;