import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createInvitation,
  joinCommunityWithCode,
  getMyCommunity,
  getConnectedPatients,
  removeCommunityMember,
  getMemberProfile,
  updateCommunityProfile,
} from "../controllers/communityController.js";

const router = express.Router();

router.post("/invite",                   authMiddleware, createInvitation);
router.post("/join",                     authMiddleware, joinCommunityWithCode);
router.get("/my-community",             authMiddleware, getMyCommunity);
router.get("/connected-patients",       authMiddleware, getConnectedPatients);
router.delete("/remove/:memberId",      authMiddleware, removeCommunityMember);
router.get("/member-profile/:memberId", authMiddleware, getMemberProfile);

// ── NEW: own profile update ──
router.put("/update-profile",           authMiddleware, updateCommunityProfile);

export default router;