import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Linking, Alert, RefreshControl,
  StatusBar, PermissionsAndroid, Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "react-native-geolocation-service";
import api from "./config/api";
import { useAppContext } from "../context/AppContext";

const TRANSLATIONS = {
  English: {
    title:            "Nearby Health Centers",
    basedOnLocation:  "Based on your location",
    away:             "away",
    searching:        "Searching nearby centers...",
    takeFewSeconds:   "This may take a few seconds",
    unableToLoad:     "Unable to Load",
    noResults:        "No Results Found",
    noResultsDesc:    (label) => `No ${label} found within 5km of your location.`,
    refresh:          "Refresh",
    retry:            "Try Again",
    viewOnMap:        "View on Map",
    getDirections:    "Get Directions",
    resultsFound:     (n) => `${n} results found near you`,
    hospitals:        "Hospitals",
    clinics:          "Clinics",
    pharmacy:         "Pharmacy",
    labsBlood:        "Labs & Blood",
    locationDenied:   "Location permission denied. Please enable location in settings.",
    locationUnavailable: "Location unavailable. Please check GPS.",
    fetchFail:        "Failed to fetch nearby health centers.",
    mapsError:        "Could not open Google Maps",
    error:            "Error",
  },
  "اردو": {
    title:            "قریبی صحت مراکز",
    basedOnLocation:  "آپ کی لوکیشن کی بنیاد پر",
    away:             "دور",
    searching:        "قریبی مراکز تلاش ہو رہے ہیں...",
    takeFewSeconds:   "کچھ سیکنڈ لگ سکتے ہیں",
    unableToLoad:     "لوڈ نہیں ہوا",
    noResults:        "کوئی نتیجہ نہیں",
    noResultsDesc:    (label) => `آپ کے 5 کلومیٹر میں کوئی ${label} نہیں ملا۔`,
    refresh:          "تازہ کریں",
    retry:            "دوبارہ کوشش کریں",
    viewOnMap:        "نقشے پر دیکھیں",
    getDirections:    "راستہ دیکھیں",
    resultsFound:     (n) => `${n} نتائج ملے`,
    hospitals:        "ہسپتال",
    clinics:          "کلینک",
    pharmacy:         "فارمیسی",
    labsBlood:        "لیبز اور بلڈ",
    locationDenied:   "لوکیشن اجازت نہیں ملی۔ سیٹنگز میں لوکیشن آن کریں۔",
    locationUnavailable: "لوکیشن دستیاب نہیں۔ GPS چیک کریں۔",
    fetchFail:        "قریبی مراکز لوڈ نہیں ہوئے۔",
    mapsError:        "گوگل میپس نہیں کھل سکا",
    error:            "خرابی",
  },
};

const getFilterColor = (value) => ({
  hospital:   "#1565C0",
  doctor:     "#00695C",
  pharmacy:   "#6A1B9A",
  blood_bank: "#B71C1C",
}[value] || "#1565C0");

const getDistance = (userLocation, placeLat, placeLng) => {
  if (!userLocation) return null;
  const R = 6371;
  const dLat = ((placeLat - userLocation.latitude) * Math.PI) / 180;
  const dLng = ((placeLng - userLocation.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLocation.latitude * Math.PI) / 180) *
    Math.cos((placeLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
};

export default function NearbyHealthCenters({ navigation }) {
  const [places,        setPlaces]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeFilter,  setActiveFilter]  = useState("hospital");
  const [userLocation,  setUserLocation]  = useState(null);
  const [error,         setError]         = useState(null);

  const { darkMode, language } = useAppContext();
  const t = TRANSLATIONS[language];

  const theme = {
    bg:           darkMode ? "#121212" : "#F4F6FA",
    surface:      darkMode ? "#1E1E1E" : "#ffffff",
    textPrimary:  darkMode ? "#F0F0F0" : "#1A1A1A",
    textSecondary:darkMode ? "#AAAAAA" : "#888888",
    border:       darkMode ? "rgba(255,255,255,0.08)" : "#F0F0F0",
    filterBg:     darkMode ? "#1E1E1E" : "#ffffff",
    filterBorder: darkMode ? "rgba(255,255,255,0.12)" : "#E0E0E0",
    filterBarBg:  darkMode ? "#1A1A1A" : "#ffffff",
    filterBarBorder: darkMode ? "rgba(255,255,255,0.08)" : "#EBEBEB",
  };

  // Filters built from translations so labels update with language
  const FILTERS = [
    { label: t.hospitals, value: "hospital",   icon: "H" },
    { label: t.clinics,   value: "doctor",     icon: "C" },
    { label: t.pharmacy,  value: "pharmacy",   icon: "Rx" },
    { label: t.labsBlood, value: "blood_bank", icon: "L" },
  ];

  const getLocation = () =>
    new Promise(async (resolve, reject) => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message: "App needs access to your location to find nearby health centers.",
              buttonPositive: "OK",
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED)
            return reject(new Error("LOCATION_PERMISSION_DENIED"));
        } else {
          const auth = await Geolocation.requestAuthorization("whenInUse");
          if (auth !== "granted")
            return reject(new Error("LOCATION_PERMISSION_DENIED"));
        }
        Geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const loc = { latitude, longitude };
            setUserLocation(loc);
            resolve(loc);
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 0, forceRequestLocation: true, showLocationDialog: true }
        );
      } catch (err) {
        reject(err);
      }
    });

  const fetchPlaces = async (type = activeFilter, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      let location = userLocation;
      if (!location) location = await getLocation();

      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/health-centers", {
        params: { latitude: Number(location.latitude), longitude: Number(location.longitude), type },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      setPlaces(res.data.places || []);
    } catch (err) {
      if (err?.message === "LOCATION_PERMISSION_DENIED" || err?.code === 1 || err?.code === "1") {
        setError(t.locationDenied);
      } else if (err?.code === 2 || err?.code === "2") {
        setError(t.locationUnavailable);
      } else {
        setError(t.fetchFail);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchPlaces(); }, []);

  const openInMaps = (place) => {
    const { latitude, longitude } = place.location;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
      .catch(() => Alert.alert(t.error, t.mapsError));
  };

  const getDirections = (place) => {
    const { latitude, longitude } = place.location;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`)
      .catch(() => Alert.alert(t.error, t.mapsError));
  };

  const activeColor = getFilterColor(activeFilter);

  const renderPlace = ({ item, index }) => {
    const distance = getDistance(userLocation, item.location?.latitude, item.location?.longitude);
    const color = getFilterColor(activeFilter);
    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardTop}>
          <View style={[styles.indexBadge, { backgroundColor: color }]}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.placeName, { color: theme.textPrimary }]} numberOfLines={2}>
              {item.name}
            </Text>
            {distance
              ? <Text style={[styles.distanceText, { color }]}>{distance} {t.away}</Text>
              : null}
          </View>
        </View>

        <View style={styles.addressRow}>
          <View style={[styles.addressDot, { backgroundColor: color }]} />
          <Text style={[styles.placeAddress, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.address}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.viewBtn, { borderColor: color, backgroundColor: theme.surface }]}
            onPress={() => openInMaps(item)}
          >
            <Text style={[styles.viewBtnText, { color }]}>{t.viewOnMap}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dirBtn, { backgroundColor: color }]}
            onPress={() => getDirections(item)}
          >
            <Text style={styles.dirBtnText}>{t.getDirections}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar backgroundColor={activeColor} barStyle="light-content" />

      {/* Header — stays color-branded */}
      <View style={[styles.header, { backgroundColor: activeColor }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          {userLocation
            ? <Text style={styles.headerSubtitle}>{t.basedOnLocation}</Text>
            : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter bar */}
      <View style={[styles.filterWrapper, { backgroundColor: theme.filterBarBg, borderBottomColor: theme.filterBarBorder }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filterContainer}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.value;
            const filterColor = getFilterColor(item.value);
            return (
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  { backgroundColor: theme.filterBg, borderColor: theme.filterBorder },
                  isActive && { backgroundColor: filterColor, borderColor: filterColor },
                ]}
                onPress={() => { setActiveFilter(item.value); fetchPlaces(item.value); }}
              >
                <View style={[
                  styles.filterIconBox,
                  { backgroundColor: isActive ? "rgba(255,255,255,0.2)" : filterColor + "15" },
                ]}>
                  <Text style={[styles.filterIcon, { color: isActive ? "#fff" : filterColor }]}>
                    {item.icon}
                  </Text>
                </View>
                <Text style={[styles.filterText, { color: isActive ? "#fff" : theme.textPrimary }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.center}>
          <View style={[styles.loadingCircle, { borderColor: activeColor }]}>
            <ActivityIndicator size="large" color={activeColor} />
          </View>
          <Text style={[styles.loadingText, { color: theme.textPrimary }]}>{t.searching}</Text>
          <Text style={[styles.loadingSubText, { color: theme.textSecondary }]}>{t.takeFewSeconds}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <View style={[styles.errorBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>{t.unableToLoad}</Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: activeColor }]} onPress={() => fetchPlaces()}>
              <Text style={styles.retryBtnText}>{t.retry}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.errorBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>{t.noResults}</Text>
            <Text style={[styles.errorText, { color: theme.textSecondary }]}>
              {t.noResultsDesc(FILTERS.find((f) => f.value === activeFilter)?.label ?? "")}
            </Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: activeColor }]} onPress={() => fetchPlaces()}>
              <Text style={styles.retryBtnText}>{t.refresh}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          renderItem={renderPlace}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPlaces(activeFilter, true)}
              colors={[activeColor]}
            />
          }
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <View style={[styles.resultsBar, { backgroundColor: activeColor }]} />
              <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
                {t.resultsFound(places.length)}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  backButton:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  backArrow:    { color: "#fff", fontSize: 28, lineHeight: 32 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle:  { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  headerSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },

  filterWrapper:   { paddingVertical: 12, borderBottomWidth: 1 },
  filterContainer: { paddingHorizontal: 12 },
  filterBtn: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 25, marginHorizontal: 4,
    borderWidth: 1.5, gap: 6,
  },
  filterIconBox: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  filterIcon:    { fontSize: 10, fontWeight: "800" },
  filterText:    { fontSize: 13, fontWeight: "600" },

  center:         { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingCircle:  { width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  loadingText:    { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  loadingSubText: { fontSize: 13 },

  errorBox:   { borderRadius: 20, padding: 28, alignItems: "center", width: "100%", elevation: 2 },
  errorTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  errorText:  { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  retryBtn:   { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  listContent:   { padding: 16, paddingBottom: 40 },
  resultsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8 },
  resultsBar:    { width: 4, height: 16, borderRadius: 2 },
  resultsText:   { fontSize: 13, fontWeight: "600" },

  card: {
    borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.06,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  cardTop:       { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 12 },
  indexBadge:    { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  indexText:     { color: "#fff", fontWeight: "800", fontSize: 14 },
  nameContainer: { flex: 1 },
  placeName:     { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  distanceText:  { fontSize: 12, fontWeight: "600", marginTop: 3 },

  addressRow:  { flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 8 },
  addressDot:  { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  placeAddress:{ fontSize: 13, flex: 1, lineHeight: 18 },
  divider:     { height: 1, marginBottom: 12 },

  btnRow:      { flexDirection: "row", gap: 8 },
  viewBtn:     { flex: 1, padding: 10, borderRadius: 10, alignItems: "center", borderWidth: 1.5 },
  viewBtnText: { fontWeight: "700", fontSize: 13 },
  dirBtn:      { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
  dirBtnText:  { color: "#fff", fontWeight: "700", fontSize: 13 },
});