import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { API_BASE } from "./config/api";



export default function OtpScreen({ route, navigation }) {
  const { email, role } = route.params;
  const [otp, setOtp] = useState("");

  const handleVerify = async () => {
    if (!otp) return Alert.alert("Error", "Enter OTP");

    try {
      const res = await axios.post(`${API_BASE}/api/auth/verify-otp`, { email, otp });
      Alert.alert("Success", "OTP verified");

      if (role === "community") navigation.replace("CommunityDashboard", { email });
      else if (role === "patient") navigation.replace("PatientDashboard", { email });
      else if (role === "admin") navigation.replace("AdminDashboard", { email });
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <TextInput
        placeholder="Enter OTP"
        keyboardType="number-pad"
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
      />
      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 16 },
  button: { backgroundColor: "#1976d2", padding: 15, borderRadius: 8 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
