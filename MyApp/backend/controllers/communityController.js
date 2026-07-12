import Invitation from "../models/Invitation.js";
import Community from "../models/Community.js";
import User from "../models/User.js";
import generateInviteCode from "../utils/generateInviteCode.js";

// CREATE INVITATION (Patient)
export const createInvitation = async (req, res) => {
  try {
    const patientId = req.user.id;
    const inviteCode = generateInviteCode() + Date.now();
    const invitation = await Invitation.create({
      patientId,
      inviteCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    res.status(201).json({
      success: true,
      inviteCode: invitation.inviteCode,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create invitation" });
  }
};

// JOIN COMMUNITY WITH CODE (Member)
export const joinCommunityWithCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const memberId = req.user.id;
    const invitation = await Invitation.findOne({ inviteCode });
    if (!invitation) return res.status(400).json({ message: "Invalid invite code" });
    if (!invitation.isActive) return res.status(400).json({ message: "Invite code inactive" });
    if (invitation.expiresAt < new Date()) return res.status(400).json({ message: "Invite code expired" });
    if (invitation.usedCount >= invitation.maxUses)
      return res.status(400).json({ message: "Invite code already used" });
    const exists = await Community.findOne({ patientId: invitation.patientId, memberId });
    if (exists) return res.status(400).json({ message: "Already joined" });
    await Community.create({ patientId: invitation.patientId, memberId });
    invitation.usedCount += 1;
    if (invitation.usedCount >= invitation.maxUses) invitation.isActive = false;
    await invitation.save();
    res.status(201).json({ message: "Successfully joined community" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET MY COMMUNITY MEMBERS (Patient sees their members)
export const getMyCommunity = async (req, res) => {
  try {
    const patientId = req.user.id;
    const community = await Community.find({ patientId }).populate("memberId", "name email role");
    const members = community.map((c) => ({
      _id:   c.memberId._id,
      id:    c.memberId._id,
      name:  c.memberId.name,
      email: c.memberId.email,
      role:  c.memberId.role,
    }));
    res.json({ members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET CONNECTED PATIENTS (Member sees their patients)
export const getConnectedPatients = async (req, res) => {
  try {
    const memberId = req.user.id;
    const patients = await Community.find({ memberId }).populate("patientId", "name email role");
    const simplified = patients.map((c) => ({
      _id:   c.patientId._id,
      id:    c.patientId._id,
      name:  c.patientId.name,
      email: c.patientId.email,
      role:  c.patientId.role,
    }));
    res.json({ patients: simplified });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// REMOVE MEMBER (Patient)
export const removeCommunityMember = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { memberId } = req.params;
    const deleted = await Community.findOneAndDelete({ patientId, memberId });
    if (!deleted) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET PROFILE OF THE OTHER PERSON (for viewing connected person's profile)
export const getMemberProfile = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { memberId } = req.params;

    const connection = await Community.findOne({
      $or: [
        { patientId: requesterId, memberId: memberId },
        { patientId: memberId,    memberId: requesterId },
      ],
    });

    if (!connection) {
      return res.status(403).json({ message: "Not connected to this user" });
    }

    const profile = await User.findById(memberId).select("-password -otp -otpExpires -fcmToken");
    if (!profile) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ member: profile });
  } catch (error) {
    console.error("getMemberProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── NEW: UPDATE OWN PROFILE ──
// PUT /api/community/update-profile
// Logged-in community member updates their own name / email
export const updateCommunityProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Check if email is taken by another user
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: "Email is already in use" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        name:  name.trim(),
        ...(email && { email: email.trim().toLowerCase() }),
      },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpires -fcmToken");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("updateCommunityProfile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};