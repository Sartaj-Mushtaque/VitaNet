import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Modal, ActivityIndicator, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import {
  Calendar, Plus, Trash2, CheckCircle, Clock, X,
  User, Home, Settings, Activity,
} from "lucide-react-native";
import api from "./config/api";
import { useAppContext } from "../context/AppContext";

const COLORS = {
  blue600: "#185FA5", blue50: "#E6F1FB",
  green600: "#0F6E56", green50: "#E1F5EE",
  amber600: "#854F0B", amber50: "#FAEEDA",
  red600: "#A32D2D", red50: "#FCEBEB",
  purple600: "#534AB7", purple50: "#EEEDFE",
};

const TREATMENT_TYPES = ["Checkup", "Transfusion", "Medication", "Lab Test", "Other"];

const TYPE_COLORS = {
  Checkup:     { bg: COLORS.blue50,   text: COLORS.blue600 },
  Transfusion: { bg: COLORS.red50,    text: COLORS.red600 },
  Medication:  { bg: COLORS.green50,  text: COLORS.green600 },
  "Lab Test":  { bg: COLORS.amber50,  text: COLORS.amber600 },
  Other:       { bg: COLORS.purple50, text: COLORS.purple600 },
};

const STATUS_CONFIG = {
  upcoming:  { bg: COLORS.blue50,  text: COLORS.blue600 },
  completed: { bg: COLORS.green50, text: COLORS.green600 },
  cancelled: { bg: COLORS.red50,   text: COLORS.red600 },
};

const NAV_ITEMS = [
  { icon: Home,     screen: "PatientDashboard" },
  { icon: User,     screen: "Profile" },
  { icon: Calendar, screen: "Schedule" },
  { icon: Settings, screen: "Settings" },
];

const TRANSLATIONS = {
  English: {
    screenTitle: "Treatment Schedule", upcomingCap: "Upcoming", completed: "Completed",
    all: "All", appointment: "appointment", appointments: "appointments",
    noSchedules: "No schedules", addFirst: "Tap + to add your first appointment",
    newAppt: "New Appointment", titleField: "Title *",
    titlePlaceholder: "e.g. Blood transfusion at City Hospital",
    type: "Type", date: "Date", time: "Time", notes: "Notes (optional)",
    notesPlaceholder: "Any special instructions...",
    assignMember: "Assign Community Member (optional)",
    noMembersYet: "No community members connected yet",
    noneAssigned: "None (no one assigned)",
    reminderNote: "🔔 They will receive push notifications 3 days before, 1 day before, and on the day of this appointment.",
    saving: "Saving...", addAppt: "Add Appointment", markDone: "Mark Done",
    cancel: "Cancel", delete: "Delete", deleteTitle: "Delete Schedule",
    deleteMsg: "Are you sure you want to delete this?",
    assigned: "Assigned", communityMember: "Community Member",
    failLoad: "Failed to load schedules", failUpdate: "Failed to update",
    failDelete: "Failed to delete", deleted: "Deleted", added: "Schedule added ✓",
    home: "Home", profile: "Profile", schedule: "Schedule", settings: "Settings",
    upcoming_status: "Upcoming", completed_status: "Completed", cancelled_status: "Cancelled",
  },
  "اردو": {
    screenTitle: "علاج کا شیڈول", upcomingCap: "آنے والے", completed: "مکمل",
    all: "سب", appointment: "اپوائنٹمنٹ", appointments: "اپوائنٹمنٹس",
    noSchedules: "کوئی شیڈول نہیں", addFirst: "+ دبا کر پہلی اپوائنٹمنٹ شامل کریں",
    newAppt: "نئی اپوائنٹمنٹ", titleField: "عنوان *",
    titlePlaceholder: "مثلاً: سٹی ہسپتال میں خون کی منتقلی",
    type: "قسم", date: "تاریخ", time: "وقت", notes: "نوٹس (اختیاری)",
    notesPlaceholder: "کوئی خاص ہدایات...",
    assignMember: "کمیونٹی ممبر منتخب کریں (اختیاری)",
    noMembersYet: "ابھی کوئی ممبر نہیں جڑا", noneAssigned: "کوئی نہیں",
    reminderNote: "🔔 انہیں 3 دن پہلے، 1 دن پہلے اور اپوائنٹمنٹ کے دن نوٹیفکیشن ملے گی۔",
    saving: "محفوظ ہو رہا ہے...", addAppt: "اپوائنٹمنٹ شامل کریں", markDone: "مکمل کریں",
    cancel: "منسوخ", delete: "حذف کریں", deleteTitle: "شیڈول حذف کریں",
    deleteMsg: "کیا آپ واقعی حذف کرنا چاہتے ہیں؟",
    assigned: "منتخب", communityMember: "ممبر",
    failLoad: "شیڈول لوڈ نہیں ہوئے", failUpdate: "اپ ڈیٹ ناکام",
    failDelete: "حذف ناکام", deleted: "حذف ہوگیا", added: "شیڈول شامل ✓",
    home: "ہوم", profile: "پروفائل", schedule: "شیڈول", settings: "ترتیبات",
    upcoming_status: "آنے والا", completed_status: "مکمل", cancelled_status: "منسوخ",
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
};
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
const today = () => new Date().toISOString().split("T")[0];

function TimePicker({ value, onChange, pickerBg, border }) {
  const [h, m] = value ? value.split(":").map(Number) : [9, 0];
  const hours   = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <View style={[s.picker, { flex: 1, backgroundColor: pickerBg, borderColor: border }]}>
        <Picker selectedValue={h} onValueChange={(v) => onChange(`${String(v).padStart(2,"0")}:${String(m).padStart(2,"0")}`)}>
          {hours.map(hr => <Picker.Item key={hr} label={`${hr===0?"12":hr>12?hr-12:hr} ${hr<12?"AM":"PM"}`} value={hr} />)}
        </Picker>
      </View>
      <View style={[s.picker, { flex: 1, backgroundColor: pickerBg, borderColor: border }]}>
        <Picker selectedValue={m} onValueChange={(v) => onChange(`${String(h).padStart(2,"0")}:${String(v).padStart(2,"0")}`)}>
          {minutes.map(mn => <Picker.Item key={mn} label={`:${String(mn).padStart(2,"0")}`} value={mn} />)}
        </Picker>
      </View>
    </View>
  );
}

function SimpleDatePicker({ value, onChange, pickerBg, border }) {
  const d = value ? new Date(value + "T00:00:00") : new Date();
  const years  = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const daysInMonth = (y, mo) => new Date(y, mo + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth(d.getFullYear(), d.getMonth()) }, (_, i) => i + 1);
  const update = (field, val) => {
    let yr = d.getFullYear(), mo = d.getMonth(), dy = d.getDate();
    if (field === "year") yr = val;
    if (field === "month") mo = val;
    if (field === "day") dy = val;
    const max = daysInMonth(yr, mo);
    onChange(`${yr}-${String(mo+1).padStart(2,"0")}-${String(Math.min(dy,max)).padStart(2,"0")}`);
  };
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[
        { flex: 1.2, val: d.getMonth(), items: months.map((mo,i) => ({label:mo,value:i})), field: "month" },
        { flex: 0.8, val: d.getDate(),  items: days.map(dy => ({label:String(dy),value:dy})), field: "day" },
        { flex: 1,   val: d.getFullYear(), items: years.map(yr => ({label:String(yr),value:yr})), field: "year" },
      ].map(({ flex, val, items, field }) => (
        <View key={field} style={[s.picker, { flex, backgroundColor: pickerBg, borderColor: border }]}>
          <Picker selectedValue={val} onValueChange={(v) => update(field, v)}>
            {items.map(it => <Picker.Item key={it.value} label={it.label} value={it.value} />)}
          </Picker>
        </View>
      ))}
    </View>
  );
}

export default function ScheduleScreen({ navigation }) {
  const [schedules,        setSchedules]        = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [showAdd,          setShowAdd]          = useState(false);
  const [filter,           setFilter]           = useState("upcoming");
  const [saving,           setSaving]           = useState(false);
  const [communityMembers, setCommunityMembers] = useState([]);
  const [assignedMemberId, setAssignedMemberId] = useState(null);
  const [form,             setForm]             = useState({
    title: "", date: today(), time: "09:00", type: "Checkup", notes: "",
  });

  const { darkMode, language } = useAppContext();
  const t = TRANSLATIONS[language];

  const theme = {
    bg:            darkMode ? "#121212" : "#F4F5F7",
    surface:       darkMode ? "#1E1E1E" : "#FFFFFF",
    textPrimary:   darkMode ? "#F0F0F0" : "#1A1A1A",
    textSecondary: darkMode ? "#AAAAAA" : "#6B6B6B",
    border:        darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    inputBg:       darkMode ? "#2C2C2C" : "#F4F5F7",
  };

  const navLabels = [t.home, t.profile, t.schedule, t.settings];

  const statusLabels = {
    upcoming:  t.upcoming_status,
    completed: t.completed_status,
    cancelled: t.cancelled_status,
  };

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res   = await api.get("/schedule", { headers: { Authorization: `Bearer ${token}` } });
      setSchedules(res.data.schedules || []);
    } catch {
      Toast.show({ type: "error", text1: t.failLoad });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCommunityMembers = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res   = await api.get("/schedule/my-community", { headers: { Authorization: `Bearer ${token}` } });
      setCommunityMembers(res.data.members || []);
    } catch (e) {
      console.log("Could not fetch community members:", e?.message);
    }
  }, []);

  useEffect(() => { fetchSchedules(); fetchCommunityMembers(); }, [fetchSchedules, fetchCommunityMembers]);

  const handleAdd = async () => {
    if (!form.title.trim()) { Toast.show({ type: "error", text1: t.titleField }); return; }
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");
      await api.post("/schedule", { ...form, assignedMemberId }, { headers: { Authorization: `Bearer ${token}` } });
      Toast.show({ type: "success", text1: t.added });
      setShowAdd(false);
      setForm({ title: "", date: today(), time: "09:00", type: "Checkup", notes: "" });
      setAssignedMemberId(null);
      fetchSchedules();
    } catch (e) {
      Toast.show({ type: "error", text1: e?.response?.data?.message || t.failLoad });
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.patch(`/schedule/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchSchedules();
    } catch {
      Toast.show({ type: "error", text1: t.failUpdate });
    }
  };

  const handleDelete = (id) => {
    Alert.alert(t.deleteTitle, t.deleteMsg, [
      { text: t.cancel, style: "cancel" },
      { text: t.delete, style: "destructive", onPress: async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          await api.delete(`/schedule/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          Toast.show({ type: "success", text1: t.deleted });
          fetchSchedules();
        } catch {
          Toast.show({ type: "error", text1: t.failDelete });
        }
      }},
    ]);
  };

  const filtered      = schedules.filter((item) => filter === "all" ? true : item.status === filter);
  const upcomingCount = schedules.filter(s => s.status === "upcoming").length;

  const filterTabs = [
    { key: "upcoming",  label: t.upcomingCap },
    { key: "completed", label: t.completed },
    { key: "all",       label: t.all },
  ];

  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.textPrimary }]}>{t.screenTitle}</Text>
          <Text style={[s.headerSub, { color: theme.textSecondary }]}>
            {upcomingCount} {upcomingCount !== 1 ? t.appointments : t.appointment}
          </Text>
        </View>
        <TouchableOpacity style={s.addIconBtn} onPress={() => setShowAdd(true)}>
          <Plus size={20} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[s.tabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {filterTabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[s.tab, { backgroundColor: theme.bg }, filter === key && s.tabActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[s.tabText, { color: theme.textSecondary }, filter === key && s.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C1A2E" }}>
          <View style={{ alignItems: "center", gap: 10 }}>
            <Activity size={28} color="#2563EB" strokeWidth={1.6} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", letterSpacing: 1.5 }}>VitaNet</Text>
          </View>
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Calendar size={48} color={theme.border} strokeWidth={1.2} />
          <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>{t.noSchedules}</Text>
          <Text style={[s.emptySub, { color: theme.textSecondary }]}>{t.addFirst}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 100 }}>
          {filtered.map((item) => {
            const typeColor   = TYPE_COLORS[item.type] || TYPE_COLORS.Other;
            const statusConf  = STATUS_CONFIG[item.status] || STATUS_CONFIG.upcoming;
            const statusLabel = statusLabels[item.status] || item.status;
            const assignedMember = communityMembers.find(
              m => m._id === (item.assignedMemberId?._id || item.assignedMemberId)
            );
            return (
              <View key={item._id} style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={s.cardTop}>
                  <View style={[s.typeBadge, { backgroundColor: typeColor.bg }]}>
                    <Text style={[s.typeBadgeText, { color: typeColor.text }]}>{item.type}</Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusConf.bg }]}>
                    <Text style={[s.statusText, { color: statusConf.text }]}>{statusLabel}</Text>
                  </View>
                </View>
                <Text style={[s.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <View style={s.cardMeta}>
                  <View style={s.metaItem}>
                    <Calendar size={13} color={theme.textSecondary} strokeWidth={1.6} />
                    <Text style={[s.metaText, { color: theme.textSecondary }]}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Clock size={13} color={theme.textSecondary} strokeWidth={1.6} />
                    <Text style={[s.metaText, { color: theme.textSecondary }]}>{formatTime(item.time)}</Text>
                  </View>
                </View>
                {item.notes ? <Text style={[s.cardNotes, { color: theme.textSecondary }]}>{item.notes}</Text> : null}
                {item.assignedMemberId && (
                  <View style={s.assignedBadge}>
                    <User size={11} color={COLORS.purple600} strokeWidth={1.8} />
                    <Text style={s.assignedText}>
                      {t.assigned}: {assignedMember?.name || t.communityMember}
                    </Text>
                  </View>
                )}
                <View style={s.cardActions}>
                  {item.status === "upcoming" && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.green50 }]} onPress={() => handleStatus(item._id, "completed")}>
                      <CheckCircle size={14} color={COLORS.green600} strokeWidth={1.8} />
                      <Text style={[s.actionText, { color: COLORS.green600 }]}>{t.markDone}</Text>
                    </TouchableOpacity>
                  )}
                  {item.status === "upcoming" && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.amber50 }]} onPress={() => handleStatus(item._id, "cancelled")}>
                      <X size={14} color={COLORS.amber600} strokeWidth={1.8} />
                      <Text style={[s.actionText, { color: COLORS.amber600 }]}>{t.cancel}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: COLORS.red50, marginLeft: "auto" }]} onPress={() => handleDelete(item._id)}>
                    <Trash2 size={14} color={COLORS.red600} strokeWidth={1.8} />
                    <Text style={[s.actionText, { color: COLORS.red600 }]}>{t.delete}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.textPrimary }]}>{t.newAppt}</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <X size={20} color={theme.textSecondary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{t.titleField}</Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder={t.titlePlaceholder}
                placeholderTextColor={theme.textSecondary}
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
              />
              <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{t.type}</Text>
              <View style={[s.picker, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Picker selectedValue={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  {TREATMENT_TYPES.map((tp) => <Picker.Item key={tp} label={tp} value={tp} />)}
                </Picker>
              </View>
              <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{t.date}</Text>
              <SimpleDatePicker value={form.date} onChange={(d) => setForm({ ...form, date: d })} pickerBg={theme.inputBg} border={theme.border} />
              <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{t.time}</Text>
              <TimePicker value={form.time} onChange={(tm) => setForm({ ...form, time: tm })} pickerBg={theme.inputBg} border={theme.border} />
              <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{t.notes}</Text>
              <TextInput
                style={[s.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary, height: 80, textAlignVertical: "top" }]}
                placeholder={t.notesPlaceholder}
                placeholderTextColor={theme.textSecondary}
                multiline
                value={form.notes}
                onChangeText={(v) => setForm({ ...form, notes: v })}
              />
              <Text style={[s.fieldLabel, { color: theme.textSecondary }]}>{t.assignMember}</Text>
              {communityMembers.length === 0 ? (
                <View style={[s.noMembersBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <User size={14} color={theme.textSecondary} strokeWidth={1.6} />
                  <Text style={[s.noMembersText, { color: theme.textSecondary }]}>{t.noMembersYet}</Text>
                </View>
              ) : (
                <View style={[s.picker, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                  <Picker selectedValue={assignedMemberId} onValueChange={(v) => setAssignedMemberId(v)}>
                    <Picker.Item label={t.noneAssigned} value={null} />
                    {communityMembers.map((m) => <Picker.Item key={m._id} label={m.name} value={m._id} />)}
                  </Picker>
                </View>
              )}
              {assignedMemberId && (
                <View style={s.reminderInfoBox}>
                  <Text style={s.reminderInfoText}>{t.reminderNote}</Text>
                </View>
              )}
              <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={handleAdd} disabled={saving}>
                <Text style={s.saveBtnText}>{saving ? t.saving : t.addAppt}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={[s.bottomNav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {NAV_ITEMS.map(({ icon: Icon, screen }, index) => {
          const active = screen === "Schedule";
          return (
            <TouchableOpacity key={screen} style={s.navItem} onPress={() => navigation.navigate(screen)}>
              <Icon size={22} color={active ? COLORS.blue600 : theme.textSecondary} strokeWidth={1.8} />
              <Text style={[s.navLabel, { color: active ? COLORS.blue600 : theme.textSecondary }]}>
                {navLabels[index]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  header:    { padding: 16, paddingTop: 18, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, gap: 10 },
  headerTitle: { fontSize: 17, fontWeight: "500" },
  headerSub:   { fontSize: 11, marginTop: 2 },
  addIconBtn:  { backgroundColor: COLORS.blue600, width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabs:        { flexDirection: "row", paddingHorizontal: 14, paddingBottom: 12, gap: 8, borderBottomWidth: 0.5 },
  tab:         { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  tabActive:   { backgroundColor: COLORS.blue600 },
  tabText:     { fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  empty:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle:  { fontSize: 16, fontWeight: "500" },
  emptySub:    { fontSize: 13 },
  card:        { borderRadius: 14, padding: 14, borderWidth: 0.5, gap: 8 },
  cardTop:     { flexDirection: "row", gap: 8 },
  typeBadge:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  typeBadgeText: { fontSize: 11, fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: "auto" },
  statusText:  { fontSize: 11, fontWeight: "500" },
  cardTitle:   { fontSize: 15, fontWeight: "500" },
  cardMeta:    { flexDirection: "row", gap: 14 },
  metaItem:    { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText:    { fontSize: 12 },
  cardNotes:   { fontSize: 12, lineHeight: 18 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn:   { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  actionText:  { fontSize: 12, fontWeight: "500" },
  assignedBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: COLORS.purple50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  assignedText:  { fontSize: 11, color: COLORS.purple600, fontWeight: "500" },
  noMembersBox:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 0.5 },
  noMembersText: { fontSize: 13 },
  reminderInfoBox:  { backgroundColor: COLORS.blue50, padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 0.5, borderColor: COLORS.blue600 + "30" },
  reminderInfoText: { fontSize: 12, color: COLORS.blue600, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40, maxHeight: "92%" },
  modalHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle:   { fontSize: 17, fontWeight: "500" },
  fieldLabel:   { fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input:        { padding: 12, borderRadius: 10, fontSize: 14, borderWidth: 0.5 },
  picker:       { borderRadius: 10, borderWidth: 0.5 },
  saveBtn:      { backgroundColor: COLORS.blue600, padding: 15, borderRadius: 12, alignItems: "center", marginTop: 20 },
  saveBtnText:  { color: "#fff", fontWeight: "500", fontSize: 15 },
  bottomNav:    { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingBottom: 14, borderTopWidth: 0.5 },
  navItem:      { alignItems: "center", gap: 4 },
  navLabel:     { fontSize: 10 },
});