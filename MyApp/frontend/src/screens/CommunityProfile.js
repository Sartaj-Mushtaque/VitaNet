import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import {
  Home, Calendar, User, Settings,
  Activity, ChevronLeft, Camera,
  Edit3, Check, X,
} from "lucide-react-native";
import api from "./config/api";
import { useAppContext } from "../context/AppContext";

// ─── Design tokens (shared with PatientDashboard) ─────────────────────────────
const TOKEN = {
  navy:         "#0C1A2E",
  navyMid:      "#14263D",
  blue:         "#2563EB",
  blueMid:      "#3B82F6",
  blueGhost:    "#EFF6FF",
  teal:         "#0D9488",
  tealLight:    "#F0FDFA",
  success:      "#059669",
  successLight: "#ECFDF5",
  danger:       "#DC2626",
  dangerLight:  "#FEF2F2",
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
    vitanet:       "VitaNet",
    myProfile:     "My Profile",
    loading:       "Loading...",
    personalInfo:  "Personal Information",
    fullName:      "Full Name",
    email:         "Email Address",
    phone:         "Phone Number",
    address:       "Home Address",
    city:          "City",
    bio:           "Bio",
    role:          "Role",
    memberSince:   "Member Since",
    accountStatus: "Account Status",
    verified:      "Verified",
    notVerified:   "Not Verified",
    editProfile:   "Edit Profile",
    saveChanges:   "Save Changes",
    cancel:        "Cancel",
    joined:        "Joined",
    status:        "Status",
    active:        "Active",
    inactive:      "Inactive",
    patient:       "Patient",
    communityMember:"Community Member",
    member:        "Member",
    notSet:        "Not set",
    changePhoto:   "Change Profile Picture",
    camera:        "Camera",
    gallery:       "Photo Library",
    comingSoon:    "Coming soon",
    nameEmpty:     "Name cannot be empty",
    updateSuccess: "Profile updated successfully",
    updateFailed:  "Failed to update profile",
    loadFailed:    "Failed to load profile",
    home:          "Home",
    schedule:      "Schedule",
    profile:       "Profile",
    settings:      "Settings",
  },
  "اردو": {
    vitanet:       "VitaNet",
    myProfile:     "میری پروفائل",
    loading:       "لوڈ ہو رہا ہے...",
    personalInfo:  "ذاتی معلومات",
    fullName:      "پورا نام",
    email:         "ای میل",
    phone:         "فون نمبر",
    address:       "گھر کا پتہ",
    city:          "شہر",
    bio:           "تعارف",
    role:          "کردار",
    memberSince:   "رکنیت کب سے",
    accountStatus: "اکاؤنٹ کی حیثیت",
    verified:      "تصدیق شدہ",
    notVerified:   "غیر تصدیق شدہ",
    editProfile:   "پروفائل ترمیم کریں",
    saveChanges:   "تبدیلیاں محفوظ کریں",
    cancel:        "منسوخ",
    joined:        "شامل ہوئے",
    status:        "حیثیت",
    active:        "فعال",
    inactive:      "غیر فعال",
    patient:       "مریض",
    communityMember:"کمیونٹی ممبر",
    member:        "ممبر",
    notSet:        "سیٹ نہیں",
    changePhoto:   "پروفائل تصویر بدلیں",
    camera:        "کیمرہ",
    gallery:       "فوٹو لائبریری",
    comingSoon:    "جلد آ رہا ہے",
    nameEmpty:     "نام خالی نہیں ہو سکتا",
    updateSuccess: "پروفائل اپ ڈیٹ ہوگئی",
    updateFailed:  "پروفائل اپ ڈیٹ نہیں ہوئی",
    loadFailed:    "پروفائل لوڈ نہیں ہوئی",
    home:          "ہوم",
    schedule:      "شیڈول",
    profile:       "پروفائل",
    settings:      "ترتیبات",
  },
};

// ─── API helpers (unchanged) ──────────────────────────────────────────────────
const getMyProfile = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
  return res.data.user;
};

const updateMyProfile = async (data) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.put("/community/update-profile", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};

// ─── Shared field component ───────────────────────────────────────────────────
const InfoRow = ({ label, value, accent, muted, th }) => (
  <View style={p.infoRow}>
    <Text style={[p.infoLabel, { color: th.sub }]}>{label}</Text>
    <Text
      style={[p.infoValue, { color: accent || (muted ? th.sub : th.text) },
        muted && { fontStyle: "italic" }]}
      numberOfLines={2}
    >
      {value || "—"}
    </Text>
  </View>
);

const EditField = ({ label, value, onChange, editable = true, keyboardType = "default", multiline = false, th }) => (
  <View style={p.editField}>
    <Text style={[p.editFieldLabel, { color: th.sub }]}>{label}</Text>
    {editable ? (
      <TextInput
        style={[p.editInput, { backgroundColor: th.surface2, color: th.text, borderColor: th.border },
          multiline && p.editInputMulti]}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        placeholderTextColor={th.sub}
        placeholder={`Enter ${label.toLowerCase()}`}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        autoCorrect={false}
      />
    ) : (
      <View style={[p.editReadonly, { backgroundColor: th.surface2 }]}>
        <Text style={[p.editReadonlyText, { color: th.sub }]}>{value || "—"}</Text>
      </View>
    )}
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommunityProfile({ navigation }) {
  const [person,   setPerson]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [phone,   setPhone]   = useState("");
  const [address, setAddress] = useState("");
  const [city,    setCity]    = useState("");
  const [bio,     setBio]     = useState("");

  const { darkMode, language } = useAppContext();
  const t  = TR[language] || TR.English;
  const th = darkMode ? DARK : LIGHT;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const navItems = [
    { label: t.home,     icon: Home,     screen: "CommunityDashboard" },
    { label: t.schedule, icon: Calendar, screen: "CommunitySchedule"  },
    { label: t.profile,  icon: User,     screen: "CommunityProfile"   },
    { label: t.settings, icon: Settings, screen: "CommunitySettings"  },
  ];

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setPerson(data);
      setName(data.name       || "");
      setEmail(data.email     || "");
      setPhone(data.phone     || "");
      setAddress(data.address || "");
      setCity(data.city       || "");
      setBio(data.bio         || "");
    } catch (err) {
      Toast.show({ type: "error", text1: err.message || t.loadFailed });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { Toast.show({ type: "error", text1: t.nameEmpty }); return; }
    try {
      setSaving(true);
      const updated = await updateMyProfile({
        name: name.trim(), email: email.trim(), phone: phone.trim(),
        address: address.trim(), city: city.trim(), bio: bio.trim(),
      });
      setPerson(updated);
      setName(updated.name || ""); setEmail(updated.email || "");
      setPhone(updated.phone || ""); setAddress(updated.address || "");
      setCity(updated.city || ""); setBio(updated.bio || "");
      setEditMode(false);
      Toast.show({ type: "success", text1: t.updateSuccess });
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || t.updateFailed });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setName(person?.name || ""); setEmail(person?.email || "");
    setPhone(person?.phone || ""); setAddress(person?.address || "");
    setCity(person?.city || ""); setBio(person?.bio || "");
    setEditMode(false);
  };

  const handleChangePicture = () => {
    Alert.alert(t.changePhoto, "", [
      { text: t.camera,  onPress: () => Toast.show({ type: "info", text1: t.comingSoon }) },
      { text: t.gallery, onPress: () => Toast.show({ type: "info", text1: t.comingSoon }) },
      { text: t.cancel, style: "cancel" },
    ]);
  };

  const initials = (person?.name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = person?.role === "patient" ? t.patient : person?.role === "community" ? t.communityMember : (person?.role || t.member);
  const joinedDate = person?.createdAt
    ? new Date(person.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—";
  const isVerified = !!person?.isVerified;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[p.center, { backgroundColor: th.bg }]}>
        <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />
        <View style={p.loadingCard}>
          <Activity size={28} color={TOKEN.blue} strokeWidth={1.6} />
          <Text style={p.loadingText}>VitaNet</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[p.root, { backgroundColor: th.bg }]}>
        <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />

        {/* ── Header ── */}
        <View style={p.header}>
          <TouchableOpacity style={p.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft size={22} color={TOKEN.white} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={p.headerTitle}>{t.myProfile}</Text>
          <TouchableOpacity style={p.editHeaderBtn} onPress={() => setEditMode(!editMode)}>
            {editMode
              ? <X size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
              : <Edit3 size={18} color="rgba(255,255,255,0.7)" strokeWidth={1.7} />}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[p.scroll, { backgroundColor: th.bg }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            {/* ── Hero Card ── */}
            <View style={[p.heroCard, { backgroundColor: th.surface, borderColor: th.border }]}>
              <View style={p.heroBand} />
              <View style={p.heroBody}>
                <View style={p.avatarWrap}>
                  <View style={[p.avatarCircle, { borderColor: th.surface }]}>
                    <Text style={p.avatarInitials}>{initials}</Text>
                  </View>
                  <TouchableOpacity style={p.cameraBadge} onPress={handleChangePicture} activeOpacity={0.85}>
                    <Camera size={13} color={TOKEN.white} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Text style={[p.heroName, { color: th.heading }]}>{person?.name}</Text>
                <Text style={[p.heroEmail, { color: th.sub }]}>{person?.email}</Text>

                <View style={p.pillRow}>
                  <View style={[p.pillRole, { backgroundColor: TOKEN.blueGhost }]}>
                    <Text style={[p.pillRoleText, { color: TOKEN.blue }]}>{roleLabel}</Text>
                  </View>
                  <View style={[p.pillStatus, { backgroundColor: isVerified ? TOKEN.successLight : TOKEN.dangerLight }]}>
                    <View style={[p.pillDot, { backgroundColor: isVerified ? TOKEN.success : TOKEN.danger }]} />
                    <Text style={[p.pillStatusText, { color: isVerified ? TOKEN.success : TOKEN.danger }]}>
                      {isVerified ? t.verified : t.notVerified}
                    </Text>
                  </View>
                </View>

                {person?.bio ? <Text style={[p.heroBio, { color: th.sub }]}>{person.bio}</Text> : null}
              </View>

              <View style={[p.statsRow, { borderTopColor: th.border }]}>
                {[
                  { value: person?.createdAt ? new Date(person.createdAt).getFullYear() : "—", label: t.joined },
                  { value: isVerified ? t.active : t.inactive, label: t.status, color: isVerified ? TOKEN.success : th.sub },
                  { value: person?.role === "patient" ? t.patient : t.member, label: t.role },
                ].map((stat, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={[p.statDivider, { backgroundColor: th.border }]} />}
                    <View style={p.statCell}>
                      <Text style={[p.statValue, { color: stat.color || th.heading }]}>{stat.value}</Text>
                      <Text style={[p.statLabel, { color: th.sub }]}>{stat.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* ── Details Card ── */}
            <View style={[p.card, { backgroundColor: th.surface, borderColor: th.border }]}>
              <Text style={[p.cardTitle, { color: th.heading }]}>{t.personalInfo}</Text>
              <View style={[p.cardDivider, { backgroundColor: th.border }]} />

              {editMode ? (
                <>
                  <EditField label={t.fullName}  value={name}    onChange={setName} th={th} />
                  <EditField label={t.email}      value={email}   onChange={setEmail}   keyboardType="email-address" th={th} />
                  <EditField label={t.phone}      value={phone}   onChange={setPhone}   keyboardType="phone-pad" th={th} />
                  <EditField label={t.address}    value={address} onChange={setAddress} th={th} />
                  <EditField label={t.city}       value={city}    onChange={setCity}    th={th} />
                  <EditField label={t.bio}        value={bio}     onChange={setBio}     multiline th={th} />
                  <EditField label={t.role}       value={roleLabel}  editable={false} th={th} />
                  <EditField label={t.memberSince} value={joinedDate} editable={false} th={th} />
                </>
              ) : (
                <>
                  {[
                    { label: t.fullName,      value: person?.name,    muted: !person?.name    },
                    { label: t.email,         value: person?.email,   muted: !person?.email   },
                    { label: t.phone,         value: person?.phone,   muted: !person?.phone   },
                    { label: t.address,       value: person?.address, muted: !person?.address },
                    { label: t.city,          value: person?.city,    muted: !person?.city    },
                    { label: t.bio,           value: person?.bio,     muted: !person?.bio     },
                    { label: t.role,          value: roleLabel },
                    { label: t.accountStatus, value: isVerified ? t.verified : t.notVerified,
                      accent: isVerified ? TOKEN.success : TOKEN.danger },
                    { label: t.memberSince,   value: joinedDate },
                  ].map((row, i, arr) => (
                    <React.Fragment key={row.label}>
                      <InfoRow {...row} th={th} />
                      {i < arr.length - 1 && <View style={[p.rowDivider, { backgroundColor: th.border }]} />}
                    </React.Fragment>
                  ))}
                </>
              )}
            </View>

            {/* ── Action Buttons ── */}
            {editMode ? (
              <View style={p.btnGroup}>
                <TouchableOpacity
                  style={[p.saveBtn, saving && p.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.88}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={TOKEN.white} />
                    : <>
                        <Check size={16} color={TOKEN.white} strokeWidth={2.5} />
                        <Text style={p.saveBtnText}>{t.saveChanges}</Text>
                      </>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[p.cancelBtn, { borderColor: th.border, backgroundColor: th.surface }]}
                  onPress={handleCancelEdit}
                  activeOpacity={0.8}
                >
                  <Text style={[p.cancelBtnText, { color: th.sub }]}>{t.cancel}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[p.editBtn, { borderColor: TOKEN.blue, backgroundColor: th.surface }]}
                onPress={() => setEditMode(true)}
                activeOpacity={0.85}
              >
                <Edit3 size={16} color={TOKEN.blue} strokeWidth={1.7} />
                <Text style={[p.editBtnText, { color: TOKEN.blue }]}>{t.editProfile}</Text>
              </TouchableOpacity>
            )}

          </Animated.View>
        </ScrollView>

        {/* ── Bottom Nav ── */}
        <View style={[p.nav, { backgroundColor: th.surface, borderTopColor: th.border }]}>
          {navItems.map(({ label, icon: Icon, screen }) => {
            const active = screen === "CommunityProfile";
            return (
              <TouchableOpacity
                key={screen}
                style={p.navItem}
                onPress={() => navigation.navigate(screen)}
                activeOpacity={0.7}
              >
                <View style={[p.navIcon, active && { backgroundColor: TOKEN.blueGhost }]}>
                  <Icon size={20} color={active ? TOKEN.blue : th.sub} strokeWidth={active ? 2 : 1.7} />
                </View>
                <Text style={[p.navLabel, { color: active ? TOKEN.blue : th.sub, fontWeight: active ? "700" : "400" }]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Toast />
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const p = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingCard: { alignItems: "center", gap: 10 },
  loadingText: { fontSize: 18, fontWeight: "700", color: TOKEN.navy, letterSpacing: 1.5 },

  // Header
  header: {
    backgroundColor: TOKEN.navy, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 18,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  backBtn:       { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle:   { flex: 1, color: TOKEN.white, fontSize: 18, fontWeight: "700", letterSpacing: 0.2 },
  editHeaderBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120, gap: 14 },

  // Hero
  heroCard:   { borderRadius: 20, overflow: "hidden", borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 4 },
  heroBand:   { position: "absolute", top: 0, left: 0, right: 0, height: 80, backgroundColor: TOKEN.navy },
  heroBody:   { paddingTop: 44, paddingHorizontal: 20, paddingBottom: 16, alignItems: "center" },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: TOKEN.blueGhost, borderWidth: 4,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: TOKEN.blue },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: TOKEN.navy, borderWidth: 2.5, borderColor: TOKEN.white,
    alignItems: "center", justifyContent: "center",
  },
  heroName:  { fontSize: 20, fontWeight: "800", letterSpacing: -0.3, marginBottom: 4 },
  heroEmail: { fontSize: 13, marginBottom: 12 },
  pillRow:   { flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap", justifyContent: "center" },
  pillRole:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillRoleText: { fontSize: 11, fontWeight: "700" },
  pillStatus:   { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pillDot:      { width: 6, height: 6, borderRadius: 3 },
  pillStatusText: { fontSize: 11, fontWeight: "700" },
  heroBio:    { fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 4, paddingHorizontal: 12 },

  statsRow:   { flexDirection: "row", borderTopWidth: 1 },
  statCell:   { flex: 1, alignItems: "center", paddingVertical: 14 },
  statValue:  { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  statLabel:  { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider:{ width: 1, alignSelf: "stretch", marginVertical: 12 },

  // Details card
  card:       { borderRadius: 18, padding: 18, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle:  { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  cardDivider:{ height: 1, marginBottom: 4 },
  rowDivider: { height: 1 },

  infoRow:       { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingVertical: 11 },
  infoLabel:     { fontSize: 13, fontWeight: "500", flex: 0.4 },
  infoValue:     { fontSize: 13, fontWeight: "600", flex: 0.6, textAlign: "right" },

  editField:      { paddingVertical: 8 },
  editFieldLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 },
  editInput:      { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11, fontSize: 14, fontWeight: "500", borderWidth: 1 },
  editInputMulti: { minHeight: 82, paddingTop: 10 },
  editReadonly:   { borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11 },
  editReadonlyText: { fontSize: 14 },

  // Buttons
  btnGroup:    { gap: 10 },
  saveBtn:     { backgroundColor: TOKEN.navy, borderRadius: 14, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  btnDisabled: { opacity: 0.55 },
  saveBtnText: { color: TOKEN.white, fontWeight: "800", fontSize: 15 },
  cancelBtn:   { borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1 },
  cancelBtnText: { fontWeight: "600", fontSize: 15 },
  editBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14, borderWidth: 1.5 },
  editBtnText: { fontWeight: "700", fontSize: 15 },

  // Nav
  nav:      { flexDirection: "row", justifyContent: "space-around", paddingTop: 8, paddingBottom: 20, borderTopWidth: 1 },
  navItem:  { alignItems: "center", gap: 4, flex: 1 },
  navIcon:  { width: 42, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 10, letterSpacing: 0.2 },
});