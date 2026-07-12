import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Modal, ActivityIndicator, TextInput, Share,
} from "react-native";
import Toast from "react-native-toast-message";
import Clipboard from "@react-native-clipboard/clipboard";
import {
  createInvitation, getMyCommunityMembers, joinCommunityWithCode,
} from "./config/api/community";
import { useAppContext } from "../context/AppContext";
import {
  Users, UserPlus, Link2, Copy, Share2, X,
  Home, User, Calendar, Settings, ChevronRight,
} from "lucide-react-native";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  blue600: "#185FA5", blue50: "#E6F1FB",
  green600: "#0F6E56", green50: "#E1F5EE",
  red600: "#A32D2D", red50: "#FCEBEB",
  amber600: "#854F0B", amber50: "#FAEEDA",
  purple600: "#534AB7", purple50: "#EEEDFE",
};

// Deterministic avatar color per member id
const AVATAR_COLORS = [
  { bg: COLORS.blue50,   text: COLORS.blue600 },
  { bg: COLORS.green50,  text: COLORS.green600 },
  { bg: COLORS.amber50,  text: COLORS.amber600 },
  { bg: COLORS.purple50, text: COLORS.purple600 },
  { bg: COLORS.red50,    text: COLORS.red600 },
];

function avatarInitials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const TRANSLATIONS = {
  English: {
    title:          "Support Circle",
    subtitle:       "People who support your care",
    noMembers:      "No members yet",
    noMembersSub:   "Invite someone you trust — family, a friend, or a caregiver.",
    generateInvite: "Generate Invite Link",
    joinWithCode:   "Join with Code",
    joinPlaceholder:"Enter invite code",
    joinBtn:        "Join",
    inviteCode:     "Your Invite Code",
    inviteCodeSub:  "Share this code with someone to add them to your circle.",
    copy:           "Copy Code",
    copied:         "Copied!",
    share:          "Share via WhatsApp / Email",
    close:          "Close",
    failLoad:       "Failed to load members",
    failInvite:     "Failed to generate invite",
    failShare:      "Failed to share",
    failJoin:       "Failed to join",
    joined:         "Joined successfully!",
    enterCode:      "Please enter a valid code",
    home:           "Home",
    profile:        "Profile",
    scheduleNav:    "Schedule",
    settings:       "Settings",
    members:        "Members",
  },
  "اردو": {
    title:          "سپورٹ سرکل",
    subtitle:       "جو لوگ آپ کی دیکھ بھال میں مدد کرتے ہیں",
    noMembers:      "ابھی کوئی ممبر نہیں",
    noMembersSub:   "کسی قابل اعتماد شخص کو دعوت دیں — خاندان، دوست، یا نگہبان۔",
    generateInvite: "دعوت لنک بنائیں",
    joinWithCode:   "کوڈ سے شامل ہوں",
    joinPlaceholder:"دعوت کوڈ درج کریں",
    joinBtn:        "شامل ہوں",
    inviteCode:     "آپ کا دعوت کوڈ",
    inviteCodeSub:  "یہ کوڈ کسی کو بھیجیں تاکہ وہ آپ کے سرکل میں شامل ہو۔",
    copy:           "کوڈ کاپی کریں",
    copied:         "کاپی ہوگیا!",
    share:          "واٹس ایپ / ای میل سے شیئر کریں",
    close:          "بند کریں",
    failLoad:       "ممبرز لوڈ نہیں ہوئے",
    failInvite:     "دعوت نامہ نہیں بنا",
    failShare:      "شیئر نہیں ہوا",
    failJoin:       "شامل نہیں ہوسکے",
    joined:         "کامیابی سے شامل ہوگئے!",
    enterCode:      "براہ کرم درست کوڈ درج کریں",
    home:           "ہوم",
    profile:        "پروفائل",
    scheduleNav:    "شیڈول",
    settings:       "ترتیبات",
    members:        "ممبرز",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SupportCircleScreen({ navigation }) {
  // All hooks unconditionally at the top
  const { darkMode, language } = useAppContext();

  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [joinCode,   setJoinCode]   = useState("");
  const [joining,    setJoining]    = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);

  const t = TRANSLATIONS[language] ?? TRANSLATIONS.English;

  const theme = useMemo(() => ({
    bg:            darkMode ? "#0F1117" : "#F0F2F5",
    surface:       darkMode ? "#1C1E26" : "#FFFFFF",
    surface2:      darkMode ? "#242630" : "#F8F9FA",
    textPrimary:   darkMode ? "#F0F0F0" : "#111827",
    textSecondary: darkMode ? "#9CA3AF" : "#6B7280",
    border:        darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    inputBg:       darkMode ? "#1C1E26" : "#F8F9FA",
  }), [darkMode]);

  const navItems = useMemo(() => [
    { label: t.home,        icon: Home,     screen: "PatientDashboard" },
    { label: t.profile,     icon: User,     screen: "Profile" },
    { label: t.scheduleNav, icon: Calendar, screen: "Schedule" },
    { label: t.settings,    icon: Settings, screen: "Settings" },
  ], [t]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const fetched = await getMyCommunityMembers();
      setMembers(Array.isArray(fetched) ? fetched : []);
    } catch {
      Toast.show({ type: "error", text1: t.failLoad });
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Invite ─────────────────────────────────────────────────────────────────
  const handleGenerateInvite = async () => {
    try {
      setGenerating(true);
      const res = await createInvitation();
      if (!res?.inviteCode) throw new Error("No invite code returned");
      setInviteCode(res.inviteCode);
      setShowInvite(true);
      fetchMembers();
    } catch {
      Toast.show({ type: "error", text1: t.failInvite });
    } finally {
      setGenerating(false);
    }
  };

  const handleShareInvite = async () => {
    try {
      await Share.share({ message: `Join my support circle using this invite code:\n\n${inviteCode}` });
    } catch {
      Toast.show({ type: "error", text1: t.failShare });
    }
  };

  // ── Join ───────────────────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (!joinCode.trim()) {
      Toast.show({ type: "error", text1: t.enterCode }); return;
    }
    try {
      setJoining(true);
      await joinCommunityWithCode(joinCode.trim());
      Toast.show({ type: "success", text1: t.joined });
      setJoinCode("");
      setShowJoin(false);
      fetchMembers();
    } catch (err) {
      Toast.show({ type: "error", text1: err?.response?.data?.message || err?.message || t.failJoin });
    } finally {
      setJoining(false);
    }
  };

  // ── Member row ─────────────────────────────────────────────────────────────
  const renderMember = ({ item, index }) => {
    const color  = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const name   = item.name || item.fullName || "—";
    const email  = item.email || "";
    const initials = avatarInitials(name);

    return (
      <View style={[s.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.memberAvatar, { backgroundColor: color.bg }]}>
          <Text style={[s.memberInitials, { color: color.text }]}>{initials}</Text>
        </View>
        <View style={s.memberInfo}>
          <Text style={[s.memberName, { color: theme.textPrimary }]} numberOfLines={1}>{name}</Text>
          {!!email && (
            <Text style={[s.memberEmail, { color: theme.textSecondary }]} numberOfLines={1}>{email}</Text>
          )}
        </View>
        <View style={[s.memberBadge, { backgroundColor: COLORS.green50 }]}>
          <Text style={[s.memberBadgeText, { color: COLORS.green600 }]}>Active</Text>
        </View>
      </View>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.container, { backgroundColor: theme.bg }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[s.headerIcon, { backgroundColor: COLORS.blue50 }]}>
          <Users size={20} color={COLORS.blue600} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.textPrimary }]}>{t.title}</Text>
          <Text style={[s.headerSub,   { color: theme.textSecondary }]}>{t.subtitle}</Text>
        </View>
        <View style={[s.countBadge, { backgroundColor: COLORS.blue50 }]}>
          <Text style={[s.countText, { color: COLORS.blue600 }]}>{members.length}</Text>
          <Text style={[s.countLabel, { color: COLORS.blue600 }]}>{t.members}</Text>
        </View>
      </View>

      {/* Main content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.blue600} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          renderItem={renderMember}
          contentContainerStyle={{ padding: 14, paddingBottom: 160, gap: 8 }}
          ListEmptyComponent={
            <View style={[s.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[s.emptyIconWrap, { backgroundColor: COLORS.blue50 }]}>
                <Users size={28} color={COLORS.blue600} strokeWidth={1.5} />
              </View>
              <Text style={[s.emptyTitle, { color: theme.textPrimary }]}>{t.noMembers}</Text>
              <Text style={[s.emptySub,   { color: theme.textSecondary }]}>{t.noMembersSub}</Text>
            </View>
          }
        />
      )}

      {/* Action buttons — floating above bottom nav */}
      <View style={[s.actionBar, { backgroundColor: theme.bg }]}>
        {/* Join with code — inline expandable */}
        {showJoin ? (
          <View style={[s.joinRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[s.joinInput, { color: theme.textPrimary, backgroundColor: theme.inputBg }]}
              placeholder={t.joinPlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              autoFocus
            />
            <TouchableOpacity
              style={[s.joinSubmit, joining && { opacity: 0.6 }]}
              onPress={handleJoin} disabled={joining}
            >
              {joining
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.joinSubmitText}>{t.joinBtn}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[s.joinCancel, { borderColor: theme.border }]} onPress={() => { setShowJoin(false); setJoinCode(""); }}>
              <X size={16} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        ) : (
         <TouchableOpacity
           style={[s.primaryBtn, generating && { opacity: 0.6 }]}
           onPress={handleGenerateInvite}
           disabled={generating}
         >
           {generating
             ? <ActivityIndicator size="small" color="#fff" />
             : <UserPlus size={16} color="#fff" strokeWidth={1.8} />}
           <Text style={s.primaryBtnText}>{t.generateInvite}</Text>
         </TouchableOpacity>
        )}
      </View>

      {/* Bottom nav */}
      <View style={[s.bottomNav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {navItems.map(({ label, icon: Icon, screen }) => {
          const active = screen === "SupportCircle";
          return (
            <TouchableOpacity key={screen} style={s.navItem} onPress={() => navigation.navigate(screen)}>
              <View style={active ? [s.navActivePill, { backgroundColor: COLORS.blue50 }] : null}>
                <Icon size={22} color={active ? COLORS.blue600 : theme.textSecondary} strokeWidth={1.8} />
              </View>
              <Text style={[s.navLabel, { color: active ? COLORS.blue600 : theme.textSecondary, fontWeight: active ? "600" : "400" }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Invite code modal */}
      <Modal visible={showInvite} transparent animationType="slide" onRequestClose={() => setShowInvite(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalSheet, { backgroundColor: theme.surface }]}>

            {/* Handle */}
            <View style={[s.modalHandle, { backgroundColor: theme.border }]} />

            <View style={[s.modalIconWrap, { backgroundColor: COLORS.blue50 }]}>
              <Link2 size={22} color={COLORS.blue600} strokeWidth={1.8} />
            </View>

            <Text style={[s.modalTitle, { color: theme.textPrimary }]}>{t.inviteCode}</Text>
            <Text style={[s.modalSub,   { color: theme.textSecondary }]}>{t.inviteCodeSub}</Text>

            {/* Code display */}
            <View style={[s.codeBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
              <Text style={[s.codeText, { color: theme.textPrimary }]} selectable>{inviteCode}</Text>
            </View>

            {/* Action buttons */}
            <TouchableOpacity
              style={s.modalPrimaryBtn}
              onPress={() => {
                Clipboard.setString(inviteCode);
                Toast.show({ type: "success", text1: t.copied });
              }}
            >
              <Copy size={16} color="#fff" strokeWidth={2} />
              <Text style={s.modalPrimaryBtnText}>{t.copy}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.modalSecondaryBtn, { backgroundColor: COLORS.green50, borderColor: COLORS.green50 }]}
              onPress={handleShareInvite}
            >
              <Share2 size={16} color={COLORS.green600} strokeWidth={2} />
              <Text style={[s.modalSecondaryBtnText, { color: COLORS.green600 }]}>{t.share}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.modalCloseBtn, { borderColor: theme.border }]} onPress={() => setShowInvite(false)}>
              <Text style={[s.modalCloseBtnText, { color: theme.textSecondary }]}>{t.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1 },
  center:             { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header:             { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingTop: 18, borderBottomWidth: 0.5 },
  headerIcon:         { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle:        { fontSize: 18, fontWeight: "700", letterSpacing: -0.2 },
  headerSub:          { fontSize: 12, marginTop: 1 },
  countBadge:         { alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  countText:          { fontSize: 18, fontWeight: "700", letterSpacing: -0.5 },
  countLabel:         { fontSize: 10, fontWeight: "600" },

  // Member card
  memberCard:         { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 0.5 },
  memberAvatar:       { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  memberInitials:     { fontSize: 15, fontWeight: "700" },
  memberInfo:         { flex: 1 },
  memberName:         { fontSize: 15, fontWeight: "600" },
  memberEmail:        { fontSize: 12, marginTop: 1 },
  memberBadge:        { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  memberBadgeText:    { fontSize: 11, fontWeight: "600" },

  // Empty state
  emptyBox:           { borderRadius: 16, borderWidth: 0.5, padding: 32, alignItems: "center", marginTop: 20 },
  emptyIconWrap:      { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle:         { fontSize: 17, fontWeight: "600", marginBottom: 6 },
  emptySub:           { fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Action bar
  actionBar:          { position: "absolute", bottom: 66, left: 0, right: 0, padding: 12 },
  btnRow:             { flexDirection: "row", gap: 10 },
  primaryBtn:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: COLORS.blue600, paddingVertical: 13, borderRadius: 12 },
  primaryBtnText:     { color: "#fff", fontWeight: "600", fontSize: 14 },
  secondaryBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
  secondaryBtnText:   { fontWeight: "600", fontSize: 14 },
  // Join row
  joinRow:            { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 8 },
  joinInput:          { flex: 1, fontSize: 15, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, letterSpacing: 1.5 },
  joinSubmit:         { backgroundColor: COLORS.blue600, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  joinSubmitText:     { color: "#fff", fontWeight: "600", fontSize: 13 },
  joinCancel:         { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  // Bottom nav
  bottomNav:          { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingBottom: 14, borderTopWidth: 0.5 },
  navItem:            { alignItems: "center", gap: 4 },
  navActivePill:      { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  navLabel:           { fontSize: 10 },

  // Modal (bottom sheet style)
  modalOverlay:       { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet:         { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, alignItems: "center" },
  modalHandle:        { width: 40, height: 4, borderRadius: 2, marginBottom: 20 },
  modalIconWrap:      { width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalTitle:         { fontSize: 19, fontWeight: "700", marginBottom: 6 },
  modalSub:           { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 20 },
  codeBox:            { borderWidth: 1, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, marginBottom: 20, width: "100%", alignItems: "center" },
  codeText:           { fontSize: 22, fontWeight: "700", letterSpacing: 4 },
  modalPrimaryBtn:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.blue600, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 12, width: "100%", justifyContent: "center", marginBottom: 10 },
  modalPrimaryBtnText:{ color: "#fff", fontWeight: "600", fontSize: 15 },
  modalSecondaryBtn:  { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 24, borderRadius: 12, width: "100%", justifyContent: "center", marginBottom: 10 },
  modalSecondaryBtnText:{ fontWeight: "600", fontSize: 15 },
  modalCloseBtn:      { width: "100%", paddingVertical: 12, borderRadius: 12, alignItems: "center", borderWidth: 1, marginTop: 4 },
  modalCloseBtnText:  { fontSize: 15 },
});