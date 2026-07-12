import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["family", "volunteer", "donor"], default: "family" },
  joinedAt: { type: Date, default: Date.now }
});

const Community = mongoose.model("Community", communitySchema);
export default Community;
