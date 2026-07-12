import SosAlert from "../models/SosAlert.js";
import Community from "../models/Community.js";
import User from "../models/User.js";
import admin from "../config/firebase.js";

// ================= SEND SOS =================
export const sendSos = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { latitude, longitude, address, message } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location is required" });
    }

    const patient = await User.findById(patientId).select("name");

    const communityLinks = await Community.find({ patientId }).populate(
      "memberId",
      "name email fcmToken"
    );

    const notifiedMembers = communityLinks.map((c) => c.memberId._id);

    // Use address if provided otherwise show coordinates
    const locationAddress =
      address || `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;

    const sos = await SosAlert.create({
      patientId,
      location: { latitude, longitude, address: locationAddress },
      message: message || "Emergency! I need immediate help!",
      notifiedMembers,
    });

    // Send FCM to each member
    const fcmPromises = communityLinks
      .filter((link) => link.memberId.fcmToken)
      .map((link) => {
        return admin.messaging().send({
          token: link.memberId.fcmToken,
          notification: {
            title: `🚨 SOS Alert from ${patient.name}`,
            body: message || "Emergency! I need immediate help!",
          },
          data: {
            type: "SOS_ALERT",
            sosId: sos._id.toString(),
            patientId: patientId.toString(),
            patientName: patient.name,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: locationAddress,
          },
          android: {
            priority: "high",
            notification: {
              sound: "default",
              channelId: "sos_alerts",
            },
          },
        });
      });

    const results = await Promise.allSettled(fcmPromises);
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`SOS sent: ${succeeded} succeeded, ${failed} failed`);

    res.status(201).json({
      success: true,
      message: `SOS alert sent to ${succeeded} member(s)`,
      sosId: sos._id,
    });
  } catch (error) {
    console.error("SOS Error:", error);
    res.status(500).json({ message: "Failed to send SOS alert" });
  }
};

// ================= GET MY SOS HISTORY (Patient) =================
export const getMySosHistory = async (req, res) => {
  try {
    const patientId = req.user.id;
    const alerts = await SosAlert.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch SOS history" });
  }
};

// ================= GET RECEIVED SOS (Community Member) =================
export const getReceivedSos = async (req, res) => {
  try {
    const memberId = req.user.id;
    const alerts = await SosAlert.find({ notifiedMembers: memberId })
      .populate("patientId", "name email")
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch received SOS alerts" });
  }
};

// ================= RESOLVE SOS =================
export const resolveSos = async (req, res) => {
  try {
    const { sosId } = req.params;
    const sos = await SosAlert.findByIdAndUpdate(
      sosId,
      { status: "resolved" },
      { new: true }
    );
    if (!sos) return res.status(404).json({ message: "SOS alert not found" });
    res.json({ message: "SOS resolved", sos });
  } catch (error) {
    res.status(500).json({ message: "Failed to resolve SOS" });
  }
  const fcmPromises = communityLinks
    .filter((link) => link.memberId.fcmToken)
    .map((link) => {
      console.log("Sending FCM to:", link.memberId.email, "| Token:", link.memberId.fcmToken.slice(0, 30));  // ADD THIS
      return admin.messaging().send({
        token: link.memberId.fcmToken,
        // ... rest of your payload
      });
    });

  const results = await Promise.allSettled(fcmPromises);

  // ADD THESE LOGS
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`FCM ${i + 1} SUCCESS:`, result.value);
    } else {
      console.log(`FCM ${i + 1} FAILED:`, result.reason?.message || result.reason);
    }
  });
};