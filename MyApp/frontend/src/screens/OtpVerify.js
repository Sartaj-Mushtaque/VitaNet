import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import api from "./config/api";

export default function OtpVerify({ route, navigation }) {
  const { email: originalEmail, role, redirectTo } = route.params;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const inputsRef = useRef([]);

  const handleOtpChange = (text, index) => {
    if (!/^\d*$/.test(text)) return; // only allow numbers

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) inputsRef.current[index + 1].focus();
    if (!text && index > 0) inputsRef.current[index - 1].focus();
  };

  const handleVerify = useCallback(async () => {
    const otpString = otp.join("").trim();
    if (otpString.length < 6) {
      setSuccessMessage("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", {
        email: originalEmail.trim().toLowerCase(),
        otp: otpString,
      });

      // Show professional modal instead of Alert
      setSuccessMessage(response.data.message);
      setSuccessModalVisible(true);

      // Redirect after 1.5 seconds
      setTimeout(() => {
        setSuccessModalVisible(false);
        if (redirectTo) navigation.replace(redirectTo);
        else {
          if (role === "community") navigation.replace("CommunityDashboard", { email: originalEmail });
          else if (role === "patient") navigation.replace("PatientDashboard", { email: originalEmail });
          else if (role === "admin") navigation.replace("AdminDashboard", { email: originalEmail });
        }
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "OTP verification failed";
      console.error("OTP Verify Error:", msg);
      setSuccessMessage(msg);
      setSuccessModalVisible(true);
    } finally {
      setLoading(false);
    }
  }, [otp, originalEmail, role, redirectTo, navigation]);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-otp", {
        email: originalEmail.trim().toLowerCase(),
      });
      setSuccessMessage("OTP has been resent to your email");
      setSuccessModalVisible(true);
      setOtp(["", "", "", "", "", ""]);
      inputsRef.current[0].focus();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to resend OTP";
      console.error("Resend OTP Error:", msg);
      setSuccessMessage(msg);
      setSuccessModalVisible(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>We’ve sent a 6-digit code to your email</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref)}
            value={digit}
            onChangeText={(text) => handleOtpChange(text, index)}
            keyboardType="number-pad"
            maxLength={1}
            style={styles.otpInput}
            textAlign="center"
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
        {resending ? <ActivityIndicator color="#28a745" /> : <Text style={styles.resendText}>Resend OTP</Text>}
      </TouchableOpacity>

      {/* Professional Success Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Notification</Text>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <Pressable style={styles.modalButton} onPress={() => setSuccessModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 10, textAlign: "center" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: 20 },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  otpInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    width: 45,
    height: 55,
    borderRadius: 8,
    fontSize: 20,
    color: "#000",
  },
  button: { backgroundColor: "#28a745", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 12 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "700", fontSize: 16 },
  resendButton: { alignItems: "center", padding: 10 },
  resendText: { color: "#28a745", fontWeight: "600" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  modalMessage: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  modalButton: { backgroundColor: "#28a745", borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
