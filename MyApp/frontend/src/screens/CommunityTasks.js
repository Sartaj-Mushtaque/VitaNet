// src/screens/CommunityTasks.js
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl, Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import api from "./config/api";

// ── colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:            "#F0F4F8",
  surface:       "#FFFFFF",
  border:        "rgba(0,0,0,0.07)",
  textPrimary:   "#1A1A2E",
  textSecondary: "#6B7280",
  blue600:       "#185FA5",
  blue50:        "#E6F1FB",
  green600:      "#0F6E56",
  green50:       "#E1F5EE",
  amber600:      "#854F0B",
  amber50:       "#FAEEDA",
  red600:        "#A32D2D",
  red50:         "#FCEBEB",
  purple600:     "#534AB7",
  purple50:      "#EEEDFE",
};

// ── config ────────────────────────────────────────────────────────────────────
const TASK_TYPE = {
  donation:    { emoji: "🩸", label: "Blood Donation", bg: C.red50,    text: C.red600    },
  scheduling:  { emoji: "📅", label: "Scheduling",     bg: C.blue50,   text: C.blue600   },
  transport:   { emoji: "🚗", label: "Transport",      bg: C.amber50,  text: C.amber600  },
  medication:  { emoji: "💊", label: "Medication",     bg: C.green50,  text: C.green600  },
  general:     { emoji: "📋", label: "General",        bg: C.purple50, text: C.purple600 },
};

const TASK_STATUS = {
  pending:    { label: "Pending",     bg: C.amber50,  text: C.amber600  },
  accepted:   { label: "Accepted",    bg: C.blue50,   text: C.blue600   },
  completed:  { label: "Completed",   bg: C.green50,  text: C.green600  },
  declined:   { label: "Declined",    bg: C.red50,    text: C.red600    },
};

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchTasks = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.get("/tasks/my-tasks", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data.tasks) ? res.data.tasks : [];
};

const respondToTask = async (taskId, action) => {
  const token = await AsyncStorage.getItem("token");
  const res = await api.patch(
    `/tasks/${taskId}/respond`,
    { action }, // "accept" | "decline" | "complete"
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.message;
};

// ── helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
};

// ── component ─────────────────────────────────────────────────────────────────
export default function CommunityTasks({ navigation }) {
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [activeFilter, setFilter]       = useState("pending");
  const [confirmModal, setConfirmModal] = useState(null); // { taskId, action, title }
  const [responding,   setResponding]   = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
    } catch (e) {
      Toast.show({ type: "error", text1: e.message || "Failed to load tasks" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRespond = async () => {
    if (!confirmModal) return;
    try {
      setResponding(true);
      const msg = await respondToTask(confirmModal.taskId, confirmModal.action);
      Toast.show({ type: "success", text1: msg || "Response sent!" });
      setConfirmModal(null);
      load();
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || "Failed to respond" });
    } finally {
      setResponding(false);
    }
  };

  const filters  = ["pending", "accepted", "completed", "all"];
  const filtered = tasks.filter((t) =>
    activeFilter === "all" ? true : t.status === activeFilter
  );
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  if (loading) {
    return (
      <View style={st.loader}>
        <ActivityIndicator size="large" color={C.blue600} />
        <Text style={st.loadingText}>Loading tasks…</Text>
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
          <Text style={st.headerTitle}>Support Tasks</Text>
          <Text style={st.headerSub}>Assigned to you by patients</Text>
        </View>
        {pendingCount > 0 && (
          <View style={st.pendingBadge}>
            <Text style={st.pendingBadgeText}>{pendingCount} new</Text>
          </View>
        )}
      </View>

      {/* ── Summary Cards ── */}
      <View style={st.summaryRow}>
        {[
          { label: "Pending",   value: tasks.filter(t => t.status === "pending").length,   color: C.amber600 },
          { label: "Accepted",  value: tasks.filter(t => t.status === "accepted").length,  color: C.blue600  },
          { label: "Completed", value: tasks.filter(t => t.status === "completed").length, color: C.green600 },
        ].map((s) => (
          <View key={s.label} style={st.summaryCard}>
            <Text style={[st.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={st.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

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

      {/* ── Task List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={st.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[C.blue600]}
            tintColor={C.blue600}
          />
        }
        ListEmptyComponent={
          <View style={st.empty}>
            <Text style={st.emptyEmoji}>📋</Text>
            <Text style={st.emptyTitle}>No tasks here</Text>
            <Text style={st.emptySub}>
              {activeFilter === "pending"
                ? "You have no pending tasks right now."
                : `No ${activeFilter} tasks found.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const type   = TASK_TYPE[item.type]     || TASK_TYPE.general;
          const status = TASK_STATUS[item.status] || TASK_STATUS.pending;
          const isPending  = item.status === "pending";
          const isAccepted = item.status === "accepted";

          return (
            <View style={st.card}>

              {/* Card Header */}
              <View style={st.cardHeader}>
                <View style={[st.typeIcon, { backgroundColor: type.bg }]}>
                  <Text style={st.typeEmoji}>{type.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={st.cardPatient}>👤 {item.patientName || "Patient"}</Text>
                </View>
                <View style={[st.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[st.statusText, { color: status.text }]}>{status.label}</Text>
                </View>
              </View>

              {/* Description */}
              {item.description && (
                <Text style={st.cardDesc}>{item.description}</Text>
              )}

              {/* Meta Row */}
              <View style={st.metaRow}>
                <View style={st.metaItem}>
                  <Text style={st.metaIcon}>📅</Text>
                  <Text style={st.metaText}>{formatDate(item.dueDate) || "No due date"}</Text>
                </View>
                <View style={[st.typePill, { backgroundColor: type.bg }]}>
                  <Text style={[st.typePillText, { color: type.text }]}>{type.label}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              {isPending && (
                <View style={st.actionRow}>
                  <TouchableOpacity
                    style={st.declineBtn}
                    onPress={() => setConfirmModal({ taskId: item._id, action: "decline", title: item.title })}
                  >
                    <Text style={st.declineBtnText}>✕ Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={st.acceptBtn}
                    onPress={() => setConfirmModal({ taskId: item._id, action: "accept", title: item.title })}
                  >
                    <Text style={st.acceptBtnText}>✓ Accept</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isAccepted && (
                <TouchableOpacity
                  style={st.completeBtn}
                  onPress={() => setConfirmModal({ taskId: item._id, action: "complete", title: item.title })}
                >
                  <Text style={st.completeBtnText}>🏁 Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {/* ── Confirm Modal ── */}
      <Modal visible={!!confirmModal} transparent animationType="fade">
        <View style={st.modalOverlay}>
          <View style={st.modalSheet}>
            <Text style={st.modalTitle}>
              {confirmModal?.action === "accept"   ? "Accept Task?"   :
               confirmModal?.action === "decline"  ? "Decline Task?"  : "Mark Completed?"}
            </Text>
            <Text style={st.modalSub} numberOfLines={2}>
              "{confirmModal?.title}"
            </Text>
            <View style={st.modalBtns}>
              <TouchableOpacity style={st.modalCancel} onPress={() => setConfirmModal(null)}>
                <Text style={st.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  st.modalConfirm,
                  confirmModal?.action === "decline" && { backgroundColor: C.red600 },
                  confirmModal?.action === "complete" && { backgroundColor: C.green600 },
                ]}
                onPress={handleRespond}
                disabled={responding}
              >
                <Text style={st.modalConfirmText}>
                  {responding ? "Sending…" : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  pendingBadge: {
    backgroundColor: C.amber50, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: C.amber600,
  },
  pendingBadgeText: { color: C.amber600, fontSize: 11, fontWeight: "700" },

  summaryRow: {
    flexDirection: "row", marginHorizontal: 14, marginTop: 14,
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    gap: 0,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 0.5, borderColor: C.border,
  },
  summaryCard:  { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 22, fontWeight: "800", marginBottom: 3 },
  summaryLabel: { fontSize: 10, color: C.textSecondary, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.4 },

  filterRow: {
    flexDirection: "row", paddingHorizontal: 14,
    paddingVertical: 12, gap: 8,
  },
  filterChip:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 0.5, borderColor: C.border },
  filterChipActive: { backgroundColor: C.blue600, borderColor: C.blue600 },
  filterText:       { fontSize: 12, color: C.textSecondary, fontWeight: "500" },
  filterTextActive: { color: "#fff", fontWeight: "700" },

  listContent: { paddingHorizontal: 14, paddingBottom: 40, gap: 12 },

  empty:      { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: C.textPrimary },
  emptySub:   { fontSize: 13, color: C.textSecondary, textAlign: "center", paddingHorizontal: 30 },

  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderWidth: 0.5, borderColor: C.border,
  },

  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeIcon:   { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  typeEmoji:  { fontSize: 20 },
  cardTitle:  { fontSize: 14, fontWeight: "600", color: C.textPrimary, marginBottom: 2 },
  cardPatient:{ fontSize: 12, color: C.textSecondary },
  statusBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "600" },

  cardDesc: { fontSize: 13, color: C.textSecondary, lineHeight: 19 },

  metaRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 12, color: C.textSecondary },
  typePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  typePillText: { fontSize: 11, fontWeight: "500" },

  actionRow:  { flexDirection: "row", gap: 10 },
  declineBtn: { flex: 1, padding: 11, borderRadius: 10, alignItems: "center", backgroundColor: C.red50, borderWidth: 1, borderColor: "rgba(163,45,45,0.2)" },
  declineBtnText: { color: C.red600, fontWeight: "600", fontSize: 13 },
  acceptBtn:  { flex: 1, padding: 11, borderRadius: 10, alignItems: "center", backgroundColor: C.blue600 },
  acceptBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  completeBtn: { padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: C.green50, borderWidth: 1, borderColor: "rgba(15,110,86,0.25)" },
  completeBtnText: { color: C.green600, fontWeight: "600", fontSize: 13 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalSheet: {
    backgroundColor: C.surface, borderRadius: 20, padding: 24,
    width: "82%", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  modalTitle:       { fontSize: 18, fontWeight: "700", color: C.textPrimary, textAlign: "center" },
  modalSub:         { fontSize: 13, color: C.textSecondary, textAlign: "center" },
  modalBtns:        { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancel:      { flex: 1, padding: 13, borderRadius: 10, alignItems: "center", backgroundColor: C.bg },
  modalCancelText:  { color: C.textSecondary, fontWeight: "600" },
  modalConfirm:     { flex: 1, padding: 13, borderRadius: 10, alignItems: "center", backgroundColor: C.blue600 },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});