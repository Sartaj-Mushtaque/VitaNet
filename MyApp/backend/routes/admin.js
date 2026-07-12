import express from "express";
import {
  getAllUsers,
  deleteUser,
  changeUserRole,
  resetUserPassword,
} from "../controllers/adminController.js";
import { verifyAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(verifyAdmin);
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.put("/reset-password", resetUserPassword);
router.put("/change-role", changeUserRole);

export default router;
