import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { Calendar, Clock, ChevronLeft, User } from "lucide-react-native";
import api from "./config/api";

const COLORS = {
  blue600: "#185FA5", blue50: "#E6F1FB",
  green600: "#0F6E56", green50: "#E1F5EE",
  amber600: "#854F0B", amber50: "#FAEEDA",
  red600: "#A32D2D", red50: "#FCEBEB",
  purple600: "#534AB7", purple50: "#EEEDFE",
  bg: "#F4F5F7", surface: "#FFFFFF",
  border: "rgba(0,0,0,0.08)",
  textPrimary: "#1A1A1A", textSecondary: "#6B6B6B",
};

const TYPE_COLORS = {
  Checkup:     { bg: COLORS.blue50,   text: COLORS.blue600 },
  Transfusion: { bg: COLORS.red50,    text: COLORS.red600 },
  Medication:  { bg: COLORS.green50,  text: COLORS.green600 },
  "Lab Test":  { bg: COLORS.amber50,  text: COLORS.amber600 },
  Other:       { bg: COLORS.purple50, text: COLORS.purple600 },
};

const STATUS_CONFIG = {
  upcoming:  { label: "Upcoming",  bg: COLORS.blue50,  text: COLORS.blue600 },
  completed: { label: "Completed", bg: COLORS.green50, text: COLORS.green600 },
  cancelled: { label: "Cancelled", bg: COLORS.red50,   text: COLORS.red600 },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
};

export default function CommunityScheduleScreen({ navigation, route }) {
  const { patientId, patientName } = route?.params || {};

  const [schedules, setSchedules] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("upcoming");

  // ✅ ALL hooks must be before any early return
  const fetchSchedules = useCallback(async () => {
    if (!patientId) return; // guard inside the hook, not before it
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res   = await api.get(`/schedule/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules(res.data.schedules || []);
    } catch (e) {
      Toast.show({ type: "error", text1: "Failed to load schedules" });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const filtered = schedules.filter((s) =>
    filter === "all" ? true : s.status === filter
  );

  const upcomingCount = schedules.filter(s => s.status === "upcoming").length;

  // ✅ Early return AFTER all hooks
  if (!patientId) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg }}>
        <Text style={{ fontSize: 16, color: COLORS.textSecondary, marginBottom: 16 }}>
          No patient selected.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: COLORS.blue600, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <ChevronLeft size={22} color={COLORS.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Treatment Schedule</Text>
          <Text style={s.headerSub}>{patientName}</Text>
        </View>
      </View>

      {/* Patient Info Banner */}
      <View style={s.banner}>
        <View style={s.bannerIcon}>
          <User size={18} color={COLORS.blue600} strokeWidth={1.8} />
        </View>
        <View>
          <Text style={s.bannerName}>{patientName}</Text>
          <Text style={s.bannerSub}>
            {upcomingCount} upcoming appointment{upcomingCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={s.tabs}>
        {["upcoming", "completed", "all"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.tab, filter === f && s.tabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.tabText, filter === f && s.tabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.blue600} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Calendar size={48} color={COLORS.border} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No schedules found</Text>
          <Text style={s.emptySub}>
            {filter === "upcoming"
              ? "This patient has no upcoming appointments"
              : "Nothing to show here"}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}>
          {filtered.map((item) => {
            const typeColor  = TYPE_COLORS[item.type]    || TYPE_COLORS.Other;
            const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.upcoming;
            return (
              <View key={item._id} style={s.card}>

                <View style={s.cardTop}>
                  <View style={[s.typeBadge, { backgroundColor: typeColor.bg }]}>
                    <Text style={[s.typeBadgeText, { color: typeColor.text }]}>
                      {item.type}
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusConf.bg }]}>
                    <Text style={[s.statusText, { color: statusConf.text }]}>
                      {statusConf.label}
                    </Text>
                  </View>
                </View>

                <Text style={s.cardTitle}>{item.title}</Text>

                <View style={s.cardMeta}>
                  <View style={s.metaItem}>
                    <Calendar size={13} color={COLORS.textSecondary} strokeWidth={1.6} />
                    <Text style={s.metaText}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Clock size={13} color={COLORS.textSecondary} strokeWidth={1.6} />
                    <Text style={s.metaText}>{formatTime(item.time)}</Text>
                  </View>
                </View>

                {item.notes ? (
                  <Text style={s.cardNotes}>{item.notes}</Text>
                ) : null}

                <View style={s.readOnlyBadge}>
                  <Text style={s.readOnlyText}>👁 View only</Text>
                </View>

              </View>
            );
          })}
        </ScrollView>
      )}

      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  center:     { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    backgroundColor: COLORS.surface, padding: 16, paddingTop: 18,
    flexDirection: "row", alignItems: "center",
    borderBottomWidth: 0.5, borderColor: COLORS.border, gap: 10,
  },
  backBtn:     { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "500", color: COLORS.textPrimary },
  headerSub:   { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },

  banner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.surface, margin: 14,
    padding: 14, borderRadius: 12,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  bannerIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.blue50,
    alignItems: "center", justifyContent: "center",
  },
  bannerName: { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  bannerSub:  { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },

  tabs: {
    flexDirection: "row", backgroundColor: COLORS.surface,
    paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4,
    gap: 8, borderBottomWidth: 0.5, borderColor: COLORS.border,
  },
  tab:           { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: COLORS.bg },
  tabActive:     { backgroundColor: COLORS.blue600 },
  tabText:       { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  tabTextActive: { color: "#fff" },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "500", color: COLORS.textPrimary },
  emptySub:   { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", paddingHorizontal: 30 },

  card: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 14, borderWidth: 0.5, borderColor: COLORS.border, gap: 8,
  },
  cardTop:       { flexDirection: "row", gap: 8 },
  typeBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: "500" },
  statusBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: "auto" },
  statusText:    { fontSize: 11, fontWeight: "500" },
  cardTitle:     { fontSize: 15, fontWeight: "500", color: COLORS.textPrimary },
  cardMeta:      { flexDirection: "row", gap: 14 },
  metaItem:      { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText:      { fontSize: 12, color: COLORS.textSecondary },
  cardNotes:     { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },

  readOnlyBadge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 0.5, borderColor: COLORS.border,
  },
  readOnlyText: { fontSize: 11, color: COLORS.textSecondary },
});