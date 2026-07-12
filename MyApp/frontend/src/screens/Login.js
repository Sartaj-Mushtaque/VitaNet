import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import { Eye, EyeOff, Activity } from "lucide-react-native";
import api from "./config/api";

// ─── Design tokens (mirrors PatientDashboard exactly) ─────────────────────────
const TOKEN = {
  navy:         "#0C1A2E",
  navyMid:      "#14263D",
  navyLight:    "#1E3554",
  blue:         "#2563EB",
  blueMid:      "#3B82F6",
  blueGhost:    "#EFF6FF",

  white:        "#FFFFFF",
  cream:        "#FAFAF8",
  stone100:     "#F5F5F4",
  stone200:     "#E7E5E4",
  stone500:     "#78716C",
  stone700:     "#44403C",
  stone900:     "#1C1917",
};

// ─── Heartbeat Loading Screen (mirrors PatientDashboard loading style) ─────────
function LoadingScreen() {
  const pulse = useRef(new Animated.Value(0)).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Heartbeat pulse for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Line draw animation
    Animated.loop(
      Animated.timing(lineAnim, { toValue: 1, duration: 1800, useNativeDriver: false })
    ).start();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <View style={ls.root}>
      <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />
      <Animated.View style={[ls.iconWrap, { transform: [{ scale }] }]}>
        <Activity size={32} color={TOKEN.blue} strokeWidth={1.6} />
      </Animated.View>
      <Text style={ls.wordmark}>VitaNet</Text>
      <Text style={ls.tagline}>Your health, coordinated.</Text>
    </View>
  );
}

const ls = StyleSheet.create({
  root:     { flex: 1, backgroundColor: TOKEN.navy, alignItems: "center", justifyContent: "center", gap: 12 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: "rgba(37,99,235,0.15)", alignItems: "center", justifyContent: "center" },
  wordmark: { color: TOKEN.white, fontSize: 28, fontWeight: "800", letterSpacing: 1.5 },
  tagline:  { color: "rgba(255,255,255,0.45)", fontSize: 13, letterSpacing: 0.3 },
});

// ─── Main Login Component ─────────────────────────────────────────────────────
export default function Login({ navigation }) {
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [role,         setRole]         = useState("");
  const [loading,      setLoading]      = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appReady,     setAppReady]     = useState(false);

  // Fade-in animation for the card
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Brief loading screen — mirrors dashboard pattern
    const t = setTimeout(() => {
      setAppReady(true);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]).start();
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  const saveFcmToken = async (authToken) => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return;
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        await api.post(
          "/auth/save-token",
          { fcmToken },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      }
    } catch (error) {
      console.error("FCM token save error:", error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation", "Email and password are required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Validation", "Invalid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;

      if (!user || !token) {
        Alert.alert("Error", "Invalid login response");
        return;
      }

      // Admin: skip role picker
      if (user.role === "admin") {
        await AsyncStorage.setItem("token",     token);
        await AsyncStorage.setItem("userRole",  user.role);
        await AsyncStorage.setItem("userEmail", user.email);
        await AsyncStorage.setItem("userId",    user._id);
        navigation.replace("AdminDashboard");
        return;
      }

      // Non-admin: enforce role picker
      if (!role) {
        Alert.alert("Validation", "Please select a role");
        return;
      }

      await AsyncStorage.setItem("token",     token);
      await AsyncStorage.setItem("userRole",  user.role);
      await AsyncStorage.setItem("userEmail", user.email);
      await AsyncStorage.setItem("userId",    user._id);

      if (!user.isVerified) {
        Alert.alert("OTP Required", "Please verify your account with OTP");
        navigation.navigate("OtpVerify", {
          email:      user.email,
          role:       user.role,
          redirectTo: user.role === "patient" ? "PatientDashboard" : "CommunityDashboard",
        });
        return;
      }

      await saveFcmToken(token);
      navigation.replace(
        user.role === "patient" ? "PatientDashboard" : "CommunityDashboard"
      );
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!appReady) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={s.root}
    >
      <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />

      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Navy header band ── */}
        <View style={s.header}>
          {/* Logo + wordmark */}
          <View style={s.brandRow}>
            <View style={s.logoWrap}>
              {/* Replace with your actual logo — falls back to Activity icon */}
              <Image
                source={require("../assets/logo.png")}
                style={s.logoImg}
                resizeMode="contain"
                // If logo.png doesn't exist yet, comment the Image out and uncomment below:
                // onError={() => {}}
              />
            </View>
            <View>
              <Text style={s.wordmark}>VitaNet</Text>
              <Text style={s.tagline}>Your health, companion.</Text>
            </View>
          </View>

          <Text style={s.headerTitle}>Welcome back</Text>
          <Text style={s.headerSub}>Sign in to continue your care journey</Text>
        </View>

        {/* ── Form card ── */}
        <Animated.View
          style={[
            s.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Email */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your email"
              placeholderTextColor={TOKEN.stone500}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Password</Text>
            <View style={s.passwordWrapper}>
              <TextInput
                style={s.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={TOKEN.stone500}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPassword(v => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword
                  ? <EyeOff size={20} color={TOKEN.stone500} />
                  : <Eye    size={20} color={TOKEN.stone500} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Role */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Role</Text>
            <View style={s.pickerBox}>
              <Picker
                selectedValue={role}
                onValueChange={setRole}
                dropdownIconColor={TOKEN.stone500}
                style={{ color: TOKEN.stone900 }}
              >
                <Picker.Item label="Select your role"  value=""          color={TOKEN.stone500} />
                <Picker.Item label="Patient"           value="patient"   color={TOKEN.stone900} />
                <Picker.Item label="Community Member"  value="community" color={TOKEN.stone900} />
              </Picker>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            style={s.forgotWrap}
            onPress={() => navigation.navigate("ForgetPassword")}
          >
            <Text style={s.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign in button */}
          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.75 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.buttonText}>
              {loading ? "Signing in..." : "Sign in"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Create account */}
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => navigation.navigate("Signup")}
            activeOpacity={0.85}
          >
            <Text style={s.createBtnText}>Create an account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={s.footer}>VitaNet — Secure healthcare coordination</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: TOKEN.navy },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  // ── Header band ──
  header: {
    backgroundColor: TOKEN.navy,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  brandRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
  logoWrap:  {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  logoImg:   { width: 34, height: 34 },
  wordmark:  { color: TOKEN.white, fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  tagline:   { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 1, letterSpacing: 0.2 },

  headerTitle: { color: TOKEN.white, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  headerSub:   { color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 20 },

  // ── Card ──
  card: {
    backgroundColor: TOKEN.white,        // ✅ Always white — no OS dark mode bleed
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    // Lift shadow
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // ── Fields ──
  fieldGroup:     { marginBottom: 16 },
  fieldLabel:     {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: TOKEN.stone500,
    marginBottom: 8,
  },
  input: {
    backgroundColor: TOKEN.stone100,     // ✅ Always light — immune to dark mode
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    fontSize: 15,
    color: TOKEN.stone900,               // ✅ Always dark text
    borderWidth: 1,
    borderColor: TOKEN.stone200,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TOKEN.stone100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKEN.stone200,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: TOKEN.stone900,
  },
  eyeBtn: { paddingHorizontal: 13 },
  pickerBox: {
    backgroundColor: TOKEN.stone100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TOKEN.stone200,
    overflow: "hidden",
  },

  // ── Forgot ──
  forgotWrap: { alignSelf: "flex-end", marginTop: -4, marginBottom: 20 },
  forgotText: { color: TOKEN.blue, fontSize: 13, fontWeight: "600" },

  // ── Primary button ──
  button: {
    backgroundColor: TOKEN.navy,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: { color: TOKEN.white, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },

  // ── Divider ──
  dividerRow:  { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: TOKEN.stone200 },
  dividerText: { color: TOKEN.stone500, fontSize: 13 },

  // ── Secondary button ──
  createBtn: {
    borderWidth: 1.5,
    borderColor: TOKEN.navy,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  createBtnText: { color: TOKEN.navy, fontWeight: "700", fontSize: 15 },

  // ── Footer ──
  footer: {
    textAlign: "center",
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    marginTop: 24,
    letterSpacing: 0.2,
  },
});