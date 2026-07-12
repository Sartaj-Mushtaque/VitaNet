import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Modal, Alert,
  PermissionsAndroid, Platform, StatusBar,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import {
  PhoneCall, FileText, MapPin, Calendar,
  BookOpen, Home, User, Settings, Users, ChevronRight,
  Bell, Heart, Activity,
} from "lucide-react-native";
import api from "./config/api";
import { getMyCommunityMembers } from "./config/api/community";
import Geolocation from "react-native-geolocation-service";
import { useAppContext } from "../context/AppContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const TOKEN = {
  // Core brand
  navy:         "#0C1A2E",
  navyMid:      "#14263D",
  navyLight:    "#1E3554",
  blue:         "#2563EB",
  blueMid:      "#3B82F6",
  blueGhost:    "#EFF6FF",
  blueGhostDark:"#1E3A5F",

  // Semantic
  danger:       "#DC2626",
  dangerLight:  "#FEF2F2",
  dangerGhost:  "rgba(220,38,38,0.12)",
  success:      "#059669",
  successLight: "#ECFDF5",

  // Accent tints
  teal:         "#0D9488",
  tealLight:    "#F0FDFA",
  amber:        "#D97706",
  amberLight:   "#FFFBEB",
  violet:       "#7C3AED",
  violetLight:  "#F5F3FF",

  // Neutrals — light mode
  cream:        "#FAFAF8",
  white:        "#FFFFFF",
  stone100:     "#F5F5F4",
  stone200:     "#E7E5E4",
  stone300:     "#D6D3D1",
  stone500:     "#78716C",
  stone700:     "#44403C",
  stone900:     "#1C1917",

  // Neutrals — dark mode
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
  divider:  TOKEN.stone300,
  text:     TOKEN.stone900,
  sub:      TOKEN.stone500,
  heading:  TOKEN.navy,
};

const DARK = {
  bg:       TOKEN.dark900,
  surface:  TOKEN.dark800,
  surface2: TOKEN.dark700,
  border:   TOKEN.darkBorder,
  divider:  TOKEN.dark600,
  text:     TOKEN.darkText,
  sub:      TOKEN.darkSub,
  heading:  TOKEN.darkText,
};

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const diseases    = ["Anemia", "Hemophilia", "Sickle Cell Disease", "Thalassemia", "Other"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Translations ─────────────────────────────────────────────────────────────
const TR = {
  English: {
    completeProfile:"Complete Your Profile",
    profileSub:"Tell us a little about yourself so we can personalise your care.",
    fullName:"Full Name", fullNamePlaceholder:"Enter your full name",
    bloodGroup:"Blood Group", selectBlood:"Select blood group",
    address:"Address", addressPlaceholder:"Enter your address",
    conditionLabel:"Condition", selectCondition:"Select condition",
    phone:"Phone Number", phonePlaceholder:"Enter phone number",
    city:"City", cityPlaceholder:"Enter your city",
    saveProfile:"Save & Continue",
    incompleteProfile:"Required Fields Missing", ok:"OK",
    patient:"Patient", active:"Active",
    sendingSos:"Sending alert...",
    emergencySos:"Emergency SOS",
    sosSubtitle:"Sends your location to all circle members",
    upcomingTreatments:"Upcoming", scheduled:"treatments",
    supportMembers:"Circle", activeLabel:"members",
    supportCircle:"Support Circle",
    noMembersYet:"No members yet",
    addMembers:"Add Members",
    manageCircle:"View Circle",
    quickActions:"Quick Access",
    viewArrow:"Open",
    healthReports:"Health Reports",
    nearbyHealth:"Nearby Centers",
    schedule:"Schedule",
    educationHub:"Education Hub",
    home:"Home", profile:"Profile", scheduleNav:"Schedule", settings:"Settings",
    sosAlertTitle:"Emergency SOS",
    sosAlertMsg:"This will alert all support circle members with your current location. Continue?",
    cancel:"Cancel", sendSos:"Send SOS",
    permissionDenied:"Permission Denied",
    locationRequired:"Location permission is required for SOS.",
    locationError:"Location Error",
    sosSent:"SOS Sent",
    sosFailed:"SOS Failed",
    unexpectedError:"An unexpected error occurred. Please try again.",
    couldNotLoad:"Could not load profile",
    checkConnection:"Check your connection and try again.",
    saveFailed:"Save failed",
    profileSaved:"Profile saved",
    pleaseComplete:"Please fill in the following fields:",
    vitanet:"VitaNet",
    tagline:"Your health, coordinated.",
  },
  "اردو": {
    completeProfile:"اپنی پروفائل مکمل کریں",
    profileSub:"اپنے بارے میں بتائیں تاکہ ہم آپ کی دیکھ بھال کو بہتر بنا سکیں۔",
    fullName:"پورا نام", fullNamePlaceholder:"اپنا پورا نام درج کریں",
    bloodGroup:"بلڈ گروپ", selectBlood:"بلڈ گروپ منتخب کریں",
    address:"پتہ", addressPlaceholder:"اپنا پتہ درج کریں",
    conditionLabel:"حالت", selectCondition:"حالت منتخب کریں",
    phone:"فون نمبر", phonePlaceholder:"فون نمبر درج کریں",
    city:"شہر", cityPlaceholder:"اپنا شہر درج کریں",
    saveProfile:"محفوظ کریں",
    incompleteProfile:"نامکمل معلومات", ok:"ٹھیک ہے",
    patient:"مریض", active:"فعال",
    sendingSos:"الرٹ بھیجا جا رہا ہے...",
    emergencySos:"ہنگامی ایس او ایس",
    sosSubtitle:"تمام ممبرز کو آپ کی لوکیشن بھیجتا ہے",
    upcomingTreatments:"آنے والے", scheduled:"علاج",
    supportMembers:"سرکل", activeLabel:"ممبرز",
    supportCircle:"سپورٹ سرکل",
    noMembersYet:"ابھی کوئی ممبر نہیں",
    addMembers:"ممبرز شامل کریں",
    manageCircle:"سرکل دیکھیں",
    quickActions:"فوری رسائی",
    viewArrow:"کھولیں",
    healthReports:"صحت رپورٹس",
    nearbyHealth:"قریبی مراکز",
    schedule:"شیڈول",
    educationHub:"تعلیمی مرکز",
    home:"ہوم", profile:"پروفائل", scheduleNav:"شیڈول", settings:"ترتیبات",
    sosAlertTitle:"ہنگامی ایس او ایس",
    sosAlertMsg:"یہ آپ کے تمام سپورٹ ممبرز کو آپ کی لوکیشن کے ساتھ الرٹ کرے گا۔ جاری رکھیں؟",
    cancel:"منسوخ", sendSos:"ایس او ایس بھیجیں",
    permissionDenied:"اجازت نہیں ملی",
    locationRequired:"ایس او ایس کے لیے لوکیشن اجازت ضروری ہے۔",
    locationError:"لوکیشن خرابی",
    sosSent:"ایس او ایس بھیج دیا",
    sosFailed:"ایس او ایس ناکام",
    unexpectedError:"ایک غیر متوقع خرابی ہوئی۔ دوبارہ کوشش کریں۔",
    couldNotLoad:"پروفائل لوڈ نہیں ہوئی",
    checkConnection:"اپنا کنیکشن چیک کریں اور دوبارہ کوشش کریں۔",
    saveFailed:"محفوظ نہیں ہوا",
    profileSaved:"پروفائل محفوظ ہوگئی",
    pleaseComplete:"براہ کرم یہ مکمل کریں:",
    vitanet:"VitaNet",
    tagline:"آپ کی صحت، منظم۔",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function PatientDashboard({ navigation }) {
  // All hooks first — unconditionally
  const [isFirstTime,   setIsFirstTime]   = useState(null);
  const [details,       setDetails]       = useState({ name: "", bloodGroup: "", address: "", diseaseType: "", phone: "", city: "" });
  const [modalVisible,  setModalVisible]  = useState(false);
  const [modalMessage,  setModalMessage]  = useState("");
  const [sosLoading,    setSosLoading]    = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [memberCount,   setMemberCount]   = useState(0);

  const { darkMode, language } = useAppContext();

  const t  = TR[language] || TR.English;
  const th = darkMode ? DARK : LIGHT;
  const greeting = getGreeting(language);

  const quickActions = [
    { label: t.healthReports, icon: FileText,  color: TOKEN.blue,   bg: TOKEN.blueGhost,   screen: "ReportsScreen" },
    { label: t.nearbyHealth,  icon: MapPin,    color: TOKEN.teal,   bg: TOKEN.tealLight,   screen: "NearbyHealthCenters" },
    { label: t.schedule,      icon: Calendar,  color: TOKEN.amber,  bg: TOKEN.amberLight,  screen: "Schedule" },
    { label: t.educationHub,  icon: BookOpen,  color: TOKEN.violet, bg: TOKEN.violetLight, screen: "EducationHub" },
  ];

  const navItems = [
    { label: t.home,        icon: Home,     screen: "PatientDashboard" },
    { label: t.profile,     icon: User,     screen: "Profile" },
    { label: t.scheduleNav, icon: Calendar, screen: "Schedule" },
    { label: t.settings,    icon: Settings, screen: "Settings" },
  ];

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDetails = async () => {
    try {
      const res = await api.get("/patient/me");
      if (res.data?.fullName) {
        setDetails({
          name:        res.data.fullName,
          bloodGroup:  res.data.bloodGroup,
          address:     res.data.address,
          diseaseType: res.data.disease,
          phone:       res.data.phone,
          city:        res.data.city,
        });
        setIsFirstTime(false);
      } else {
        setIsFirstTime(true);
      }
    } catch (e) {
      if (e?.response?.status === 404) {
        setIsFirstTime(true);
      } else {
        setIsFirstTime(false);
        Toast.show({ type: "error", text1: t.couldNotLoad, text2: t.checkConnection });
      }
    }
    try {
      const res = await api.get("/schedule");
      setUpcomingCount((res.data.schedules || []).filter((s) => s.status === "upcoming").length);
    } catch { /* non-blocking */ }
    try {
      const members = await getMyCommunityMembers();
      setMemberCount(Array.isArray(members) ? members.length : 0);
    } catch { /* non-blocking */ }
  };

  useEffect(() => { fetchDetails(); }, []);

  // ── SOS ──────────────────────────────────────────────────────────────────
  const getRawSosPosition = (highAccuracy) =>
    new Promise((resolve, reject) =>
      Geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        timeout:            highAccuracy ? 10000 : 20000,
        maximumAge:         highAccuracy ? 0 : 30000,
        forceRequestLocation: true,
        showLocationDialog:   true,
        forceLocationManager: !highAccuracy,
      })
    );

  const getSosLocation = async () => {
    try { return await getRawSosPosition(true); }
    catch { return await getRawSosPosition(false); }
  };

  const handleSos = () => {
    Alert.alert(t.sosAlertTitle, t.sosAlertMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.sendSos, style: "destructive",
        onPress: async () => {
          setSosLoading(true);
          try {
            if (Platform.OS === "android") {
              const fine   = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
              const coarse = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
              if (fine !== PermissionsAndroid.RESULTS.GRANTED && coarse !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(t.permissionDenied, t.locationRequired); return;
              }
            }
            let position;
            try { position = await getSosLocation(); }
            catch (locErr) {
              const code = locErr?.code;
              const msg = code === 1 ? "Location permission denied. Enable it in app settings."
                : code === 2 ? "Location unavailable. Turn Location off/on and enable High Accuracy."
                : code === 3 ? "Location timed out. Try again outdoors."
                : "Please enable GPS to send SOS.";
              Alert.alert(t.locationError, msg); return;
            }
            const { latitude, longitude } = position.coords;
            try {
              const res = await api.post("/sos/send", { latitude, longitude, address: "", message: "Emergency! I need immediate help!" });
              Toast.show({ type: "success", text1: t.sosSent, text2: res.data.message });
            } catch (apiErr) {
              Toast.show({ type: "error", text1: t.sosFailed, text2: apiErr?.response?.data?.message || "" });
            }
          } catch {
            Alert.alert("Error", t.unexpectedError);
          } finally {
            setSosLoading(false);
          }
        },
      },
    ]);
  };

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const { name, bloodGroup, address, diseaseType, phone, city } = details;
    const missing = [];
    if (!name)        missing.push(t.fullName);
    if (!bloodGroup)  missing.push(t.bloodGroup);
    if (!address)     missing.push(t.address);
    if (!diseaseType) missing.push(t.conditionLabel);
    if (!phone)       missing.push(t.phone);
    if (!city)        missing.push(t.city);
    if (missing.length > 0) {
      setModalMessage(`${t.pleaseComplete}\n\n${missing.join("\n")}`);
      setModalVisible(true);
      return;
    }
    try {
      await api.post("/patient/me", { fullName: name, bloodGroup, address, disease: diseaseType, phone, city });
      setIsFirstTime(false);
      Toast.show({ type: "success", text1: t.profileSaved });
    } catch (e) {
      Toast.show({ type: "error", text1: t.saveFailed, text2: e?.response?.data?.message || "" });
    }
  };

  // ── Single return ─────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: th.bg }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={TOKEN.navy}
      />

      {/* ── Loading ── */}
      {isFirstTime === null && (
        <View style={[s.center, { backgroundColor: th.bg }]}>
          <View style={s.loadingCard}>
            <Activity size={28} color={TOKEN.blue} strokeWidth={1.6} />
            <Text style={s.loadingText}>VitaNet</Text>
          </View>
        </View>
      )}

      {/* ── Profile setup form ── */}
      {isFirstTime === true && (
        <View style={{ flex: 1 }}>
          {/* Navy header band */}
          <View style={s.formBand}>
            <View style={s.formBrandRow}>
              <View style={s.formBrandIcon}>
                <Heart size={18} color={TOKEN.white} strokeWidth={1.8} fill={TOKEN.white} />
              </View>
              <View>
                <Text style={s.formBrandName}>{t.vitanet}</Text>
                <Text style={s.formBrandTag}>{t.tagline}</Text>
              </View>
            </View>
            <Text style={s.formBandTitle}>{t.completeProfile}</Text>
            <Text style={s.formBandSub}>{t.profileSub}</Text>
          </View>

          <ScrollView
            style={{ flex: 1, backgroundColor: th.bg }}
            contentContainerStyle={s.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {[
              { label: t.fullName,  key: "name",    placeholder: t.fullNamePlaceholder, keyboard: "default"   },
              { label: t.address,   key: "address", placeholder: t.addressPlaceholder,  keyboard: "default"   },
              { label: t.phone,     key: "phone",   placeholder: t.phonePlaceholder,    keyboard: "phone-pad" },
              { label: t.city,      key: "city",    placeholder: t.cityPlaceholder,     keyboard: "default"   },
            ].map(({ label, key, placeholder, keyboard }) => (
              <View key={key} style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: th.sub }]}>{label}</Text>
                <TextInput
                  style={[s.input, { backgroundColor: th.surface, color: th.text, borderColor: th.border }]}
                  placeholder={placeholder}
                  placeholderTextColor={th.sub}
                  keyboardType={keyboard}
                  value={details[key]}
                  onChangeText={(v) => setDetails({ ...details, [key]: v })}
                />
              </View>
            ))}

            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: th.sub }]}>{t.bloodGroup}</Text>
              <View style={[s.pickerWrap, { backgroundColor: th.surface, borderColor: th.border }]}>
                <Picker selectedValue={details.bloodGroup}
                  onValueChange={(v) => setDetails({ ...details, bloodGroup: v })}
                  dropdownIconColor={th.sub}>
                  <Picker.Item label={t.selectBlood} value="" color={th.sub} />
                  {bloodGroups.map((b) => <Picker.Item key={b} label={b} value={b} color={th.text} />)}
                </Picker>
              </View>
            </View>

            <View style={s.fieldGroup}>
              <Text style={[s.fieldLabel, { color: th.sub }]}>{t.conditionLabel}</Text>
              <View style={[s.pickerWrap, { backgroundColor: th.surface, borderColor: th.border }]}>
                <Picker selectedValue={details.diseaseType}
                  onValueChange={(v) => setDetails({ ...details, diseaseType: v })}
                  dropdownIconColor={th.sub}>
                  <Picker.Item label={t.selectCondition} value="" color={th.sub} />
                  {diseases.map((d) => <Picker.Item key={d} label={d} value={d} color={th.text} />)}
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.88}>
              <Text style={s.saveBtnText}>{t.saveProfile}</Text>
            </TouchableOpacity>
          </ScrollView>

          <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
            <View style={s.modalBg}>
              <View style={[s.modalBox, { backgroundColor: th.surface }]}>
                <View style={s.modalIconWrap}>
                  <Activity size={22} color={TOKEN.danger} strokeWidth={1.7} />
                </View>
                <Text style={[s.modalTitle, { color: th.text }]}>{t.incompleteProfile}</Text>
                <Text style={[s.modalBody,  { color: th.sub  }]}>{modalMessage}</Text>
                <TouchableOpacity style={s.modalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={s.modalBtnText}>{t.ok}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* ── Dashboard ── */}
      {isFirstTime === false && (
        <View style={{ flex: 1 }}>

          {/* ── Header — deep navy ── */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerGreet}>{greeting}</Text>
              <Text style={s.headerName} numberOfLines={1}>{details.name || t.patient}</Text>
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

          {/* ── Body ── */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[s.body, { backgroundColor: th.bg }]}
            showsVerticalScrollIndicator={false}
          >

            {/* SOS — pulls up from the header, overlapping slightly */}
            <TouchableOpacity
              style={[s.sosCard, sosLoading && { opacity: 0.8 }]}
              onPress={handleSos}
              disabled={sosLoading}
              activeOpacity={0.9}
            >
              <View style={s.sosTextBlock}>
                <Text style={s.sosEyebrow}>EMERGENCY</Text>
                <Text style={s.sosTitle}>{sosLoading ? t.sendingSos : t.emergencySos}</Text>
                <Text style={s.sosSub}>{t.sosSubtitle}</Text>
              </View>
              <View style={s.sosBtn}>
                {sosLoading
                  ? <ActivityIndicator size="small" color={TOKEN.danger} />
                  : <PhoneCall size={22} color={TOKEN.danger} strokeWidth={2} />}
              </View>
            </TouchableOpacity>

            {/* ── Stat row ── */}
            <View style={s.statRow}>
              <TouchableOpacity
                style={[s.statCard, { backgroundColor: th.surface, borderColor: th.border }]}
                onPress={() => navigation.navigate("Schedule")}
                activeOpacity={0.8}
              >
                <View style={[s.statPip, { backgroundColor: TOKEN.blueGhost }]}>
                  <Calendar size={14} color={TOKEN.blue} strokeWidth={2} />
                </View>
                <Text style={[s.statNum, { color: th.heading }]}>{upcomingCount}</Text>
                <Text style={[s.statPrimary, { color: th.text }]}>{t.upcomingTreatments}</Text>
                <Text style={[s.statSecondary, { color: th.sub }]}>{t.scheduled}</Text>
                <View style={[s.statChevron]}>
                  <ChevronRight size={14} color={th.sub} strokeWidth={2} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.statCard, { backgroundColor: th.surface, borderColor: th.border }]}
                onPress={() => navigation.navigate("SupportCircle")}
                activeOpacity={0.8}
              >
                <View style={[s.statPip, { backgroundColor: TOKEN.tealLight }]}>
                  <Users size={14} color={TOKEN.teal} strokeWidth={2} />
                </View>
                <Text style={[s.statNum, { color: th.heading }]}>{memberCount}</Text>
                <Text style={[s.statPrimary, { color: th.text }]}>{t.supportMembers}</Text>
                <Text style={[s.statSecondary, { color: th.sub }]}>{t.activeLabel}</Text>
                <View style={[s.statChevron]}>
                  <ChevronRight size={14} color={th.sub} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>

            {/* ── Support circle card ── */}
            <TouchableOpacity
              style={[s.circleCard, { backgroundColor: th.surface, borderColor: th.border }]}
              onPress={() => navigation.navigate("SupportCircle")}
              activeOpacity={0.8}
            >
              <View style={[s.circleAvatarStack]}>
                {memberCount > 0
                  ? Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
                      <View key={i} style={[s.circleAvatar, { left: i * 18, backgroundColor: [TOKEN.blueGhost, TOKEN.tealLight, TOKEN.violetLight][i], borderColor: th.surface }]}>
                        <Text style={[s.circleAvatarText, { color: [TOKEN.blue, TOKEN.teal, TOKEN.violet][i] }]}>
                          {String.fromCharCode(65 + i)}
                        </Text>
                      </View>
                    ))
                  : (
                    <View style={[s.circleAvatar, { backgroundColor: TOKEN.blueGhost, borderColor: th.surface }]}>
                      <Users size={14} color={TOKEN.blue} strokeWidth={1.8} />
                    </View>
                  )}
              </View>
              <View style={s.circleTextBlock}>
                <Text style={[s.circleTitle, { color: th.text }]}>{t.supportCircle}</Text>
                <Text style={[s.circleSub, { color: th.sub }]}>
                  {memberCount > 0 ? `${memberCount} ${t.activeLabel}` : t.noMembersYet}
                </Text>
              </View>
              <View style={[s.circleAction, { backgroundColor: memberCount > 0 ? TOKEN.blueGhost : TOKEN.navy }]}>
                <Text style={[s.circleActionText, { color: memberCount > 0 ? TOKEN.blue : TOKEN.white }]}>
                  {memberCount > 0 ? t.manageCircle : t.addMembers}
                </Text>
              </View>
            </TouchableOpacity>

            {/* ── Quick actions ── */}
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: th.sub }]}>{t.quickActions}</Text>
              <View style={[s.sectionLine, { backgroundColor: th.border }]} />
            </View>

            <View style={s.grid}>
              {quickActions.map(({ label, icon: Icon, color, bg, screen }) => (
                <TouchableOpacity
                  key={screen}
                  style={[s.gridCard, { backgroundColor: th.surface, borderColor: th.border }]}
                  onPress={() => navigation.navigate(screen)}
                  activeOpacity={0.8}
                >
                  <View style={[s.gridIconWrap, { backgroundColor: bg }]}>
                    <Icon size={20} color={color} strokeWidth={1.7} />
                  </View>
                  <Text style={[s.gridLabel, { color: th.text }]}>{label}</Text>
                  <View style={[s.gridFooter]}>
                    <Text style={[s.gridCta, { color: color }]}>{t.viewArrow}</Text>
                    <ChevronRight size={12} color={color} strokeWidth={2.2} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>

          </ScrollView>

          {/* ── Bottom nav ── */}
          <View style={[s.nav, { backgroundColor: th.surface, borderTopColor: th.border }]}>
            {navItems.map(({ label, icon: Icon, screen }) => {
              const active = screen === "PatientDashboard";
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

        </View>
      )}

      <Toast />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Loading
  loadingCard:  { alignItems: "center", gap: 10 },
  loadingText:  { fontSize: 18, fontWeight: "700", color: TOKEN.navy, letterSpacing: 1.5 },

  // ── Form ──
  formBand:       { backgroundColor: TOKEN.navy, paddingHorizontal: 22, paddingTop: 52, paddingBottom: 28 },
  formBrandRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
  formBrandIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  formBrandName:  { color: TOKEN.white, fontSize: 15, fontWeight: "700", letterSpacing: 1 },
  formBrandTag:   { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 1 },
  formBandTitle:  { color: TOKEN.white, fontSize: 24, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  formBandSub:    { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 19 },
  formScroll:     { padding: 20, paddingBottom: 50 },
  fieldGroup:     { marginBottom: 16 },
  fieldLabel:     { fontSize: 11, fontWeight: "700", letterSpacing: 0.9, textTransform: "uppercase", marginBottom: 8 },
  input:          { paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, fontSize: 15, borderWidth: 1 },
  pickerWrap:     { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  saveBtn:        { backgroundColor: TOKEN.navy, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  saveBtnText:    { color: TOKEN.white, fontWeight: "800", fontSize: 15, letterSpacing: 0.4 },

  // Modal
  modalBg:        { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)" },
  modalBox:       { padding: 28, borderRadius: 20, width: "82%", alignItems: "center", elevation: 16 },
  modalIconWrap:  { width: 48, height: 48, borderRadius: 14, backgroundColor: TOKEN.dangerLight, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  modalTitle:     { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  modalBody:      { fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 24 },
  modalBtn:       { backgroundColor: TOKEN.navy, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10 },
  modalBtnText:   { color: TOKEN.white, fontWeight: "700", fontSize: 14 },

  // ── Dashboard header ──
  header:         { backgroundColor: TOKEN.navy, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 20, flexDirection: "row", alignItems: "flex-end" },
  headerGreet:    { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "500", letterSpacing: 0.3, marginBottom: 3 },
  headerName:     { color: TOKEN.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  headerRight:    { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 2 },
  activePill:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(5,150,105,0.18)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  activeDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  activePillText: { fontSize: 11, color: "#34D399", fontWeight: "700" },
  bellWrap:       { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },

  // ── Body / Scroll ──
  body:           { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24, gap: 12 },

  // ── SOS ──
  sosCard:        { backgroundColor: TOKEN.white, borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    borderWidth: 1.5, borderColor: TOKEN.danger,
                    shadowColor: TOKEN.danger, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  sosTextBlock:   { flex: 1 },
  sosEyebrow:     { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, color: TOKEN.danger, marginBottom: 3 },
  sosTitle:       { fontSize: 17, fontWeight: "800", color: TOKEN.stone900, letterSpacing: -0.3, marginBottom: 4 },
  sosSub:         { fontSize: 12, color: TOKEN.stone500, lineHeight: 17 },
  sosBtn:         { width: 52, height: 52, borderRadius: 14, backgroundColor: TOKEN.dangerLight, alignItems: "center", justifyContent: "center", marginLeft: 14,
                    borderWidth: 1, borderColor: "rgba(220,38,38,0.2)" },

  // ── Stat cards ──
  statRow:        { flexDirection: "row", gap: 12 },
  statCard:       { flex: 1, borderRadius: 16, padding: 16, borderWidth: 1, position: "relative",
                    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statPip:        { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statNum:        { fontSize: 32, fontWeight: "800", letterSpacing: -1, lineHeight: 36, marginBottom: 4 },
  statPrimary:    { fontSize: 13, fontWeight: "600", lineHeight: 17 },
  statSecondary:  { fontSize: 11, marginTop: 2 },
  statChevron:    { position: "absolute", top: 14, right: 14 },

  // ── Support circle ──
  circleCard:     { borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12,
                    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  circleAvatarStack: { width: 54, height: 36, position: "relative" },
  circleAvatar:   { position: "absolute", width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  circleAvatarText: { fontSize: 11, fontWeight: "700" },
  circleTextBlock:{ flex: 1 },
  circleTitle:    { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  circleSub:      { fontSize: 12 },
  circleAction:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  circleActionText:{ fontSize: 12, fontWeight: "700" },

  // ── Quick actions ──
  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  sectionTitle:   { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  sectionLine:    { flex: 1, height: 1 },
  grid:           { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard:       { width: "47.5%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 10,
                    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  gridIconWrap:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  gridLabel:      { fontSize: 13, fontWeight: "700", lineHeight: 18 },
  gridFooter:     { flexDirection: "row", alignItems: "center", gap: 2 },
  gridCta:        { fontSize: 11, fontWeight: "700" },

  // ── Bottom nav ──
  nav:            { flexDirection: "row", justifyContent: "space-around", paddingTop: 8, paddingBottom: 20, borderTopWidth: 1 },
  navItem:        { alignItems: "center", gap: 4, flex: 1 },
  navIcon:        { width: 42, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navLabel:       { fontSize: 10, letterSpacing: 0.2 },
});