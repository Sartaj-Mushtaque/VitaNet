// src/screens/CommunityAlerts.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import api from "./config/api";

// ── colour tokens (matches your existing dashboard) ──────────────────────────
const C = {
  bg:            "#F0F4F8",
  surface:       "#FFFFFF",
  border:        "rgba(0,0,0,0.07)",
  textPrimary:   "#1A1A2E",
  textSecondary: "#6B7280",
  blue600:       "#185FA5",
  blue50:        "#E6F1FB",
  red600:        "#A32D2D",
  red50:         "#FCEBEB",
  red400:        "#E05252",
  green600:      "#0F6E56",
  green50:       "#E1F5EE",
  amber600:      "#854F0B",
  amber50:       "#FAEEDA",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const SEVERITY = {
  critical: { label: "Critical",  bg: C.red50,   text: C.red600,   dot: C.red400   },
  high:     { label: "High",      bg: C.amber50, text: C.amber600, dot: C.amber600 },
  normal:   { label: "Normal",    bg: C.blue50,  text: C.blue600,  dot: C.blue600  },
  resolved: { label: "Resolved",  bg: C.green50, text: C.green600, dot: C.green600 },
};

// ── API ───────────────────────────────────────────────────────────────────────
const fetchAlerts = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.get("/alerts/community", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data.alerts) ? res.data.alerts : [];
};

const markAlertRead = async (alertId) => {
  const token = await AsyncStorage.getItem("token");
  await api.patch(`/alerts/${alertId}/read`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ── component ─────────────────────────────────────────────────────────────────
export default function CommunityAlerts({ navigation }) {
  const [alerts,      setAlerts]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeFilter, setFilter]     = useState("all");

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (e) {
      Toast.show({ type: "error", text1: e.message || "Failed to load alerts" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (alertId) => {
    try {
      await markAlertRead(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a._id === alertId ? { ...a, read: true } : a))
      );
    } catch {
      Toast.show({ type: "error", text1: "Could not mark as read" });
    }
  };

  const filters = ["all", "critical", "high", "normal", "resolved"];
  const filtered = alerts.filter((a) =>
    activeFilter === "all" ? true : (a.severity || "normal") === activeFilter
  );
  const unreadCount = alerts.filter((a) => !a.read).length;

  if (loading) {
    return (
      <View style={st.loader}>
        <ActivityIndicator size="large" color={C.red600} />
        <Text style={st.loadingText}>Loading alerts…</Text>
      </View>
    );
  }

  return (
    <View style={st.container}>

      {/* ── Header ── */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={st.backBtn}>
          <Text style={st.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.headerTitle}>Emergency Alerts</Text>
          <Text style={st.headerSub}>SOS &amp; community notifications</Text>
        </View>
        {unreadCount > 0 && (
          <View style={st.unreadBadge}>
            <Text style={st.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* ── Active SOS Banner (if any critical unread) ── */}
      {alerts.some((a) => a.severity === "critical" && !a.read) && (
        <View style={st.sosBanner}>
          <Text style={st.sosPulse}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={st.sosTitle}>Active Emergency</Text>
            <Text style={st.sosSub}>A patient needs immediate help</Text>
          </View>
          <View style={st.sosDot} />
        </View>
      )}

      {/* ── Filter Tabs ── */}
      <View style={st.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[st.filterChip, activeFilter === f && st.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[st.filterText, activeFilter === f && st.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[C.red600]}
            tintColor={C.red600}
          />
        }
        ListEmptyComponent={
          <View style={st.empty}>
            <Text style={st.emptyEmoji}>🔔</Text>
            <Text style={st.emptyTitle}>No alerts</Text>
            <Text style={st.emptySub}>
              {activeFilter === "all"
                ? "You have no alerts right now."
                : `No ${activeFilter} alerts found.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const sev = SEVERITY[item.severity || "normal"];
          return (
            <View style={[st.card, !item.read && st.cardUnread]}>

              {/* Severity stripe */}
              <View style={[st.stripe, { backgroundColor: sev.dot }]} />

              <View style={st.cardBody}>
                {/* Top row */}
                <View style={st.cardTop}>
                  <View style={[st.sevBadge, { backgroundColor: sev.bg }]}>
                    <View style={[st.sevDot, { backgroundColor: sev.dot }]} />
                    <Text style={[st.sevText, { color: sev.text }]}>{sev.label}</Text>
                  </View>
                  <Text style={st.timeText}>{timeAgo(item.createdAt)}</Text>
                </View>

                {/* Patient name */}
                <Text style={st.cardPatient}>
                  🏥 {item.patientName || "Unknown Patient"}
                </Text>

                {/* Message */}
                <Text style={st.cardMessage}>{item.message || "Emergency assistance needed."}</Text>

                {/* Location (if present) */}
                {item.location && (
                  <View style={st.locationRow}>
                    <Text style={st.locationIcon}>📍</Text>
                    <Text style={st.locationText}>{item.location}</Text>
                  </View>
                )}

                {/* Actions */}
                <View style={st.cardActions}>
                  {!item.read && (
                    <TouchableOpacity
                      style={st.readBtn}
                      onPress={() => handleMarkRead(item._id)}
                    >
                      <Text style={st.readBtnText}>✓ Mark Read</Text>
                    </TouchableOpacity>
                  )}
                  {item.read && (
                    <View style={st.readTag}>
                      <Text style={st.readTagText}>✓ Read</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <Toast />
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  loader:      { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg },
  loadingText: { marginTop: 10, fontSize: 13, color: C.textSecondary },

  header: {
    backgroundColor: C.surface,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    borderBottomWidth: 0.5, borderColor: C.border,
  },
  backBtn:     { padding: 4 },
  backArrow:   { fontSize: 28, color: C.textPrimary, lineHeight: 30 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: C.textPrimary },
  headerSub:   { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  unreadBadge: {
    backgroundColor: C.red600,
    borderRadius: 12, minWidth: 24, height: 24,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  sosBanner: {
    backgroundColor: C.red50,
    marginHorizontal: 14, marginTop: 14,
    borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: C.red600,
  },
  sosPulse:  { fontSize: 26 },
  sosTitle:  { fontSize: 14, fontWeight: "700", color: C.red600 },
  sosSub:    { fontSize: 12, color: C.red600, marginTop: 2, opacity: 0.8 },
  sosDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.red400,
  },

  filterRow: {
    flexDirection: "row", paddingHorizontal: 14,
    paddingVertical: 12, gap: 8, flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: C.surface,
    borderWidth: 0.5, borderColor: C.border,
  },
  filterChipActive: { backgroundColor: C.red600, borderColor: C.red600 },
  filterText:       { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "700" },

  listContent: { paddingHorizontal: 14, paddingBottom: 40, gap: 10 },

  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  emptySub:   { fontSize: 13, color: C.textSecondary, textAlign: "center", paddingHorizontal: 30 },

  card: {
    backgroundColor: C.surface, borderRadius: 16,
    flexDirection: "row", overflow: "hidden",
    borderWidth: 0.5, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardUnread: { borderColor: "rgba(163,45,45,0.25)" },
  stripe:     { width: 5 },
  cardBody:   { flex: 1, padding: 14, gap: 8 },

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sevBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  sevDot:    { width: 6, height: 6, borderRadius: 3 },
  sevText:   { fontSize: 11, fontWeight: "600" },
  timeText:  { fontSize: 11, color: C.textSecondary },

  cardPatient: { fontSize: 13, fontWeight: "600", color: C.textPrimary },
  cardMessage: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 12, color: C.textSecondary },

  cardActions: { flexDirection: "row", marginTop: 2 },
  readBtn: {
    backgroundColor: C.green50,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  readBtnText: { color: C.green600, fontSize: 12, fontWeight: "600" },
  readTag: {
    backgroundColor: C.bg,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  readTagText: { color: C.textSecondary, fontSize: 12 },
});