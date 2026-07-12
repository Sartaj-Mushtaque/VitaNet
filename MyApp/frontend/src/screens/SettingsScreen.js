import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import {
  Home, User, Calendar, Settings,
  Bell, Globe, Moon, ShieldCheck,
  HelpCircle, LogOut, ChevronRight,
} from "lucide-react-native";
import { useAppContext } from "../context/AppContext";

const COLORS = {
  blue600:  "#185FA5",
  red600:   "#A32D2D",
  green600: "#0F6E56",
};

const navItems = [
  { label: "Home",     icon: Home,     screen: "PatientDashboard" },
  { label: "Profile",  icon: User,     screen: "Profile" },
  { label: "Schedule", icon: Calendar, screen: "Schedule" },
  { label: "Settings", icon: Settings, screen: "Settings" },
];

const TRANSLATIONS = {
  English: {
    title:         "Settings",
    preferences:   "PREFERENCES",
    reminders:     "Treatment Reminders",
    remindersSub:  "Get alerts for upcoming appointments",
    darkMode:      "Dark Mode",
    darkModeSub:   "Switch to dark theme",
    language:      "Language",
    account:       "ACCOUNT",
    editProfile:   "Edit Profile",
    editProfileSub:"Update your personal details",
    privacy:       "Privacy & Security",
    privacySub:    "Manage your data and permissions",
    support:       "SUPPORT",
    help:          "Help & Support",
    helpSub:       "Get assistance and guidance",
    logout:        "Logout",
    confirmLogout: "Confirm Logout",
    confirmMsg:    "Are you sure you want to logout?",
    cancel:        "Cancel",
    selectLang:    "Select Language",
    comingSoon:    "Coming soon",
    home:          "Home",
    profile:       "Profile",
    schedule:      "Schedule",
    settings:      "Settings",
  },
  "اردو": {
    title:         "ترتیبات",
    preferences:   "ترجیحات",
    reminders:     "علاج کی یاد دہانی",
    remindersSub:  "آنے والی اپوائنٹمنٹ کے لیے الرٹ",
    darkMode:      "ڈارک موڈ",
    darkModeSub:   "ڈارک تھیم پر سوئچ کریں",
    language:      "زبان",
    account:       "اکاؤنٹ",
    editProfile:   "پروفائل ترمیم کریں",
    editProfileSub:"اپنی ذاتی تفصیلات اپ ڈیٹ کریں",
    privacy:       "رازداری اور سیکیورٹی",
    privacySub:    "اپنا ڈیٹا اور اجازتیں منظم کریں",
    support:       "سپورٹ",
    help:          "مدد اور سپورٹ",
    helpSub:       "مدد اور رہنمائی حاصل کریں",
    logout:        "لاگ آؤٹ",
    confirmLogout: "لاگ آؤٹ کی تصدیق",
    confirmMsg:    "کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟",
    cancel:        "منسوخ",
    selectLang:    "زبان منتخب کریں",
    comingSoon:    "جلد آ رہا ہے",
    home:          "ہوم",
    profile:       "پروفائل",
    schedule:      "شیڈول",
    settings:      "ترتیبات",
  },
};

export default function SettingsScreen({ navigation }) {
  const [logoutModal,   setLogoutModal]   = useState(false);
  const [languageModal, setLanguageModal] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const { darkMode, setDarkMode, language, setLanguage } = useAppContext();

  const t = TRANSLATIONS[language];

  // ── Theme colors based on dark mode ──────────────────────────────────────
  const theme = {
    bg:            darkMode ? "#121212" : "#F4F5F7",
    surface:       darkMode ? "#1E1E1E" : "#FFFFFF",
    textPrimary:   darkMode ? "#F0F0F0" : "#1A1A1A",
    textSecondary: darkMode ? "#AAAAAA" : "#6B6B6B",
    border:        darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    divider:       darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
    modalBg:       darkMode ? "#1E1E1E" : "#FFFFFF",
    cancelBtn:     darkMode ? "#2C2C2C" : "#eeeeee",
    cancelText:    darkMode ? "#F0F0F0" : "#000000",
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("Login");
  };

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    setLanguageModal(false);
    Toast.show({ type: "success", text1: `Language set to ${lang}` });
  };

  // ── Sub-components defined OUTSIDE render so hooks count stays stable ─────
  const renderSection = (title, children) => (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </View>
  );

  const renderRowArrow = ({ icon: Icon, color, label, sublabel, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: color + "18" }]}>
        <Icon size={17} color={color} strokeWidth={1.8} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      <ChevronRight size={16} color={theme.textSecondary} strokeWidth={1.5} />
    </TouchableOpacity>
  );

  const renderRowToggle = ({ icon: Icon, color, label, sublabel, value, onValueChange }) => (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: color + "18" }]}>
        <Icon size={17} color={color} strokeWidth={1.8} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: COLORS.blue600 }}
        thumbColor={theme.surface}
      />
    </View>
  );

  const navLabels = [t.home, t.profile, t.schedule, t.settings];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>

        <Text style={[styles.title, { color: theme.textPrimary }]}>{t.title}</Text>

        {/* ── Preferences ───────────────────────────────────────────── */}
        {renderSection(t.preferences, <>
          {renderRowToggle({
            icon: Bell, color: COLORS.blue600,
            label: t.reminders, sublabel: t.remindersSub,
            value: notifications, onValueChange: setNotifications,
          })}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          {renderRowToggle({
            icon: Moon, color: "#534AB7",
            label: t.darkMode, sublabel: t.darkModeSub,
            value: darkMode, onValueChange: setDarkMode,
          })}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          {renderRowArrow({
            icon: Globe, color: "#0F6E56",
            label: t.language, sublabel: language,
            onPress: () => setLanguageModal(true),
          })}
        </>)}

        {/* ── Account ───────────────────────────────────────────────── */}
        {renderSection(t.account, <>
          {renderRowArrow({
            icon: User, color: COLORS.blue600,
            label: t.editProfile, sublabel: t.editProfileSub,
            onPress: () => navigation.navigate("Profile"),
          })}
          <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          {renderRowArrow({
            icon: ShieldCheck, color: "#854F0B",
            label: t.privacy, sublabel: t.privacySub,
            onPress: () => Toast.show({ type: "info", text1: t.comingSoon }),
          })}
        </>)}

        {/* ── Support ───────────────────────────────────────────────── */}
        {renderSection(t.support,
          renderRowArrow({
            icon: HelpCircle, color: "#534AB7",
            label: t.help, sublabel: t.helpSub,
            onPress: () => Toast.show({ type: "info", text1: t.comingSoon }),
          })
        )}

        {/* ── Logout ────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModal(true)}
          activeOpacity={0.85}
        >
          <LogOut size={18} color="#fff" strokeWidth={1.8} />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Bottom Nav ────────────────────────────────────────────────── */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {navItems.map(({ icon: Icon, screen }, index) => {
          const active = screen === "Settings";
          return (
            <TouchableOpacity
              key={screen}
              style={styles.navItem}
              onPress={() => navigation.navigate(screen)}
            >
              <Icon
                size={22}
                color={active ? COLORS.blue600 : theme.textSecondary}
                strokeWidth={1.8}
              />
              <Text style={[styles.navLabel, { color: active ? COLORS.blue600 : theme.textSecondary }]}>
                {navLabels[index]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Logout Modal ──────────────────────────────────────────────── */}
      <Modal transparent animationType="fade" visible={logoutModal} onRequestClose={() => setLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.confirmLogout}</Text>
            <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>{t.confirmMsg}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.cancelBtn }]}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={{ color: theme.cancelText, fontWeight: "600" }}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.red600 }]}
                onPress={handleLogout}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>{t.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Language Modal ────────────────────────────────────────────── */}
      <Modal transparent animationType="fade" visible={languageModal} onRequestClose={() => setLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.modalBg }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{t.selectLang}</Text>
            {["English", "اردو"].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langOption, language === lang && { backgroundColor: COLORS.blue600 + "18" }]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={[styles.langText, { color: theme.textPrimary }, language === lang && { color: COLORS.blue600, fontWeight: "600" }]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: theme.cancelBtn, marginTop: 8, width: "100%" }]}
              onPress={() => setLanguageModal(false)}
            >
              <Text style={{ color: theme.cancelText, fontWeight: "600" }}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  title:        { fontSize: 22, fontWeight: "500", marginBottom: 20 },

  section:      { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "500", letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
  sectionCard:  { borderRadius: 14, borderWidth: 0.5, overflow: "hidden" },

  row:          { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rowIcon:      { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowText:      { flex: 1 },
  rowLabel:     { fontSize: 14, fontWeight: "500" },
  rowSub:       { fontSize: 11, marginTop: 2 },
  divider:      { height: 0.5, marginLeft: 60 },

  logoutBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.red600, padding: 15, borderRadius: 12, marginTop: 8 },
  logoutText:   { color: "#fff", fontWeight: "500", fontSize: 15 },

  bottomNav:    { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingBottom: 14, borderTopWidth: 0.5 },
  navItem:      { alignItems: "center", gap: 4 },
  navLabel:     { fontSize: 10 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", padding: 24, borderRadius: 16, alignItems: "center" },
  modalTitle:   { fontSize: 18, fontWeight: "500", marginBottom: 8 },
  modalMessage: { fontSize: 14, marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", gap: 10, width: "100%" },
  modalBtn:     { flex: 1, padding: 13, borderRadius: 10, alignItems: "center" },

  langOption:   { width: "100%", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 4 },
  langText:     { fontSize: 15 },
});
