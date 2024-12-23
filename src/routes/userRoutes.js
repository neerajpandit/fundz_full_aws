import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  loginUser,
  logoutUser,
  updateUser,
} from "../controllers/userController.js";
import {validateLogin, validateRegistration} from "../middlewares/inputValidator.js";

import { isAdmin, verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// router.post("/",validatePhoneOtp, sendOtpForAuth);


router.post("/",validateRegistration, createUser);
router.post("/login",validateLogin,loginUser);
router.post("/logout",verifyToken,logoutUser)
router.get("/",verifyToken,isAdmin, getAllUsers);
router.get("/:id",verifyToken, getUserById);
router.put("/:id", verifyToken, updateUser);
// router.delete("/user/:id", deleteUser);

export default router;
