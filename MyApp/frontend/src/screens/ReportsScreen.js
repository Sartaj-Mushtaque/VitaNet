import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, TouchableOpacity, FlatList, Alert, Modal,
  StyleSheet, SafeAreaView, TextInput, StatusBar,
  ActivityIndicator, Share,
} from "react-native";
import { pick, types } from "@react-native-documents/picker";
import { Activity } from "lucide-react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import api from "../screens/config/api";
import { useAppContext } from "../context/AppContext";

const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"];
const ALLOWED_LABEL = "PDF, JPG, PNG, DOC, XLS";

const TRANSLATIONS = {
  English: {
    title: "My Reports", folders: "folder", foldersPlural: "folders",
    files: "file", filesPlural: "files", newFolder: "+ New Folder",
    totalFiles: "Total Files", fileTypes: "File Types",
    noFolders: "No Folders Yet", noFoldersDesc: "Tap \"+ New Folder\" to create your first folder",
    noFiles: "No Files Yet", noFilesDesc: "Tap \"+ Upload\" to add your first file.\nSupported formats: ",
    upload: "+ Upload", uploading: "Uploading",
    newFolderTitle: "New Folder", newFolderSub: "Enter a name for your new folder",
    folderPlaceholder: "e.g. Blood Tests, X-Rays, MRI...",
    createFolder: "Create Folder", cancel: "Cancel",
    viewFile: "Open File", viewFileSub: "Open with any app on your device",
    download: "Download", downloadSub: "Save file to your device",
    deleteFile: "Delete File", deleteFileSub: "Permanently remove this file",
    uploaded: "Uploaded",
    deleteTitle: "Delete File", deleteMsg: "This file will be permanently removed. This action cannot be undone.",
    deleteSuccess: "Deleted", deleteSuccessMsg: "The file has been removed successfully.",
    deleteFail: "Delete Failed", deleteFailMsg: "Could not delete the file. Please try again.",
    uploadSuccess: "Upload Successful", uploadFail: "Upload Failed",
    uploadFailMsg: "Network or storage error. Please check your connection and try again.",
    invalidFile: "Invalid File Type",
    loading: "Loading your reports...",
    errorTitle: "Temporarily Unavailable",
    errorDesc: "Could not load your reports. Please check your connection and try again.",
    retry: "Try Again",
    deleting: "Deleting file...",
    folderError: "Error", folderExists: "A folder with this name already exists.",
    folderNameRequired: "Please enter a folder name.",
    openingFile: "Opening file...",
  },
  "اردو": {
    title: "میری رپورٹس", folders: "فولڈر", foldersPlural: "فولڈرز",
    files: "فائل", filesPlural: "فائلیں", newFolder: "+ نیا فولڈر",
    totalFiles: "کل فائلیں", fileTypes: "فائل اقسام",
    noFolders: "ابھی کوئی فولڈر نہیں", noFoldersDesc: "\"+ نیا فولڈر\" دبائیں",
    noFiles: "ابھی کوئی فائل نہیں", noFilesDesc: "\"+ اپ لوڈ\" دبائیں\nقابل قبول: ",
    upload: "+ اپ لوڈ", uploading: "اپ لوڈ ہو رہا ہے",
    newFolderTitle: "نیا فولڈر", newFolderSub: "فولڈر کا نام درج کریں",
    folderPlaceholder: "مثلاً: بلڈ ٹیسٹ، ایکسرے...",
    createFolder: "فولڈر بنائیں", cancel: "منسوخ",
    viewFile: "فائل کھولیں", viewFileSub: "کسی بھی ایپ سے کھولیں",
    download: "ڈاؤن لوڈ", downloadSub: "ڈیوائس پر محفوظ کریں",
    deleteFile: "فائل حذف کریں", deleteFileSub: "مستقل طور پر ہٹائیں",
    uploaded: "اپ لوڈ",
    deleteTitle: "فائل حذف کریں", deleteMsg: "یہ فائل مستقل طور پر ہٹا دی جائے گی۔",
    deleteSuccess: "حذف ہوگئی", deleteSuccessMsg: "فائل کامیابی سے ہٹا دی گئی۔",
    deleteFail: "حذف ناکام", deleteFailMsg: "فائل حذف نہیں ہوئی۔ دوبارہ کوشش کریں۔",
    uploadSuccess: "اپ لوڈ کامیاب", uploadFail: "اپ لوڈ ناکام",
    uploadFailMsg: "نیٹ ورک یا اسٹوریج میں خرابی۔",
    invalidFile: "غلط فائل قسم",
    loading: "رپورٹس لوڈ ہو رہی ہیں...",
    errorTitle: "عارضی طور پر دستیاب نہیں",
    errorDesc: "رپورٹس لوڈ نہیں ہوئیں۔ کنیکشن چیک کریں۔",
    retry: "دوبارہ کوشش کریں",
    deleting: "فائل حذف ہو رہی ہے...",
    folderError: "خرابی", folderExists: "اس نام کا فولڈر پہلے سے موجود ہے۔",
    folderNameRequired: "فولڈر کا نام درج کریں۔",
    openingFile: "فائل کھل رہی ہے...",
  },
};

const getFileStyle = (fileName = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf")                        return { label: "PDF",  color: "#B71C1C", bg: "#FFEBEE" };
  if (["jpg", "jpeg", "png"].includes(ext)) return { label: "IMG",  color: "#0D47A1", bg: "#E3F2FD" };
  if (["doc", "docx"].includes(ext))        return { label: "DOC",  color: "#1565C0", bg: "#E8EAF6" };
  if (["xls", "xlsx"].includes(ext))        return { label: "XLS",  color: "#1B5E20", bg: "#E8F5E9" };
  return                                           { label: "FILE", color: "#37474F", bg: "#ECEFF1" };
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const isAllowedFile = (fileName = "") =>
  ALLOWED_EXTENSIONS.includes(fileName.split(".").pop()?.toLowerCase());

const ReportsScreen = () => {
  const [folders,        setFolders]        = useState([]);
  const [currentFolder,  setCurrentFolder]  = useState(null);
  const [folderReports,  setFolderReports]  = useState([]);
  const [menuVisible,    setMenuVisible]    = useState(false);
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [newFolderModal, setNewFolderModal] = useState(false);
  const [newFolderName,  setNewFolderName]  = useState("");
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading,        setLoading]        = useState(true);
  const [fetchError,     setFetchError]     = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [openingFile,    setOpeningFile]    = useState(false);

  const { darkMode, language } = useAppContext();
  const t = TRANSLATIONS[language] || TRANSLATIONS.English;

  const theme = {
    bg:            darkMode ? "#121212" : "#F4F6F9",
    surface:       darkMode ? "#1E1E1E" : "#ffffff",
    textPrimary:   darkMode ? "#F0F0F0" : "#1A1A2E",
    textSecondary: darkMode ? "#AAAAAA" : "#757575",
    border:        darkMode ? "rgba(255,255,255,0.08)" : "#E0E0E0",
    inputBg:       darkMode ? "#2C2C2C" : "#F4F6F9",
    statusBar:     darkMode ? "light-content" : "dark-content",
    statusBarBg:   darkMode ? "#121212" : "#fff",
  };

  const currentFolderRef = useRef(null);
  useEffect(() => { currentFolderRef.current = currentFolder; }, [currentFolder]);
  useEffect(() => { fetchReports(); }, []);

  const fetchReports = useCallback(async () => {
    try {
      setFetchError(false);
      const res  = await api.get("/reports");
      const data = res.data;
      const grouped = data.reduce((acc, item) => {
        const key = item.folderName || "General";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
      const folderList = Object.keys(grouped).map((k) => ({
        name: k, reports: grouped[k], count: grouped[k].length,
      }));
      setFolders(folderList);
      const active = currentFolderRef.current;
      if (active) {
        const updated = folderList.find((f) => f.name === active);
        setFolderReports(updated ? updated.reports : []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── FIXED: folder name sent as query param so multer can read it ──
  const uploadFile = async (folder) => {
    try {
      setUploading(true); setUploadProgress(0);
      const res  = await pick({ type: [types.allFiles] });
      const file = Array.isArray(res) ? res[0] : res;

      if (!isAllowedFile(file.name)) {
        Alert.alert(
          t.invalidFile,
          `Only ${ALLOWED_LABEL} files are allowed.\n\nYou selected: .${file.name.split(".").pop()?.toUpperCase()}`
        );
        return;
      }

      const formData = new FormData();
      formData.append("file", {
        uri:  file.uri,
        type: file.type || "application/octet-stream",
        name: file.name,
      });

      // ✅ No manual token needed — api.js interceptor handles auth + content-type automatically
      await api.post(
        `/reports/upload?folderName=${encodeURIComponent(folder)}`,
        formData,
        {
          onUploadProgress: (e) =>
            setUploadProgress(Math.round((e.loaded * 100) / e.total)),
        }
      );

      await fetchReports();
      Alert.alert(t.uploadSuccess, `"${file.name}" has been uploaded.`);
    } catch (err) {
      if (err?.code !== "DOCUMENT_PICKER_CANCELED") {
        Alert.alert(t.uploadFail, t.uploadFailMsg);
      }
    } finally {
      setUploading(false); setUploadProgress(0);
    }
  };

  const createFolder = () => {
    const name = newFolderName.trim();
    if (!name) return Alert.alert(t.folderError, t.folderNameRequired);
    if (folders.find((f) => f.name === name)) return Alert.alert(t.folderError, t.folderExists);
    setFolders((prev) => [...prev, { name, reports: [], count: 0 }]);
    setNewFolderName(""); setNewFolderModal(false);
  };

  const deleteFile = (id) => {
    Alert.alert(t.deleteTitle, t.deleteMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.deleteFile, style: "destructive", onPress: async () => {
          try {
            setDeleting(true); setMenuVisible(false);
            await api.delete(`/reports/${id}`);
            await fetchReports();
            Alert.alert(t.deleteSuccess, t.deleteSuccessMsg);
          } catch {
            Alert.alert(t.deleteFail, t.deleteFailMsg);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const getMimeType = (fileName = "") => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const map = {
      pdf:  "application/pdf",
      doc:  "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls:  "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      jpg:  "image/jpeg",
      jpeg: "image/jpeg",
      png:  "image/png",
    };
    return map[ext] || "application/octet-stream";
  };

  const openFile = async (url, fileName) => {
    if (!url || !fileName) {
      Alert.alert("Error", `Missing info.\nURL: ${url}\nName: ${fileName}`);
      return;
    }
    try {
      setOpeningFile(true);
      setMenuVisible(false);

      const mime      = getMimeType(fileName);
      const safeName  = fileName.replace(/\s+/g, "_");

      // ✅ Use DocumentDir — accessible by actionViewIntent unlike CacheDir
      const localPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${safeName}`;

      console.log("📥 Downloading from:", url);
      console.log("💾 Saving to:", localPath);
      console.log("📄 MIME:", mime);

      const res = await ReactNativeBlobUtil.config({
        path: localPath,
        overwrite: true,
        fileCache: true,
      }).fetch("GET", url);

      console.log("✅ Download done. Path:", res.path());

      await ReactNativeBlobUtil.android.actionViewIntent(res.path(), mime);

    } catch (err) {
      console.error("❌ openFile error:", err);
      Alert.alert("Debug Error", err?.message || JSON.stringify(err));
    } finally {
      setOpeningFile(false);
    }
  };

  const shareFile = async (url, fileName) => {
    if (!url || !fileName) return;
    try {
      setOpeningFile(true);
      setMenuVisible(false);

      const mime      = getMimeType(fileName);
      const safeName  = fileName.replace(/\s+/g, "_");
      const localPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${safeName}`;

      const res = await ReactNativeBlobUtil.config({
        path: localPath,
        overwrite: true,
        fileCache: true,
      }).fetch("GET", url);

      await ReactNativeBlobUtil.android.actionViewIntent(res.path(), mime);
    } catch (err) {
      console.error("❌ shareFile error:", err);
      Alert.alert("Debug Error", err?.message || JSON.stringify(err));
    } finally {
      setOpeningFile(false);
    }
  };

  const openMenu = (file) => { setSelectedFile(file); setMenuVisible(true); };

  // ── Loading ──
  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0C1A2E" }}>
      <View style={{ alignItems: "center", gap: 10 }}>
        <Activity size={28} color="#2563EB" strokeWidth={1.6} />
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF", letterSpacing: 1.5 }}>VitaNet</Text>
      </View>
    </View>
  );

  // ── Error ──
  if (fetchError) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t.title}</Text>
      </View>
      <View style={styles.centerBox}>
        <View style={styles.errorIconBox}><Text style={styles.errorIconText}>!</Text></View>
        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>{t.errorTitle}</Text>
        <Text style={[styles.errorDesc,  { color: theme.textSecondary }]}>{t.errorDesc}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReports}>
          <Text style={styles.retryBtnText}>{t.retry}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // ── Folder View ──
  if (currentFolder) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentFolder(null)}>
          <Text style={[styles.backArrow, { color: theme.textPrimary }]}>{"<"}</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{currentFolder}</Text>
          <Text style={[styles.headerSub,   { color: theme.textSecondary }]}>
            {folderReports.length} {folderReports.length !== 1 ? t.filesPlural : t.files}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
          onPress={() => uploadFile(currentFolder)}
          disabled={uploading}
        >
          {uploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.uploadBtnText}>
                {uploadProgress > 0 ? `  ${uploadProgress}%` : `  ${t.uploading}`}
              </Text>
            </View>
          ) : (
            <Text style={styles.uploadBtnText}>{t.upload}</Text>
          )}
        </TouchableOpacity>
      </View>

      {uploading && uploadProgress > 0 && (
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
        </View>
      )}

      {deleting && (
        <View style={styles.deletingBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.deletingText}>  {t.deleting}</Text>
        </View>
      )}

      {openingFile && (
        <View style={styles.deletingBanner}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.deletingText}>  {t.openingFile}</Text>
        </View>
      )}

      <FlatList
        data={folderReports}
        keyExtractor={(i) => i._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.emptyIconBox}><Text style={styles.emptyIconText}>0</Text></View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t.noFiles}</Text>
            <Text style={[styles.emptyDesc,  { color: theme.textSecondary }]}>
              {t.noFilesDesc}{ALLOWED_LABEL}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const { label, color, bg } = getFileStyle(item.fileName);
          return (
            <View style={[styles.fileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.fileTypePill, { backgroundColor: bg }]}>
                <Text style={[styles.fileTypePillText, { color }]}>{label}</Text>
              </View>
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.fileName}
                </Text>
                <Text style={[styles.fileDate, { color: theme.textSecondary }]}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <TouchableOpacity style={styles.menuBtn} onPress={() => openMenu(item)}>
                <View style={styles.menuDotsWrap}>
                  {[0, 1, 2].map((i) => (
                    <View key={i} style={[styles.menuDot, { backgroundColor: theme.textSecondary }]} />
                  ))}
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      {/* File Action Sheet */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.actionSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

            {selectedFile && (
              <View style={[styles.sheetFileInfo, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.sheetFileName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {selectedFile.fileName}
                </Text>
                <Text style={[styles.sheetFileDate, { color: theme.textSecondary }]}>
                  {t.uploaded} {formatDate(selectedFile.createdAt)}
                </Text>
              </View>
            )}

            {/* Open File — triggers Android "Open With" (Word, Adobe, Gallery etc.) */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => openFile(selectedFile?.fileUrl, selectedFile?.fileName)}
            >
              <View style={[styles.sheetOptionIconBox, { backgroundColor: "#E3F2FD" }]}>
                <Text style={[styles.sheetOptionIconLabel, { color: "#1565C0" }]}>V</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>{t.viewFile}</Text>
                <Text style={[styles.sheetOptionSub,  { color: theme.textSecondary }]}>Open with Word, Adobe, Gallery...</Text>
              </View>
            </TouchableOpacity>

            {/* Share — shows WhatsApp, Email, Drive etc. */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => shareFile(selectedFile?.fileUrl, selectedFile?.fileName)}
            >
              <View style={[styles.sheetOptionIconBox, { backgroundColor: "#E8F5E9" }]}>
                <Text style={[styles.sheetOptionIconLabel, { color: "#1B5E20" }]}>S</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetOptionText, { color: theme.textPrimary }]}>Share File</Text>
                <Text style={[styles.sheetOptionSub,  { color: theme.textSecondary }]}>WhatsApp, Email, Drive...</Text>
              </View>
            </TouchableOpacity>

            <View style={[styles.sheetDivider, { backgroundColor: theme.border }]} />

            {/* Delete */}
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => deleteFile(selectedFile?._id)}
            >
              <View style={[styles.sheetOptionIconBox, { backgroundColor: "#FFEBEE" }]}>
                <Text style={[styles.sheetOptionIconLabel, { color: "#B71C1C" }]}>X</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetOptionText, { color: "#B71C1C" }]}>{t.deleteFile}</Text>
                <Text style={[styles.sheetOptionSub,  { color: theme.textSecondary }]}>{t.deleteFileSub}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetCancelBtn, { borderColor: theme.border }]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  // ── Root / Folders View ──
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.statusBarBg} />

      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t.title}</Text>
          <Text style={[styles.headerSub,   { color: theme.textSecondary }]}>
            {folders.length} {folders.length !== 1 ? t.foldersPlural : t.folders}
          </Text>
        </View>
        <TouchableOpacity style={styles.uploadBtn} onPress={() => setNewFolderModal(true)}>
          <Text style={styles.uploadBtnText}>{t.newFolder}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{folders.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.foldersPlural}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{folders.reduce((sum, f) => sum + f.count, 0)}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.totalFiles}</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{ALLOWED_EXTENSIONS.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t.fileTypes}</Text>
        </View>
      </View>

      <FlatList
        data={folders}
        keyExtractor={(i) => i.name}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.emptyIconBox}><Text style={styles.emptyIconText}>0</Text></View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t.noFolders}</Text>
            <Text style={[styles.emptyDesc,  { color: theme.textSecondary }]}>{t.noFoldersDesc}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.folderCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            activeOpacity={0.75}
            onPress={() => { setCurrentFolder(item.name); setFolderReports(item.reports); }}
          >
            <View style={styles.folderIconBox}>
              <Text style={styles.folderIconLabel}>F</Text>
            </View>
            <View style={styles.folderInfo}>
              <Text style={[styles.folderName,  { color: theme.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.folderCount, { color: theme.textSecondary }]}>
                {item.count} {item.count !== 1 ? t.filesPlural : t.files}
              </Text>
            </View>
            <View style={[styles.folderChevron, { backgroundColor: theme.inputBg }]}>
              <Text style={[styles.folderChevronText, { color: theme.textSecondary }]}>{">"}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* New Folder Modal */}
      <Modal visible={newFolderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.actionSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle,    { color: theme.textPrimary }]}>{t.newFolderTitle}</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>{t.newFolderSub}</Text>
            <TextInput
              style={[styles.folderInput, {
                backgroundColor: theme.inputBg,
                borderColor: theme.border,
                color: theme.textPrimary,
              }]}
              placeholder={t.folderPlaceholder}
              placeholderTextColor={theme.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <TouchableOpacity style={styles.createFolderBtn} onPress={createFolder}>
              <Text style={styles.createFolderBtnText}>{t.createFolder}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetCancelBtn, { borderColor: theme.border }]}
              onPress={() => { setNewFolderModal(false); setNewFolderName(""); }}
            >
              <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>{t.cancel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1 },
  listContent: { padding: 16, gap: 10, paddingBottom: 40 },
  header:      { backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5 },
  backBtn:     { marginRight: 12, padding: 4 },
  backArrow:   { fontSize: 20, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.2 },
  headerSub:   { fontSize: 12, marginTop: 2 },
  uploadBtn:         { backgroundColor: "#1565C0", paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  uploadBtnDisabled: { backgroundColor: "#90CAF9" },
  uploadBtnText:     { color: "#fff", fontWeight: "600", fontSize: 13, letterSpacing: 0.3 },
  uploadingRow:      { flexDirection: "row", alignItems: "center" },
  progressBarTrack:  { height: 3, backgroundColor: "#BBDEFB" },
  progressBarFill:   { height: 3, backgroundColor: "#1565C0" },
  deletingBanner:    { backgroundColor: "#1565C0", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  deletingText:      { color: "#fff", fontSize: 13, fontWeight: "600" },
  centerBox:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  loadingText: { fontSize: 14, marginTop: 14 },
  errorIconBox:  { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFEBEE", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  errorIconText: { fontSize: 24, fontWeight: "700", color: "#B71C1C" },
  errorTitle:    { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  errorDesc:     { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  retryBtn:      { backgroundColor: "#1565C0", paddingHorizontal: 28, paddingVertical: 12, borderRadius: 8 },
  retryBtnText:  { color: "#fff", fontWeight: "600", fontSize: 14 },
  statsBar:    { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginTop: 16, marginBottom: 4, borderRadius: 12, padding: 16, borderWidth: 0.5, elevation: 1 },
  statItem:    { flex: 1, alignItems: "center" },
  statValue:   { fontSize: 20, fontWeight: "700", color: "#1565C0", marginBottom: 3 },
  statLabel:   { fontSize: 10, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28 },
  emptyBox:    { borderRadius: 12, padding: 40, alignItems: "center", borderWidth: 1, borderStyle: "dashed", marginTop: 10 },
  emptyIconBox:  { width: 52, height: 52, borderRadius: 26, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyIconText: { fontSize: 22, fontWeight: "700", color: "#1565C0" },
  emptyTitle:    { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptyDesc:     { fontSize: 13, textAlign: "center", lineHeight: 20 },
  folderCard:    { borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 0.5, elevation: 1 },
  folderIconBox: { width: 46, height: 46, borderRadius: 10, backgroundColor: "#E3F2FD", alignItems: "center", justifyContent: "center", marginRight: 14 },
  folderIconLabel: { fontSize: 16, fontWeight: "700", color: "#1565C0" },
  folderInfo:      { flex: 1 },
  folderName:      { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  folderCount:     { fontSize: 12 },
  folderChevron:   { width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  folderChevronText: { fontSize: 16, fontWeight: "600" },
  fileCard:      { borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", borderWidth: 0.5, elevation: 1 },
  fileTypePill:  { width: 46, height: 46, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 12 },
  fileTypePillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  fileInfo:      { flex: 1 },
  fileName:      { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  fileDate:      { fontSize: 11 },
  menuBtn:       { padding: 8 },
  menuDotsWrap:  { gap: 3, alignItems: "center" },
  menuDot:       { width: 4, height: 4, borderRadius: 2 },
  modalOverlay:  { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  actionSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  sheetHandle:   { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sheetTitle:    { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  sheetSubtitle: { fontSize: 13, marginBottom: 16 },
  sheetFileInfo: { borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 0.5 },
  sheetFileName: { fontSize: 14, fontWeight: "600" },
  sheetFileDate: { fontSize: 12, marginTop: 2 },
  sheetOption:        { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14 },
  sheetOptionIconBox: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sheetOptionIconLabel: { fontSize: 14, fontWeight: "700" },
  sheetOptionText: { fontSize: 15, fontWeight: "500" },
  sheetOptionSub:  { fontSize: 12, marginTop: 1 },
  sheetDivider:    { height: 0.5, marginVertical: 6 },
  sheetCancelBtn:  { marginTop: 10, padding: 14, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  sheetCancelText: { fontWeight: "600", fontSize: 14 },
  folderInput:       { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14, marginBottom: 12 },
  createFolderBtn:   { backgroundColor: "#1565C0", padding: 14, borderRadius: 10, alignItems: "center", marginBottom: 8 },
  createFolderBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

export default ReportsScreen;