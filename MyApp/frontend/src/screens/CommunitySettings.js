import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Switch, ScrollView, ActivityIndicator, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import {
  Home, Calendar, User, Settings,
  Bell, ChevronRight, LogOut, Shield,
  HelpCircle, Activity, Moon, Globe,
  AlertTriangle, CheckSquare, ChevronLeft,
} from "lucide-react-native";
import api from "./config/api";
import { useAppContext } from "../context/AppContext";

// ─── Design tokens (shared with PatientDashboard) ─────────────────────────────
const TOKEN = {
  navy:         "#0C1A2E",
  blue:         "#2563EB",
  blueGhost:    "#EFF6FF",
  teal:         "#0D9488",
  tealLight:    "#F0FDFA",
  amber:        "#D97706",
  amberLight:   "#FFFBEB",
  violet:       "#7C3AED",
  violetLight:  "#F5F3FF",
  danger:       "#DC2626",
  dangerLight:  "#FEF2F2",
  dangerGhost:  "rgba(220,38,38,0.12)",
  success:      "#059669",
  successLight: "#ECFDF5",
  cream:        "#FAFAF8",
  white:        "#FFFFFF",
  stone100:     "#F5F5F4",
  stone200:     "#E7E5E4",
  stone500:     "#78716C",
  stone900:     "#1C1917",
  dark900:      "#080E1A",
  dark800:      "#0F1829",
  dark700:      "#172035",
  dark600:      "#1F2D45",
  darkBorder:   "rgba(255,255,255,0.06)",
  darkText:     "#E8EDF5",
  darkSub:      "#8B9AB5",
};

const LIGHT = {
  bg:       TOKEN.cream,
  surface:  TOKEN.white,
  surface2: TOKEN.stone100,
  border:   TOKEN.stone200,
  text:     TOKEN.stone900,
  sub:      TOKEN.stone500,
  heading:  TOKEN.navy,
};

const DARK = {
  bg:       TOKEN.dark900,
  surface:  TOKEN.dark800,
  surface2: TOKEN.dark700,
  border:   TOKEN.darkBorder,
  text:     TOKEN.darkText,
  sub:      TOKEN.darkSub,
  heading:  TOKEN.darkText,
};

// ─── Translations ─────────────────────────────────────────────────────────────
const TR = {
  English: {
    vitanet:        "VitaNet",
    settings:       "Settings",
    loading:        "Loading...",
    preferences:    "PREFERENCES",
    sosAlerts:      "SOS Alerts",
    sosAlertsSub:   "Get notified when a patient sends an SOS",
    taskAlerts:     "Task Assignments",
    taskAlertsSub:  "Get notified when a task is assigned to you",
    reminders:      "Reminders",
    remindersSub:   "Appointment and schedule reminders",
    darkMode:       "Dark Mode",
    darkModeSub:    "Switch to dark theme",
    navigation:     "NAVIGATION",
    viewAlerts:     "View Alerts",
    viewAlertsSub:  "Emergency SOS notifications",
    myTasks:        "My Tasks",
    myTasksSub:     "Support tasks assigned to you",
    account:        "ACCOUNT",
    logout:         "Logout",
    logoutSub:      "Sign out of your account",
    confirmLogout:  "Confirm Logout",
    confirmMsg:     "Are you sure you want to sign out?",
    cancel:         "Cancel",
    comingSoon:     "Coming soon",
    prefsSaved:     "Preferences saved",
    prefsFailed:    "Failed to save preferences",
    loadFailed:     "Failed to load profile",
    communityMember:"Community Member",
    active:         "Active",
    home:           "Home",
    schedule:       "Schedule",
    profile:        "Profile",
  },
  "اردو": {
    vitanet:        "VitaNet",
    settings:       "ترتیبات",
    loading:        "لوڈ ہو رہا ہے...",
    preferences:    "ترجیحات",
    sosAlerts:      "ایس او ایس الرٹ",
    sosAlertsSub:   "جب مریض ایس او ایس بھیجے تو اطلاع ملے",
    taskAlerts:     "ٹاسک الرٹ",
    taskAlertsSub:  "جب ٹاسک تفویض ہو تو اطلاع ملے",
    reminders:      "یاد دہانی",
    remindersSub:   "اپوائنٹمنٹ اور شیڈول کی یاد دہانی",
    darkMode:       "ڈارک موڈ",
    darkModeSub:    "ڈارک تھیم پر سوئچ کریں",
    navigation:     "نیویگیشن",
    viewAlerts:     "الرٹ دیکھیں",
    viewAlertsSub:  "ہنگامی ایس او ایس اطلاعات",
    myTasks:        "میرے ٹاسک",
    myTasksSub:     "آپ کو تفویض کردہ ٹاسک",
    account:        "اکاؤنٹ",
    logout:         "لاگ آؤٹ",
    logoutSub:      "اپنے اکاؤنٹ سے باہر ہوں",
    confirmLogout:  "لاگ آؤٹ کی تصدیق",
    confirmMsg:     "کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟",
    cancel:         "منسوخ",
    comingSoon:     "جلد آ رہا ہے",
    prefsSaved:     "ترجیحات محفوظ",
    prefsFailed:    "ترجیحات محفوظ نہیں ہوئیں",
    loadFailed:     "پروفائل لوڈ نہیں ہوئی",
    communityMember:"کمیونٹی ممبر",
    active:         "فعال",
    home:           "ہوم",
    schedule:       "شیڈول",
    profile:        "پروفائل",
  },
};

// ─── API helpers (unchanged) ──────────────────────────────────────────────────
const getMe = async () => {
  const token = await AsyncStorage.getItem("token");
  const res = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  return res.data.user;
};

const saveNotifPrefs = async (prefs) => {
  const token = await AsyncStorage.getItem("token");
  await api.patch("/auth/notification-preferences", prefs, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommunitySettings({ navigation }) {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [logoutModal,  setLogoutModal]  = useState(false);
  const [saving,       setSaving]       = useState(false);

  const [sosAlerts,      setSosAlerts]      = useState(true);
  const [taskAlerts,     setTaskAlerts]     = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(true);

  const { darkMode, setDarkMode, language } = useAppContext();
  const t  = TR[language] || TR.English;
  const th = darkMode ? DARK : LIGHT;

  const navItems = [
    { label: t.home,     icon: Home,     screen: "CommunityDashboard" },
    { label: t.schedule, icon: Calendar, screen: "CommunitySchedule"  },
    { label: t.profile,  icon: User,     screen: "CommunityProfile"   },
    { label: t.settings, icon: Settings, screen: "CommunitySettings"  },
  ];

  useEffect(() => {
    (async () => {
      try {
        const u = await getMe();
        setUser(u);
        if (u.notificationPreferences) {
          const p = u.notificationPreferences;
          if (p.sosAlerts      !== undefined) setSosAlerts(p.sosAlerts);
          if (p.taskAlerts     !== undefined) setTaskAlerts(p.taskAlerts);
          if (p.reminderAlerts !== undefined) setReminderAlerts(p.reminderAlerts);
        }
      } catch {
        Toast.show({ type: "error", text1: t.loadFailed });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (key, setter, newVal) => {
    setter(newVal);
    try {
      setSaving(true);
      await saveNotifPrefs({
        sosAlerts:      key === "sosAlerts"      ? newVal : sosAlerts,
        taskAlerts:     key === "taskAlerts"     ? newVal : taskAlerts,
        reminderAlerts: key === "reminderAlerts" ? newVal : reminderAlerts,
      });
      Toast.show({ type: "success", text1: t.prefsSaved });
    } catch {
      setter(!newVal);
      Toast.show({ type: "error", text1: t.prefsFailed });
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    navigation.replace("Login");
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[st.center, { backgroundColor: th.bg }]}>
        <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />
        <View style={st.loadingCard}>
          <Activity size={28} color={TOKEN.blue} strokeWidth={1.6} />
          <Text style={st.loadingText}>VitaNet</Text>
        </View>
      </View>
    );
  }

  const initials = user?.name?.charAt(0)?.toUpperCase() || "?";

  // ── Section wrapper ────────────────────────────────────────────────────────
  const Section = ({ title, children }) => (
    <View style={st.section}>
      <Text style={[st.sectionLabel, { color: th.sub }]}>{title}</Text>
      <View style={[st.sectionCard, { backgroundColor: th.surface, borderColor: th.border }]}>
        {children}
      </View>
    </View>
  );

  // ── Toggle Row ─────────────────────────────────────────────────────────────
  const ToggleRow = ({ icon: Icon, color, bg, label, sub, value, onChange, isLast }) => (
    <View style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: th.border }]}>
      <View style={[st.rowIconWrap, { backgroundColor: bg }]}>
        <Icon size={17} color={color} strokeWidth={1.8} />
      </View>
      <View style={st.rowText}>
        <Text style={[st.rowLabel, { color: th.text }]}>{label}</Text>
        {sub && <Text style={[st.rowSub, { color: th.sub }]}>{sub}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: th.border, true: TOKEN.blue }}
        thumbColor={TOKEN.white}
      />
    </View>
  );

  // ── Arrow Row ──────────────────────────────────────────────────────────────
  const ArrowRow = ({ icon: Icon, color, bg, label, sub, onPress, danger, isLast }) => (
    <TouchableOpacity
      style={[st.row, !isLast && { borderBottomWidth: 1, borderBottomColor: th.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[st.rowIconWrap, { backgroundColor: danger ? TOKEN.dangerLight : bg }]}>
        <Icon size={17} color={danger ? TOKEN.danger : color} strokeWidth={1.8} />
      </View>
      <View style={st.rowText}>
        <Text style={[st.rowLabel, { color: danger ? TOKEN.danger : th.text }]}>{label}</Text>
        {sub && <Text style={[st.rowSub, { color: th.sub }]}>{sub}</Text>}
      </View>
      <ChevronRight size={16} color={danger ? TOKEN.danger : th.sub} strokeWidth={1.5} />
    </TouchableOpacity>
  );

  return (
    <View style={[st.root, { backgroundColor: th.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />

      {/* ── Header ── */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={TOKEN.white} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>{t.settings}</Text>
        {saving && <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />}
        {!saving && <View style={{ width: 36 }} />}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[st.scroll, { backgroundColor: th.bg }]}
      >
        {/* ── Profile Card ── */}
        <View style={[st.profileCard, { backgroundColor: th.surface, borderColor: th.border }]}>
          <View style={[st.profileAvatar, { backgroundColor: TOKEN.blueGhost }]}>
            <Text style={[st.profileAvatarText, { color: TOKEN.blue }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[st.profileName, { color: th.heading }]}>{user?.name || t.communityMember}</Text>
            <Text style={[st.profileEmail, { color: th.sub }]}>{user?.email || ""}</Text>
            <View style={st.rolePill}>
              <View style={st.roleDot} />
              <Text style={st.rolePillText}>{t.communityMember}</Text>
            </View>
          </View>
        </View>

        {/* ── Preferences ── */}
        <Section title={t.preferences}>
          <ToggleRow
            icon={AlertTriangle} color={TOKEN.danger}  bg={TOKEN.dangerLight}
            label={t.sosAlerts}  sub={t.sosAlertsSub}
            value={sosAlerts}    onChange={(v) => handleToggle("sosAlerts", setSosAlerts, v)}
          />
          <ToggleRow
            icon={CheckSquare}   color={TOKEN.blue}    bg={TOKEN.blueGhost}
            label={t.taskAlerts} sub={t.taskAlertsSub}
            value={taskAlerts}   onChange={(v) => handleToggle("taskAlerts", setTaskAlerts, v)}
          />
          <ToggleRow
            icon={Bell}           color={TOKEN.amber}   bg={TOKEN.amberLight}
            label={t.reminders}   sub={t.remindersSub}
            value={reminderAlerts} onChange={(v) => handleToggle("reminderAlerts", setReminderAlerts, v)}
          />
          <ToggleRow
            icon={Moon}       color={TOKEN.violet}   bg={TOKEN.violetLight}
            label={t.darkMode} sub={t.darkModeSub}
            value={darkMode}   onChange={setDarkMode}
            isLast
          />
        </Section>

        {/* ── Navigation ── */}
        <Section title={t.navigation}>
          <ArrowRow
            icon={AlertTriangle} color={TOKEN.danger} bg={TOKEN.dangerLight}
            label={t.viewAlerts} sub={t.viewAlertsSub}
            onPress={() => navigation.navigate("CommunityAlerts")}
          />
          <ArrowRow
            icon={CheckSquare} color={TOKEN.teal} bg={TOKEN.tealLight}
            label={t.myTasks}  sub={t.myTasksSub}
            onPress={() => navigation.navigate("CommunityTasks")}
            isLast
          />
        </Section>

        {/* ── Account ── */}
        <Section title={t.account}>
          <ArrowRow
            icon={LogOut}    color={TOKEN.danger}  bg={TOKEN.dangerLight}
            label={t.logout} sub={t.logoutSub}
            onPress={() => setLogoutModal(true)}
            danger isLast
          />
        </Section>

        <Text style={[st.versionText, { color: th.sub }]}>VitaNet · Community Member App</Text>
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={[st.nav, { backgroundColor: th.surface, borderTopColor: th.border }]}>
        {navItems.map(({ label, icon: Icon, screen }) => {
          const active = screen === "CommunitySettings";
          return (
            <TouchableOpacity
              key={screen}
              style={st.navItem}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.7}
            >
              <View style={[st.navIcon, active && { backgroundColor: TOKEN.blueGhost }]}>
                <Icon size={20} color={active ? TOKEN.blue : th.sub} strokeWidth={active ? 2 : 1.7} />
              </View>
              <Text style={[st.navLabel, { color: active ? TOKEN.blue : th.sub, fontWeight: active ? "700" : "400" }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Logout Modal ── */}
      <Modal transparent animationType="fade" visible={logoutModal} onRequestClose={() => setLogoutModal(false)}>
        <View style={st.modalBg}>
          <View style={[st.modalBox, { backgroundColor: th.surface }]}>
            <View style={[st.modalIconWrap, { backgroundColor: TOKEN.dangerLight }]}>
              <LogOut size={22} color={TOKEN.danger} strokeWidth={1.7} />
            </View>
            <Text style={[st.modalTitle, { color: th.text }]}>{t.confirmLogout}</Text>
            <Text style={[st.modalBody,  { color: th.sub  }]}>{t.confirmMsg}</Text>
            <View style={st.modalBtns}>
              <TouchableOpacity
                style={[st.modalBtnCancel, { backgroundColor: th.surface2, borderColor: th.border }]}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={[st.modalBtnCancelText, { color: th.sub }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.modalBtnDanger} onPress={logout}>
                <Text style={st.modalBtnDangerText}>{t.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingCard: { alignItems: "center", gap: 10 },
  loadingText: { fontSize: 18, fontWeight: "700", color: TOKEN.navy, letterSpacing: 1.5 },

  // Header
  header: {
    backgroundColor: TOKEN.navy, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 18,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  backBtn:     { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: TOKEN.white, fontSize: 18, fontWeight: "700", letterSpacing: 0.2 },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 0 },

  // Profile card
  profileCard:     { borderRadius: 18, padding: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  profileAvatar:   { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
  profileAvatarText: { fontSize: 24, fontWeight: "800" },
  profileName:     { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  profileEmail:    { fontSize: 12, marginBottom: 6 },
  rolePill:        { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: TOKEN.blueGhost, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: "flex-start" },
  roleDot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: TOKEN.blue },
  rolePillText:    { fontSize: 11, color: TOKEN.blue, fontWeight: "600" },

  // Section
  section:      { marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8, marginLeft: 2 },
  sectionCard:  { borderRadius: 16, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },

  // Row
  row:        { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rowIconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowText:    { flex: 1 },
  rowLabel:   { fontSize: 14, fontWeight: "600", marginBottom: 1 },
  rowSub:     { fontSize: 11 },

  versionText: { textAlign: "center", fontSize: 11, marginTop: 8, marginBottom: 16 },

  // Modal
  modalBg:       { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)" },
  modalBox:      { padding: 28, borderRadius: 20, width: "82%", alignItems: "center", elevation: 16 },
  modalIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalTitle:    { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  modalBody:     { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalBtns:     { flexDirection: "row", gap: 10, width: "100%" },
  modalBtnCancel:      { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  modalBtnCancelText:  { fontWeight: "600", fontSize: 14 },
  modalBtnDanger:      { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center", backgroundColor: TOKEN.danger },
  modalBtnDangerText:  { color: TOKEN.white, fontWeight: "700", fontSize: 14 },

  // Nav
  nav:      { flexDirection: "row", justifyContent: "space-around", paddingTop: 8, paddingBottom: 20, borderTopWidth: 1 },
  navItem:  { alignItems: "center", gap: 4, flex: 1 },
  navIcon:  { width: 42, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 10, letterSpacing: 0.2 },
});