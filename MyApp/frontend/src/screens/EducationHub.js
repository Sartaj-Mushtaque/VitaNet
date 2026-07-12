import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Linking, Modal, Platform, Image, Animated,
} from "react-native";
import {
  Home, User, Calendar, Settings,
  PlayCircle, FileText, ArrowLeft, Search, X, Activity,
} from "lucide-react-native";
import { useAppContext } from "../context/AppContext";

// ─── COLORS ───────────────────────────────────────────────────
const COLORS = {
  red600:    "#A32D2D", red50:    "#FCEBEB",
  blue600:   "#185FA5", blue50:   "#E6F1FB",
  green600:  "#0F6E56", green50:  "#E1F5EE",
  amber600:  "#854F0B", amber50:  "#FAEEDA",
  purple600: "#534AB7", purple50: "#EEEDFE",
  navy:      "#0C1A2E",
  vitaBlue:  "#2563EB",
};

// ─── TRANSLATIONS ─────────────────────────────────────────────
const TRANSLATIONS = {
  English: {
    educationHub: "Education Hub",
    hubSubtitle: "Thalassemia & blood health resources",
    videos: "Videos", articles: "Articles",
    searchPlaceholder: "Search videos and articles...",
    noVideos: "No videos match your search",
    noArticles: "No articles match your search",
    watchYoutube: "Watch on YouTube", readArticle: "Read Article",
    openInYoutube: "Open in YouTube", close: "Close",
    found: "found", video: "video", videoPlural: "videos",
    article: "article", articlePlural: "articles",
    statVideos: "Videos", statArticles: "Articles",
    statTopics: "Topics", statSources: "Sources",
    home: "Home", profile: "Profile", schedule: "Schedule", settings: "Settings",
  },
  "اردو": {
    educationHub: "تعلیمی مرکز",
    hubSubtitle: "تھیلیسیمیا اور خون کی صحت کے وسائل",
    videos: "ویڈیوز", articles: "مضامین",
    searchPlaceholder: "ویڈیوز اور مضامین تلاش کریں...",
    noVideos: "کوئی ویڈیو نہیں ملی",
    noArticles: "کوئی مضمون نہیں ملا",
    watchYoutube: "یوٹیوب پر دیکھیں", readArticle: "مضمون پڑھیں",
    openInYoutube: "یوٹیوب میں کھولیں", close: "بند کریں",
    found: "ملے", video: "ویڈیو", videoPlural: "ویڈیوز",
    article: "مضمون", articlePlural: "مضامین",
    statVideos: "ویڈیوز", statArticles: "مضامین",
    statTopics: "موضوعات", statSources: "ذرائع",
    home: "ہوم", profile: "پروفائل", schedule: "شیڈول", settings: "ترتیبات",
  },
};

// ─── CATEGORY CONFIG ──────────────────────────────────────────
const CATEGORY_COLORS = {
  "Thalassemia":    { bg: "#FFF0F0", text: "#C0392B", darkBg: "rgba(192,57,43,0.15)" },
  "Blood Donation": { bg: "#FFF5EB", text: "#854F0B", darkBg: "rgba(133,79,11,0.15)" },
  "Blood Science":  { bg: "#EBF4FF", text: "#185FA5", darkBg: "rgba(24,95,165,0.15)" },
  "General Health": { bg: "#EAFAF1", text: "#0F6E56", darkBg: "rgba(15,110,86,0.15)" },
  "Nutrition":      { bg: "#F5EEF8", text: "#534AB7", darkBg: "rgba(83,74,183,0.15)" },
  "Emergency Care": { bg: "#F2F3F4", text: "#2C3E50", darkBg: "rgba(44,62,80,0.15)" },
};

const CATEGORIES = ["All", "Thalassemia", "Blood Donation", "Blood Science", "General Health", "Nutrition", "Emergency Care"];

const CATEGORY_LABELS_UR = {
  "All":            "سب",
  "Thalassemia":    "تھیلیسیمیا",
  "Blood Donation": "خون کا عطیہ",
  "Blood Science":  "خون کی سائنس",
  "General Health": "عمومی صحت",
  "Nutrition":      "غذائیت",
  "Emergency Care": "ہنگامی نگہداشت",
};

// ─── DATA ─────────────────────────────────────────────────────
const VIDEOS = [
  { id: "1",  ytId: "ZuHdnTKBBKg", category: "Blood Science",  duration: "~8 min",
    title: "The Molecular Science of Blood & Transfusions",
    description: "Medically accurate 3D animation of red blood cells, plasma, and platelets and how matching types interact during a clinical transfusion procedure." },
  { id: "2",  ytId: "Q55LrC7vijM", category: "Blood Donation", duration: "~5 min",
    title: "The Journey of Donated Blood",
    description: "Official NHS walkthrough on what happens after donation — how labs separate blood into plasma, platelets, and red cells." },
  { id: "3",  ytId: "y5PJs0_1aFU", category: "Blood Donation", duration: "~6 min",
    title: "Blood Donation Basics – Preparation & Recovery",
    description: "Clear guide on donor pre-requisites: iron-rich foods, hydration, clinical screening, and post-donation recovery." },
  { id: "4",  ytId: "Xn96e8pveoM", category: "General Health", duration: "~10 min",
    title: "Cardiovascular Health & The Circulatory System",
    description: "Clinically sound overview of how the heart, arteries, and veins transport oxygen-rich blood and how to maintain heart health." },
  { id: "5",  ytId: "M4ACYp75mjU", category: "Emergency Care", duration: "~7 min",
    title: "Emergency First Aid – CPR & Basic Life Support",
    description: "Step-by-step instructional tutorial by medical professionals demonstrating hands-only CPR and rapid response protocols." },
  { id: "6",  ytId: "f2vO_6Y_k00", category: "Blood Science",  duration: "~5 min",
    title: "Understanding Blood Groups & Compatibility",
    description: "Highly visual guide explaining differences between blood types (A, B, AB, O and Rh factors) and safe donor/recipient matching." },
  { id: "7",  ytId: "y5PJs0_1aFU", category: "Nutrition",      duration: "~6 min",
    title: "General Nutrition & Iron Deficiency Prevention",
    description: "Comprehensive breakdown of how iron intake builds hemoglobin levels and maintains safe energy metrics for blood screening." },
  { id: "8",  ytId: "6tl7hB1V-os", category: "Blood Donation", duration: "~4 min",
    title: "The Psychological & Community Impact of Giving Blood",
    description: "Inspiring breakdown of emotional and community-driven rewards of blood donation — how one donation saves three lives." },
  { id: "9",  ytId: "LujCe8E9ibw", category: "Blood Donation", duration: "~5 min",
    title: "Overcoming Fears – Blood Donation Myths vs. Reality",
    description: "Reassuring video addressing misconceptions about pain, recovery speed, and long-term health benefits of donating." },
  { id: "10", ytId: "TQrxSv7EUmQ", category: "Blood Donation", duration: "~6 min",
    title: "Every Drop Counts – Why Continuous Donations Matter",
    description: "Educational overview on the critical need for steady donations due to the short shelf life of platelets and blood components." },
  { id: "11", ytId: "97_6eT1ZG88", category: "Thalassemia",    duration: "~9 min",
    title: "Understanding Beta Thalassemia – Symptoms, Causes & Types",
    description: "Medically accurate animation detailing genetic mutations behind Beta Thalassemia and differences between Thalassemia Minor and Major." },
  { id: "12", ytId: "C_5o7WxODPY", category: "Thalassemia",    duration: "~12 min",
    title: "Thalassemia Prevention, Screening & Transfusion Management",
    description: "Awareness lecture by pediatric hematology specialists on pre-marital genetic screening and iron chelation therapies." },
  { id: "13", ytId: "a3f0N8_zM38", category: "Thalassemia",    duration: "~15 min",
    title: "The Daily Journey of Living with Thalassemia Major",
    description: "Patient advocacy documentary on daily life with Thalassemia Major and the critical role of community support in long-term care." },
];

const ARTICLES = [
  { id: "a1", source: "WHO",                        category: "Blood Science",  readTime: "8 min",
    title: "Global Blood Safety, Supply & Transfusion Regulations",
    url: "https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability",
    description: "Official WHO fact sheet on global standards for safe blood networks, clinical testing, and expanding voluntary donor pools." },
  { id: "a2", source: "NCBI",                       category: "Blood Donation", readTime: "12 min",
    title: "Clinical Indications, Processing & Eligibility of Donations",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/NBK525967/",
    description: "Peer-reviewed CME document covering hemoglobin thresholds, safe donation frequencies, and clinical usage protocols." },
  { id: "a3", source: "Red Cross",                  category: "Blood Science",  readTime: "6 min",
    title: "Understanding Blood Components: Red Blood Cells",
    url: "https://www.redcrossblood.org/donate-blood/dlp/red-blood-cells.html",
    description: "American Red Cross overview of how erythrocytes transport oxygen and differences in donation processing methods." },
  { id: "a4", source: "Medical News Today",         category: "Blood Donation", readTime: "7 min",
    title: "The Mutual Win: Proven Health Benefits for the Donor",
    url: "https://www.medicalnewstoday.com/articles/319366",
    description: "Medical synthesis reviewing how regular donations reduce blood pressure, balance iron stores, and lower cardiovascular risks." },
  { id: "a5", source: "Red Cross",                  category: "Blood Donation", readTime: "5 min",
    title: "Why Continuous Donations Matter for Vulnerable Populations",
    url: "https://www.redcrossblood.org/local-homepage/news/article/blood-donation-importance.html",
    description: "Health advocacy article on how persistent donation cycles secure hospital supply for chemotherapy, trauma, and pediatric cases." },
  { id: "a6", source: "CDC",                        category: "Thalassemia",    readTime: "10 min",
    title: "CDC Thalassemia Resource Center & Patient Care Toolkit",
    url: "https://www.cdc.gov/thalassemia/hcp/toolkit/index.html",
    description: "Official CDC guidelines on managing Thalassemia, tracking hemoglobin levels, preventing infections, and treatment protocols." },
  { id: "a7", source: "Mayo Clinic",                category: "Thalassemia",    readTime: "9 min",
    title: "Mayo Clinic Thalassemia Diagnostics & Treatment Guidelines",
    url: "https://www.mayoclinic.org/diseases-conditions/thalassemia/diagnosis-treatment/drc-20355001",
    description: "Patient-friendly clinical breakdown of advanced diagnostics, genetic counseling, and vital lifestyle modifications." },
  { id: "a8", source: "Cooley's Anemia Foundation", category: "Thalassemia",    readTime: "11 min",
    title: "Cooley's Anemia Foundation – Standards of Care Guidelines",
    url: "https://thalassemia.org",
    description: "Specialized clinical publications on monitoring requirements for transfusion recipients and managing iron overload." },
];

// ─── CATEGORY BADGE ───────────────────────────────────────────
function CategoryBadge({ category, darkMode }) {
  const cfg = CATEGORY_COLORS[category] ?? { bg: "#F0F0F0", text: "#555", darkBg: "rgba(0,0,0,0.2)" };
  return (
    <View style={[s.badge, { backgroundColor: darkMode ? cfg.darkBg : cfg.bg }]}>
      <View style={[s.badgeDot, { backgroundColor: cfg.text }]} />
      <Text style={[s.badgeText, { color: cfg.text }]}>{category.toUpperCase()}</Text>
    </View>
  );
}

// ─── VIDEO CARD ───────────────────────────────────────────────
function VideoCard({ item, onPress, theme, t, darkMode }) {
  const [imgError, setImgError] = useState(false);
  const thumbUri = `https://img.youtube.com/vi/${item.ytId}/hqdefault.jpg`;

  return (
    <TouchableOpacity
      style={[s.videoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}
    >
      <View style={s.thumbWrap}>
        {!imgError ? (
          <Image
            source={{ uri: thumbUri }}
            style={s.thumb}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[s.thumb, s.thumbFallback]}>
            <PlayCircle size={40} color="rgba(255,255,255,0.7)" strokeWidth={1.2} />
          </View>
        )}
        <View style={s.thumbOverlay}>
          <View style={s.playBtn}>
            <PlayCircle size={28} color="#fff" strokeWidth={1.5} />
          </View>
        </View>
        <View style={s.durationBadge}>
          <Text style={s.durationText}>{item.duration}</Text>
        </View>
        <View style={s.thumbCatWrap}>
          <CategoryBadge category={item.category} darkMode={false} />
        </View>
      </View>
      <View style={s.cardBody}>
        <Text style={[s.cardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[s.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={s.cardFooter}>
          <View style={s.ytTag}>
            <Text style={s.ytTagText}>▶ {t.watchYoutube}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── ARTICLE CARD ─────────────────────────────────────────────
function ArticleCard({ item, theme, t, darkMode }) {
  return (
    <TouchableOpacity
      style={[s.articleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.85}
    >
      <View style={s.articleTopRow}>
        <View style={[s.sourcePill, { backgroundColor: COLORS.blue50 }]}>
          <Text style={[s.sourcePillText, { color: COLORS.blue600 }]}>{item.source}</Text>
        </View>
        <Text style={[s.readTimeText, { color: theme.textSecondary }]}>{item.readTime} read</Text>
      </View>
      <CategoryBadge category={item.category} darkMode={darkMode} />
      <Text style={[s.cardTitle, { color: theme.textPrimary, marginTop: 6 }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[s.cardDesc, { color: theme.textSecondary }]} numberOfLines={3}>
        {item.description}
      </Text>
      <View style={[s.cardFooter, { marginTop: 8 }]}>
        <FileText size={13} color={COLORS.blue600} strokeWidth={1.8} />
        <Text style={[s.cardAction, { color: COLORS.blue600 }]}>{t.readArticle}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── VIDEO MODAL ──────────────────────────────────────────────
function VideoModal({ video, onClose, theme, t }) {
  const [imgError, setImgError] = useState(false);
  if (!video) return null;
  const thumbUri = `https://img.youtube.com/vi/${video.ytId}/hqdefault.jpg`;
  const ytUrl    = `https://www.youtube.com/watch?v=${video.ytId}`;

  return (
    <Modal animationType="slide" transparent visible={!!video} onRequestClose={onClose}>
      <View style={s.modalBg}>
        <View style={[s.modalBox, { backgroundColor: theme.surface }]}>
          <View style={[s.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[s.modalTitle, { color: theme.textPrimary }]} numberOfLines={2}>
              {video.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: theme.bg }]}>
              <X size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={s.modalThumbWrap}>
            {!imgError ? (
              <Image
                source={{ uri: thumbUri }}
                style={s.modalThumb}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={[s.modalThumb, s.thumbFallback]}>
                <PlayCircle size={52} color="rgba(255,255,255,0.7)" strokeWidth={1.2} />
              </View>
            )}
            <View style={s.modalThumbOverlay}>
              <View style={s.modalPlayBtn}>
                <PlayCircle size={44} color="#fff" strokeWidth={1.3} />
              </View>
            </View>
          </View>
          <View style={s.modalBody}>
            <CategoryBadge category={video.category} darkMode={theme.bg === "#121212"} />
            <Text style={[s.modalDesc, { color: theme.textSecondary }]}>{video.description}</Text>
          </View>
          <TouchableOpacity
            style={s.ytBtn}
            onPress={() => { Linking.openURL(ytUrl); onClose(); }}
          >
            <PlayCircle size={18} color="#fff" strokeWidth={1.8} />
            <Text style={s.ytBtnText}>{t.openInYoutube}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={[s.cancelBtn, { borderColor: theme.border }]}>
            <Text style={[s.cancelBtnText, { color: theme.textSecondary }]}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────
export default function EducationHub({ navigation }) {
  const { darkMode, language } = useAppContext();
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.English;

  const theme = {
    bg:            darkMode ? "#121212" : "#F4F5F7",
    surface:       darkMode ? "#1E1E1E" : "#FFFFFF",
    textPrimary:   darkMode ? "#F0F0F0" : "#1A1A1A",
    textSecondary: darkMode ? "#AAAAAA" : "#6B6B6B",
    border:        darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
  };

  // ── ALL HOOKS — unconditionally at the top ────────────────
  const [tab,         setTab]         = useState("videos");
  const [filter,      setFilter]      = useState("All");
  const [search,      setSearch]      = useState("");
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading,     setLoading]     = useState(false);

  const lastScrollY  = useRef(0);
  const collapseAnim = useRef(new Animated.Value(0)).current;

  const COLLAPSE_THRESHOLD = 60;

  const handleScroll = useCallback((event) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;
    if (diff > 8 && currentY > COLLAPSE_THRESHOLD) {
      Animated.spring(collapseAnim, { toValue: 1, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
    } else if (diff < -8 || currentY < COLLAPSE_THRESHOLD) {
      Animated.spring(collapseAnim, { toValue: 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
    }
    lastScrollY.current = currentY;
  }, []);

  const statsHeight   = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [76, 0] });
  const statsOpacity  = collapseAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" });
  const filterHeight  = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [52, 0] });
  const filterOpacity = collapseAnim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: "clamp" });
  const pillsHeight   = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [58, 0] });
  const pillsOpacity  = collapseAnim.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: "clamp" });
  const searchHeight  = collapseAnim.interpolate({ inputRange: [0, 1], outputRange: [56, 0] });
  const searchOpacity = collapseAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" });

  const navItems = [
    { label: t.home,     icon: Home,     screen: "PatientDashboard" },
    { label: t.profile,  icon: User,     screen: "Profile" },
    { label: t.schedule, icon: Calendar, screen: "Schedule" },
    { label: t.settings, icon: Settings, screen: "Settings" },
  ];

  const q = search.toLowerCase();
  const filteredVideos = VIDEOS.filter(v =>
    (filter === "All" || v.category === filter) &&
    (v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q))
  );
  const filteredArticles = ARTICLES.filter(a =>
    (filter === "All" || a.category === filter) &&
    (a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
  );

  const countText = tab === "videos"
    ? `${filteredVideos.length} ${filteredVideos.length === 1 ? t.video : t.videoPlural} ${t.found}`
    : `${filteredArticles.length} ${filteredArticles.length === 1 ? t.article : t.articlePlural} ${t.found}`;

  // ── Early return AFTER all hooks ─────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.navy }}>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Activity size={28} color={COLORS.vitaBlue} strokeWidth={1.6} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", letterSpacing: 1.5 }}>
            VitaNet
          </Text>
        </View>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: theme.bg }]}>

      {/* ── COLLAPSIBLE HEADER ──────────────────────────────── */}
      <View style={s.stickyHeader}>

        {/* Top bar — always visible */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <ArrowLeft size={20} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerTitles}>
            <Text style={s.headerLabel}>VitaNet</Text>
            <Text style={s.headerTitle}>{t.educationHub}</Text>
          </View>
          <Animated.View style={{ opacity: collapseAnim }}>
            <View style={s.collapsedPill}>
              <Text style={s.collapsedPillText}>
                {tab === "videos" ? `▶ ${filteredVideos.length}` : `📖 ${filteredArticles.length}`}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Stats row */}
        <Animated.View style={{ height: statsHeight, opacity: statsOpacity, overflow: "hidden" }}>
          <View style={s.statsRow}>
            {[
              { icon: "▶",  val: VIDEOS.length,   lbl: t.statVideos },
              { icon: "📖", val: ARTICLES.length, lbl: t.statArticles },
              { icon: "🏷", val: 6,               lbl: t.statTopics },
              { icon: "🏥", val: "8+",             lbl: t.statSources },
            ].map(st => (
              <View key={st.lbl} style={s.statChip}>
                <Text style={s.statIcon}>{st.icon}</Text>
                <View>
                  <Text style={s.statVal}>{st.val}</Text>
                  <Text style={s.statLbl}>{st.lbl}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Search */}
        <Animated.View style={{ height: searchHeight, opacity: searchOpacity, overflow: "hidden" }}>
          <View style={s.searchWrap}>
            <View style={s.searchBox}>
              <Search size={15} color="rgba(255,255,255,0.5)" strokeWidth={1.8} />
              <TextInput
                style={[s.searchInput, { color: "#fff" }]}
                placeholder={t.searchPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={14} color="rgba(255,255,255,0.5)" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Tabs */}
        <Animated.View style={{ height: filterHeight, opacity: filterOpacity, overflow: "hidden" }}>
          <View style={s.tabRow}>
            {["videos", "articles"].map(tb => (
              <TouchableOpacity
                key={tb}
                style={[
                  s.tabBtn,
                  tb === tab
                    ? { backgroundColor: COLORS.vitaBlue }
                    : { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)", borderWidth: 0.5 },
                ]}
                onPress={() => setTab(tb)}
              >
                <Text style={[s.tabText, { color: tb === tab ? "#fff" : "rgba(255,255,255,0.7)" }]}>
                  {tb === "videos" ? `▶  ${t.videos} (${VIDEOS.length})` : `📖  ${t.articles} (${ARTICLES.length})`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Category pills */}
        <Animated.View style={{ height: pillsHeight, opacity: pillsOpacity, overflow: "hidden" }}>
          <View style={s.pillsWrap}>
            {CATEGORIES.map((cat) => {
              const isActive = filter === cat;
              const label    = language === "اردو" ? (CATEGORY_LABELS_UR[cat] ?? cat) : cat;
              const cfg      = CATEGORY_COLORS[cat];
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setFilter(cat)}
                  style={[
                    s.pill,
                    isActive
                      ? { backgroundColor: COLORS.vitaBlue, borderColor: COLORS.vitaBlue }
                      : { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)" },
                  ]}
                >
                  {cfg && !isActive && <View style={[s.pillDot, { backgroundColor: cfg.text }]} />}
                  <Text style={[s.pillText, { color: isActive ? "#fff" : "rgba(255,255,255,0.8)" }]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Count row — always visible */}
        <View style={s.countRow}>
          <Text style={s.countLabel}>{countText}</Text>
          {filter !== "All" && (
            <Animated.View style={{ opacity: collapseAnim }}>
              <TouchableOpacity style={s.activeFilterChip} onPress={() => setFilter("All")}>
                <Text style={s.activeFilterChipText}>{filter}</Text>
                <X size={10} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>

      {/* ── LIST ────────────────────────────────────────────── */}
      {tab === "videos" ? (
        <FlatList
          data={filteredVideos}
          keyExtractor={i => i.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <VideoCard item={item} onPress={setActiveVideo} theme={theme} t={t} darkMode={darkMode} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={[s.emptyText, { color: theme.textSecondary }]}>{t.noVideos}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredArticles}
          keyExtractor={i => i.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <ArticleCard item={item} theme={theme} t={t} darkMode={darkMode} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🔍</Text>
              <Text style={[s.emptyText, { color: theme.textSecondary }]}>{t.noArticles}</Text>
            </View>
          }
        />
      )}

      {/* ── BOTTOM NAV ──────────────────────────────────────── */}
      <View style={[s.bottomNav, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {navItems.map(({ label, icon: Icon, screen }) => (
          <TouchableOpacity key={screen} style={s.navItem} onPress={() => navigation.navigate(screen)}>
            <Icon size={22} color={theme.textSecondary} strokeWidth={1.8} />
            <Text style={[s.navLabel, { color: theme.textSecondary }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── VIDEO MODAL ─────────────────────────────────────── */}
      <VideoModal video={activeVideo} onClose={() => setActiveVideo(null)} theme={theme} t={t} />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  stickyHeader: {
    backgroundColor: "#1a1a2e",
    paddingTop: Platform.OS === "ios" ? 54 : 38,
  },
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 10, gap: 10,
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitles: { flex: 1 },
  headerLabel:  { fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: 1.4, textTransform: "uppercase" },
  headerTitle:  { fontSize: 19, fontWeight: "700", color: "#fff", marginTop: 1 },

  collapsedPill:     { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  collapsedPillText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  statsRow: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  statChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7, flex: 1,
  },
  statIcon: { fontSize: 13, marginRight: 5 },
  statVal:  { fontSize: 13, fontWeight: "700", color: "#fff", lineHeight: 16 },
  statLbl:  { fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: "500" },

  searchWrap: { paddingHorizontal: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, borderWidth: 0.5,
    backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)",
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600" },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  pill:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  pillDot:   { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  pillText:  { fontSize: 11, fontWeight: "600" },

  countRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 0.5, borderTopColor: "rgba(255,255,255,0.08)",
  },
  countLabel: { fontSize: 11, fontWeight: "500", color: "rgba(255,255,255,0.5)" },

  activeFilterChip:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: COLORS.vitaBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeFilterChipText: { fontSize: 11, fontWeight: "600", color: "#fff" },

  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 },

  videoCard:     { borderRadius: 14, overflow: "hidden", borderWidth: 0.5, marginBottom: 12 },
  thumbWrap:     { position: "relative" },
  thumb:         { width: "100%", height: 185 },
  thumbFallback: { backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center" },
  thumbOverlay:  { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center" },
  playBtn:       { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)" },
  durationBadge: { position: "absolute", bottom: 8, right: 8, backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  durationText:  { color: "#fff", fontSize: 11, fontWeight: "600" },
  thumbCatWrap:  { position: "absolute", top: 8, left: 8 },

  cardBody:   { padding: 12 },
  cardTitle:  { fontSize: 14, fontWeight: "600", lineHeight: 20, marginBottom: 4 },
  cardDesc:   { fontSize: 12.5, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  cardAction: { fontSize: 12, fontWeight: "600" },
  ytTag:      { backgroundColor: "#A32D2D", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flexDirection: "row", alignItems: "center" },
  ytTagText:  { color: "#fff", fontSize: 11.5, fontWeight: "700" },

  badge:     { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 2 },
  badgeDot:  { width: 5, height: 5, borderRadius: 3, marginRight: 5 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },

  articleCard:    { borderRadius: 14, padding: 14, borderWidth: 0.5, marginBottom: 12 },
  articleTopRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  sourcePill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sourcePillText: { fontSize: 11, fontWeight: "700" },
  readTimeText:   { fontSize: 11, fontWeight: "500" },

  modalBg:  { flex: 1, backgroundColor: "rgba(0,0,0,0.62)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: Platform.OS === "ios" ? 34 : 20 },
  modalHeader:       { flexDirection: "row", alignItems: "flex-start", padding: 16, borderBottomWidth: 0.5, gap: 10 },
  modalTitle:        { flex: 1, fontSize: 15, fontWeight: "600", lineHeight: 22 },
  closeBtn:          { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  modalThumbWrap:    { position: "relative" },
  modalThumb:        { width: "100%", height: 195 },
  modalThumbOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", alignItems: "center", justifyContent: "center" },
  modalPlayBtn:      { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.55)" },
  modalBody:         { padding: 14, paddingBottom: 4 },
  modalDesc:         { fontSize: 13, lineHeight: 20, marginTop: 6 },
  ytBtn:             { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 14, marginTop: 14, backgroundColor: "#C0392B", paddingVertical: 14, borderRadius: 12 },
  ytBtnText:         { color: "#fff", fontSize: 15, fontWeight: "600" },
  cancelBtn:         { marginHorizontal: 14, marginTop: 10, paddingVertical: 12, borderRadius: 12, borderWidth: 0.8, alignItems: "center" },
  cancelBtnText:     { fontSize: 14, fontWeight: "500" },

  bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, paddingBottom: 14, borderTopWidth: 0.5 },
  navItem:   { alignItems: "center", gap: 4 },
  navLabel:  { fontSize: 10 },

  empty:     { alignItems: "center", paddingVertical: 50 },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, fontWeight: "500" },
});