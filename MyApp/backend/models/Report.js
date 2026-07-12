import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    folderName: String,
    fileName: String,
    fileType: String,

    // IMPORTANT
    fileUrl: String,
    filePath: String,
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);