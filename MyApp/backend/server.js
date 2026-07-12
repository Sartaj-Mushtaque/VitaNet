import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import patientRoutes from "./routes/patientRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import sosRoutes from "./routes/sosRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import healthCentersRoute from "./routes/healthCentersRoute.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import { startReminderCron } from "./utils/sendReminders.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

fs.mkdirSync("uploads", { recursive: true });

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB Connected");
      startReminderCron();
    })
    .catch((err) => console.log("MongoDB Error:", err.message));

app.use("/api/auth",           authRoutes);
app.use("/api/admin",          adminRoutes);
app.use("/api/patient",        patientRoutes);
app.use("/api/invite",         invitationRoutes);
app.use("/api/community",      communityRoutes);
app.use("/api/sos",            sosRoutes);
app.use("/api/reports",        reportRoutes);
app.use("/api/health-centers", healthCentersRoute);
app.use("/api/schedule",       scheduleRoutes);

app.get("/", (req, res) => res.send("API is running..."));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));