import mongoose from "mongoose";

const patientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    bloodGroup: {
      type: String,
    },

    address: {
      type: String,
    },

    disease: {
      type: String,
    },

    phone: {
      type: String,
    },

    city: {
      type: String,
    },

    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "PatientProfile",
  patientProfileSchema
);