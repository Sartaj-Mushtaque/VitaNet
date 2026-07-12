import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from "react-native";
import axios from "axios";
import { API_BASE } from "./config/api";

export default function ProfileScreen({ route, navigation }) {
  const { email } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user
  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/auth/user-by-email/${email}`);
      if (res.data?.user) setUser(res.data.user);
      else {
        Alert.alert("Error", "No user data found");
        navigation.goBack();
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      Alert.alert("Error", "Failed to fetch user data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [email, navigation]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#d32f2f" />
      </View>
    );

  if (!user)
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data found.</Text>
      </View>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      <Text style={styles.title}>Profile Details</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>Name: {user.name}</Text>
        <Text style={styles.infoText}>Email: {user.email}</Text>
        <Text style={styles.infoText}>Role: {user.role}</Text>
        <Text style={styles.infoText}>Blood Group: {user.bloodGroup || "N/A"}</Text>
        <Text style={styles.infoText}>Transfusions this month: 0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollPadding: { padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  infoBox: { padding: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 10 },
  infoText: { fontSize: 16, marginVertical: 6 },
  errorText: { fontSize: 16, color: "red", textAlign: "center", marginTop: 50 },
});
