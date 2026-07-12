import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Eye, EyeOff, Activity } from "lucide-react-native";
import api from "./config/api";

// ─── Design tokens (identical to Login & PatientDashboard) ────────────────────
const TOKEN = {
  navy:      "#0C1A2E",
  navyLight: "#1E3554",
  blue:      "#2563EB",
  white:     "#FFFFFF",
  cream:     "#FAFAF8",
  stone100:  "#F5F5F4",
  stone200:  "#E7E5E4",
  stone500:  "#78716C",
  stone700:  "#44403C",
  stone900:  "#1C1917",
};

const PASSWORD_REGEX = /^(?=.{8,}$)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/;
const GMAIL_REGEX    = /@gmail\.com$/i;

// ─── Main Signup Component ────────────────────────────────────────────────────
export default function Signup({ navigation }) {
  const [role,         setRole]         = useState("patient");
  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,             setLoading]             = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [confirmPassword,     setConfirmPassword]     = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [appReady,            setAppReady]            = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Heartbeat pulse for loading icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    const t = setTimeout(() => {
      pulse.stop();
      setAppReady(true);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]).start();
    }, 1400);
    return () => { clearTimeout(t); pulse.stop(); };
  }, []);

  const validate = () => {
    if (!name.trim())            { Alert.alert("Validation", "Full name is required"); return false; }
    if (!email.trim())           { Alert.alert("Validation", "Email is required"); return false; }
    if (!GMAIL_REGEX.test(email)){ Alert.alert("Validation", "Use a valid @gmail.com email"); return false; }
    if (!password)               { Alert.alert("Validation", "Password is required"); return false; }
    if (!PASSWORD_REGEX.test(password)) {
      Alert.alert("Validation", "Password must be 8+ characters and contain a special character");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation", "Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const response = await api.post("/auth/register", { name, email, password, role });
      console.log("Signup success:", response.data);
      Alert.alert("Success", "OTP sent to your email");
      navigation.replace("OtpVerify", { email, role, redirectTo: "Login" });
    } catch (err) {
      console.error("Signup error:", err);
      if (err.response) {
        Alert.alert("Error", err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        Alert.alert("Error", "No response from server. Check your network or try again later.");
      } else {
        Alert.alert("Error", `Unexpected error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ── Loading screen — inlined, no sub-component, no extra hooks ── */}
      {!appReady && (
        <View style={{ flex: 1, backgroundColor: TOKEN.navy, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />
          <Animated.View style={{
            width: 64, height: 64, borderRadius: 20,
            backgroundColor: "rgba(37,99,235,0.15)",
            alignItems: "center", justifyContent: "center",
            transform: [{ scale: pulseAnim }],
          }}>
            <Activity size={32} color={TOKEN.blue} strokeWidth={1.6} />
          </Animated.View>
          <Text style={{ color: TOKEN.white, fontSize: 28, fontWeight: "800", letterSpacing: 1.5 }}>VitaNet</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, letterSpacing: 0.3 }}>Your health, coordinated.</Text>
        </View>
      )}

      {/* ── Main screen — hidden until ready ── */}
      {appReady && (
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
          <View style={s.brandRow}>
            <View style={s.logoWrap}>
              <Image
                source={require("../assets/logo.png")}
                style={s.logoImg}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={s.wordmark}>VitaNet</Text>
              <Text style={s.tagline}>Your health, coordinated.</Text>
            </View>
          </View>
          <Text style={s.headerTitle}>Create Account</Text>
          <Text style={s.headerSub}>Join VitaNet for better healthcare coordination</Text>
        </View>

        {/* ── Form card ── */}
        <Animated.View
          style={[
            s.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Full Name */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Full Name</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your full name"
              placeholderTextColor={TOKEN.stone500}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="Enter your @gmail.com email"
              placeholderTextColor={TOKEN.stone500}
              keyboardType="email-address"
              autoCapitalize="none"
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
                placeholder="8+ chars with a special character"
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
            <Text style={s.hint}>Must be 8+ characters and include a special character</Text>
          </View>

          {/* Confirm Password */}
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>Confirm Password</Text>
            <View style={[
              s.passwordWrapper,
              confirmPassword.length > 0 && {
                borderColor: confirmPassword === password ? "#059669" : "#DC2626",
              },
            ]}>
              <TextInput
                style={s.passwordInput}
                placeholder="Re-enter your password"
                placeholderTextColor={TOKEN.stone500}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowConfirmPassword(v => !v)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmPassword
                  ? <EyeOff size={20} color={TOKEN.stone500} />
                  : <Eye    size={20} color={TOKEN.stone500} />
                }
              </TouchableOpacity>
            </View>
            {/* Live match indicator */}
            {confirmPassword.length > 0 && (
              <Text style={[
                s.hint,
                { color: confirmPassword === password ? "#059669" : "#DC2626" },
              ]}>
                {confirmPassword === password ? "Passwords match" : "Passwords do not match"}
              </Text>
            )}
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
                <Picker.Item label="Patient"          value="patient"   color={TOKEN.stone900} />
                <Picker.Item label="Community Member" value="community" color={TOKEN.stone900} />
              </Picker>
            </View>
          </View>

          {/* Create account button */}
          <TouchableOpacity
            style={[s.button, loading && { opacity: 0.75 }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={s.buttonText}>
              {loading ? "Creating account..." : "Create Account"}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Back to login */}
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => navigation.navigate("Login")}
            activeOpacity={0.85}
          >
            <Text style={s.loginBtnText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={s.footer}>VitaNet — Secure healthcare coordination</Text>
      </ScrollView>
    </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: TOKEN.navy },
  scroll: { flexGrow: 1, paddingBottom: 32 },

  // ── Header ──
  header: {
    backgroundColor: TOKEN.navy,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  brandRow:  { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
  logoWrap:  {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center", justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  logoImg:     { width: 34, height: 34 },
  wordmark:    { color: TOKEN.white, fontSize: 18, fontWeight: "800", letterSpacing: 1 },
  tagline:     { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 1, letterSpacing: 0.2 },
  headerTitle: { color: TOKEN.white, fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  headerSub:   { color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 20 },

  // ── Card ──
  card: {
    backgroundColor: TOKEN.white,        // ✅ Always white — immune to OS dark mode
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  // ── Fields ──
  fieldGroup:  { marginBottom: 16 },
  fieldLabel:  {
    fontSize: 11, fontWeight: "700",
    letterSpacing: 0.9, textTransform: "uppercase",
    color: TOKEN.stone500, marginBottom: 8,
  },
  input: {
    backgroundColor: TOKEN.stone100,     // ✅ Always light
    paddingHorizontal: 14, paddingVertical: 13,
    borderRadius: 12, fontSize: 15,
    color: TOKEN.stone900,               // ✅ Always dark text
    borderWidth: 1, borderColor: TOKEN.stone200,
  },
  passwordWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: TOKEN.stone100,
    borderRadius: 12, borderWidth: 1, borderColor: TOKEN.stone200,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: TOKEN.stone900,
  },
  eyeBtn: { paddingHorizontal: 13 },
  hint:   { fontSize: 11, color: TOKEN.stone500, marginTop: 6, lineHeight: 16 },
  pickerBox: {
    backgroundColor: TOKEN.stone100,
    borderRadius: 12, borderWidth: 1, borderColor: TOKEN.stone200,
    overflow: "hidden",
  },

  // ── Primary button ──
  button: {
    backgroundColor: TOKEN.navy,
    paddingVertical: 15, borderRadius: 14, alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: TOKEN.white, fontWeight: "800", fontSize: 15, letterSpacing: 0.3 },

  // ── Divider ──
  dividerRow:  { flexDirection: "row", alignItems: "center", marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: TOKEN.stone200 },
  dividerText: { color: TOKEN.stone500, fontSize: 13 },

  // ── Secondary button ──
  loginBtn: {
    borderWidth: 1.5, borderColor: TOKEN.navy,
    paddingVertical: 14, borderRadius: 14, alignItems: "center",
  },
  loginBtnText: { color: TOKEN.navy, fontWeight: "700", fontSize: 15 },

  // ── Footer ──
  footer: {
    textAlign: "center", color: "rgba(255,255,255,0.25)",
    fontSize: 11, marginTop: 24, letterSpacing: 0.2,
  },
});