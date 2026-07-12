import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, SafeAreaView, Modal, StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context/AppContext";
import { Users, Settings, Trash2, ShieldCheck, KeyRound, Home } from "lucide-react-native";
import api from "./config/api";

const LIGHT = {
  blue: "#185FA5", blueSoft: "#E6F1FB", blueLight: "#B5D4F4",
  bg: "#F4F6F9", surface: "#FFFFFF",
  border: "rgba(0,0,0,0.07)", borderMid: "rgba(0,0,0,0.12)",
  text: "#1A1A1A", textMuted: "#6B7280", textLight: "#9CA3AF",
  green: "#3B6D11", greenSoft: "#EAF3DE",
  red: "#A32D2D", redSoft: "#FCEBEB",
  amber: "#854F0B", amberSoft: "#FAEEDA",
};

const DARK = {
  blue: "#5BA3E0", blueSoft: "#0C2340", blueLight: "#1A3A5C",
  bg: "#0F1117", surface: "#1C1F26",
  border: "rgba(255,255,255,0.07)", borderMid: "rgba(255,255,255,0.12)",
  text: "#F1F1F1", textMuted: "#9CA3AF", textLight: "#6B7280",
  green: "#81C784", greenSoft: "#0F2010",
  red: "#E57373", redSoft: "#2A1515",
  amber: "#FFB74D", amberSoft: "#2A1F00",
};

const T = {
  English: {
    adminPanel:      "Admin Panel",
    registeredUsers: "registered users",
    resetPassword:   "Reset Password",
    newPassword:     "New password",
    changeRole:      "Change Role",
    deleteUser:      "Delete user",
    noUsers:         "No users found",
    loadingUsers:    "Loading users…",
    deleteTitle:     "Delete user",
    changeRoleTitle: "Change role",
    deleteMsg:       "Are you sure you want to permanently delete",
    changeRoleMsg:   "Update the role for",
    cancel:          "Cancel",
    confirm:         "Confirm",
    home:            "Home",
    settings:        "Settings",
    patient:         "Patient",
    community:       "Community",
  },
  Urdu: {
    adminPanel:      "ایڈمن پینل",
    registeredUsers: "رجسٹرڈ صارفین",
    resetPassword:   "پاس ورڈ ری سیٹ",
    newPassword:     "نیا پاس ورڈ",
    changeRole:      "کردار تبدیل کریں",
    deleteUser:      "صارف حذف کریں",
    noUsers:         "کوئی صارف نہیں ملا",
    loadingUsers:    "صارفین لوڈ ہو رہے ہیں…",
    deleteTitle:     "صارف حذف کریں",
    changeRoleTitle: "کردار تبدیل کریں",
    deleteMsg:       "کیا آپ واقعی مستقل طور پر حذف کرنا چاہتے ہیں",
    changeRoleMsg:   "کا کردار اپ ڈیٹ کریں",
    cancel:          "منسوخ",
    confirm:         "تصدیق کریں",
    home:            "ہوم",
    settings:        "ترتیبات",
    patient:         "مریض",
    community:       "کمیونٹی",
  },
};

export default function AdminDashboard({ navigation }) {
  const { darkMode, language } = useAppContext();
  const C = darkMode ? DARK : LIGHT;
  const t = T[language] || T.English;
  const s = makeStyles(C);

  const [users,         setUsers]         = useState([]);
  const [passwords,     setPasswords]     = useState({});
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loading,       setLoading]       = useState(true);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [modalType,     setModalType]     = useState("");
  const [selectedUser,  setSelectedUser]  = useState(null);
  const [toast,         setToast]         = useState({ visible: false, message: "", type: "success" });
  const [token,         setToken]         = useState("");

  useEffect(() => {
    const loadToken = async () => {
      try {
        const tk = await AsyncStorage.getItem("token");
        if (!tk) navigation.replace("Login");
        else setToken(tk);
      } catch { navigation.replace("Login"); }
    };
    loadToken();
  }, [navigation]);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(
        (res.data?.users || []).filter(
          (u) => u.role === "patient" || u.role === "community"
        )
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to fetch users", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type }), 2800);
  };

  const openModal = (type, user = null) => {
    setModalType(type); setSelectedUser(user); setModalVisible(true);
  };

  const handleModalConfirm = async () => {
    if (!selectedUser) return;
    try {
      if (modalType === "delete") {
        await api.delete(`/admin/users/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showToast(`"${selectedUser.name}" deleted`);
        fetchUsers();
      } else if (modalType === "changeRole") {
        const newRole = selectedRoles[selectedUser._id] ?? selectedUser.role;
        await api.put("/admin/change-role",
          { userId: selectedUser._id, newRole },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast(`Role updated to "${newRole}"`);
        fetchUsers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Operation failed", "error");
    } finally { setModalVisible(false); setSelectedUser(null); }
  };

  const resetUserPassword = async (userId, userName) => {
    const newPassword = passwords[userId];
    if (!newPassword) { showToast("Enter a new password", "error"); return; }
    try {
      await api.put("/admin/reset-password",
        { userId, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Password reset for "${userName}"`);
      setPasswords((prev) => ({ ...prev, [userId]: "" }));
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset password", "error");
    }
  };

  const roleBadge = (role) => ({
    patient:   { bg: C.blueSoft,  text: C.blue  },
    community: { bg: C.greenSoft, text: C.green },
  }[role] || { bg: C.amberSoft, text: C.amber });

  const initials = (name = "") =>
    name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const renderUser = ({ item }) => {
    const badge = roleBadge(item.role);
    return (
      <View style={s.card}>
        {/* Header */}
        <View style={s.cardHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials(item.name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{item.name}</Text>
            <Text style={s.userEmail}>{item.email}</Text>
          </View>
          <View style={[s.roleBadge, { backgroundColor: badge.bg }]}>
            <Text style={[s.roleBadgeText, { color: badge.text }]}>
              {item.role === "patient" ? t.patient : t.community}
            </Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Reset password */}
        <Text style={s.sectionLabel}>{t.resetPassword}</Text>
        <View style={s.inputRow}>
          <TextInput
            placeholder={t.newPassword}
            placeholderTextColor={C.textLight}
            style={s.input}
            secureTextEntry
            value={passwords[item._id] || ""}
            onChangeText={(v) =>
              setPasswords((prev) => ({ ...prev, [item._id]: v }))
            }
          />
          <TouchableOpacity style={s.iconBtn}
            onPress={() => resetUserPassword(item._id, item.name)}>
            <KeyRound size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Change role */}
        <Text style={s.sectionLabel}>{t.changeRole}</Text>
        <View style={s.pickerRow}>
          <View style={s.pickerWrap}>
            <Picker
              selectedValue={selectedRoles[item._id] ?? item.role}
              onValueChange={(role) =>
                setSelectedRoles((prev) => ({ ...prev, [item._id]: role }))
              }
              style={{ color: C.text }}
            >
              <Picker.Item label={t.patient}   value="patient"   />
              <Picker.Item label={t.community} value="community" />
            </Picker>
          </View>
          <TouchableOpacity
            style={[s.iconBtn, { backgroundColor: C.green }]}
            onPress={() => openModal("changeRole", item)}
          >
            <ShieldCheck size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Delete */}
        <TouchableOpacity style={s.deleteBtn}
          onPress={() => openModal("delete", item)}>
          <Trash2 size={15} color={C.red} />
          <Text style={s.deleteBtnText}>{t.deleteUser}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading)
    return (
      <View style={[s.loadingWrap, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.blue} />
        <Text style={s.loadingText}>{t.loadingUsers}</Text>
      </View>
    );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={C.surface}
      />

      {/* ── Header — no logout button, no back button ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t.adminPanel}</Text>
        <Text style={s.headerSub}>{users.length} {t.registeredUsers}</Text>
      </View>

      {/* Toast */}
      {toast.visible && (
        <View style={[s.toast,
          { backgroundColor: toast.type === "success" ? C.green : C.red }]}>
          <Text style={s.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Users size={40} color={C.blueLight} />
            <Text style={s.emptyText}>{t.noUsers}</Text>
          </View>
        }
        contentContainerStyle={s.listContent}
      />

      {/* Confirm modal */}
      <Modal visible={modalVisible} transparent animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={[s.modalIconWrap,
              { backgroundColor: modalType === "delete" ? C.redSoft : C.blueSoft }]}>
              {modalType === "delete"
                ? <Trash2 size={22} color={C.red} />
                : <ShieldCheck size={22} color={C.blue} />
              }
            </View>
            <Text style={s.modalTitle}>
              {modalType === "delete" ? t.deleteTitle : t.changeRoleTitle}
            </Text>
            <Text style={s.modalMsg}>
              {modalType === "delete"
                ? `${t.deleteMsg} "${selectedUser?.name}"?`
                : `${t.changeRoleMsg} "${selectedUser?.name}"?`}
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn}
                onPress={() => setModalVisible(false)}>
                <Text style={s.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalConfirmBtn,
                  { backgroundColor: modalType === "delete" ? C.red : C.blue }]}
                onPress={handleModalConfirm}>
                <Text style={s.modalConfirmText}>{t.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tabItem}
          onPress={() => navigation.replace("AdminDashboard")}>
          <Home size={22} color={C.blue} />
          <Text style={[s.tabLabel, { color: C.blue }]}>{t.home}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem}
          onPress={() => navigation.navigate("AdminSettings")}>
          <Settings size={22} color={C.textMuted} />
          <Text style={[s.tabLabel, { color: C.textMuted }]}>{t.settings}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.bg },
  loadingWrap:      { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText:      { marginTop: 12, color: C.textMuted, fontSize: 14 },
  header:           { backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: C.border },
  headerTitle:      { fontSize: 20, fontWeight: "600", color: C.text },
  headerSub:        { fontSize: 13, color: C.textMuted, marginTop: 1 },
  toast:            { marginHorizontal: 16, marginTop: 10, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  toastText:        { color: "#fff", fontSize: 14, fontWeight: "500" },
  listContent:      { padding: 16, paddingBottom: 90 },
  card:             { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: C.border },
  cardHeader:       { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar:           { width: 44, height: 44, borderRadius: 22, backgroundColor: C.blueSoft, justifyContent: "center", alignItems: "center" },
  avatarText:       { color: C.blue, fontWeight: "600", fontSize: 15 },
  userName:         { fontSize: 15, fontWeight: "600", color: C.text },
  userEmail:        { fontSize: 13, color: C.textMuted, marginTop: 1 },
  roleBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleBadgeText:    { fontSize: 12, fontWeight: "600" },
  divider:          { height: 0.5, backgroundColor: C.border, marginVertical: 14 },
  sectionLabel:     { fontSize: 11, fontWeight: "600", color: C.textLight, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 },
  inputRow:         { flexDirection: "row", gap: 8, marginBottom: 14 },
  input:            { flex: 1, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, color: C.text, borderWidth: 0.5, borderColor: C.borderMid },
  iconBtn:          { width: 44, height: 44, borderRadius: 10, backgroundColor: C.blue, justifyContent: "center", alignItems: "center" },
  pickerRow:        { flexDirection: "row", gap: 8, marginBottom: 14 },
  pickerWrap:       { flex: 1, backgroundColor: C.bg, borderRadius: 10, borderWidth: 0.5, borderColor: C.borderMid, justifyContent: "center" },
  deleteBtn:        { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 0.5, borderColor: "#F7C1C1", backgroundColor: C.redSoft },
  deleteBtnText:    { color: C.red, fontSize: 13, fontWeight: "500" },
  emptyWrap:        { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText:        { color: C.textMuted, fontSize: 15 },
  modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 24 },
  modalCard:        { backgroundColor: C.surface, borderRadius: 20, padding: 24, alignItems: "center" },
  modalIconWrap:    { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  modalTitle:       { fontSize: 17, fontWeight: "600", color: C.text, marginBottom: 8 },
  modalMsg:         { fontSize: 14, color: C.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalActions:     { flexDirection: "row", gap: 10, width: "100%" },
  modalCancelBtn:   { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.bg, borderWidth: 0.5, borderColor: C.borderMid, alignItems: "center" },
  modalCancelText:  { fontSize: 14, fontWeight: "500", color: C.textMuted },
  modalConfirmBtn:  { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  modalConfirmText: { fontSize: 14, fontWeight: "500", color: "#fff" },
  tabBar:           { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: C.surface, borderTopWidth: 0.5, borderColor: C.border, height: 62, paddingBottom: 6 },
  tabItem:          { flex: 1, justifyContent: "center", alignItems: "center", gap: 3 },
  tabLabel:         { fontSize: 11, fontWeight: "500" },
});