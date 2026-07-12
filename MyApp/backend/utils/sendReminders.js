import cron from "node-cron";
import TreatmentSchedule from "../models/TreatmentSchedule.js";
import admin from "../config/firebase.js";

// ── Send a single FCM push notification ──────────────────────────────────────
const sendPush = async (fcmToken, title, body) => {
  if (!fcmToken) return;
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });
  } catch (err) {
    console.error("[Reminder] FCM send error:", err.message);
  }
};

// ── Main reminder function ────────────────────────────────────────────────────
const runReminders = async () => {
  try {
    const now      = new Date();
    const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

    // Get date strings for 1 day and 3 days from now
    const d1 = new Date(now); d1.setDate(now.getDate() + 1);
    const d3 = new Date(now); d3.setDate(now.getDate() + 3);
    const in1Day  = d1.toISOString().split("T")[0];
    const in3Days = d3.toISOString().split("T")[0];

    // Fetch all upcoming schedules in the next 3 days
    const schedules = await TreatmentSchedule.find({
      status: "upcoming",
      date: { $in: [todayStr, in1Day, in3Days] },
    })
      .populate("patientId",        "name fcmToken")
      .populate("assignedMemberId", "name fcmToken");

    for (const schedule of schedules) {
      const patient  = schedule.patientId;
      const assigned = schedule.assignedMemberId;
      const label    = `${schedule.type}: ${schedule.title}`;
      let changed    = false;

      // ── 3-day reminder ──────────────────────────────────────────────────────
      if (schedule.date === in3Days && !schedule.reminderSent.threeDays) {
        // Notify patient
        await sendPush(
          patient?.fcmToken,
          "Upcoming Treatment in 3 Days",
          `Reminder: ${label} is scheduled on ${schedule.date} at ${schedule.time}.`
        );
        // Notify assigned member
        if (assigned?.fcmToken) {
          await sendPush(
            assigned.fcmToken,
            `You're needed in 3 Days`,
            `${patient?.name} has a ${schedule.type} on ${schedule.date}. You are assigned to assist.`
          );
        }
        schedule.reminderSent.threeDays = true;
        changed = true;
        console.log(`[Reminder] 3-day sent for schedule ${schedule._id}`);
      }

      // ── 1-day reminder ──────────────────────────────────────────────────────
      if (schedule.date === in1Day && !schedule.reminderSent.oneDay) {
        await sendPush(
          patient?.fcmToken,
          "Treatment Tomorrow!",
          `Don't forget: ${label} is tomorrow at ${schedule.time}.`
        );
        if (assigned?.fcmToken) {
          await sendPush(
            assigned.fcmToken,
            `Reminder: ${patient?.name} needs you tomorrow`,
            `${patient?.name}'s ${schedule.type} is tomorrow at ${schedule.time}. Please be ready.`
          );
        }
        schedule.reminderSent.oneDay = true;
        changed = true;
        console.log(`[Reminder] 1-day sent for schedule ${schedule._id}`);
      }

      // ── Day-of reminder ─────────────────────────────────────────────────────
      if (schedule.date === todayStr && !schedule.reminderSent.dayOf) {
        await sendPush(
          patient?.fcmToken,
          "Treatment Today!",
          `Your ${label} is today at ${schedule.time}. Stay prepared!`
        );
        if (assigned?.fcmToken) {
          await sendPush(
            assigned.fcmToken,
            `Today: ${patient?.name} needs your help`,
            `${patient?.name}'s ${schedule.type} is today at ${schedule.time}. Please be there.`
          );
        }
        schedule.reminderSent.dayOf = true;
        changed = true;
        console.log(`[Reminder] Day-of sent for schedule ${schedule._id}`);
      }

      if (changed) await schedule.save();
    }
  } catch (err) {
    console.error("[Reminder] Cron error:", err.message);
  }
};

// ── Schedule: runs every day at 8:00 AM ──────────────────────────────────────
export const startReminderCron = () => {
  cron.schedule("* 8 * * *", () => {
    console.log("[Reminder] Running daily reminder check...");
    runReminders();
  });
  console.log("[Reminder] Cron job scheduled — runs daily at 8:00 AM");
};