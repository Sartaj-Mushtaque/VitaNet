import React, { useEffect, useState } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  setupNotificationHandlers,
  setSosModalHandler,
  checkInitialNotification,
  requestNotificationPermission,
  registerFcmToken,
} from "./src/services/notificationService";
import SosAlertModal from "./src/components/SosAlertModal";
import { AppProvider } from "./src/context/AppContext";

export default function App() {
  const [sosVisible, setSosVisible] = useState(false);
  const [sosData, setSosData]       = useState(null);

  useEffect(() => {
    // 1. Register SOS modal handler FIRST
    setSosModalHandler((data) => {
      setSosData(data);
      setSosVisible(true);
    });

    // 2. Request permission + save FCM token
    requestNotificationPermission().then((granted) => {
      if (granted) registerFcmToken();
    });

    // 3. Setup foreground + background listeners
    const unsubscribe = setupNotificationHandlers();

    // 4. Check cold start AFTER handler is registered
    checkInitialNotification();

    return unsubscribe;
  }, []);

  return (
    <AppProvider>
      <AppNavigator />
      <SosAlertModal
        visible={sosVisible}
        data={sosData}
        onClose={() => setSosVisible(false)}
      />
    </AppProvider>
  );
}