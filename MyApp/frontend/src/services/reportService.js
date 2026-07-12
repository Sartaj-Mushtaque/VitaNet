import { pick, types } from "@react-native-documents/picker";
import api from "../screens/config/api";

export const uploadReport = async (folderName) => {
  try {
    const [res] = await pick({
      type: [types.allFiles],
    });

    const formData = new FormData();

    formData.append("file", {
      uri: res.uri,
      type: res.type || "application/octet-stream",
      name: res.name,
    });

    formData.append("folderName", folderName);

    const response = await api.post("/reports/upload", formData);

    return response.data;
  } catch (err) {
    console.error("Upload error:", err?.response?.data || err.message);
    throw err;
  }
};