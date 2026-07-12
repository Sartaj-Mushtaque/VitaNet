import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// ================= NODEMAILER CONFIG =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) console.error("Email transporter error:", err);
  else console.log("Email transporter ready");
});

// ================= HELPERS =================
const normalizeEmail = (email) => email.trim().toLowerCase();
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    email = normalizeEmail(email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      otp: role === "admin" ? null : otp,
      otpExpires: role === "admin" ? null : otpExpires,
      isVerified: role === "admin",
    });

    if (role !== "admin") {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "VitaNet Registration OTP",
        html: `<p>Hello ${name},</p><p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
      });
    }

    res.status(201).json({
      message:
        role === "admin"
          ? "Admin registered successfully"
          : "User registered, please verify OTP",
      email,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role !== "admin" && !user.isVerified) {
      return res.status(400).json({ message: "Please verify your account first" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ================= VERIFY OTP =================
export const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    email = normalizeEmail(email);
    otp = otp.toString().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin does not require OTP verification" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Account verified successfully", token, user });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// ================= RESEND OTP =================
export const resendOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "VitaNet OTP Resend",
      html: `<p>Hello ${user.name},</p><p>Your new OTP is <b>${otp}</b>. Expires in 10 minutes.</p>`,
    });

    res.status(200).json({ message: "OTP has been resent to your email" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Server error during OTP resend" });
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    email = normalizeEmail(email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "No account found with this email" });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Hello ${user.name},</p><p>Your OTP is <b>${otp}</b>. Expires in 5 minutes.</p>`,
    });

    res.status(200).json({ message: "OTP sent to your registered email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error during password reset request" });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    email = normalizeEmail(email);
    otp = otp.toString().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (Date.now() > user.otpExpires) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};
// ================= ADMIN RESET PASSWORD =================
export const adminResetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword)
      return res.status(400).json({ message: "userId and newPassword are required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password reset successfully by admin" });
  } catch (err) {
    console.error("Admin Reset Password Error:", err);
    res.status(500).json({ message: "Server error during admin password reset" });
  }
};
// ================= GET USER BY EMAIL =================
export const getUserByEmail = async (req, res) => {
  try {
    let { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("-password -otp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("GetUserByEmail Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// ================= SAVE FCM TOKEN =================
export const saveFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token required" });
    }

    await User.findByIdAndUpdate(req.user.id, { fcmToken });
    res.status(200).json({ message: "FCM token saved" });
  } catch (error) {
    console.error("Save FCM Token Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
