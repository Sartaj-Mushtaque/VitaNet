import Invitation from "../models/Invitation.js";
import generateInviteCode from "../utils/generateInviteCode.js";

// Create invitation (Patient)
export const createInvitation = async (req, res) => {
  try {
    const patientId = req.user.id;

    const inviteCode = generateInviteCode();

    const invitation = await Invitation.create({
      patientId,
      inviteCode,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    res.status(201).json({
      success: true,
      inviteCode: invitation.inviteCode,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create invitation" });
  }
};

// Validate invitation code
export const validateInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) return res.status(400).json({ message: "Invite code required" });

    const invitation = await Invitation.findOne({ inviteCode });

    if (!invitation) return res.status(400).json({ message: "Invalid invite code" });
    if (!invitation.isActive) return res.status(400).json({ message: "Invite code inactive" });
    if (invitation.expiresAt < new Date()) return res.status(400).json({ message: "Invite code expired" });
    if (invitation.usedCount >= invitation.maxUses) return res.status(400).json({ message: "Invite code already used" });

    res.status(200).json({ valid: true, patientId: invitation.patientId });
  } catch (error) {
    res.status(500).json({ message: "Validation failed" });
  }
};
