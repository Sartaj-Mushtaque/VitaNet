import TreatmentSchedule from "../models/TreatmentSchedule.js";

// ── Create ────────────────────────────────────────────────────────────────────
export const createSchedule = async (req, res) => {
  try {
    const { title, date, time, type, notes, assignedMemberId } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ message: "Title, date and time are required" });
    }
    const schedule = await TreatmentSchedule.create({
      patientId: req.user.id,
      title, date, time,
      type: type || "Checkup",
      notes: notes || "",
      assignedMemberId: assignedMemberId || null,   // ← NEW
    });
    res.status(201).json({ success: true, schedule });
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({ message: "Failed to create schedule" });
  }
};

// ── Get All (for logged-in patient) ──────────────────────────────────────────
export const getMySchedules = async (req, res) => {
  try {
    const schedules = await TreatmentSchedule.find({ patientId: req.user.id })
      .sort({ date: 1, time: 1 });
    res.json({ schedules });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch schedules" });
  }
};

// ── Update Status ─────────────────────────────────────────────────────────────
export const updateScheduleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const schedule = await TreatmentSchedule.findOneAndUpdate(
      { _id: id, patientId: req.user.id },
      { status },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ message: "Failed to update schedule" });
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await TreatmentSchedule.findOneAndDelete({
      _id: id,
      patientId: req.user.id,
    });
    if (!schedule) return res.status(404).json({ message: "Schedule not found" });
    res.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete schedule" });
  }
};
// ── Get schedules for a specific patient (for community members) ──────────────
export const getPatientSchedules = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify the requester is actually connected to this patient
    const Community = (await import("../models/Community.js")).default;
    const isConnected = await Community.findOne({
      patientId,
      memberId: req.user.id,
    });

    if (!isConnected) {
      return res.status(403).json({ message: "Not authorized to view this patient's schedule" });
    }

    const schedules = await TreatmentSchedule.find({ patientId })
      .sort({ date: 1, time: 1 });

    res.json({ schedules });
  } catch (error) {
    console.error("Get patient schedules error:", error);
    res.status(500).json({ message: "Failed to fetch patient schedules" });
  }
};