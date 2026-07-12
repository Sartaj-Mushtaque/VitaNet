import PatientProfile from "../models/patientProfile.js";

// GET logged-in patient profile
export const getPatientProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from authMiddleware
    const profile = await PatientProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// CREATE or UPDATE logged-in patient profile
export const createPatientProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, phone, city, disease, bloodGroup, avatar } = req.body;

    let profile = await PatientProfile.findOne({ userId });

    if (profile) {
      // Update
      Object.assign(profile, { fullName, email, phone, city, disease, bloodGroup, avatar });
      await profile.save();
    } else {
      // Create
      profile = new PatientProfile({ userId, fullName, email, phone, city, disease, bloodGroup, avatar });
      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
