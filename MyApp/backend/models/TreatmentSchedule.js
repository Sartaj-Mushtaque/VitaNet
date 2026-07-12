import mongoose from "mongoose";

const treatmentScheduleSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: { type: String, required: true },
  date: { type: String, required: true },   // "YYYY-MM-DD"
  time: { type: String, required: true },   // "HH:MM"
  type: {
    type: String,
    enum: ["Checkup", "Transfusion", "Medication", "Lab Test", "Other"],
    default: "Checkup",
  },
  notes: { type: String, default: "" },
  status: {
    type: String,
    enum: ["upcoming", "completed", "cancelled"],
    default: "upcoming",
  },

  // ── NEW: Who is assigned to help (e.g. blood donor) ──────────
  assignedMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  // ── NEW: Track which reminders already sent ───────────────────
  reminderSent: {
    threeDays: { type: Boolean, default: false },
    oneDay:    { type: Boolean, default: false },
    dayOf:     { type: Boolean, default: false },
  },

}, { timestamps: true });

export default mongoose.model("TreatmentSchedule", treatmentScheduleSchema);