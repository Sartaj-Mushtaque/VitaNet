import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../screens/config/api";

let showSosModal = null;

// ─── Register Modal Handler ───────────────────────────────────────────────────
export const setSosModalHandler = (handler) => {
  showSosModal = handler;
};

// ─── Parse FCM Data (all fields come as strings) ─────────────────────────────
const parseSosData = (data, notification) => ({
  patientName: data.patientName || "Unknown Patient",
  latitude:    parseFloat(data.latitude),
  longitude:   parseFloat(data.longitude),
  address:     data.address  || "",
  message:     notification?.body || data.message || "Emergency! I need immediate help!",
});

// ─── Trigger SOS Modal ────────────────────────────────────────────────────────
const triggerSosModal = (remoteMessage, source) => {
  if (remoteMessage?.data?.type !== "SOS_ALERT") return;

  if (!showSosModal) {
    console.warn(`[NotificationService] SOS ${source}: handler not registered yet`);
    return;
  }

  const sosData = parseSosData(remoteMessage.data, remoteMessage.notification);

  if (isNaN(sosData.latitude) || isNaN(sosData.longitude)) {
    console.warn(`[NotificationService] SOS ${source}: invalid coordinates`, remoteMessage.data);
    return;
  }

  console.log(`[NotificationService] SOS ${source}: triggering modal`, sosData);
  showSosModal(sosData);
};

// ─── Request Permission ───────────────────────────────────────────────────────
export const requestNotificationPermission = async () => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    console.log("[NotificationService] Permission granted:", enabled);
    return enabled;
  } catch (error) {
    console.error("[NotificationService] Permission error:", error);
    return false;
  }
};

// ─── Save FCM Token to Backend ────────────────────────────────────────────────
export const registerFcmToken = async () => {
  try {
    const token = await messaging().getToken();
    if (!token) return;

    console.log("[NotificationService] FCM Token:", token);

    const authToken = await AsyncStorage.getItem("token");
    if (!authToken) return;

    await api.post(
      "/auth/fcm-token",
      { fcmToken: token },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log("[NotificationService] FCM token saved to backend");
  } catch (error) {
    console.error("[NotificationService] FCM token registration error:", error);
  }
};

// ─── Setup All Listeners ──────────────────────────────────────────────────────
export const setupNotificationHandlers = () => {
  // Foreground (app is open)
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("[NotificationService] Foreground message:", remoteMessage);
    triggerSosModal(remoteMessage, "foreground");
  });

  // Background tap (app minimized, user taps notification)
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log("[NotificationService] Background tap:", remoteMessage);
    triggerSosModal(remoteMessage, "background");
  });

  // Token refresh
  messaging().onTokenRefresh(async (newToken) => {
    console.log("[NotificationService] Token refreshed:", newToken);
    await registerFcmToken();
  });

  return unsubscribe;
};

// ─── Cold Start (app was killed, user taps notification) ──────────────────────
export const checkInitialNotification = async () => {
  try {
    const remoteMessage = await messaging().getInitialNotification();
    if (remoteMessage) {
      console.log("[NotificationService] Cold start message:", remoteMessage);
      triggerSosModal(remoteMessage, "cold-start");
    }
  } catch (error) {
    console.error("[NotificationService] Cold start check error:", error);
  }
};