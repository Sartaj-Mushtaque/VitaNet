import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  StatusBar,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  Home, Calendar, User, Settings,
  Users, ChevronRight, Bell, Activity,
  Copy, UserPlus, LogIn, Heart,
} from "lucide-react-native";
import api from "./config/api";
import { useAppContext } from "../context/AppContext";

// ─── Design tokens (shared with PatientDashboard) ─────────────────────────────
const TOKEN = {
  navy:         "#0C1A2E",
  navyMid:      "#14263D",
  navyLight:    "#1E3554",
  blue:         "#2563EB",
  blueMid:      "#3B82F6",
  blueGhost:    "#EFF6FF",
  blueGhostDark:"#1E3A5F",
  teal:         "#0D9488",
  tealLight:    "#F0FDFA",
  amber:        "#D97706",
  amberLight:   "#FFFBEB",
  violet:       "#7C3AED",
  violetLight:  "#F5F3FF",
  success:      "#059669",
  successLight: "#ECFDF5",
  cream:        "#FAFAF8",
  white:        "#FFFFFF",
  stone100:     "#F5F5F4",
  stone200:     "#E7E5E4",
  stone300:     "#D6D3D1",
  stone500:     "#78716C",
  stone700:     "#44403C",
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
    vitanet:         "VitaNet",
    tagline:         "Your health, coordinated.",
    community:       "Community",
    myCommunity:     "My Community",
    connectedPatients:"Connected Patients",
    member:          "Member",
    patient:         "Patient",
    active:          "Active",
    connections:     "connections",
    connection:      "connection",
    noConnections:   "No connections yet",
    noConnDesc:      "Generate an invite code below to add community members.",
    noConnDescMember:"Paste an invite code below to connect with a patient.",
    inviteSomeone:   "Invite Someone",
    inviteDesc:      "Share a code to connect",
    generateCode:    "Generate Invite Code",
    yourCode:        "Your Invite Code",
    copyCode:        "Copy Code",
    joinCommunity:   "Join a Community",
    joinDesc:        "Enter code from a patient",
    pasteCode:       "Paste invite code here...",
    joining:         "Joining...",
    join:            "Join Community",
    inviteReady:     "Invite Code Ready",
    shareCode:       "Share this code with your community member",
    done:            "Done",
    copied:          "Copied to clipboard",
    failedLoad:      "Failed to load dashboard",
    failedInvite:    "Failed to create invite",
    failedJoin:      "Failed to join",
    invalidCode:     "Please enter a valid code",
    noPatients:      "No connected patients yet",
    home:            "Home",
    schedule:        "Schedule",
    profile:         "Profile",
    settings:        "Settings",
    network:         "Network",
    none:            "None",
    role:            "Role",
    connected:       "Connected",
    profile2:        "Profile",
    viewProfile:     "View",
  },
  "اردو": {
    vitanet:         "VitaNet",
    tagline:         "آپ کی صحت، منظم۔",
    community:       "کمیونٹی",
    myCommunity:     "میری کمیونٹی",
    connectedPatients:"منسلک مریض",
    member:          "ممبر",
    patient:         "مریض",
    active:          "فعال",
    connections:     "روابط",
    connection:      "رابطہ",
    noConnections:   "ابھی کوئی رابطہ نہیں",
    noConnDesc:      "ممبرز شامل کرنے کے لیے نیچے کوڈ بنائیں۔",
    noConnDescMember:"مریض سے جڑنے کے لیے کوڈ درج کریں۔",
    inviteSomeone:   "کسی کو مدعو کریں",
    inviteDesc:      "جڑنے کے لیے کوڈ شیئر کریں",
    generateCode:    "دعوت نامہ کوڈ بنائیں",
    yourCode:        "آپ کا کوڈ",
    copyCode:        "کوڈ کاپی کریں",
    joinCommunity:   "کمیونٹی میں شامل ہوں",
    joinDesc:        "مریض کا کوڈ درج کریں",
    pasteCode:       "دعوت نامہ کوڈ یہاں پیسٹ کریں...",
    joining:         "شامل ہو رہے ہیں...",
    join:            "کمیونٹی میں شامل ہوں",
    inviteReady:     "دعوت نامہ تیار ہے",
    shareCode:       "یہ کوڈ اپنے ممبر کے ساتھ شیئر کریں",
    done:            "ہو گیا",
    copied:          "کلپ بورڈ پر کاپی ہو گیا",
    failedLoad:      "ڈیش بورڈ لوڈ نہیں ہوا",
    failedInvite:    "کوڈ نہیں بن سکا",
    failedJoin:      "شامل نہیں ہو سکے",
    invalidCode:     "درست کوڈ درج کریں",
    noPatients:      "ابھی کوئی منسلک مریض نہیں",
    home:            "ہوم",
    schedule:        "شیڈول",
    profile:         "پروفائل",
    settings:        "ترتیبات",
    network:         "نیٹ ورک",
    none:            "کوئی نہیں",
    role:            "کردار",
    connected:       "منسلک",
    profile2:        "پروفائل",
    viewProfile:     "دیکھیں",
  },
};

// ─── API helpers (unchanged) ──────────────────────────────────────────────────
const getUserData = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};

const getCommunityMembers = async (role) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const endpoint =
    role === "patient" ? "/community/my-community" : "/community/connected-patients";
  const res = await api.get(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return role === "patient"
    ? Array.isArray(res.data.members)  ? res.data.members  : []
    : Array.isArray(res.data.patients) ? res.data.patients : [];
};

const createInvite = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.post("/community/invite", {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.inviteCode;
};

const joinCommunity = async (code) => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Login required");
  const res = await api.post("/community/join", { inviteCode: code }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.message;
};

// ─── Greeting helper ──────────────────────────────────────────────────────────
const getGreeting = (lang) => {
  const h = new Date().getHours();
  if (lang === "اردو") {
    if (h >= 5  && h < 12) return "صبح بخیر";
    if (h >= 12 && h < 17) return "دوپہر بخیر";
    if (h >= 17 && h < 21) return "شام بخیر";
    return "رات بخیر";
  }
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
};

// ─── Member Card ──────────────────────────────────────────────────────────────
const MemberCard = ({ item, isPatient, onViewProfile, onViewSchedule, th, t }) => {
  const initials = (item.name || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={[s.memberCard, { backgroundColor: th.surface, borderColor: th.border }]}>
      <TouchableOpacity
        style={s.memberCardMain}
        activeOpacity={0.75}
        onPress={() => onViewProfile(item)}
      >
        <View style={[s.memberAvatar, { backgroundColor: TOKEN.blueGhost }]}>
          <Text style={[s.memberAvatarText, { color: TOKEN.blue }]}>{initials}</Text>
        </View>
        <View style={s.memberInfo}>
          <Text style={[s.memberName, { color: th.text }]}>{item.name}</Text>
          <Text style={[s.memberEmail, { color: th.sub }]} numberOfLines={1}>{item.email}</Text>
          <View style={s.connectedBadge}>
            <View style={s.connectedDot} />
            <Text style={s.connectedText}>{t.connected}</Text>
          </View>
        </View>
        <View style={[s.viewChip, { backgroundColor: TOKEN.blueGhost }]}>
          <Text style={[s.viewChipText, { color: TOKEN.blue }]}>{t.viewProfile}</Text>
          <ChevronRight size={12} color={TOKEN.blue} strokeWidth={2.2} />
        </View>
      </TouchableOpacity>
      {!isPatient && (
        <TouchableOpacity
          style={[s.scheduleChip, { borderTopColor: th.border }]}
          onPress={() => onViewSchedule(item)}
          activeOpacity={0.75}
        >
          <Calendar size={14} color={TOKEN.teal} strokeWidth={1.8} />
          <Text style={[s.scheduleChipText, { color: TOKEN.teal }]}>{t.schedule}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CommunityDashboard({ navigation }) {
  const [user,       setUser]       = useState(null);
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [joinCode,   setJoinCode]   = useState("");
  const [joining,    setJoining]    = useState(false);

  const { darkMode, language } = useAppContext();
  const t  = TR[language] || TR.English;
  const th = darkMode ? DARK : LIGHT;
  const greeting = getGreeting(language || "English");

  const handleScheduleNav = () => {
    if (isPatient) {
      navigation.navigate("Schedule");
    } else if (members.length > 0) {
      const first = members[0];
      navigation.navigate("CommunitySchedule", {
        patientId:   first._id || first.id,
        patientName: first.name,
      });
    } else {
      Toast.show({ type: "info", text1: t.noPatients });
    }
  };

  const navItems = [
    { label: t.home,     icon: Home,     onPress: () => navigation.navigate("CommunityDashboard"), screen: "CommunityDashboard" },
    { label: t.schedule, icon: Calendar, onPress: handleScheduleNav,                                screen: "CommunitySchedule"  },
    { label: t.profile,  icon: User,     onPress: () => navigation.navigate("CommunityProfile"),   screen: "CommunityProfile"   },
    { label: t.settings, icon: Settings, onPress: () => navigation.navigate("CommunitySettings"),  screen: "CommunitySettings"  },
  ];

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const userData = await getUserData();
      setUser(userData);
      const community = await getCommunityMembers(userData.role);
      setMembers(community);
    } catch (error) {
      Toast.show({ type: "error", text1: error.message || t.failedLoad });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    try {
      const code = await createInvite();
      setInviteCode(code);
      setShowInvite(true);
      loadDashboard();
    } catch {
      Toast.show({ type: "error", text1: t.failedInvite });
    }
  };

  const handleJoinCommunity = async () => {
    if (!joinCode.trim()) {
      Toast.show({ type: "error", text1: t.invalidCode });
      return;
    }
    try {
      setJoining(true);
      const msg = await joinCommunity(joinCode.trim());
      Toast.show({ type: "success", text1: msg });
      setJoinCode("");
      loadDashboard();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: error?.response?.data?.message || error?.message || t.failedJoin,
      });
    } finally {
      setJoining(false);
    }
  };

  const handleViewProfile = (item) => {
    const personId   = item._id || item.id;
    const personName = item.name;
    if (!personId) { Toast.show({ type: "error", text1: "ID not found" }); return; }
    navigation.navigate("CommunityProfile", { personId, personName, viewerRole: user?.role });
  };

  const handleViewSchedule = (patient) => {
    const patientId   = patient._id || patient.id;
    const patientName = patient.name;
    if (!patientId) { Toast.show({ type: "error", text1: "Patient ID not found" }); return; }
    navigation.navigate("CommunitySchedule", { patientId, patientName });
  };

  const isPatient   = user?.role === "patient";
  const memberCount = members.length;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: th.bg }]}>
        <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />
        <View style={s.loadingCard}>
          <Activity size={28} color={TOKEN.blue} strokeWidth={1.6} />
          <Text style={s.loadingText}>VitaNet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: th.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={TOKEN.navy} />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerGreet}>{greeting}</Text>
          <Text style={s.headerName} numberOfLines={1}>{user?.name || t.member}</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.activePill}>
            <View style={s.activeDot} />
            <Text style={s.activePillText}>{t.active}</Text>
          </View>
          <TouchableOpacity style={s.bellWrap}>
            <Bell size={18} color="rgba(255,255,255,0.7)" strokeWidth={1.7} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stats Strip ── */}
      <View style={[s.statsStrip, { backgroundColor: th.surface, borderColor: th.border }]}>
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: TOKEN.blue }]}>{memberCount}</Text>
          <Text style={[s.statCaption, { color: th.sub }]}>
            {isPatient ? t.connections : t.connections}
          </Text>
        </View>
        <View style={[s.statSep, { backgroundColor: th.border }]} />
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: memberCount > 0 ? TOKEN.success : th.sub }]}>
            {memberCount > 0 ? t.active : t.none}
          </Text>
          <Text style={[s.statCaption, { color: th.sub }]}>{t.network}</Text>
        </View>
        <View style={[s.statSep, { backgroundColor: th.border }]} />
        <View style={s.statCell}>
          <Text style={[s.statNum, { color: TOKEN.blue }]}>
            {isPatient ? t.patient : t.member}
          </Text>
          <Text style={[s.statCaption, { color: th.sub }]}>{t.role}</Text>
        </View>
      </View>

      {/* ── Member List ── */}
      <FlatList
        data={members}
        keyExtractor={(item) => String(item._id || item.id)}
        contentContainerStyle={[s.listContent, { backgroundColor: th.bg }]}
        showsVerticalScrollIndicator={false}

        ListHeaderComponent={
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: th.sub }]}>
              {isPatient ? t.myCommunity : t.connectedPatients}
            </Text>
            <View style={[s.sectionLine, { backgroundColor: th.border }]} />
          </View>
        }

        ListEmptyComponent={
          <View style={[s.emptyCard, { backgroundColor: th.surface, borderColor: th.border }]}>
            <View style={[s.emptyIconWrap, { backgroundColor: TOKEN.blueGhost }]}>
              <Users size={28} color={TOKEN.blue} strokeWidth={1.5} />
            </View>
            <Text style={[s.emptyTitle, { color: th.text }]}>{t.noConnections}</Text>
            <Text style={[s.emptyDesc, { color: th.sub }]}>
              {isPatient ? t.noConnDesc : t.noConnDescMember}
            </Text>
          </View>
        }

        renderItem={({ item }) => (
          <MemberCard
            item={item}
            isPatient={isPatient}
            onViewProfile={handleViewProfile}
            onViewSchedule={handleViewSchedule}
            th={th}
            t={t}
          />
        )}

        ListFooterComponent={
          <View style={s.actionSection}>
            {/* PATIENT — generate invite */}
            {isPatient && (
              <View style={[s.actionCard, { backgroundColor: th.surface, borderColor: th.border }]}>
                <View style={s.actionCardHeader}>
                  <View style={[s.actionIconWrap, { backgroundColor: TOKEN.blueGhost }]}>
                    <UserPlus size={20} color={TOKEN.blue} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.actionCardTitle, { color: th.text }]}>{t.inviteSomeone}</Text>
                    <Text style={[s.actionCardSub, { color: th.sub }]}>{t.inviteDesc}</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.primaryBtn} onPress={handleCreateInvite} activeOpacity={0.88}>
                  <Text style={s.primaryBtnText}>{t.generateCode}</Text>
                </TouchableOpacity>
                {inviteCode ? (
                  <View style={[s.codeBox, { backgroundColor: TOKEN.blueGhost }]}>
                    <Text style={[s.codeLabel, { color: TOKEN.blue }]}>{t.yourCode}</Text>
                    <Text style={[s.codeValue, { color: TOKEN.blue }]}>{inviteCode}</Text>
                    <TouchableOpacity
                      style={s.copyBtn}
                      onPress={() => {
                        Clipboard.setString(inviteCode);
                        Toast.show({ type: "success", text1: t.copied });
                      }}
                    >
                      <Copy size={14} color={TOKEN.white} strokeWidth={2} />
                      <Text style={s.copyBtnText}>{t.copyCode}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}

            {/* MEMBER — join community */}
            {!isPatient && (
              <View style={[s.actionCard, { backgroundColor: th.surface, borderColor: th.border }]}>
                <View style={s.actionCardHeader}>
                  <View style={[s.actionIconWrap, { backgroundColor: TOKEN.tealLight }]}>
                    <LogIn size={20} color={TOKEN.teal} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.actionCardTitle, { color: th.text }]}>{t.joinCommunity}</Text>
                    <Text style={[s.actionCardSub, { color: th.sub }]}>{t.joinDesc}</Text>
                  </View>
                </View>
                <TextInput
                  style={[s.codeInput, {
                    backgroundColor: th.surface2,
                    color: th.text,
                    borderColor: th.border,
                  }]}
                  placeholder={t.pasteCode}
                  placeholderTextColor={th.sub}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[s.primaryBtn, (!joinCode || joining) && s.primaryBtnDisabled]}
                  disabled={!joinCode || joining}
                  onPress={handleJoinCommunity}
                  activeOpacity={0.88}
                >
                  <Text style={s.primaryBtnText}>
                    {joining ? t.joining : t.join}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />

      {/* ── Invite Modal ── */}
      <Modal visible={showInvite} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={[s.modalBox, { backgroundColor: th.surface }]}>
            <View style={s.modalIconWrap}>
              <Heart size={22} color={TOKEN.blue} strokeWidth={1.7} fill={TOKEN.blue} />
            </View>
            <Text style={[s.modalTitle, { color: th.text }]}>{t.inviteReady}</Text>
            <Text style={[s.modalBody, { color: th.sub }]}>{t.shareCode}</Text>
            <View style={[s.modalCodeBox, { backgroundColor: TOKEN.blueGhost }]}>
              <Text style={[s.codeLabel, { color: TOKEN.blue }]}>CODE</Text>
              <Text style={[s.modalCode, { color: TOKEN.blue }]}>{inviteCode}</Text>
            </View>
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => {
                Clipboard.setString(inviteCode);
                Toast.show({ type: "success", text1: t.copied });
              }}
            >
              <Copy size={14} color={TOKEN.white} strokeWidth={2} />
              <Text style={s.primaryBtnText}>{t.copyCode}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.outlineBtn, { borderColor: th.border }]}
              onPress={() => setShowInvite(false)}
            >
              <Text style={[s.outlineBtnText, { color: th.sub }]}>{t.done}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Bottom Nav ── */}
      <View style={[s.nav, { backgroundColor: th.surface, borderTopColor: th.border }]}>
        {navItems.map(({ label, icon: Icon, screen }) => {
          const active = screen === "CommunityDashboard";
          return (
            <TouchableOpacity
              key={screen}
              style={s.navItem}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.7}
            >
              <View style={[s.navIcon, active && { backgroundColor: TOKEN.blueGhost }]}>
                <Icon size={20} color={active ? TOKEN.blue : th.sub} strokeWidth={active ? 2 : 1.7} />
              </View>
              <Text style={[s.navLabel, { color: active ? TOKEN.blue : th.sub, fontWeight: active ? "700" : "400" }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Toast />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  loadingCard: { alignItems: "center", gap: 10 },
  loadingText: { fontSize: 18, fontWeight: "700", color: TOKEN.navy, letterSpacing: 1.5 },

  // Header
  header:         { backgroundColor: TOKEN.navy, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, flexDirection: "row", alignItems: "flex-end" },
  headerGreet:    { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "500", letterSpacing: 0.3, marginBottom: 3 },
  headerName:     { color: TOKEN.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  headerRight:    { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 2 },
  activePill:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(5,150,105,0.18)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activeDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  activePillText: { fontSize: 11, color: "#34D399", fontWeight: "700" },
  bellWrap:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },

  // Stats
  statsStrip: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginTop: 14,
    borderRadius: 16, padding: 14,
    borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statCell:    { flex: 1, alignItems: "center" },
  statNum:     { fontSize: 15, fontWeight: "800", marginBottom: 3 },
  statCaption: { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  statSep:     { width: 1, height: 32 },

  // List
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100, gap: 10 },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  sectionTitle:  { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  sectionLine:   { flex: 1, height: 1 },

  // Empty
  emptyCard: {
    borderRadius: 18, padding: 32, alignItems: "center",
    borderWidth: 1, borderStyle: "dashed",
  },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle:    { fontSize: 15, fontWeight: "700", marginBottom: 6 },
  emptyDesc:     { fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Member card
  memberCard: {
    borderRadius: 16, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  memberCardMain:   { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  memberAvatar:     { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { fontSize: 17, fontWeight: "700" },
  memberInfo:       { flex: 1 },
  memberName:       { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  memberEmail:      { fontSize: 12, marginBottom: 5 },
  connectedBadge:   { flexDirection: "row", alignItems: "center", gap: 4 },
  connectedDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  connectedText:    { fontSize: 11, color: TOKEN.success, fontWeight: "600" },
  viewChip:         { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 3 },
  viewChipText:     { fontSize: 11, fontWeight: "600" },
  scheduleChip:     { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  scheduleChipText: { fontSize: 12, fontWeight: "600" },

  // Action section
  actionSection: { gap: 12, marginTop: 8 },
  actionCard:    { borderRadius: 18, padding: 18, gap: 12, borderWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  actionCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionCardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  actionCardSub:   { fontSize: 12 },

  codeBox:   { borderRadius: 14, padding: 16, alignItems: "center", gap: 8 },
  codeLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5 },
  codeValue: { fontSize: 26, fontWeight: "800", letterSpacing: 5 },
  copyBtn:   { backgroundColor: TOKEN.navy, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  copyBtnText: { color: TOKEN.white, fontWeight: "600", fontSize: 13 },

  codeInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, borderWidth: 1 },

  primaryBtn:         { backgroundColor: TOKEN.navy, borderRadius: 13, paddingVertical: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText:     { color: TOKEN.white, fontWeight: "800", fontSize: 15 },
  outlineBtn:         { paddingVertical: 13, borderRadius: 13, alignItems: "center", borderWidth: 1 },
  outlineBtnText:     { fontWeight: "600", fontSize: 14 },

  // Modal
  modalBg:       { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)" },
  modalBox:      { padding: 28, borderRadius: 20, width: "82%", alignItems: "center", gap: 10, elevation: 16 },
  modalIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: TOKEN.blueGhost, alignItems: "center", justifyContent: "center" },
  modalTitle:    { fontSize: 17, fontWeight: "700" },
  modalBody:     { fontSize: 13, textAlign: "center", lineHeight: 20 },
  modalCodeBox:  { width: "100%", borderRadius: 14, padding: 20, alignItems: "center", gap: 6 },
  modalCode:     { fontSize: 28, fontWeight: "800", letterSpacing: 5 },

  // Nav
  nav:      { flexDirection: "row", justifyContent: "space-around", paddingTop: 8, paddingBottom: 20, borderTopWidth: 1 },
  navItem:  { alignItems: "center", gap: 4, flex: 1 },
  navIcon:  { width: 42, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navLabel: { fontSize: 10, letterSpacing: 0.2 },
});