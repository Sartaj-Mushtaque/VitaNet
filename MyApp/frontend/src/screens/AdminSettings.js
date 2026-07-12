import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Switch, Modal, ScrollView, StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAppContext } from "../context/AppContext";
import {
  LogOut, Moon, Globe, Bell, Shield,
  ChevronRight, Home, Settings, Check, User, Info,
} from "lucide-react-native";

const LIGHT = {
  blue: "#185FA5", blueSoft: "#E6F1FB", bg: "#F4F6F9",
  surface: "#FFFFFF", border: "rgba(0,0,0,0.07)", borderMid: "rgba(0,0,0,0.12)",
  text: "#1A1A1A", textMuted: "#6B7280", textLight: "#9CA3AF",
  red: "#A32D2D", redSoft: "#FCEBEB", green: "#3B6D11", greenSoft: "#EAF3DE",
};

const DARK = {
  blue: "#5BA3E0", blueSoft: "#0C2340", bg: "#0F1117",
  surface: "#1C1F26", border: "rgba(255,255,255,0.07)", borderMid: "rgba(255,255,255,0.12)",
  text: "#F1F1F1", textMuted: "#9CA3AF", textLight: "#6B7280",
  red: "#E57373", redSoft: "#2A1515", green: "#81C784", greenSoft: "#0F2010",
};

const LANGUAGES = [
  { code: "English", label: "English"    },
  { code: "Urdu",    label: "اردو"       },
];

const T = {
  English: {
    settings:      "Settings",
    adminPrefs:    "Admin preferences",
    appearance:    "Appearance",
    darkMode:      "Dark mode",
    darkModeSub:   "Switch to dark theme",
    langRegion:    "Language",
    appLang:       "App language",
    appLangSub:    "Select your preferred language",
    notifs:        "Notifications",
    pushNotif:     "Push notifications",
    pushNotifSub:  "SOS alerts and system updates",
    security:      "Security",
    twoFactor:     "Two-factor authentication",
    twoFactorSub:  "Extra layer of login security",
    changePass:    "Change admin password",
    changePassSub: "Update your login credentials",
    about:         "About",
    appVersion:    "App version",
    signOut:       "Sign out",
    signOutTitle:  "Sign out?",
    signOutMsg:    "You'll be returned to the login screen.",
    cancel:        "Cancel",
    selectLang:    "Select language",
    home:          "Home",
    administrator: "Administrator",
  },
  Urdu: {
    settings:      "ترتیبات",
    adminPrefs:    "ایڈمن ترجیحات",
    appearance:    "ظاہری شکل",
    darkMode:      "ڈارک موڈ",
    darkModeSub:   "ڈارک تھیم پر جائیں",
    langRegion:    "زبان",
    appLang:       "ایپ کی زبان",
    appLangSub:    "اپنی پسندیدہ زبان منتخب کریں",
    notifs:        "اطلاعات",
    pushNotif:     "پش نوٹیفکیشن",
    pushNotifSub:  "SOS الرٹس اور اپڈیٹس",
    security:      "سیکیورٹی",
    twoFactor:     "دو عنصری تصدیق",
    twoFactorSub:  "اضافی سیکیورٹی",
    changePass:    "پاس ورڈ تبدیل کریں",
    changePassSub: "لاگ ان اسناد اپ ڈیٹ کریں",
    about:         "کے بارے میں",
    appVersion:    "ایپ ورژن",
    signOut:       "سائن آؤٹ",
    signOutTitle:  "سائن آؤٹ کریں؟",
    signOutMsg:    "آپ لاگ ان اسکرین پر واپس آ جائیں گے۔",
    cancel:        "منسوخ",
    selectLang:    "زبان منتخب کریں",
    home:          "ہوم",
    administrator: "ایڈمنسٹریٹر",
  },
};

export default function AdminSettings({ navigation }) {
  const { darkMode, setDarkMode, language, setLanguage } = useAppContext();
  const [notifications, setNotifications] = useState(true);
  const [twoFactor,     setTwoFactor]     = useState(false);
  const [logoutModal,   setLogoutModal]   = useState(false);
  const [langModal,     setLangModal]     = useState(false);
  const [adminEmail,    setAdminEmail]    = useState("");

  const C = darkMode ? DARK : LIGHT;
  const t = T[language] || T.English;
  const s = makeStyles(C);

  useEffect(() => {
    const load = async () => {
      try {
        const notif = await AsyncStorage.getItem("notifications");
        const tf    = await AsyncStorage.getItem("twoFactor");
        const email = await AsyncStorage.getItem("userEmail");
        if (notif !== null) setNotifications(notif === "true");
        if (tf    !== null) setTwoFactor(tf === "true");
        if (email)          setAdminEmail(email);
      } catch {}
    };
    load();
  }, []);

  const toggleNotifications = (val) => {
    setNotifications(val);
    AsyncStorage.setItem("notifications", String(val));
  };

  const toggleTwoFactor = (val) => {
    setTwoFactor(val);
    AsyncStorage.setItem("twoFactor", String(val));
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    setLogoutModal(false);
    navigation.replace("Login");
  };

  // ── Reusable rows ──────────────────────────────────────────────
  const ToggleRow = ({ icon: Icon, label, sublabel, value, onToggle, iconBg }) => (
    <View style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: iconBg || C.blueSoft }]}>
        <Icon size={18} color={C.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sublabel ? <Text style={s.rowSub}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: C.borderMid, true: C.blue }}
        thumbColor="#fff"
      />
    </View>
  );

  const ChevronRow = ({ icon: Icon, label, sublabel, value, onPress, iconBg }) => (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: iconBg || C.blueSoft }]}>
        <Icon size={18} color={C.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sublabel ? <Text style={s.rowSub}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={s.rowValue}>{value}</Text> : null}
      <ChevronRight size={16} color={C.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={C.surface}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t.settings}</Text>
        <Text style={s.headerSub}>{t.adminPrefs}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Profile card ── */}
        <View style={s.profileCard}>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarText}>AD</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{t.administrator}</Text>
            <Text style={s.profileEmail}>{adminEmail || "admin@vitanet.com"}</Text>
          </View>
          <View style={s.adminBadge}>
            <Text style={s.adminBadgeText}>Admin</Text>
          </View>
        </View>

        {/* ── Appearance ── */}
        <Text style={s.sectionHeader}>{t.appearance}</Text>
        <View style={s.card}>
          <ToggleRow
            icon={Moon} label={t.darkMode} sublabel={t.darkModeSub}
            value={darkMode} onToggle={setDarkMode}
          />
        </View>

        {/* ── Language ── */}
        <Text style={s.sectionHeader}>{t.langRegion}</Text>
        <View style={s.card}>
          <ChevronRow
            icon={Globe} label={t.appLang} sublabel={t.appLangSub}
            value={language} onPress={() => setLangModal(true)}
          />
        </View>

        {/* ── Notifications ── */}
        <Text style={s.sectionHeader}>{t.notifs}</Text>
        <View style={s.card}>
          <ToggleRow
            icon={Bell} label={t.pushNotif} sublabel={t.pushNotifSub}
            value={notifications} onToggle={toggleNotifications}
          />
        </View>

        {/* ── Security ── */}
        <Text style={s.sectionHeader}>{t.security}</Text>
        <View style={s.card}>
          <ToggleRow
            icon={Shield} label={t.twoFactor} sublabel={t.twoFactorSub}
            value={twoFactor} onToggle={toggleTwoFactor}
            iconBg={C.greenSoft}
          />
          <View style={s.rowDivider} />
          <ChevronRow
            icon={User} label={t.changePass} sublabel={t.changePassSub}
            onPress={() => navigation.navigate("ForgetPassword")}
            iconBg={C.greenSoft}
          />
        </View>

        {/* ── About ── */}
        <Text style={s.sectionHeader}>{t.about}</Text>
        <View style={s.card}>
          <ChevronRow
            icon={Info} label={t.appVersion}
            sublabel="VitaNet Admin" value="v1.0.0"
            onPress={() => {}}
          />
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={() => setLogoutModal(true)}>
          <LogOut size={18} color={C.red} />
          <Text style={s.logoutText}>{t.signOut}</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* ── Language sheet ── */}
      <Modal visible={langModal} transparent animationType="slide"
        onRequestClose={() => setLangModal(false)}>
        <View style={s.sheetOverlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{t.selectLang}</Text>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={s.langRow}
                onPress={() => { setLanguage(lang.code); setLangModal(false); }}
                activeOpacity={0.7}
              >
                <Text style={[
                  s.langLabel,
                  language === lang.code && { color: C.blue, fontWeight: "600" },
                ]}>
                  {lang.label}
                </Text>
                {language === lang.code && <Check size={18} color={C.blue} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.sheetCancelBtn} onPress={() => setLangModal(false)}>
              <Text style={s.sheetCancelText}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Logout confirm modal ── */}
      <Modal visible={logoutModal} transparent animationType="fade"
        onRequestClose={() => setLogoutModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalIconWrap}>
              <LogOut size={24} color={C.red} />
            </View>
            <Text style={s.modalTitle}>{t.signOutTitle}</Text>
            <Text style={s.modalMsg}>{t.signOutMsg}</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={s.modalCancelBtn}
                onPress={() => setLogoutModal(false)}>
                <Text style={s.modalCancelText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirmBtn} onPress={handleLogout}>
                <Text style={s.modalConfirmText}>{t.signOut}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tabItem}
          onPress={() => navigation.replace("AdminDashboard")}>
          <Home size={22} color={C.textMuted} />
          <Text style={[s.tabLabel, { color: C.textMuted }]}>{t.home}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => {}}>
          <Settings size={22} color={C.blue} />
          <Text style={[s.tabLabel, { color: C.blue }]}>{t.settings}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (C) => StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  scroll:            { padding: 16 },
  header:            { backgroundColor: C.surface, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: C.border },
  headerTitle:       { fontSize: 20, fontWeight: "600", color: C.text },
  headerSub:         { fontSize: 13, color: C.textMuted, marginTop: 1 },
  profileCard:       { flexDirection: "row", alignItems: "center", backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 6, borderWidth: 0.5, borderColor: C.border, gap: 12 },
  profileAvatar:     { width: 48, height: 48, borderRadius: 24, backgroundColor: C.blueSoft, justifyContent: "center", alignItems: "center" },
  profileAvatarText: { color: C.blue, fontWeight: "600", fontSize: 16 },
  profileName:       { fontSize: 15, fontWeight: "600", color: C.text },
  profileEmail:      { fontSize: 13, color: C.textMuted, marginTop: 1 },
  adminBadge:        { backgroundColor: C.blueSoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  adminBadgeText:    { fontSize: 12, fontWeight: "600", color: C.blue },
  sectionHeader:     { fontSize: 11, fontWeight: "600", color: C.textLight, textTransform: "uppercase", letterSpacing: 0.7, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  card:              { backgroundColor: C.surface, borderRadius: 16, borderWidth: 0.5, borderColor: C.border, overflow: "hidden" },
  row:               { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowIcon:           { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  rowLabel:          { fontSize: 15, color: C.text, fontWeight: "500" },
  rowSub:            { fontSize: 12, color: C.textMuted, marginTop: 1 },
  rowValue:          { fontSize: 13, color: C.textMuted, marginRight: 4 },
  rowDivider:        { height: 0.5, backgroundColor: C.border, marginLeft: 64 },
  logoutBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, padding: 15, borderRadius: 14, backgroundColor: C.redSoft, borderWidth: 0.5, borderColor: "#F7C1C1" },
  logoutText:        { color: C.red, fontSize: 15, fontWeight: "600" },
  sheetOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet:             { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36 },
  sheetHandle:       { width: 40, height: 4, backgroundColor: C.borderMid, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetTitle:        { fontSize: 17, fontWeight: "600", color: C.text, marginBottom: 12 },
  langRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 0.5, borderColor: C.border },
  langLabel:         { fontSize: 15, color: C.text },
  sheetCancelBtn:    { marginTop: 16, padding: 14, borderRadius: 12, backgroundColor: C.bg, alignItems: "center" },
  sheetCancelText:   { fontSize: 15, color: C.textMuted, fontWeight: "500" },
  modalOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 24 },
  modalCard:         { backgroundColor: C.surface, borderRadius: 20, padding: 24, alignItems: "center" },
  modalIconWrap:     { width: 56, height: 56, borderRadius: 28, backgroundColor: C.redSoft, justifyContent: "center", alignItems: "center", marginBottom: 14 },
  modalTitle:        { fontSize: 17, fontWeight: "600", color: C.text, marginBottom: 8 },
  modalMsg:          { fontSize: 14, color: C.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalActions:      { flexDirection: "row", gap: 10, width: "100%" },
  modalCancelBtn:    { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.bg, borderWidth: 0.5, borderColor: C.borderMid, alignItems: "center" },
  modalCancelText:   { fontSize: 14, fontWeight: "500", color: C.textMuted },
  modalConfirmBtn:   { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.red, alignItems: "center" },
  modalConfirmText:  { fontSize: 14, fontWeight: "500", color: "#fff" },
  tabBar:            { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", backgroundColor: C.surface, borderTopWidth: 0.5, borderColor: C.border, height: 62, paddingBottom: 6 },
  tabItem:           { flex: 1, justifyContent: "center", alignItems: "center", gap: 3 },
  tabLabel:          { fontSize: 11, fontWeight: "500" },
});