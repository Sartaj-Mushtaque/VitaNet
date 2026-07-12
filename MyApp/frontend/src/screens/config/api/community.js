import api from "../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// CREATE INVITATION

export const createInvitation = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw "Please login again";

    const res = await api.post(
      "/community/invite",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    throw error.response?.data?.message || "Failed to create invitation";
  }
};

// GET MY COMMUNITY MEMBERS

export const getMyCommunityMembers = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw "Please login again";

    const res = await api.get("/community/my-community", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data.members || [];
  } catch (error) {
    throw error.response?.data?.message || "Failed to fetch members";
  }
};
