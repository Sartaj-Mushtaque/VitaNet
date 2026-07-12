import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator,
  PermissionsAndroid, Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";
import { launchImageLibrary } from "react-native-image-picker";
import { Home, User, Calendar, Settings, Activity } from "lucide-react-native";
import api from "./config/api";
import { useAppContext } from "../context/AppContext";

const COLORS = { blue600: "#185FA5", red600: "#A32D2D" };
const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const diseases    = ["Anemia", "Hemophilia", "Sickle Cell Disease", "Thalassemia", "Other"];

const navItems = [
  { icon: Home,     screen: "PatientDashboard" },
  { icon: User,     screen: "Profile" },
  { icon: Calendar, screen: "Schedule" },
  { icon: Settings, screen: "Settings" },
];

const TRANSLATIONS = {
  English: {
    title: "My Profile", editProfile: "Edit Profile", saveChanges: "Save Changes",
    saving: "Saving...", cancel: "Cancel", changePhoto: "Change photo",
    fullName: "Full Name", bloodGroup: "Blood Group",
    condition: "Disease / Condition", phone: "Phone Number", city: "City", address: "Address",
    selectBlood: "Select blood group", selectCondition: "Select condition",
    phonePlaceholder: "11-digit phone number", cityPlaceholder: "City",
    addressPlaceholder: "Address", namePlaceholder: "Full Name",
    conditionLabel: "Condition",
    saveFail: "Save failed", saveSuccess: "Profile saved successfully",
    profileFail: "Profile not found or unauthorized",
    home: "Home", profile: "Profile", schedule: "Schedule", settings: "Settings",
  },
  "اردو": {
    title: "میری پروفائل", editProfile: "پروفائل ترمیم کریں", saveChanges: "تبدیلیاں محفوظ کریں",
    saving: "محفوظ ہو رہا ہے...", cancel: "منسوخ", changePhoto: "تصویر تبدیل کریں",
    fullName: "پورا نام",  bloodGroup: "بلڈ گروپ",
    condition: "بیماری / حالت", phone: "فون نمبر", city: "شہر", address: "پتہ",
    selectBlood: "بلڈ گروپ منتخب کریں", selectCondition: "حالت منتخب کریں",
    phonePlaceholder: "11 ہندسے فون نمبر", cityPlaceholder: "شہر",
    addressPlaceholder: "پتہ", namePlaceholder: "پورا نام",
    conditionLabel: "حالت",
    saveFail: "محفوظ نہیں ہوا", saveSuccess: "پروفائل کامیابی سے محفوظ ہوئی",
    profileFail: "پروفائل نہیں ملی",
    home: "ہوم", profile: "پروفائل", schedule: "شیڈول", settings: "ترتیبات",
  },
};

export default function PatientProfile({ navigation }) {
  const [loading,  setLoading]  = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [details,  setDetails]  = useState({ name: "", email: "", bloodGroup: "", diseaseType: "", phone: "", city: "", address: "", avatar: null });
  const [snapshot, setSnapshot] = useState(null);

  const { darkMode, language } = useAppContext();
  const t = TRANSLATIONS[language];

  const theme = {
    bg:            darkMode ? "#121212" : "#F4F5F7",
    surface:       darkMode ? "#1E1E1E" : "#FFFFFF",
    textPrimary:   darkMode ? "#F0F0F0" : "#1A1A1A",
    textSecondary: darkMode ? "#AAAAAA" : "#6B6B6B",
    border:        darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  };

  const navLabels = [t.home, t.profile, t.schedule, t.settings];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res  = await api.get("/patient/me");
        const data = res.data;
        const formatted = {
          name: data.fullName || "",
          bloodGroup: data.bloodGroup || "", diseaseType: data.disease || "",
          phone: data.phone || "", city: data.city || "",
          address: data.address || "", avatar: data.avatar || null,
        };
        setDetails(formatted); setSnapshot(formatted);
      } catch {
        Toast.show({ type: "error", text1: t.profileFail });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const pickImage = async () => {
    if (Platform.OS === "android") await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
    launchImageLibrary({ mediaType: "photo", maxWidth: 300, maxHeight: 300, quality: 0.7 }, (res) => {
      if (res.didCancel || res.errorCode) return;
      if (res.assets?.length > 0) setDetails((p) => ({ ...p, avatar: res.assets[0].uri }));
    });
  };

  const handleCancel = () => { if (snapshot) setDetails(snapshot); setEditMode(false); };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.post("/patient/me", {
        fullName: details.name, bloodGroup: details.bloodGroup,
        disease: details.diseaseType, phone: details.phone, city: details.city,
        address: details.address, avatar: details.avatar,
      });
      setSnapshot(details);
      Toast.show({ type: "success", text1: t.saveSuccess });
      setEditMode(false);
    } catch {
      Toast.show({ type: "error", text1: t.saveFail });
    } finally {
      setIsSaving(false);
    }
  };

 if (loading) return (
   <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C1A2E" }}>
     <View style={{ alignItems: "center", gap: 10 }}>
       <Activity size={28} color="#2563EB" strokeWidth={1.6} />
       <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", letterSpacing: 1.5 }}>VitaNet</Text>
     </View>
   </View>
 );

  const profileRows = [
    { label: t.fullName,       value: details.name },
    { label: t.bloodGroup,     value: details.bloodGroup },
    { label: t.conditionLabel, value: details.diseaseType },
    { label: t.phone,          value: details.phone },
    { label: t.city,           value: details.city },
    { label: t.address,        value: details.address },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t.title}</Text>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {details.avatar ? (
            <Image source={{ uri: details.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{details.name ? details.name[0].toUpperCase() : "?"}</Text>
            </View>
          )}
          {editMode && (
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Text style={styles.uploadText}>{t.changePhoto}</Text>
            </TouchableOpacity>
          )}
        </View>

        {editMode ? (
          <>
            {[
              { label: t.fullName,  key: "name",        placeholder: t.namePlaceholder,  kb: "default" },
              { label: t.phone,     key: "phone",       placeholder: t.phonePlaceholder, kb: "phone-pad", maxLen: 11 },
              { label: t.city,      key: "city",        placeholder: t.cityPlaceholder,  kb: "default" },
              { label: t.address,   key: "address",     placeholder: t.addressPlaceholder, kb: "default" },
            ].map(({ label, key, placeholder, kb, maxLen }) => (
              <React.Fragment key={key}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }]}
                  placeholder={placeholder}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType={kb}
                  maxLength={maxLen}
                  value={details[key]}
                  onChangeText={(v) => setDetails((p) => ({ ...p, [key]: v }))}
                />
              </React.Fragment>
            ))}

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t.bloodGroup}</Text>
            <View style={[styles.pickerWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Picker selectedValue={details.bloodGroup} onValueChange={(v) => setDetails((p) => ({ ...p, bloodGroup: v }))}>
                <Picker.Item label={t.selectBlood} value="" />
                {bloodGroups.map((b) => <Picker.Item key={b} label={b} value={b} />)}
              </Picker>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{t.condition}</Text>
            <View style={[styles.pickerWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Picker selectedValue={details.diseaseType} onValueChange={(v) => setDetails((p) => ({ ...p, diseaseType: v }))}>
                <Picker.Item label={t.selectCondition} value="" />
                {diseases.map((d) => <Picker.Item key={d} label={d} value={d} />)}
              </Picker>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={handleCancel} disabled={isSaving}>
                <Text style={[styles.cancelText, { color: theme.textPrimary }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
                <Text style={styles.saveText}>{isSaving ? t.saving : t.saveChanges}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {profileRows.map(({ label, value }) => (
              <View key={label} style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
                <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{value || "—"}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(true)}>
              <Text style={styles.editText}>{t.editProfile}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {navItems.map(({ icon: Icon, screen }, index) => {
          const active = screen === "Profile";
          return (
            <TouchableOpacity key={screen} style={styles.navItem} onPress={() => navigation.navigate(screen)}>
              <Icon size={22} color={active ? COLORS.blue600 : theme.textSecondary} strokeWidth={1.8} />
              <Text style={[styles.navLabel, { color: active ? COLORS.blue600 : theme.textSecondary }]}>
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

const styles = StyleSheet.create({
  container:         { flex: 1 },
  center:            { flex: 1, justifyContent: "center", alignItems: "center" },
  title:             { fontSize: 22, fontWeight: "500", marginBottom: 20, textAlign: "center" },
  avatarContainer:   { alignItems: "center", marginBottom: 24 },
  avatar:            { width: 90, height: 90, borderRadius: 45, marginBottom: 10 },
  avatarPlaceholder: { backgroundColor: "#185FA5", justifyContent: "center", alignItems: "center" },
  avatarInitial:     { color: "#fff", fontSize: 36, fontWeight: "300" },
  uploadBtn:         { backgroundColor: "#185FA5", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  uploadText:        { color: "#fff", fontWeight: "500", fontSize: 13 },
  fieldLabel:        { fontSize: 11, fontWeight: "500", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, marginTop: 14 },
  input:             { padding: 13, borderRadius: 10, fontSize: 15, borderWidth: 0.5 },
  pickerWrap:        { borderRadius: 10, borderWidth: 0.5 },
  btnRow:            { flexDirection: "row", gap: 10, marginTop: 28 },
  cancelBtn:         { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 0.5 },
  cancelText:        { fontWeight: "500", fontSize: 15 },
  saveBtn:           { flex: 1, backgroundColor: "#185FA5", padding: 14, borderRadius: 12, alignItems: "center" },
  saveText:          { color: "#fff", fontWeight: "500", fontSize: 15 },
  row:               { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 0.5 },
  rowLabel:          { fontSize: 13, fontWeight: "500" },
  rowValue:          { fontSize: 14, flex: 1, textAlign: "right", marginLeft: 12 },
  editBtn:           { backgroundColor: "#185FA5", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  editText:          { color: "#fff", fontWeight: "500", fontSize: 15 },
  bottomNav:         { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingBottom: 14, borderTopWidth: 0.5 },
  navItem:           { alignItems: "center", gap: 4 },
  navLabel:          { fontSize: 10 },
});