import React, { useEffect } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />

      {/* Logo */}
      <View style={styles.logoCircle}>
        <Text style={styles.plus}>+</Text>
      </View>

      {/* App Name */}
      <Text style={styles.title}>VitaNet</Text>
      <Text style={styles.subtitle}>Your Health Companion</Text>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E88E5",
    justifyContent: "center",
    alignItems: "center",
  },

  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5, // Android shadow
  },

  plus: {
    fontSize: 64,
    fontWeight: "800",
    color: "#1E88E5",
    lineHeight: 64,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
    marginTop: 8,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#E3F2FD",
  },
});
