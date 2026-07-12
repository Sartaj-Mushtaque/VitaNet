import mongoose from "mongoose";

const sosAlertSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String, default: "" },
  },
  message: {
    type: String,
    default: "Emergency! I need immediate help!",
  },
  notifiedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  status: {
    type: String,
    enum: ["active", "resolved"],
    default: "active",
  },
}, { timestamps: true });

export default mongoose.model("SosAlert", sosAlertSchema);