import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://192.168.1.43:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// Attach token for ALL requests EXCEPT FormData uploads
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🚀 IMPORTANT FIX: prevent interceptor breaking FormData
api.interceptors.request.use((config) => {
  if (
    config.data instanceof FormData
  ) {
    // Let browser/native set correct boundary automatically
    config.headers["Content-Type"] = "multipart/form-data";
  }

  return config;
});

export default api;