import messaging from "@react-native-firebase/messaging";
import { Linking, Alert } from "react-native";

let showSosModal = null;

export const setSosModalHandler = (handler) => {
  showSosModal = handler;
};

// Safely parse SOS data from FCM (all fields arrive as strings)
const parseSosData = (data) => ({
  patientName: data.patientName || "Unknown Patient",
  latitude:    parseFloat(data.latitude),
  longitude:   parseFloat(data.longitude),
  address:     data.address || "",
  message:     data.message  || "Emergency! I need immediate help!",
});

// Open Google Maps pinned to the exact patient location
export const openPatientLocationOnMap = (latitude, longitude, patientName) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lng)) {
    Alert.alert("Location Error", "Could not read patient location coordinates.");
    return;
  }

  const label = encodeURIComponent(`SOS - ${patientName || "Patient"}`);
  const url   = `https://www.google.com/maps?q=${lat},${lng}&label=${label}`;

  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback to geo URI (works on most Android devices)
        Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
      }
    })
    .catch(() => {
      Alert.alert("Error", "Unable to open Google Maps.");
    });
};

export const setupNotificationHandlers = () => {
  // ── Foreground ──────────────────────────────────────────────
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    if (remoteMessage.data?.type === "SOS_ALERT" && showSosModal) {
      const sosData = parseSosData({
        ...remoteMessage.data,
        message: remoteMessage.notification?.body,
      });

      if (isNaN(sosData.latitude) || isNaN(sosData.longitude)) {
        console.warn("SOS foreground: invalid coordinates", remoteMessage.data);
        return;
      }

      showSosModal(sosData);
    }
  });

  // ── Background (app open, tapped notification) ───────────────
  messaging().onNotificationOpenedApp((remoteMessage) => {
    if (remoteMessage.data?.type === "SOS_ALERT" && showSosModal) {
      const sosData = parseSosData(remoteMessage.data);

      if (isNaN(sosData.latitude) || isNaN(sosData.longitude)) {
        console.warn("SOS background: invalid coordinates", remoteMessage.data);
        return;
      }

      showSosModal(sosData);
    }
  });

  // ── Cold start (app was closed, tapped notification) ─────────
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage?.data?.type === "SOS_ALERT" && showSosModal) {
        const sosData = parseSosData(remoteMessage.data);

        if (isNaN(sosData.latitude) || isNaN(sosData.longitude)) {
          console.warn("SOS cold start: invalid coordinates", remoteMessage.data);
          return;
        }

        showSosModal(sosData);
      }
    });

  return unsubscribe;
};