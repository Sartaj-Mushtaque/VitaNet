import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
  Vibration,
  Alert,
} from "react-native";

const COLORS = {
  red600:        "#A32D2D",
  red50:         "#FCEBEB",
  red100:        "#F7C1C1",
  blue600:       "#185FA5",
  blue50:        "#E6F1FB",
  green600:      "#0F6E56",
  green50:       "#E1F5EE",
  amber50:       "#FAEEDA",
  amber600:      "#854F0B",
  bg:            "#F4F5F7",
  surface:       "#FFFFFF",
  border:        "rgba(0,0,0,0.08)",
  textPrimary:   "#1A1A1A",
  textSecondary: "#6B6B6B",
};

export default function SosAlertModal({ visible, data, onClose }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const pulseRef  = useRef(null);

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([400, 300, 400, 300, 400]);

      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    } else {
      pulseRef.current?.stop();
      slideAnim.setValue(300);
      Vibration.cancel();
    }
  }, [visible]);

  if (!data) return null;

  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  const openInMaps = () => {
    if (!hasValidCoords) {
      Alert.alert("Location Error", "Patient location coordinates are unavailable.");
      return;
    }

    const label = encodeURIComponent(`SOS - ${data.patientName || "Patient"}`);

    // Primary: Google Maps app deep link — pins exact location
    const googleMapsApp = `google.navigation:q=${lat},${lng}`;
    // Fallback 1: geo URI — works on all Android map apps
    const geoUri        = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    // Fallback 2: browser
    const googleMapsWeb = `https://maps.google.com/?q=${lat},${lng}&ll=${lat},${lng}&z=17`;

    Linking.canOpenURL(googleMapsApp)
      .then((supported) => {
        if (supported) return Linking.openURL(googleMapsApp);
        return Linking.canOpenURL(geoUri).then((geoSupported) => {
          if (geoSupported) return Linking.openURL(geoUri);
          return Linking.openURL(googleMapsWeb);
        });
      })
      .catch(() => {
        Linking.openURL(googleMapsWeb).catch(() =>
          Alert.alert("Error", "Unable to open maps. Please install Google Maps.")
        );
      });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

          {/* Header */}
          <View style={s.header}>
            <Animated.View style={[s.sosIconWrap, { transform: [{ scale: pulseAnim }] }]}>
              <View style={s.sosIconInner} />
            </Animated.View>
            <Text style={s.headerTitle}>Emergency SOS</Text>
            <Text style={s.headerSub}>Immediate assistance required</Text>
          </View>

          <View style={s.divider} />

          {/* Patient */}
          <View style={s.infoRow}>
            <View style={[s.iconBox, { backgroundColor: COLORS.blue50 }]}>
              <View style={s.personIcon}>
                <View style={s.personHead} />
                <View style={s.personBody} />
              </View>
            </View>
            <View style={s.infoText}>
              <Text style={s.infoLabel}>Patient</Text>
              <Text style={s.infoValue}>{data.patientName || "Unknown"}</Text>
            </View>
          </View>

          {/* Message */}
          <View style={s.infoRow}>
            <View style={[s.iconBox, { backgroundColor: COLORS.amber50 }]}>
              <View style={s.msgIcon}>
                <View style={s.msgLine} />
                <View style={[s.msgLine, { width: 14 }]} />
              </View>
            </View>
            <View style={s.infoText}>
              <Text style={s.infoLabel}>Message</Text>
              <Text style={s.infoValue}>
                {data.message || "Emergency! I need immediate help!"}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={s.infoRow}>
            <View style={[s.iconBox, { backgroundColor: COLORS.green50 }]}>
              <View style={s.pinIcon}>
                <View style={s.pinHead} />
                <View style={s.pinTail} />
              </View>
            </View>
            <View style={s.infoText}>
              <Text style={s.infoLabel}>Location</Text>
              <Text style={s.infoValue}>
                {data.address || "Location captured via GPS"}
              </Text>
              {hasValidCoords ? (
                <Text style={s.coords}>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </Text>
              ) : (
                <Text style={[s.coords, { color: COLORS.red600 }]}>
                  Coordinates unavailable
                </Text>
              )}
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[s.mapsBtn, !hasValidCoords && { opacity: 0.5 }]}
            onPress={openInMaps}
            disabled={!hasValidCoords}
            activeOpacity={0.85}
          >
            <Text style={s.mapsBtnText}>Open in Google Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.closeBtnText}>I'm on my way</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 44,
  },
  header: { alignItems: "center", marginBottom: 16 },
  sosIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.red50,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2, borderColor: COLORS.red600,
  },
  sosIconInner: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.red600,
  },
  headerTitle: {
    fontSize: 20, fontWeight: "500",
    color: COLORS.red600, letterSpacing: 0.5,
  },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  divider: { height: 0.5, backgroundColor: COLORS.border, marginVertical: 16 },

  infoRow: {
    flexDirection: "row", alignItems: "flex-start",
    marginBottom: 10, backgroundColor: COLORS.bg,
    padding: 12, borderRadius: 12, gap: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 10, color: COLORS.textSecondary,
    fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14, fontWeight: "500",
    color: COLORS.textPrimary, marginTop: 3, lineHeight: 20,
  },
  coords: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },

  // Pure-View icons (no SVG / no lucide needed)
  personIcon: { alignItems: "center" },
  personHead: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#185FA5", marginBottom: 2 },
  personBody: { width: 14, height: 8, borderRadius: 4, backgroundColor: "#185FA5" },
  msgIcon: { gap: 4 },
  msgLine: { width: 18, height: 2.5, borderRadius: 2, backgroundColor: "#854F0B" },
  pinIcon: { alignItems: "center" },
  pinHead: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#0F6E56" },
  pinTail: { width: 3, height: 7, backgroundColor: "#0F6E56", marginTop: -1, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },

  mapsBtn: {
    backgroundColor: COLORS.blue600,
    padding: 15, borderRadius: 12,
    alignItems: "center", marginTop: 12, marginBottom: 10,
  },
  mapsBtnText: { color: "#fff", fontWeight: "500", fontSize: 15 },
  closeBtn: {
    backgroundColor: COLORS.red600,
    padding: 15, borderRadius: 12, alignItems: "center",
  },
  closeBtnText: { color: "#fff", fontWeight: "500", fontSize: 15 },
});