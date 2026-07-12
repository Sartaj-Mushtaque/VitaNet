// ResetPassword.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import api from "./config/api";

export default function ResetPassword({ route, navigation }) {
  const { email } = route.params || {};
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const inputRefs = useRef([]);

  const showModal = (message, autoClose = false, onClose) => {
    setModalMessage(message);
    setModalVisible(true);
    if (autoClose) {
      setTimeout(() => {
        setModalVisible(false);
        if (onClose) onClose();
      }, 1500);
    }
  };

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtpArr = [...otp];
      newOtpArr[index] = value;
      setOtp(newOtpArr);

      if (value && index < 5) inputRefs.current[index + 1].focus();
      if (!value && index > 0) inputRefs.current[index - 1].focus();
    }
  };

  const handleReset = async () => {
    const otpValue = otp.join("").trim();
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || otpValue.length !== 6 || !newPassword) {
      console.log("Validation failed:", { normalizedEmail, otpValue, newPassword });
      return showModal("Please fill all fields correctly");
    }

    console.log("Reset Password Payload:", { email: normalizedEmail, otp: otpValue, newPassword });

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: normalizedEmail,
        otp: otpValue,
        newPassword,
      });

      console.log("Reset Password Response:", res.data);
      showModal(res.data.message, true, () => navigation.navigate("Login"));
    } catch (err) {
      console.log("Reset Password Error:", err.response?.data || err.message);
      showModal(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>OTP sent to: {email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            style={styles.otpInput}
            keyboardType="numeric"
            maxLength={1}
            value={digit}
            onChangeText={(val) => handleOtpChange(index, val)}
          />
        ))}
      </View>

      <TextInput
        placeholder="New Password"
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Updating..." : "Update Password"}
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#EAF2FB" },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 10, textAlign: "center", color: "#1E88E5" },
  subtitle: { textAlign: "center", marginBottom: 20, color: "#666" },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  otpInput: { width: 45, height: 50, borderWidth: 1, borderColor: "#1E88E5", borderRadius: 12, textAlign: "center", fontSize: 20, backgroundColor: "#fff" },
  input: { height: 48, borderWidth: 1, borderColor: "#1E88E5", borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#fff", marginBottom: 12 },
  button: { backgroundColor: "#1E88E5", height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center", marginTop: 12 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: "80%", backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center" },
  modalText: { fontSize: 16, color: "#333", marginBottom: 20, textAlign: "center" },
  modalButton: { backgroundColor: "#1E88E5", paddingVertical: 10, paddingHorizontal: 30, borderRadius: 12 },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
